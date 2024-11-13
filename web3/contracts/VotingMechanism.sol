// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./CrowdFunding.sol";

contract VotingMechanism {
    CrowdFunding public crowdfunding;

    // Mapping to track votes per campaign and option
    mapping(uint256 => mapping(uint256 => uint256)) public totalVotes;

    // Event for logging votes
    event Voted(uint256 campaignId, address voter, uint256 optionId, uint256 tokens);

    constructor(address _crowdfundingAddress) {
        crowdfunding = CrowdFunding(_crowdfundingAddress);
    }

    // Vote for a specific option using tokens
    function vote(uint256 _campaignId, uint256 _userOptionId, uint256 _tokens) public {
        // Ensure _userOptionId is 1 or greater to prevent negative indexing
        require(_userOptionId > 0, "Option ID must be 1 or greater.");

        // Retrieve campaign details, including options
        (
            , , , , , , , , , string[] memory options, 
        ) = crowdfunding.getCampaign(_campaignId);

        // Ensure options are available for the campaign
        require(options.length > 0, "No options available for voting.");

        // Check if the user option ID is valid (1-based index)
        require(_userOptionId <= options.length, "Invalid option ID.");

        // Check if the voter is a donor by ensuring they have a token balance

        // uint256 donorTokens = crowdfunding.getTokenBalance(_campaignId, msg.sender);
        // require(donorTokens > 0, "You are not a donor to this campaign.");
        
        require(_tokens > 0, "Must vote with at least 1 token.");
        // require(donorTokens >= _tokens, "Not enough tokens to vote.");

        // // Deduct tokens from the donor's balance in CrowdFunding
        // crowdfunding.deductTokens(_campaignId, msg.sender, _tokens);

        // Use _userOptionId directly in totalVotes, keeping it 1-based
        totalVotes[_campaignId][_userOptionId] += _tokens;

        emit Voted(_campaignId, msg.sender, _userOptionId, _tokens);
    }

    // Get the winning option for a campaign based on the weighted votes
    function getWinningOption(uint256 _campaignId) public view returns (uint256 winningOption) {
        uint256 highestVotes = 0;
        (, , , , , , , , , string[] memory options, ) = crowdfunding.getCampaign(_campaignId);

        // Iterate with user-friendly 1-based indexing
        for (uint256 i = 1; i <= options.length; i++) {
            if (totalVotes[_campaignId][i] > highestVotes) {
                highestVotes = totalVotes[_campaignId][i];
                winningOption = i; // No need to adjust, as we are using 1-based indexing
            }
        }
    }

    // Get the voting percentage for each option in a campaign
    function getVotingPercentage(uint256 _campaignId) public view returns (uint256[] memory) {
        (, , , , , , , , , string[] memory options, ) = crowdfunding.getCampaign(_campaignId);
        uint256 totalTokens = 0;
        uint256[] memory percentages = new uint256[](options.length);

        // Calculate total tokens used in voting
        for (uint256 i = 1; i <= options.length; i++) {
            totalTokens += totalVotes[_campaignId][i];
        }

        // Calculate the percentage for each option
        for (uint256 i = 1; i <= options.length; i++) {
            if (totalTokens > 0) {
                percentages[i - 1] = (totalVotes[_campaignId][i] * 100) / totalTokens;
            } else {
                percentages[i - 1] = 0; // No votes, so 0% for each option
            }
        }

        return percentages;
    }

    // Get the total votes (tokens) for each option in a campaign
    function getTotalVotes(uint256 _campaignId) public view returns (uint256[] memory) {
        (, , , , , , , , , string[] memory options, ) = crowdfunding.getCampaign(_campaignId);
        uint256[] memory votes = new uint256[](options.length);

        // Populate total votes for each option
        for (uint256 i = 1; i <= options.length; i++) {
            votes[i - 1] = totalVotes[_campaignId][i];
        }

        return votes;
    }
}
