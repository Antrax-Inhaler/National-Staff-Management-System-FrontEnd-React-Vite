import React from "react";

interface TextAreaInputProps {
  label: string;
  name: string;
  value: string | number | readonly string[] | undefined;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;
  error?: string[];
  required?: boolean;
  className?: string;
  inputClass?: string;
  readOnly?: boolean;
  placeholder?: string;
}

export default function TextAreaInput({
  label,
  name,
  value,
  onChange,
  error,
  required = false,
  className = "",
  inputClass = "",
  readOnly = false,
  placeholder = ""
}: TextAreaInputProps) {
  const baseClass = `
    mt-1 w-full rounded border border-gray-300 px-2 py-1 text-xs
    focus:ring-1 focus:ring-blue-500 focus:border-blue-500
    ${inputClass}
  `;

  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-700">
        {label} {required && <span className="text-red-700">*</span>}
      </label>

      <textarea
        name={name}
        value={value}
        onChange={onChange}
        className={baseClass}
        readOnly={readOnly}
        placeholder={placeholder}
      />

      {error && error.length > 0 && (
        <p className="mt-1 text-xs text-red-600">{error[0]}</p>
      )}
    </div>
  );
}
