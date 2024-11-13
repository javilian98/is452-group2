import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useStateContext } from "../context";
import { CustomButton, CountBox, Loader, RadioButton } from "../components";
import { calculateBarPercentage, daysLeft } from "../utils";

import { thirdweb } from "../assets";

const CampaignDetails = () => {
  const { state } = useLocation();
  console.log(state);

  const navigate = useNavigate();
  const {
    donate,
    getUserCampaigns,
    getTotalVotes,
    finalizeTheCampaign,
    addVote,
    contract,
    address,
  } = useStateContext();

  const [campaigns, setCampaigns] = useState();
  const [isLoading, setIsLoading] = useState();
  const [amount, setAmount] = useState();
  const [donators, setDonators] = useState([]);
  const [donations, setDonations] = useState([]);
  const [selectedOption, setSelectedOption] = useState("");
  const [voteResults, setVoteResults] = useState([]);

  const remainingDays = daysLeft(state.deadline);

  const fetchCampaigns = async () => {
    setIsLoading(true);
    const data = await getUserCampaigns();

    setCampaigns(data);
    setIsLoading(false);
  };

  const fetchVoteResults = async () => {
    const results = []; // Temporarily store the results here

    // Use Promise.all to fetch all vote results concurrently
    try {
      const votePromises = state.options.map((_, index) =>
        getTotalVotes(state.pId, index + 1)
          .then((data) => {
            results.push(data); // Push the result to the array
          })
          .catch((error) => {
            console.error(
              "Error fetching total votes for option",
              index + 1,
              error
            );
            results.push(0); // In case of an error, push a default value (0)
          })
      );

      // Wait for all promises to resolve
      await Promise.all(votePromises);

      // After all the results are fetched, update the state
      setVoteResults(results);
    } catch (error) {
      console.error("Error fetching total votes:", error);
    }
  };

  useEffect(() => {
    if (contract) {
      setDonators(state.donators);
      setDonations(state.donations);
      fetchCampaigns();
      fetchVoteResults();
    }
  }, [contract, address]);

  const handleDonate = async () => {
    setIsLoading(true);
    try {
      // Attempt the donation transaction
      await donate(state.pId, amount); // Ensure this resolves before moving forward

      // After the donation is successful, proceed with voting
      if (!selectedOption) {
        alert("Please select a vote option before proceeding.");
        return; // Prevent voting if no option is selected
      }

      // Log to ensure the selected option is correctly set
      console.log("Selected option for voting:", selectedOption);

      // Find the index of the selected option
      const selectedOptionIndex = state.options.findIndex(
        (item) => item === selectedOption
      );

      if (selectedOptionIndex === -1) {
        alert("Invalid vote option selected.");
        return; // Ensure the selected option is valid
      }

      // Call handleVote after donation is successful
      await addVote(state.pId, selectedOptionIndex + 1, amount * 100); // Ensure this resolves
      console.log("Vote has been successfully recorded.");

      // Navigate after both actions (donation + vote) are completed
      navigate("/"); // Navigate after both donation and vote are successful
      // window.location.reload();
    } catch (error) {
      console.error("Error in donation or voting:", error);
      alert("Error during donation or voting. Please try again.");
    } finally {
      setIsLoading(false); // Reset loading state after both donation and vote are completed
    }
  };

  const handleOptionChange = (e) => {
    setSelectedOption(e.target.value); // Track selected vote option
    console.log("selectedOption ", selectedOption);
  };

  const handleFinalizeCampaign = async () => {
    console.log("Finalizing campaign!!");
    try {
      await finalizeTheCampaign(state.pId);
      navigate("/");
      // window.location.reload();
    } catch (error) {
      alert("Error while finalizing campaign: " + error);
    }
  };

  const voteProgressBarPercentage = (option) => {
    const voteResultsNum = voteResults.map((item) => Number(item));

    const totalVotes = voteResultsNum?.reduce((acc, currentValue) => {
      return acc + currentValue; // Accumulate the sum of the array elements
    }, 0); // Initial value is 0

    return (Number(voteResultsNum?.[option]) / totalVotes) * 100;
  };

  const hasTargetReached = () => {
    const totalDonationAmount = state.donations
      .map((item) => Number(item))
      .reduce((acc, currentValue) => {
        return acc + currentValue; // Accumulate the sum of the array elements
      }, 0); // Initial value is 0;
    console.log("totalDonationAmount ", totalDonationAmount);

    const targetReached = Number(state.target);

    return totalDonationAmount >= targetReached;
  };

  return (
    <div>
      {isLoading && <Loader />}

      <div className="w-full flex md:flex-row flex-col mt-10 gap-[30px]">
        <div className="flex-1 flex-col">
          <img
            src={state.image}
            alt="Campaign"
            className="w-full h-[410px] object-cover rounded-xl"
          />
          <div className="relative w-full h-5[px] bg-[#3a3a43] mt-2">
            <div
              className="absolute h-full bg-[#4acda3]"
              style={{
                width: `${calculateBarPercentage(
                  state.target,
                  state.amountCollected
                )}%`,
                maxWidth: "100%",
              }}
            ></div>
          </div>
        </div>

        <div className="flex md:w-[150px] w-full flex-wrap justify-between gap-[30px]">
          <CountBox title="Days Left" value={remainingDays} />
          <CountBox
            title={`Raised of ${state.target}`}
            value={state.amountCollected}
          />
          <CountBox title="Total Backers" value={donators.length} />
        </div>
      </div>

      <div className="mt-[60px] flex lg:flex-row flex-col gap-5">
        <div className="flex-[2] flex flex-col gap-[40px]">
          <div>
            <h4 className="font-epilogue font-semibold text-[18px] text-white uppercase">
              Creator
            </h4>

            <div className="mt-[20px] flex flex-row items-center flex-wrap gap-[14px]">
              <div className="w-[52px] h-[52px] flex items-center justify-center rounded-full bg-[#2c2f32] cursor-pointer">
                <img
                  src={thirdweb}
                  alt="user"
                  className="w-[60%] h-[60%] object-contain"
                />
              </div>

              <div>
                <h4 className="font-epilogue font-semibold text-[14px] text-white break-all">
                  {state.owner}
                </h4>
                <p className="mt-[4px] font-epilogue font-normaal text-[12px] text-[#808191]">
                  {campaigns?.length} Campaigns
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-epilogue font-semibold text-[18px] text-white uppercase">
              Story
            </h4>

            <div className="mt-[20px]">
              <p className="mt-[4px] font-epilogue font-normaal text-[16px] text-[#808191] leading-[26px] text-justify">
                {state.description}
              </p>
            </div>
          </div>

          {state.isFinalized && !hasTargetReached() ? (
            <></>
          ) : (
            <div>
              <h4 className="font-epilogue font-semibold text-[18px] text-white uppercase">
                Donators
              </h4>

              <div className="mt-[20px] flex flex-col gap-4">
                {donators.length > 0 ? (
                  donators.map((item, index) => (
                    <div key={item} className="flex justify-between gap-4">
                      <p className="font-epilogue font-normal text-[16px] text-[#b2b3bd] leading-[26px] break-all">
                        {index + 1}. {item}
                      </p>
                      <p className="font-epilogue font-normal text-[16px] text-[#808191] leading-[26px] break-all">
                        {donations[index]}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="mt-[4px] font-epilogue font-normaal text-[16px] text-[#808191] leading-[26px] text-justify">
                    No donators yet. Be the first one!
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1">
          {/* <h4 className="font-epilogue font-semibold text-[18px] text-white uppercase">
            Vote
          </h4>
          <div className="mt-[20px] mb-[20px] flex flex-col p-4 bg-[#1c1c24] rounded-[10px]">
            {state.options.map((item, index) => (
              <RadioButton
                key={`${item}-${index}`}
                value={item}
                handleChange={handleOptionChange}
              />
            ))}

            <CustomButton
              btnType="button"
              title="Select Vote"
              styles="w-full bg-[#8c6dfd]"
              handleClick={handleVote}
            />
          </div> */}

          {/* Vote Results */}
          {/* {!state.isFinalized && ( */}
          <div>
            <h4 className="font-epilogue font-semibold text-[18px] text-white uppercase">
              Vote Results
            </h4>

            <div className="my-[20px] p-4 bg-[#13131a] rounded-[10px]">
              {state.options.map((item, index) => (
                <div>
                  <p className="font-epilogue text-white">{item}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-[#13131a] rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{
                          width: `${voteProgressBarPercentage(index)}%`,
                        }} // Adjust width dynamically
                      />
                    </div>
                    <span className="text-white">{voteResults?.[index]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* )} */}
          {/* Vote Results */}

          {!state.isFinalized ? (
            <>
              <h4 className="font-epilogue font-semibold text-[18px] text-white uppercase">
                Fund
              </h4>

              <div className="mt-[20px] flex flex-col p-4 bg-[#1c1c24] rounded-[10px]">
                <p className="font-epilogue font-medium text-[20px] leading-[30px] text-center text-[#808191]">
                  Fund the campaign
                </p>
                <p className="font-epilogue font-medium leading-[30px] text-center text-white">
                  1 token = 0.01
                </p>
                <div className="mt-[30px]">
                  <input
                    type="number"
                    placeholder="ETH 0.1"
                    step="0.01"
                    className="w-full py-[10px] sm:px-[15px] outline-none border-[1px] border-[#3a3a43] bg-transparent font-epilogue text-white text-[18px] leading-[30px] placeholder:text-[#4b5264] rounded-[10px]"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />

                  <div className="my-[20px] p-4 bg-[#13131a] rounded-[10px]">
                    <h4 className="font-epilogue font-semibold text-[14px] leading-[22px] text-white mb-[20px]">
                      Select a voting option
                    </h4>

                    {state.options.map((item, index) => (
                      <RadioButton
                        key={`${item}-${index}`}
                        value={item}
                        handleChange={handleOptionChange}
                      />
                    ))}
                  </div>

                  <CustomButton
                    btnType="button"
                    title="Fund Campaign"
                    styles="w-full bg-[#8c6dfd]"
                    handleClick={handleDonate}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="mt-[20px] flex flex-col p-4 bg-[#8c6dfd] rounded-[10px]">
              <p className="font-epilogue font-medium text-[20px] leading-[30px] text-center text-white">
                This campaign has been finalized
              </p>
            </div>
          )}

          {!state.isFinalized && (
            <div className="mt-[20px]">
              <h4 className="mt-[40px] mb-[20px] font-epilogue font-semibold text-[18px] text-white">
                Reached your target?
              </h4>
              <CustomButton
                btnType="button"
                title="Finalize Campaign"
                styles="w-full bg-[#ec9f3a]"
                handleClick={handleFinalizeCampaign}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignDetails;
