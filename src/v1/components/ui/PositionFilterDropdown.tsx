import { useState, useRef, useEffect } from "react";
import { Filter, X } from "lucide-react";
import { Positions } from "../../constants/positions";

interface PositionFilterDropdownProps {
  value: string[];
  onChange: (selected: string[]) => void;
  size?: "sm" | "md" | "lg";
  buttonLabel?: string;
}

export default function PositionFilterDropdown({
  value,
  onChange,
  size = "md",
  buttonLabel = "Positions",
}: PositionFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const positionOptions = Object.values(Positions);

  const handlePositionToggle = (position: string) => {
    const newSelected = value.includes(position)
      ? value.filter((p) => p !== position)
      : [...value, position];
    onChange(newSelected);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const isActive = value.length > 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          inline-flex items-center gap-2 font-medium rounded-lg shadow-sm 
          border border-gray-300 bg-white hover:bg-gray-50 
          focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1
          ${sizeClasses[size]}
          ${isActive ? "text-blue-700 bg-blue-50 border-blue-200" : "text-gray-700"}
        `}
      >
        <Filter size={16} />
        <span>{buttonLabel}</span>
        {isActive && (
          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-blue-500 rounded-full">
            {value.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg w-72"
          style={{
            top: (buttonRef.current?.getBoundingClientRect().bottom ?? 0) + 8,
            right: window.innerWidth - (buttonRef.current?.getBoundingClientRect().right ?? 0),
          }}
        >
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-gray-900">
                Filter by Position
              </div>
              {isActive && (
                <button
                  onClick={handleClearAll}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {positionOptions.map((position) => {
                const isSelected = value.includes(position);
                return (
                  <div
                    key={position}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      id={`position-${position}`}
                      checked={isSelected}
                      onChange={() => handlePositionToggle(position)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor={`position-${position}`}
                      className={`text-sm cursor-pointer flex-1 ${
                        isSelected ? "text-blue-700 font-medium" : "text-gray-700"
                      }`}
                    >
                      {position}
                    </label>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 mt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {isActive
                    ? `${value.length} position${value.length > 1 ? "s" : ""} selected`
                    : "Select positions to filter"}
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}