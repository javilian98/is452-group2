// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract RefundMechanism {
    mapping(uint256 => mapping(address => uint256)) public refunds; // Maps campaign ID to donor address to refund amount
    address public crowdfunding; // Address of the CrowdFunding contract

    event RefundEnabled(uint256 campaignId);
    event RefundProcessed(uint256 campaignId, address donator, uint256 amount);

    // Function to set the crowdfunding address after deployment
    function setCrowdfundingAddress(address _crowdFundingAddress) external {
        require(crowdfunding == address(0), "CrowdFunding address already set");
        require(_crowdFundingAddress != address(0), "Invalid CrowdFunding address");
        crowdfunding = _crowdFundingAddress;
    }

    // Enable refunds for a specific campaign and store the amounts to refund each donor
    function enableRefund(uint256 _campaignId, address[] memory _donators, uint256[] memory _donations) external {
        require(msg.sender == crowdfunding, "Only CrowdFunding can enable refunds.");

        for (uint256 i = 0; i < _donators.length; i++) {
            refunds[_campaignId][_donators[i]] = _donations[i];
        }

        emit RefundEnabled(_campaignId);
    }

    function getRefundAmount(uint256 _campaignId, address _donor) external view returns (uint256) {
        return refunds[_campaignId][_donor];
    }

    function resetRefund(uint256 _campaignId, address _donor) external {
        require(msg.sender == crowdfunding, "Only CrowdFunding can reset refunds.");
        refunds[_campaignId][_donor] = 0;
    }
}
