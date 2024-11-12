// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./RefundMechanism.sol";

contract CrowdFunding {
    struct Campaign {
        address owner;
        string title;
        string description;
        uint256 target;
        uint256 deadline;
        uint256 amountCollected;
        string image;
        address[] donators;
        uint256[] donations;
        string[] options; // Voting options
        bool isFinalized;
    }

    mapping(uint256 => Campaign) public campaigns;
    uint256 public numberOfCampaigns = 0;
    uint256 public tokensPerEther = 100; // Exchange rate, 1 ETH = 100 tokens

    // Mapping to track tokens for each donor by campaign ID
    mapping(uint256 => mapping(address => uint256)) public tokenBalance;
    RefundMechanism public refundMechanism;

    event CampaignCreated(uint256 campaignId, address owner, string title, uint256 target, uint256 deadline);
    event Donated(uint256 campaignId, address donator, uint256 amount);
    event CampaignFinalized(uint256 campaignId, address owner, uint256 amountCollected);
    event RefundTriggered(uint256 campaignId);

    constructor(address _refundMechanismAddress) {
        refundMechanism = RefundMechanism(_refundMechanismAddress);
    }

    // Create a new campaign
    function createCampaign(
        address _owner,
        string memory _title,
        string memory _description,
        uint256 _target,
        uint256 _deadline,
        string memory _image
    ) public returns (uint256) {
        require(_deadline > block.timestamp, "Deadline must be in the future.");

        Campaign storage campaign = campaigns[numberOfCampaigns];
        campaign.owner = _owner;
        campaign.title = _title;
        campaign.description = _description;
        campaign.target = _target;
        campaign.deadline = _deadline;
        campaign.image = _image;
        campaign.isFinalized = false;

        numberOfCampaigns++;

        emit CampaignCreated(numberOfCampaigns - 1, _owner, _title, _target, _deadline);
        return numberOfCampaigns - 1;
    }

    // Add options for voting, only campaign owner can add options
    function addOptions(uint256 _campaignId, string[] memory _options) public {
        Campaign storage campaign = campaigns[_campaignId];
        require(msg.sender == campaign.owner, "Only owner can add options.");
        require(campaign.options.length == 0, "Options already set.");

        for (uint256 i = 0; i < _options.length; i++) {
            campaign.options.push(_options[i]);
        }
    }

    // Donate to a campaign and mint tokens
    function donate(uint256 _campaignId) public payable {
        Campaign storage campaign = campaigns[_campaignId];
        require(block.timestamp < campaign.deadline, "Campaign ended.");
        require(msg.value > 0, "Donation must be greater than 0.");

        campaign.donators.push(msg.sender);
        campaign.donations.push(msg.value);
        campaign.amountCollected += msg.value;

        // Calculate and assign tokens based on the donation amount
        uint256 tokens = (msg.value * tokensPerEther) / 1 ether;
        tokenBalance[_campaignId][msg.sender] += tokens;

        emit Donated(_campaignId, msg.sender, msg.value);
    }

    // Finalize the campaign, either transferring funds to the owner or triggering refunds
    function finalizeCampaign(uint256 _campaignId) public {
        Campaign storage campaign = campaigns[_campaignId];
        require(msg.sender == campaign.owner, "Only the campaign owner can finalize this campaign."); // Restrict access
        require(block.timestamp >= campaign.deadline, "Campaign is still ongoing.");
        require(!campaign.isFinalized, "Campaign already finalized.");

        if (campaign.amountCollected >= campaign.target) {
            // If the target is met, transfer funds to the owner
            campaign.isFinalized = true;
            (bool sent, ) = payable(campaign.owner).call{value: campaign.amountCollected}("");
            require(sent, "Transfer to owner failed.");
            emit CampaignFinalized(_campaignId, campaign.owner, campaign.amountCollected);
        } else {
            // If the target is not met, enable and process refunds in RefundMechanism
            refundMechanism.enableRefund(_campaignId, campaign.donators, campaign.donations);
            refundMechanism.processRefund(_campaignId, campaign.donators); // Pass the list of donators
            campaign.isFinalized = true;
            emit RefundTriggered(_campaignId);
        }
    }

    function transferRefund(uint256 _campaignId, address _donor) external {
        require(msg.sender == address(refundMechanism), "Only RefundMechanism can call this function.");
        uint256 refundAmount = refundMechanism.getRefundAmount(_campaignId, _donor);
        require(refundAmount > 0, "No refund available for this donor.");

        // Transfer the refund amount
        payable(_donor).transfer(refundAmount);
    }   


    // Get details of a specific campaign, including options
    function getCampaign(uint256 _campaignId)
        public
        view
        returns (
            address owner,
            string memory title,
            string memory description,
            uint256 target,
            uint256 deadline,
            uint256 amountCollected,
            string memory image,
            address[] memory donators,
            uint256[] memory donations,
            string[] memory options,
            bool isFinalized
        )
    {
        Campaign storage campaign = campaigns[_campaignId];
        return (
            campaign.owner,
            campaign.title,
            campaign.description,
            campaign.target,
            campaign.deadline,
            campaign.amountCollected,
            campaign.image,
            campaign.donators,
            campaign.donations,
            campaign.options,
            campaign.isFinalized
        );
    }

    // Get details of all campaigns
    function getCampaigns() public view returns (Campaign[] memory) {
        Campaign[] memory allCampaigns = new Campaign[](numberOfCampaigns);

        for (uint256 i = 0; i < numberOfCampaigns; i++) {
            Campaign storage item = campaigns[i];
            allCampaigns[i] = item;
        }

        return allCampaigns;
    }

    // Deduct tokens from a donor's balance
    function deductTokens(uint256 _campaignId, address _donor, uint256 _tokens) external {
        require(tokenBalance[_campaignId][_donor] >= _tokens, "Not enough tokens");
        tokenBalance[_campaignId][_donor] -= _tokens;
    }

    // Get the total token balance of a donor for a specific campaign
    function getTokenBalance(uint256 _campaignId, address _donor) public view returns (uint256) {
        return tokenBalance[_campaignId][_donor];
    }
}
