import React from "react";

interface InputFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string | number | null;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  error?: string[];
  required?: boolean;
  className?: string;
  readOnly?: boolean; // ✅ already here
}

export default function InputField({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  required = false,
  className = "",
  readOnly = false, // ✅ default false
}: InputFieldProps) {
  const baseClass =
    "mt-1 w-full rounded border border-gray-300 px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500";

  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-700">
        {label} {required && <span className="text-red-700">*</span>}
      </label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className={baseClass}
        readOnly={readOnly} // ✅ applied here
      />
      {error && error.length > 0 && (
        <p className="mt-1 text-xs text-red-600">{error[0]}</p>
      )}
    </div>
  );
}
