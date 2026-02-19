// src/components/ui/ComboInput.tsx
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  ChevronDown, 
  Loader2, 
  Plus, 
  X, 
  Check,
  Search,
  RefreshCw
} from "lucide-react";

interface ComboInputProps {
  // Basic props
  label?: string;
  name: string;
  value: string | number | null | undefined;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | { target: { name: string; value: string | number | null } }
  ) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  
  // Options configuration
  options?: Array<{ label: string; value: string | number }>;
  fetchOptions?: () => Promise<Array<{ label: string; value: string | number }>>;
  enableCustomInput?: boolean;
  allowMultiple?: boolean;
  maxSelections?: number;
  
  // Display configuration
  mode?: "dropdown" | "inline" | "combobox";
  size?: "sm" | "md" | "lg";
  searchable?: boolean;
  creatable?: boolean;
  
  // States
  loading?: boolean;
  error?: string[];
  success?: boolean;
  
  // Texts
  noOptionsText?: string;
  loadingText?: string;
  createText?: string;
  addCustomText?: string;
  refreshText?: string;
}

export default function ComboInput({
  label,
  name,
  value,
  onChange,
  placeholder = "Select or type...",
  required = false,
  disabled = false,
  className = "",
  inputClassName = "",
  
  // Options
  options: providedOptions = [],
  fetchOptions,
  enableCustomInput = true,
  allowMultiple = false,
  maxSelections,
  
  // Display
  mode = "combobox",
  size = "md",
  searchable = true,
  creatable = true,
  
  // States
  loading: externalLoading = false,
  error,
  success,
  
  // Texts
  noOptionsText = "No options available",
  loadingText = "Loading options...",
  createText = "Create new",
  addCustomText = "Add custom value",
  refreshText = "Refresh options",
}: ComboInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [internalOptions, setInternalOptions] = useState(providedOptions);
  const [isLoading, setIsLoading] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [selectedItems, setSelectedItems] = useState<Array<{ label: string; value: string | number }>>([]);
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
    width: number;
  }>({ top: 0, left: 0, width: 0 });

  const triggerRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Size classes
  const sizeClasses = {
    sm: "py-1 px-2 text-xs",
    md: "py-2 px-3 text-sm",
    lg: "py-3 px-4 text-base"
  };

  // Initialize from props
  useEffect(() => {
    setInternalOptions(providedOptions);
  }, [providedOptions]);

  // Handle multiple selections
  useEffect(() => {
    if (allowMultiple) {
      if (Array.isArray(value)) {
        const items = value.map(val => 
          internalOptions.find(opt => opt.value === val) || 
          { label: String(val), value: val }
        );
        setSelectedItems(items);
      } else {
        setSelectedItems([]);
      }
    }
  }, [value, internalOptions, allowMultiple]);

  // Fetch options from backend
  const loadOptions = async () => {
    if (!fetchOptions) return;
    
    try {
      setIsLoading(true);
      const fetchedOptions = await fetchOptions();
      setInternalOptions(fetchedOptions);
    } catch (error) {
      console.error('Failed to fetch options:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize fetch on mount if needed
  useEffect(() => {
    if (fetchOptions && internalOptions.length === 0) {
      loadOptions();
    }
  }, []);

  // Filter options based on search
  const filteredOptions = internalOptions.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(option.value).toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if custom value should be shown
  const shouldShowCustomOption = 
    enableCustomInput && 
    searchQuery.trim() !== "" && 
    !internalOptions.some(opt => 
      opt.label.toLowerCase() === searchQuery.toLowerCase() ||
      String(opt.value).toLowerCase() === searchQuery.toLowerCase()
    );

  // Get selected label for single selection
  const selectedLabel = allowMultiple 
    ? selectedItems.map(item => item.label).join(", ")
    : internalOptions.find(opt => opt.value === value)?.label || 
      (enableCustomInput && value ? String(value) : "");

  // Create synthetic change event
  const emitChange = (newValue: string | number | null | Array<string | number>) => {
    const synthetic = {
      target: {
        name,
        value: newValue
      }
    } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>;
    
    onChange(synthetic);
  };

  // Handle selection
  const handleSelect = (optionValue: string | number) => {
    if (allowMultiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const isSelected = currentValues.includes(optionValue);
      
      let newValues: Array<string | number>;
      if (isSelected) {
        newValues = currentValues.filter(v => v !== optionValue);
      } else {
        if (maxSelections && currentValues.length >= maxSelections) {
          // Optionally handle max selections reached
          return;
        }
        newValues = [...currentValues, optionValue];
      }
      
      emitChange(newValues);
    } else {
      emitChange(optionValue);
      setIsOpen(false);
      setSearchQuery("");
    }
  };

  // Handle custom value creation
  const handleCreateCustom = () => {
    const customValue = searchQuery.trim();
    if (!customValue) return;

    if (allowMultiple) {
      const currentValues = Array.isArray(value) ? value : [];
      emitChange([...currentValues, customValue]);
      
      // Add to internal options if not exists
      if (!internalOptions.some(opt => opt.value === customValue)) {
        setInternalOptions(prev => [...prev, {
          label: customValue,
          value: customValue
        }]);
      }
    } else {
      emitChange(customValue);
      
      // Add to internal options if not exists
      if (!internalOptions.some(opt => opt.value === customValue)) {
        setInternalOptions(prev => [...prev, {
          label: customValue,
          value: customValue
        }]);
      }
      
      setIsOpen(false);
    }
    
    setSearchQuery("");
  };

  // Remove selected item (for multiple mode)
  const removeSelectedItem = (itemValue: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!allowMultiple || !Array.isArray(value)) return;
    
    const newValues = value.filter(v => v !== itemValue);
    emitChange(newValues);
  };

  // Clear all selections
  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (allowMultiple) {
      emitChange([]);
    } else {
      emitChange(null);
    }
    
    setSearchQuery("");
  };

  // Toggle dropdown and calculate position
  const toggleDropdown = () => {
    if (disabled) return;
    
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    
    if (newIsOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
      
      // Focus search input when opening
      setTimeout(() => {
        if (dropdownRef.current) {
          const searchInput = dropdownRef.current.querySelector('input');
          searchInput?.focus();
        }
      }, 10);
    }
  };

  // Close dropdown when clicking outside
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

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // For inline mode
  if (mode === "inline") {
    return (
      <div className={`flex flex-wrap gap-2 items-center ${className}`}>
        {label && (
          <label className="text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        
        <div className="flex flex-wrap gap-2">
          {internalOptions.map(option => (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`
                px-3 py-1.5 text-sm rounded-lg border transition-colors
                ${allowMultiple && Array.isArray(value) && value.includes(option.value)
                  ? 'bg-blue-100 text-blue-700 border-blue-300'
                  : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              disabled={disabled}
            >
              {option.label}
              {allowMultiple && Array.isArray(value) && value.includes(option.value) && (
                <Check className="inline-block ml-1 w-3 h-3" />
              )}
            </button>
          ))}
          
          {enableCustomInput && (
            <div className="relative">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && customInput.trim()) {
                    handleCreateCustom();
                    setCustomInput("");
                  }
                }}
                placeholder="Custom..."
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={disabled}
              />
              {customInput.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    handleCreateCustom();
                    setCustomInput("");
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // For dropdown and combobox modes
  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Trigger/Input Area */}
      <div
        ref={triggerRef}
        className={`
          relative w-full border rounded-lg bg-white cursor-text
          ${sizeClasses[size]}
          ${success ? 'border-green-500' : error ? 'border-red-500' : 'border-gray-300'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-50' : 'hover:border-gray-400'}
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
          ${inputClassName}
        `}
        onClick={toggleDropdown}
      >
        {/* Selected items display for multiple mode */}
        {allowMultiple && selectedItems.length > 0 ? (
          <div className="flex flex-wrap gap-1 items-center min-h-[20px]">
            {selectedItems.map(item => (
              <span
                key={String(item.value)}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full"
              >
                {item.label}
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => removeSelectedItem(item.value, e)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
            <input
              type="text"
              ref={inputRef}
              className="flex-1 min-w-[60px] outline-none bg-transparent"
              placeholder={selectedItems.length === 0 ? placeholder : ""}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              onFocus={() => !isOpen && setIsOpen(true)}
              disabled={disabled}
            />
          </div>
        ) : (
          // Single selection display
          <div className="flex items-center justify-between">
            <span className={`${!selectedLabel ? 'text-gray-400' : ''}`}>
              {selectedLabel || placeholder}
            </span>
            <div className="flex items-center gap-1">
              {!allowMultiple && value && !disabled && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="p-0.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {(externalLoading || isLoading) && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {/* Dropdown (portal) */}
      {isOpen && !disabled && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] bg-white border border-gray-300 rounded-lg shadow-xl overflow-hidden"
          style={{
            top: dropdownPos.top + 4,
            left: dropdownPos.left,
            width: dropdownPos.width,
            maxHeight: '300px',
          }}
        >
          {/* Search input */}
          {searchable && (
            <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search options..."
                  className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options list */}
          <div className="overflow-y-auto max-h-[250px]">
            {/* Loading state */}
            {isLoading ? (
              <div className="flex items-center justify-center p-4 text-gray-500">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {loadingText}
              </div>
            ) : (
              <>
                {/* Options */}
                {filteredOptions.length > 0 ? (
                  filteredOptions.map(option => {
                    const isSelected = allowMultiple
                      ? Array.isArray(value) && value.includes(option.value)
                      : value === option.value;
                    
                    return (
                      <div
                        key={String(option.value)}
                        className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                          isSelected ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handleSelect(option.value)}
                      >
                        <span className={isSelected ? 'font-medium text-blue-700' : ''}>
                          {option.label}
                        </span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="px-3 py-3 text-center text-gray-500 text-sm">
                    {noOptionsText}
                  </div>
                )}

                {/* Custom creation option */}
                {creatable && shouldShowCustomOption && (
                  <div
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer border-t border-gray-200 bg-gray-50 hover:bg-gray-100"
                    onClick={handleCreateCustom}
                  >
                    <Plus className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      {createText}: <span className="font-medium">"{searchQuery}"</span>
                    </span>
                  </div>
                )}

                {/* Refresh options button */}
                {fetchOptions && (
                  <button
                    type="button"
                    onClick={loadOptions}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 border-t border-gray-200 hover:bg-gray-50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {refreshText}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Selection info for multiple mode */}
          {allowMultiple && maxSelections && (
            <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-200 bg-gray-50">
              {Array.isArray(value) ? value.length : 0} / {maxSelections} selected
            </div>
          )}
        </div>,
        document.body
      )}

      {/* Error message */}
      {error && error.length > 0 && (
        <p className="mt-1 text-xs text-red-600">{error[0]}</p>
      )}

      {/* Success message */}
      {success && (
        <p className="mt-1 text-xs text-green-600">✓ Successfully saved</p>
      )}
    </div>
  );
}