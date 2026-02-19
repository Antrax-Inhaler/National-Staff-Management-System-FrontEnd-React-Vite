import React from "react";

interface InputFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement> {
  label: string;
  name: string;
  error?: string[];
  required?: boolean;
  className?: string;
  inputClass?: string;
  readOnly?: boolean;
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
  inputClass = "",
  readOnly = false,
  ...rest // ✅ captures min, max, step, placeholder, etc.
}: InputFieldProps) {
  const baseClass = `mt-1 w-full rounded border border-gray-300 px-2 py-1 text-xs 
    focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${inputClass}`;

  const isHidden = rest.hidden ?? false; // 👈 safely access
  
  return (
    <div className={className}>
      {!isHidden && (
        <label className="block text-xs font-medium text-gray-700">
          {label} {required && <span className="text-red-700">*</span>}
        </label>
      )}
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className={baseClass}
        readOnly={readOnly}
        {...rest} // ✅ apply extra props
      />
      {error && error.length > 0 && (
        <p className="mt-1 text-xs text-red-600">{error[0]}</p>
      )}
    </div>
  );
}
