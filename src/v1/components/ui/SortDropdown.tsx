// src/components/ui/SortDropdown.tsx
import { useState } from "react";
import { ArrowUpDown, ChevronDown } from "lucide-react";
import { SORT_OPTIONS } from "../../constants/sortOptions";

interface SortDropdownProps {
  value: string;
  onChange: (value: string) => void;
  size?: "sm" | "md" | "lg";
}

export default function SortDropdown({
  value,
  onChange,
  size = "md",
}: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 ${sizeClasses[size]}`}
      >
        <ArrowUpDown size={16} />
        <span>Sort</span>
        <ChevronDown size={14} className="text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg w-60">
          <div className="p-2">
            <div className="px-2 py-1 text-xs font-medium tracking-wider text-gray-500 uppercase">
              Sort By
            </div>
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex items-center w-full px-3 py-2 text-sm rounded-md text-left ${
                  value === option.value
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {option.label}
                {value === option.value && (
                  <div className="w-2 h-2 ml-auto bg-blue-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}