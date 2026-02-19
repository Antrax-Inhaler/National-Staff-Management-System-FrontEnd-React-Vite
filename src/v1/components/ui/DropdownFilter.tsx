import React from "react";
import { ChevronDown, X } from "lucide-react";

interface DropdownFilterProps {
  label?: string;
  name: string;
  value: string | number | null | undefined;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  options: { label: string; value: string | number }[];
  disabled?: boolean;
  placeholder?: string;
  showClearButton?: boolean;
}

export default function DropdownFilter({
  label,
  name,
  value,
  onChange,
  options,
  disabled = false,
  placeholder = "All",
  showClearButton = true,
}: DropdownFilterProps) {
  const selectedLabel = options.find((opt) => opt.value === value)?.label ?? "";
  const hasValue = value !== null && value !== undefined && value !== "";

  // Create synthetic event
  const emitChangeEvent = (val: string | number | null) => {
    const synthetic = {
      target: {
        name,
        value: val,
      },
    } as unknown as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>;

    onChange(synthetic);
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value === "" ? null : e.target.value;
    emitChangeEvent(val);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    emitChangeEvent(null);
  };

  return (
    <div className="relative inline-block">
      {label && (
        <label className="block mb-1 text-xs font-medium text-gray-600">
          {label}
        </label>
      )}

      <div className="relative inline-flex items-center">
        {/* Select Dropdown */}
        <select
          name={name}
          value={value ?? ""}
          onChange={handleChange}
          disabled={disabled}
          className={`
            appearance-none inline-flex items-center gap-2 pl-2 pr-10 py-1.5 text-xs font-medium
            border rounded-lg transition-all
            ${
              hasValue
                ? "bg-blue-50 border-blue-300 text-blue-700"
                : "bg-white border-gray-300 text-gray-700"
            }
            ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-50"}
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
          `}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={String(opt.value)} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Icons Container */}
        <div className="absolute flex items-center gap-1 pointer-events-none right-2">
          {hasValue && showClearButton && (
            <button
              type="button"
              onClick={handleClear}
              className="pointer-events-auto p-0.5 hover:bg-blue-200 rounded transition"
              disabled={disabled}
            >
              <X size={14} className="text-blue-500" />
            </button>
          )}
          <ChevronDown
            size={14}
            className={hasValue ? "text-blue-500" : "text-gray-400"}
          />
        </div>
      </div>
    </div>
  );
}
