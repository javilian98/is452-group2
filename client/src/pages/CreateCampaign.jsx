import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";

import { money } from "../assets";
import { CustomButton, Loader } from "../components";
import { checkIfImage } from "../utils";

import { FormField } from "../components";

import { useStateContext } from "../context";

const CreateCampaign = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { createCampaign, addOptions, connect, address } = useStateContext();
  const [form, setForm] = useState({
    name: "",
    title: "",
    description: "",
    target: "",
    deadline: "",
    image: "",
    options: [],
  });

  const handleFormFieldChange = (fieldName, e) => {
    setForm({ ...form, [fieldName]: e.target.value });
  };

  // Handle change for each option field
  const handleFormOptionFieldChange = (index, e) => {
    const updatedOptions = [...form.options]; // Copy current options
    updatedOptions[index] = e.target.value; // Update the option at the given index
    setForm((prevForm) => ({
      ...prevForm,
      options: updatedOptions, // Update the options array in state
    }));
  };

  // Handle removing an option from the list
  const handleRemoveOption = (index) => {
    const updatedOptions = form.options.filter((_, idx) => idx !== index);
    setForm((prevForm) => ({
      ...prevForm,
      options: updatedOptions, // Remove the option at the specified index
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    checkIfImage(form.image, async (exists) => {
      if (exists) {
        try {
          setIsLoading(true); // Start loading

          // Call the createCampaign function and wait for the transaction to complete
          const campaignTx = await createCampaign({
            ...form,
            target: ethers.utils.parseUnits(form.target, 18), // Convert target to proper units
          });

          // Wait for the transaction to be mined and capture the receipt
          // const receipt = await campaignTx.wait();

          // The campaign ID is emitted in the event, or you can get it from the transaction's return value
          const campaignId = campaignTx.receipt.events[0].args[0].toString(); // Extract the campaign ID from the event

          console.log("Campaign created with ID:", campaignId);

          // Call addOptions with the form and the campaign ID
          await addOptions(form, campaignId);

          setIsLoading(false);
          navigate("/");
        } catch (error) {
          console.error("Error occurred:", error);
          alert("Something went wrong. Please try again.");
          setIsLoading(false); // Stop loading in case of error
        }
      } else {
        alert("Provide valid image URL");
        setForm({ ...form, image: "" });
      }
    });
  };

  return (
    <div className="bg-[#1c1c24] flex justify-center items-center flex-col rounded-[10px] sm:p-10 p-4">
      {isLoading && <Loader />}
      <div className="flex justify-center items-center p-[16px] sm:min-w-[380px] bg-[#3a3a43] rounded-[10px]">
        <h1 className="font-epilogue font-bold sm:text-[25px] text-[18px] leading-[38px] text-white">
          Start a Campaign
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full mt-[65px] flex flex-col gap-[30px]"
      >
        <div className="flex flex-wrap gap-[40px]">
          <FormField
            labelName="Your Name *"
            placeholder="John Doe"
            inputType="text"
            value={form.name}
            handleChange={(e) => handleFormFieldChange("name", e)}
          />
          <FormField
            labelName="Campaign Title *"
            placeholder="Write a title"
            inputType="text"
            value={form.title}
            handleChange={(e) => handleFormFieldChange("title", e)}
          />
        </div>

        <FormField
          labelName="Story *"
          placeholder="Write your story"
          isTextArea
          value={form.description}
          handleChange={(e) => handleFormFieldChange("description", e)}
        />

        <div className="w-full flex justify-start items-center p-4 bg-[#8c6dfd] h-[120px] rounded-[10px]">
          <img
            src={money}
            alt="money"
            className="w-[40px] h-[40px] object-contain"
          />
          <h4 className="font-epilogue font-bold text-[25px] text-white ml-[20px]">
            You will get 100% of the raised amount
          </h4>
        </div>

        <div className="flex flex-wrap gap-[40px]">
          <FormField
            labelName="Goal *"
            placeholder="eth 0.50"
            inputType="text"
            value={form.target}
            handleChange={(e) => handleFormFieldChange("target", e)}
          />
          <FormField
            labelName="End Date *"
            placeholder="End Date"
            inputType="date"
            value={form.deadline}
            handleChange={(e) => handleFormFieldChange("deadline", e)}
          />
        </div>

        <FormField
          labelName="Campaign Image *"
          placeholder="Place image url of your campaign"
          inputType="url"
          value={form.image}
          handleChange={(e) => handleFormFieldChange("image", e)}
        />

        <div className="flex flex-col gap-2">
          <h3 className="text-white">Voting Options</h3>
          {form.options.map((item, index) => (
            <div className="flex items-end gap-2">
              <FormField
                labelName={`Option ${index + 1}`}
                placeholder={`Option ${index + 1}`}
                inputType="text"
                value={form.options[index]}
                handleChange={(e) => {
                  handleFormOptionFieldChange(index, e);
                  console.log("aaa");
                }}
              />
              <button
                type="button"
                className="text-white py-[15px] sm:px-[25px] px-[15px] rounded-[10px] bg-red-500 h-fit"
                onClick={() => handleRemoveOption(index)}
              >
                x
              </button>
            </div>
          ))}

          <CustomButton
            btnType="button"
            title="Add option"
            styles="bg-[#3a3a43]"
            handleClick={() => {
              setForm((prevForm) => ({
                ...prevForm,
                options: [...prevForm.options, ""],
              }));
            }}
          />
        </div>

        <div className="flex justify-center items-center mt-[40px] ">
          <CustomButton
            btnType="submit"
            title="Submit new campaign"
            styles="bg-[#1dc071]"
            handleClick={() => {
              console.log(address);
              if (address) navigate("/create-campaign");
              else connect();
            }}
          />
        </div>
      </form>
    </div>
  );
};

export default CreateCampaign;
