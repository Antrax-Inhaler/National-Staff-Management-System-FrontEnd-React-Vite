import React from "react";

interface RadioFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value"> {
  label: string;
  name: string;
  value: string;
  checked: boolean;
  error?: string[];
  required?: boolean;
  className?: string;
  readOnly?: boolean;
}

export default function RadioField({
  label,
  name,
  value,
  checked,
  onChange,
  error,
  required = false,
  className = "",
  readOnly = false,
  ...rest
}: RadioFieldProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input
        id={`${name}-${value}`}
        name={name}
        type="radio"
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={readOnly}
        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
        {...rest}
      />
      <label
        htmlFor={`${name}-${value}`}
        className="text-xs font-medium text-gray-700 cursor-pointer select-none"
      >
        {label} {required && <span className="text-red-700">*</span>}
      </label>

      {error && error.length > 0 && (
        <p className="mt-1 text-xs text-red-600">{error[0]}</p>
      )}
    </div>
  );
}
