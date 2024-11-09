// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

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
    uint256 public tokensPerEther = 1000; // Exchange rate, 1 ETH = 1000 tokens

    // Mapping to track tokens for each donor by campaign ID
    mapping(uint256 => mapping(address => uint256)) public tokenBalance;

    event CampaignCreated(uint256 campaignId, address owner, string title, uint256 target, uint256 deadline);
    event Donated(uint256 campaignId, address donator, uint256 amount);
    event CampaignFinalized(uint256 campaignId, address owner, uint256 amountCollected);

    // Create a new campaign
    function createCampaign(
        address _owner, 
        string memory _title, 
        string memory _description, 
        uint256 _target, 
        uint256 _deadline, 
        string memory _image
    ) 
        public 
        returns (uint256) 
    {
        require(_deadline > block.timestamp, "The deadline should be a date in the future.");
        
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
        require(msg.sender == campaign.owner, "Only the campaign owner can add options.");
        require(campaign.options.length == 0, "Options already added."); // Prevent overwriting options

        for (uint256 i = 0; i < _options.length; i++) {
            campaign.options.push(_options[i]);
        }
    }

    // Donate to a campaign and mint tokens
    function donate(uint256 _campaignId) public payable {
        Campaign storage campaign = campaigns[_campaignId];
        require(block.timestamp < campaign.deadline, "Campaign has ended.");
        require(msg.value > 0, "Donation amount must be greater than 0.");

        campaign.donators.push(msg.sender);
        campaign.donations.push(msg.value);
        campaign.amountCollected += msg.value;

        // Calculate and assign tokens based on the donation amount
        uint256 tokens = (msg.value * tokensPerEther) / 1 ether;
        tokenBalance[_campaignId][msg.sender] += tokens; // Mint tokens for voting

        emit Donated(_campaignId, msg.sender, msg.value);
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

    // Finalize the campaign and transfer funds if the target is met
    function finalizeCampaign(uint256 _campaignId) public {
        Campaign storage campaign = campaigns[_campaignId];
        require(block.timestamp >= campaign.deadline, "Campaign is still ongoing.");
        require(campaign.amountCollected >= campaign.target, "Campaign target not met.");
        require(!campaign.isFinalized, "Campaign already finalized.");

        campaign.isFinalized = true; // Mark the campaign as finalized

        // Transfer collected funds to the campaign owner
        payable(campaign.owner).transfer(campaign.amountCollected);

        emit CampaignFinalized(_campaignId, campaign.owner, campaign.amountCollected);
    }

    // Function to deduct tokens from a donor's balance
    function deductTokens(uint256 _campaignId, address _donor, uint256 _tokens) external {
        require(tokenBalance[_campaignId][_donor] >= _tokens, "Not enough tokens");
        tokenBalance[_campaignId][_donor] -= _tokens;
    }

    // Get the total token balance of a donor for a specific campaign
    function getTokenBalance(uint256 _campaignId, address _donor) public view returns (uint256) {
        return tokenBalance[_campaignId][_donor];
    }
}
