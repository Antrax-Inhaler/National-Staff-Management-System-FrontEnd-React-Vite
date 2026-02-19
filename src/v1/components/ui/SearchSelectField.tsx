import React, { useState, useRef, useEffect } from "react";

interface Option {
  label: string;
  value: string | number;
}

interface SearchableSelectProps {
  label: string;
  name: string;
  value: string | number | null | undefined;
  onChange: (value: string | number) => void;
  options: Option[];
  onSearchChange?: (query: string) => void; // 🔍 triggers TanStack Query refetch
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

export default function SearchSelectField({
  label,
  name,
  value,
  onChange,
  options,
  onSearchChange,
  placeholder = "Select an option",
  disabled = false,
  isLoading = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Trigger search callback
  useEffect(() => {
    if (onSearchChange) onSearchChange(search);
  }, [search]);

  const selectedLabel = options.find((o) => o.value === value)?.label || "";

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block mb-1 text-xs font-medium text-gray-700">
        {label}
      </label>

      {/* Selected field */}
      <div
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`border border-gray-300 px-2 py-1 text-sm rounded cursor-pointer bg-white ${
          disabled ? "bg-gray-100 cursor-not-allowed" : "hover:border-blue-400"
        }`}
      >
        {selectedLabel || <span className="text-gray-400">{placeholder}</span>}
      </div>

      {/* Popup dropdown */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg max-h-60">
          {/* 🔍 Search box inside dropdown */}
          <div className="p-2 border border-gray-300-b">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 🏙️ Options */}
          {isLoading ? (
            <div className="p-2 text-xs text-gray-500">Loading...</div>
          ) : options.length > 0 ? (
            options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`px-2 py-1 text-xs cursor-pointer hover:bg-blue-50 ${
                  opt.value === value ? "bg-blue-100 font-medium" : ""
                }`}
              >
                {opt.label}
              </div>
            ))
          ) : (
            <div className="p-2 text-xs text-gray-500">No results found</div>
          )}
        </div>
      )}
    </div>
  );
}
