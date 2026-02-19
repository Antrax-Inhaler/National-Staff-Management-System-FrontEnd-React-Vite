import React from "react";

interface SelectFieldProps<T = any> {
  label: string;
  name: string;
  value: T | null | undefined; // ✅ Generic type for objects
  onChange: (value: T | null) => void; // ✅ Return the actual object
  options: { label: string; value: T }[]; // ✅ Options contain objects
  error?: string[];
  required?: boolean;
  className?: string;
  inputClass?: string;
  disabled?: boolean;
  placeholder?: string;
  getOptionValue?: (option: T) => string | number; // ✅ Extract unique identifier
  getOptionLabel?: (option: T) => string; // ✅ Extract display label
}

export default function ObjectSelectField<T = any>({
  label,
  name,
  value,
  onChange,
  options,
  error,
  required = false,
  className = "",
  inputClass = "",
  disabled = false,
  placeholder = "Select an option",
  getOptionValue = (opt) => JSON.stringify(opt), // ✅ Default: stringify object
  getOptionLabel = (opt) => String(opt), // ✅ Default: convert to string
}: SelectFieldProps<T>) {
  const baseClass = `mt-1 w-full rounded border border-gray-300 px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${inputClass}`;

  // ✅ Get the string representation of current value
  const selectValue = value == null ? "" : getOptionValue(value);

  // ✅ Handle change by finding and returning the actual object
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;

    if (selectedValue === "") {
      onChange(null);
      return;
    }

    const selectedOption = options.find(
      (opt) => getOptionValue(opt.value) === selectedValue
    );

    onChange(selectedOption ? selectedOption.value : null);
  };

  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-700">
        {label} {required && "*"}
      </label>
      <select
        name={name}
        value={selectValue}
        onChange={handleChange}
        className={baseClass}
        required={required}
        disabled={disabled}
      >
        {/* ✅ Empty option for placeholder */}
        <option value="" disabled={required}>
          {placeholder}
        </option>
        {options.map((opt, index) => {
          const optionValue = getOptionValue(opt.value);
          const optionLabel = getOptionLabel(opt.value);

          return (
            <option key={`${optionValue}-${index}`} value={optionValue}>
              {opt.label || optionLabel}
            </option>
          );
        })}
      </select>
      {error && error.length > 0 && (
        <p className="mt-1 text-xs text-red-600">{error[0]}</p>
      )}
    </div>
  );
}
