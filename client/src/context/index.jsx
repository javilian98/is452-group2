import React, { useContext, createContext } from "react";

import {
  useAddress,
  useContract,
  useMetamask,
  useContractWrite,
} from "@thirdweb-dev/react";
import { ethers } from "ethers";
import { EditionMetadataWithOwnerOutputSchema } from "@thirdweb-dev/sdk";

const StateContext = createContext();

export const StateContextProvider = ({ children }) => {
  const { contract } = useContract(
    import.meta.env.VITE_DEPLOYED_CROWDFUNDING_CONTRACT_ADDRESS
  );
  const { contract: votingContract } = useContract(
    import.meta.env.VITE_DEPLOYED_VOTING_CONTRACT_ADDRESS
  );
  // const { contract: refundContract } = useContract(
  //   import.meta.env.VITE_DEPLOYED_REFUND_CONTRACT_ADDRESS
  // );

  const { mutateAsync: createCampaign } = useContractWrite(
    contract,
    "createCampaign"
  );
  const { mutateAsync: addOptions } = useContractWrite(contract, "addOptions");
  const { mutateAsync: finalizeCampaign } = useContractWrite(
    contract,
    "finalizeCampaign"
  );

  const { mutateAsync: vote } = useContractWrite(votingContract, "vote");

  const address = useAddress();
  const connect = useMetamask();

  const publishCampaign = async (form) => {
    try {
      const data = await createCampaign({
        args: [
          address, // owner
          form.title, // title
          form.description, // description
          form.target,
          new Date(form.deadline).getTime(), // deadline,
          form.image,
        ],
      });

      console.log("contract call success", data);
      return data;
    } catch (error) {
      console.log("contract call failure", error);
    }
  };

  const publishOptions = async (form, campaignId) => {
    try {
      const data = await addOptions({
        args: [campaignId, form.options],
      });

      console.log("contract call success", data);
    } catch (error) {
      console.log("contract call failure", error);
    }
  };

  const getCampaigns = async () => {
    const campaigns = await contract.call("getCampaigns");
    console.log("campaigns ", campaigns);

    const parsedCampaigns = campaigns.map((campaign, i) => ({
      owner: campaign.owner,
      title: campaign.title,
      description: campaign.description,
      target: ethers.utils.formatEther(campaign.target.toString()),
      deadline: campaign.deadline.toNumber(),
      amountCollected: ethers.utils.formatEther(
        campaign.amountCollected.toString()
      ),
      donators: campaign.donators,
      donations: campaign.donations.map((donation) =>
        ethers.utils.formatEther(donation.toString())
      ), // Format each BigNumber in the donations array
      options: campaign.options,
      isFinalized: campaign.isFinalized,
      image: campaign.image,
      pId: i,
    }));

    return parsedCampaigns;
  };

  const getUserCampaigns = async () => {
    const allCampaigns = await getCampaigns();

    const filteredCampaigns = allCampaigns.filter(
      (campaign) => campaign.owner === address
    );

    return filteredCampaigns;
  };

  const donate = async (pId, amount) => {
    const data = await contract.call("donate", [pId], {
      value: ethers.utils.parseEther(amount),
    });

    return data;
  };

  const getDonations = async (pId) => {
    // const donations = await contract.call("getDonators", pId);
    const donations = await contract.call("getDonators", [pId]);
    const numberOfDonations = donations[0].length;

    const parsedDonations = [];

    for (let i = 0; i < numberOfDonations; i++) {
      parsedDonations.push({
        donator: donations[0][i],
        donation: ethers.utils.formatEther(donations[1][i].toString()),
      });
    }

    return parsedDonations;
  };

  const publishFinalizeCampaign = async (campaignId) => {
    try {
      const data = await finalizeCampaign({
        args: [campaignId],
      });

      console.log("contract call success", data);
    } catch (error) {
      console.log("contract call failure", error);
    }
  };

  const publishVote = async (campaignId, option, tokens) => {
    try {
      const data = await vote({
        args: [campaignId, option, tokens],
      });

      console.log("contract call success", data);
    } catch (error) {
      console.log("contract call failure", error);
    }
  };

  const getTotalVotes = async (campaignId, optionId) => {
    try {
      const data = await votingContract.call("totalVotes", [
        campaignId,
        optionId,
      ]);
      console.log("contract call success", data);
      return data.toString();
    } catch (error) {
      console.log("contract call failure", error);
    }
  };

  return (
    <StateContext.Provider
      value={{
        address,
        contract,
        connect,
        createCampaign: publishCampaign,
        addOptions: publishOptions,
        addVote: publishVote,
        getCampaigns,
        getUserCampaigns,
        getTotalVotes,
        donate,
        finalizeTheCampaign: publishFinalizeCampaign,
        getDonations,
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);
