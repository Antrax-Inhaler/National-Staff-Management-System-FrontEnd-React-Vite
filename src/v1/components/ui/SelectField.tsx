import React from "react";

interface SelectFieldProps {
  label: string;
  name: string;
  value: string | number | null | undefined; // ✅ Allow null and undefined
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { label: string; value: string | number }[];
  error?: string[];
  required?: boolean;
  className?: string;
  inputClass?: string;
  disabled?: boolean;
  placeholder?: string; // ✅ Optional placeholder text
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
  inputClass = "",
  disabled = false,
  placeholder = "Select an option", // ✅ Default placeholder
}: SelectFieldProps) {
  const baseClass =
    `mt-1 w-full rounded border border-gray-300 px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${inputClass}`;

  // ✅ Convert null/undefined to empty string
  const selectValue = value == null ? "" : value;

  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-700">
        {label} {required && "*"}
      </label>
      <select
        name={name}
        value={selectValue}
        onChange={onChange}
        className={baseClass}
        required={required}
        disabled={disabled}
      >
        {/* ✅ Empty option for placeholder */}
        <option value="" disabled={required}>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
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
