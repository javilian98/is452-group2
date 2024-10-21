import React, { useState, useEffect } from "react";

// import { useStateContext } from "../context";
import { DisplayCampaigns } from "../components";

const Home = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [campaigns, setCampaigns] = useState([
    {
      owner: "0xabc",
      title: "Fund Example 1",
      description: "Description of this campaign",
      target: 0.15,
      deadline: 1729437427,
      amountCollected: 0.1,
      image:
        "https://www.geekawhat.com/wp-content/uploads/2024/03/FI_6500X-White-4070-Ti-SUPER-PC-Build.jpg",
    },
  ]);

  // const { address, contract, getCampaigns } = useStateContext()

  // const fetchCampaigns = () => {
  //   setIsLoading(true)
  //   const data = await getCampaigns()
  //   setCampaigns(data)
  //   setIsLoading(false)
  // }

  // useEffect(() => {
  //   if (contract) fetchCampaigns()
  // }, [address, contract])

  return (
    <DisplayCampaigns
      title={"All Campaigns"}
      isLoading={isLoading}
      campaigns={campaigns}
    />
  );
};

export default Home;
