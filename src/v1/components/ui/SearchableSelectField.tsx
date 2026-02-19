import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface SearchableSelectFieldProps {
  label?: string;
  name: string;
  value: string | number | null | undefined;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  options: { label: string; value: string | number }[];
  searchValue: string;
  onSearchChange: (val: string) => void;
  loading?: boolean;
  error?: string[];
  required?: boolean;
  className?: string;
  inputClass?: string;
  disabled?: boolean;
  placeholder?: string;
  noResultsText?: string;
}

export default function SearchableSelectField({
  label,
  name,
  value,
  onChange,
  options,
  searchValue,
  onSearchChange,
  loading = false,
  error,
  required = false,
  className = "",
  inputClass = "",
  disabled = false,
  placeholder = "Select an option",
  noResultsText = "No results found",
}: SearchableSelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
    width: number;
    openUpward: boolean;
  }>({
    top: 0,
    left: 0,
    width: 0,
    openUpward: false,
  });

  const triggerRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const selectedLabel = options.find((opt) => opt.value === value)?.label ?? "";

  const emitChangeEvent = (val: string | number) => {
    const synthetic = {
      target: {
        name,
        value: val,
      },
    } as unknown as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>;

    onChange(synthetic);
  };

  const handleSelect = (val: string | number) => {
    emitChangeEvent(val);
    setIsOpen(false);
  };

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownHeight = 200; // Approximate max height (input + max-h-40)
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Determine if we should open upward
      const shouldOpenUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

      setDropdownPos({
        top: shouldOpenUpward
          ? rect.top + window.scrollY - dropdownHeight
          : rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        openUpward: shouldOpenUpward,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        dropdownRef.current &&
        !triggerRef.current.contains(target) &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block mb-1 text-xs font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Trigger */}
      <div
        ref={triggerRef}
        tabIndex={0}
        className={`w-full rounded border border-gray-300 px-2 py-1.5 text-xs cursor-pointer bg-white focus:ring-1 focus:ring-blue-500 ${inputClass} ${
          disabled ? "bg-gray-100 cursor-not-allowed" : ""
        }`}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
      >
        {selectedLabel || <span className="text-gray-400">{placeholder}</span>}
      </div>

      {/* Dropdown (portal) */}
      {isOpen &&
        !disabled &&
        createPortal(
          <div
            ref={dropdownRef}
            className="absolute z-[9999] bg-white border border-gray-300 rounded shadow-lg"
            style={{
              position: "absolute",
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
            }}
          >
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search..."
              autoFocus
              className="w-full px-2 py-1.5 text-xs border-b border-gray-200 focus:outline-none"
            />

            <div className="overflow-y-auto text-xs max-h-40">
              {loading ? (
                <div className="px-2 py-2 text-center text-gray-400">
                  Loading...
                </div>
              ) : options.length === 0 ? (
                <div className="px-2 py-2 text-center text-gray-400">
                  {noResultsText}
                </div>
              ) : (
                options.map((opt) => (
                  <div
                    key={String(opt.value)}
                    className={`px-2 py-1.5 cursor-pointer hover:bg-blue-50 ${
                      value === opt.value ? "bg-blue-100 font-medium" : ""
                    }`}
                    onClick={() => handleSelect(opt.value)}
                  >
                    {opt.label}
                  </div>
                ))
              )}
            </div>
          </div>,
          document.body
        )}

      {error && error.length > 0 && (
        <p className="mt-1 text-xs text-red-600">{error[0]}</p>
      )}
    </div>
  );
}