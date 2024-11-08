// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./CrowdFunding.sol";

contract VotingContract {
    CrowdFunding public crowdFunding;

    // campaignId => optionIndex => vote count
    mapping(uint256 => mapping(uint256 => uint256)) public votes;
    // campaignId => address => bool
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    constructor(address _crowdFundingAddress) {
        crowdFunding = CrowdFunding(_crowdFundingAddress);
    }

    function voteForAllocation(
        uint256 _campaignId,
        uint256 _optionIndex
    ) public {
        // Check that voting has not ended in the CrowdFunding contract
        require(
            !crowdFunding.isVotingEnded(_campaignId),
            "Voting has already ended for this campaign."
        );

        // Get the donation amount from the CrowdFunding contract
        uint256 donationAmount = crowdFunding.getDonationAmount(
            _campaignId,
            msg.sender
        );
        require(donationAmount > 0, "Only donors can vote.");
        require(!hasVoted[_campaignId][msg.sender], "You have already voted.");

        // Get the number of allocation options
        uint256 optionsCount = crowdFunding.getAllocationOptionsCount(
            _campaignId
        );
        require(_optionIndex < optionsCount, "Invalid allocation option.");

        // Record the vote
        votes[_campaignId][_optionIndex] += donationAmount;
        hasVoted[_campaignId][msg.sender] = true;
    }

    function endVoting(uint256 _campaignId) public {
        // Only the campaign owner can end the voting
        address campaignOwner = crowdFunding.getCampaignOwner(_campaignId);
        require(
            msg.sender == campaignOwner,
            "Only the campaign owner can end the voting."
        );

        // Check that voting has not already ended
        require(
            !crowdFunding.isVotingEnded(_campaignId),
            "Voting has already ended."
        );

        // Get the number of allocation options
        uint256 optionsCount = crowdFunding.getAllocationOptionsCount(
            _campaignId
        );

        // Determine the winning option
        uint256 highestVotes = 0;
        uint256 winningOptionIndex = 0;

        for (uint256 i = 0; i < optionsCount; i++) {
            uint256 optionVotes = votes[_campaignId][i];
            if (optionVotes > highestVotes) {
                highestVotes = optionVotes;
                winningOptionIndex = i;
            }
        }

        // Set the winning option in the CrowdFunding contract
        crowdFunding.setWinningOption(_campaignId, winningOptionIndex);
    }

    function getWinningOption(
        uint256 _campaignId
    ) public view returns (uint256) {
        return crowdFunding.getWinningOption(_campaignId);
    }
}
