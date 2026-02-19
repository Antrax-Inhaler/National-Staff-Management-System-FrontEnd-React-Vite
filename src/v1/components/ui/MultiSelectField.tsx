import { ChevronDown } from 'lucide-react';
import React, { type ChangeEvent, useState, useRef, useEffect } from 'react';

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectProps {
  name: string;
  label?: string;
  value?: string[];
  options?: MultiSelectOption[];
  onChange: (e: { target: { name: string; value: string[] } }) => void;
  required?: boolean;
  error?: string | null;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const MultiSelectField: React.FC<MultiSelectProps> = ({
  name,
  label,
  value = [],
  options = [],
  onChange,
  required = false,
  error = null,
  placeholder = 'Select items...',
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const selectedValues = Array.isArray(value) ? value : [];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (optionValue: string): void => {
    const currentValues = Array.isArray(value) ? value : [];
    let newValues: string[];

    if (currentValues.includes(optionValue)) {
      newValues = currentValues.filter((v) => v !== optionValue);
    } else {
      newValues = [...currentValues, optionValue];
    }

    onChange({ target: { name, value: newValues } });
  };

  const handleRemove = (valueToRemove: string): void => {
    const currentValues = Array.isArray(value) ? value : [];
    const newValues = currentValues.filter((v) => v !== valueToRemove);
    
    onChange({ target: { name, value: newValues } });
  };

  return (
    <div className={className} ref={dropdownRef}>
      {label && (
        <label className="block mb-1 text-xs font-medium text-gray-700 sm:text-xs">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Dropdown trigger */}
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={(e) => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              setIsOpen(!isOpen);
            }
          }}
          className={`w-full  px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-xs text-left border border-gray-300 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white hover:border-gray-400 cursor-pointer'
          }`}
        >
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
            {/* Selected items as pills */}
            {selectedValues.length > 0 ? (
              selectedValues.map((selectedValue) => {
                const option = options.find((opt) => opt.value === selectedValue);
                return option ? (
                  <span
                    key={selectedValue}
                    className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-xs font-medium bg-blue-100 text-blue-700 rounded-full max-w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <span className="truncate">{option.label}</span>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(selectedValue);
                      }}
                      className="hover:bg-blue-200 rounded-full p-0.5 disabled:cursor-not-allowed flex-shrink-0"
                      aria-label={`Remove ${option.label}`}
                    >
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </span>
                ) : null;
              })
            ) : (
              <span className="text-xs text-gray-500 sm:text-xs">{placeholder}</span>
            )}

            <svg
              className={`w-4 h-4 sm:w-5 sm:h-5 ml-auto flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 sm:max-h-60 md:max-h-72">
            {options.length > 0 ? (
              <div className="py-1">
                {options.map((option) => {
                  const isSelected = selectedValues.includes(option.value);
                  
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleToggle(option.value)}
                      className={`w-full px-2 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-xs text-left hover:bg-gray-50 active:bg-gray-100 flex items-center gap-2 sm:gap-3 touch-manipulation ${
                        isSelected ? 'bg-blue-50' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Handled by button onClick
                        className="flex-shrink-0 w-3 h-3 text-blue-600 border-gray-300 rounded pointer-events-none focus:ring-blue-500"
                      />
                      <span className={`break-words ${isSelected ? 'font-medium text-blue-700' : 'text-gray-700'}`}>
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="px-3 py-2 text-xs text-center text-gray-500 sm:py-3 sm:text-xs">
                No options available
              </div>
            )}
          </div>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-red-600 sm:text-xs">{error}</p>}
    </div>
  );
};

export default MultiSelectField;