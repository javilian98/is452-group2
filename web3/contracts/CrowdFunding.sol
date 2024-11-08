pragma solidity ^0.8.9;

contract CrowdFunding {
    struct Campaign {
        address payable owner;
        string title;
        string description;
        uint256 target;
        uint256 deadline;
        uint256 amountCollected;
        string image;
        address[] donators;
        uint256[] donations;
        bool fundsWithdrawn;
        bool isRefunded;
        string[] allocationOptions;
        // Internal mappings not accessible from outside
        mapping(uint256 => uint256) votes; // optionIndex => voteCount
        mapping(address => bool) hasVoted;
        bool votingEnded;
        uint256 winningOption;
    }

    mapping(uint256 => Campaign) private campaigns;
    mapping(uint256 => mapping(address => uint256)) private donations; // Track donations per campaign per donor

    uint256 public numberOfCampaigns = 0;

    address public owner;
    address public votingContractAddress;

    modifier onlyVotingContract() {
        require(
            msg.sender == votingContractAddress,
            "Only the VotingContract can call this function."
        );
        _;
    }

    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "Only the contract owner can call this function."
        );
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setVotingContractAddress(
        address _votingContractAddress
    ) public onlyOwner {
        votingContractAddress = _votingContractAddress;
    }

    function createCampaign(
        address payable _owner,
        string memory _title,
        string memory _description,
        uint256 _target,
        uint256 _deadline,
        string memory _image,
        string[] memory _allocationOptions
    ) public returns (uint256) {
        require(
            _deadline > block.timestamp,
            "The deadline should be a date in the future."
        );
        require(
            _allocationOptions.length >= 2,
            "At least two allocation options are required."
        );

        Campaign storage campaign = campaigns[numberOfCampaigns];

        campaign.owner = _owner;
        campaign.title = _title;
        campaign.description = _description;
        campaign.target = _target;
        campaign.deadline = _deadline;
        campaign.amountCollected = 0;
        campaign.image = _image;
        campaign.fundsWithdrawn = false;
        campaign.isRefunded = false;
        campaign.allocationOptions = _allocationOptions;
        campaign.votingEnded = false;
        campaign.winningOption = type(uint256).max; // Initialize to max value

        numberOfCampaigns++;

        return numberOfCampaigns - 1;
    }

    function donateToCampaign(uint256 _id) public payable {
        uint256 amount = msg.value;
        Campaign storage campaign = campaigns[_id];

        require(
            block.timestamp < campaign.deadline,
            "The campaign has already ended."
        );

        campaign.donators.push(msg.sender);
        campaign.donations.push(amount);

        campaign.amountCollected += amount;

        // Track the donation amount per donor
        donations[_id][msg.sender] += amount;
    }

    function withdrawFunds(uint256 _id) public {
        Campaign storage campaign = campaigns[_id];

        require(
            msg.sender == campaign.owner,
            "Only the campaign owner can withdraw funds."
        );
        require(
            block.timestamp > campaign.deadline,
            "Cannot withdraw funds before the deadline."
        );
        require(
            campaign.amountCollected >= campaign.target,
            "Campaign did not reach the funding target."
        );
        require(!campaign.fundsWithdrawn, "Funds have already been withdrawn.");
        require(campaign.votingEnded, "Voting has not ended yet.");

        campaign.fundsWithdrawn = true;

        (bool sent, ) = campaign.owner.call{value: campaign.amountCollected}(
            ""
        );
        require(sent, "Failed to send funds to the campaign owner.");
    }

    function claimRefund(uint256 _id) public {
        Campaign storage campaign = campaigns[_id];

        require(
            block.timestamp > campaign.deadline,
            "Cannot claim refund before the campaign ends."
        );
        require(
            campaign.amountCollected < campaign.target,
            "Campaign reached the funding target; cannot refund."
        );
        require(
            donations[_id][msg.sender] > 0,
            "You have not donated to this campaign."
        );

        uint256 refundAmount = donations[_id][msg.sender];
        donations[_id][msg.sender] = 0;

        (bool sent, ) = payable(msg.sender).call{value: refundAmount}("");
        require(sent, "Failed to refund the donor.");
    }

    // Getter for allocation options
    function getAllocationOptions(
        uint256 _campaignId
    ) public view returns (string[] memory) {
        return campaigns[_campaignId].allocationOptions;
    }

    // Getter for the campaign owner
    function getCampaignOwner(
        uint256 _campaignId
    ) public view returns (address) {
        return campaigns[_campaignId].owner;
    }

    // Getter to check if voting has ended
    function isVotingEnded(uint256 _campaignId) public view returns (bool) {
        return campaigns[_campaignId].votingEnded;
    }

    // Getter to get the winning option
    function getWinningOption(
        uint256 _campaignId
    ) public view returns (uint256) {
        require(
            campaigns[_campaignId].votingEnded,
            "Voting has not ended yet."
        );
        return campaigns[_campaignId].winningOption;
    }

    // Function to set the winning option, callable only by the VotingContract
    function setWinningOption(
        uint256 _campaignId,
        uint256 _winningOption
    ) external onlyVotingContract {
        Campaign storage campaign = campaigns[_campaignId];
        campaign.winningOption = _winningOption;
        campaign.votingEnded = true;
    }

    // Function to get the donation amount for a donor in a campaign
    function getDonationAmount(
        uint256 _campaignId,
        address _donor
    ) public view returns (uint256) {
        return donations[_campaignId][_donor];
    }

    // Function to get the total number of allocation options
    function getAllocationOptionsCount(
        uint256 _campaignId
    ) public view returns (uint256) {
        return campaigns[_campaignId].allocationOptions.length;
    }
}
