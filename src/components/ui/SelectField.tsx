import React from "react";

interface SelectFieldProps {
  label: string;
  name: string;
  value: string | number | null | undefined;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { label: string; value: string | number }[];
  error?: string[];
  required?: boolean;
  className?: string; // wrapper div
  selectClassName?: string; // for the <select> element
  optionClassName?: string; // for <option> elements
  labelClassName?: string;
  disabled?: boolean;
  placeholder?: string;
}

export default function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  error,
  required = false,
  className = "",
  labelClassName = "",
  selectClassName = "",
  optionClassName = "",
  disabled = false,
  placeholder = "Select an option",
}: SelectFieldProps) {
  const baseClass =
    "mt-1 w-full rounded border border-gray-300 px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500";

  const selectValue = value == null ? "" : value;

  return (
    <div className={className}>
      <label className={`block text-xs  font-medium text-gray-700 ${labelClassName}`}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        name={name}
        value={selectValue}
        onChange={onChange}
        className={`${baseClass} ${selectClassName}`}
        required={required}
        disabled={disabled}
      >
        <option value="" disabled={required}>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            className={optionClassName} // optional class for each option
          >
            {opt.label}
          </option>
        ))}
      </select>
      {error && error.length > 0 && (
        <p className="mt-1 text-xs text-red-600">{error[0]}</p>
      )}
    </div>
  );
}

