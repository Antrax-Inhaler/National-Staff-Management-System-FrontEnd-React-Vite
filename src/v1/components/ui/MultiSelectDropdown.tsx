// src/components/ui/MultiSelectDropdown.tsx
import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';

interface MultiSelectDropdownProps {
  label: string;
  options: Array<{ value: string; label: string }>;
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  searchable?: boolean;
  maxSelections?: number;
  disabled?: boolean;
}

export function MultiSelectDropdown({
  label,
  options,
  selectedValues,
  onChange,
  placeholder = 'Select options...',
  searchable = false,
  maxSelections,
  disabled = false,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const filteredOptions = searchable
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const handleSelect = (value: string) => {
    if (selectedValues.includes(value)) {
      // Remove if already selected
      onChange(selectedValues.filter(v => v !== value));
    } else {
      // Add if not selected and within max limit
      if (!maxSelections || selectedValues.length < maxSelections) {
        onChange([...selectedValues, value]);
      }
    }
  };

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedValues.filter(v => v !== value));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const selectedLabels = selectedValues
    .map(value => options.find(opt => opt.value === value)?.label)
    .filter(Boolean);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="mb-1">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {selectedValues.length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
              {selectedValues.length}
            </span>
          )}
        </label>
      </div>

      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          min-h-[42px] w-full px-3 py-2 text-sm border rounded-lg cursor-pointer
          flex items-center justify-between gap-2 flex-wrap
          transition-all duration-200
          ${disabled 
            ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' 
            : isOpen
              ? 'border-blue-500 ring-2 ring-blue-200 bg-white'
              : 'border-gray-300 hover:border-gray-400 bg-white'
          }
        `}
      >
        <div className="flex flex-wrap gap-1 flex-1">
          {selectedLabels.length > 0 ? (
            selectedLabels.map((label, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md"
              >
                {label}
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => handleRemove(selectedValues[index], e)}
                    className="p-0.5 hover:bg-blue-200 rounded"
                  >
                    <X size={12} />
                  </button>
                )}
              </span>
            ))
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {selectedValues.length > 0 && !disabled && (
            <button
              type="button"
              onClick={handleClearAll}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            } ${disabled ? 'text-gray-400' : 'text-gray-500'}`}
          />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {searchable && (
            <div className="sticky top-0 p-2 border-b bg-white">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          <div className="py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <div
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`
                      flex items-center gap-3 px-3 py-2 cursor-pointer
                      transition-colors duration-150
                      ${isSelected 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className={`
                      w-4 h-4 border rounded flex items-center justify-center
                      ${isSelected 
                        ? 'bg-blue-600 border-blue-600' 
                        : 'border-gray-300'
                      }
                    `}>
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                    <span className="text-sm">{option.label}</span>
                  </div>
                );
              })
            ) : (
              <div className="px-3 py-4 text-center text-gray-500 text-sm">
                No options found
              </div>
            )}

            {maxSelections && selectedValues.length >= maxSelections && (
              <div className="px-3 py-2 text-xs text-amber-600 bg-amber-50 border-t">
                Maximum {maxSelections} selections allowed
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}