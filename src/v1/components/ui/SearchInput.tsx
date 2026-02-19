import React, { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (val: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onEnter?: (val: string) => void;
  placeholder?: string;
  className?: string;
  showClear?: boolean;
  onClear?: () => void;
  debounceMs?: number;
}

export default function SearchInput({
  value,
  onChange,
  onKeyDown,
  onEnter,
  placeholder = "Search…",
  className = "",
  showClear = false,
  onClear,
  debounceMs = 300,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Sync local value when external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const handleInputChange = (newValue: string) => {
    setLocalValue(newValue);

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      onChange(newValue);
    }, debounceMs);
  };

  const handleClear = () => {
    setLocalValue("");
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    if (onClear) {
      onClear();
    } else {
      onChange("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (onKeyDown) onKeyDown(e);

    if (e.key === "Enter") {
      // Clear debounce timer and trigger immediately on Enter
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      onChange(localValue);
      if (onEnter) onEnter(localValue);
    }
  };

  return (
    <div
      className={`flex w-full max-w-sm items-center rounded-md border border-gray-300
                  bg-white px-3 py-2 shadow-sm focus-within:ring-2
                  focus-within:ring-blue-500 ${className}`}
    >
      <Search className="w-5 h-5 text-gray-400" />
      <input
        type="search"
        value={localValue}
        placeholder={placeholder}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 ml-2 text-sm text-gray-700 placeholder-gray-400 bg-transparent focus:outline-none"
      />
      {showClear && localValue && (
        <button
          type="button"
          onClick={handleClear}
          className="ml-2 text-gray-400 hover:text-gray-600"
          aria-label="Clear search"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
