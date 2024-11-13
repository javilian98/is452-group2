import React from "react";

const RadioButton = ({ value, handleChange }) => {
  return (
    <div className="flex items-center mb-4">
      <input
        id={value}
        type="radio"
        value={value}
        name="default-radio"
        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
        onChange={handleChange}
      />
      <label
        htmlFor={value}
        className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
      >
        {value}
      </label>
    </div>
  );
};

export default RadioButton;
