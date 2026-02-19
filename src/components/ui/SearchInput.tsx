import React from "react";
import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (val: string) => void;
  onEnter?: (val: string) => void;
  placeholder?: string;
  className?: string; // optional extra classes for the wrapper
}

export default function SearchInput({
  value,
  onChange,
  onEnter,
  placeholder = "Search…",
  className = "",
}: SearchInputProps) {
  return (
    <div
      className={`flex w-full max-w-sm items-center rounded-md border border-gray-300
                  bg-white px-3 py-2 shadow-sm focus-within:ring-2
                  focus-within:ring-blue-500 ${className}`}
    >
      <Search className="h-5 w-5 text-gray-400" />
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onEnter) onEnter(value);
        }}
        className="ml-2 flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
      />
    </div>
  );
}
