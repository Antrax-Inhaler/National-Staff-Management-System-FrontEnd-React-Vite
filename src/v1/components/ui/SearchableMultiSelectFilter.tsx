import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, X, ChevronDown } from "lucide-react";

export interface FilterOption {
  label: string;
  value: string | number;
}

interface SearchableMultiSelectFilterProps {
  mobileLabel?: string;
  label?: string;
  name: string;
  value: FilterOption[];
  onApply: (selected: FilterOption[]) => void;
  options: FilterOption[];
  searchValue: string;
  onSearchChange: (val: string) => void;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  noResultsText?: string;
  showClearButton?: boolean;
  maxDisplayCount?: number;
  popupWidth?: number;
  popupMaxHeight?: number;
}

export default function SearchableMultiSelectFilter({
  mobileLabel,
  label,
  name,
  value = [],
  onApply,
  options,
  searchValue,
  onSearchChange,
  loading = false,
  disabled = false,
  placeholder = "All",
  noResultsText = "No results found",
  showClearButton = true,
  maxDisplayCount = 2,
  popupWidth = 400,
  popupMaxHeight = 400,
}: SearchableMultiSelectFilterProps) {
  const [tempSelected, setTempSelected] = useState<FilterOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
    width: number;
  }>({
    top: 0,
    left: 0,
    width: 0,
  });

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const hasValue = value.length > 0;

  const isSelected = (optionValue: string | number) => {
    return tempSelected.some((v) => v.value === optionValue);
  };

  const handleSelect = (option: FilterOption) => {
    const isCurrentlySelected = isSelected(option.value);

    if (isCurrentlySelected) {
      setTempSelected(tempSelected.filter((v) => v.value !== option.value));
    } else {
      setTempSelected([...tempSelected, option]);
    }
  };

  const handleRemove = (optionValue: string | number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTempSelected(tempSelected.filter((v) => v.value !== optionValue));
  };

  const handleClear = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTempSelected([]);
  };

  const handleApply = () => {
    onApply(tempSelected);
    closeDropdown();
  };

  const handleCancel = () => {
    setTempSelected(value);
    closeDropdown();
  };

  const toggleDropdown = () => {
    if (disabled) return;

    if (!isOpen) {
      setTempSelected(value);
      if (isMobile) {
        setIsOpen(true);
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 10);
      } else {
        setIsOpen(true);
      }
    } else {
      handleCancel();
    }
  };

  const closeDropdown = () => {
    if (isMobile) {
      setIsAnimating(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsAnimating(false);
      }, 300);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen && triggerRef.current && !isMobile) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isOpen, isMobile]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        dropdownRef.current &&
        !triggerRef.current.contains(target) &&
        !dropdownRef.current.contains(target)
      ) {
        handleCancel();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isOpen, isMobile, value]);

  const displayText = () => {
    if (value.length === 0) return placeholder;
    if (value.length === 1) return value[0].label;
    if (value.length <= maxDisplayCount) {
      return value.map((v) => v.label).join(", ");
    }
    return `${value
      .slice(0, maxDisplayCount)
      .map((v) => v.label)
      .join(", ")} +${value.length - maxDisplayCount}`;
  };

  return (
    <div className="relative inline-block">
      {label && (
        <label className="block mb-1 text-xs font-medium text-gray-600">
          {label}
        </label>
      )}

      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={toggleDropdown}
        className={`
          inline-flex items-center gap-2 px-3 py-2 text-xs font-medium
          border rounded-lg transition-all
          ${
            hasValue
              ? "bg-gray-800 border-gray-300 text-white hover:bg-gray-700"
              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1
        `}
      >
        <Search
          size={14}
          className={hasValue ? "text-white" : "text-gray-400"}
        />
        <span className="max-w-[200px] truncate">{displayText()}</span>
        {hasValue && showClearButton ? (
          <X
            size={14}
            className="text-gray-500 hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              onApply([]);
            }}
          />
        ) : (
          <ChevronDown
            size={14}
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {isOpen &&
        !disabled &&
        createPortal(
          <>
            <div
              className={`fixed inset-0 transition-opacity duration-300  ${
                isMobile
                  ? `z-[9998] ${isAnimating ? "bg-transparent" : "bg-black/20"}`
                  : "z-[9998] bg-black/20"
              }`}
              onClick={handleCancel}
            />

            <div
              ref={dropdownRef}
              className={`
                bg-white shadow-lg animate-fadeIn ${
                  isMobile ? "transition-all duration-300" : ""
                }
                ${
                  isMobile
                    ? `fixed left-0 right-0 z-[9999] rounded-t-2xl max-h-[80vh] flex flex-col 
                     ${isAnimating ? "bottom-[-100%]" : "bottom-0"}`
                    : "absolute z-[9999] border border-gray-300 rounded-lg"
                }
              `}
              style={
                isMobile || !mounted
                  ? undefined
                  : {
                      position: "absolute",
                      top: dropdownPos.top,
                      left: dropdownPos.left,
                      width: popupWidth,
                    }
              }
            >
              {isMobile && (
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {mobileLabel || "Select Options"}
                  </h3>
                  <button
                    onClick={handleCancel}
                    className="p-1 text-gray-400 transition-colors rounded-lg hover:text-gray-600 hover:bg-gray-100"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}

              <div
                className={`p-2 border-b border-gray-200 ${
                  isMobile ? "flex-shrink-0" : ""
                }`}
              >
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute text-gray-400 transform -translate-y-1/2 left-2 top-1/2"
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search..."
                    className="w-full py-1.5 pl-8 pr-2 text-xs border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div
                className={`overflow-y-auto text-xs ${
                  isMobile ? "flex-1" : ""
                }`}
                style={{ maxHeight: isMobile ? "auto" : `${popupMaxHeight}px` }}
              >
                {loading ? (
                  <div className="px-4 py-8 text-center text-gray-400">
                    <div className="inline-block w-5 h-5 border-2 border-gray-300 rounded-full border-t-zinc-500 animate-spin"></div>
                    <p className="mt-2 text-xs">Loading...</p>
                  </div>
                ) : options.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-400">
                    <Search size={24} className="mx-auto mb-2 text-white opacity-30" />
                    <p className="text-xs">{noResultsText}</p>
                  </div>
                ) : (
                  options.map((opt) => {
                    const selected = isSelected(opt.value);
                    return (
                      <div
                        key={String(opt.value)}
                        className={`px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selected
                            ? "bg-gray-50 text-zinc-700 font-medium"
                            : "text-gray-700"
                        } ${isMobile ? "py-3" : ""}`}
                        onClick={() => handleSelect(opt)}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={`flex items-center justify-center w-4 h-4 min-w-[16px] border-2 rounded transition-colors ${
                              selected
                                ? "bg-zinc-500 border-zinc-500"
                                : "bg-white border-gray-300"
                            }`}
                          >
                            {selected && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </span>
                          {opt.label}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              <div
                className={`flex-shrink-0 p-4 border-t border-gray-200 rounded-lg ${
                  isMobile ? "" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleClear}
                    className="px-4 py-2 text-xs font-medium text-gray-700 transition-all duration-200 hover:text-gray-900 hover:underline"
                  >
                    Clear all
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 text-xs font-medium text-gray-700 transition-all duration-200 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleApply}
                      className="px-4 py-2 text-xs font-medium text-white transition-all duration-200 bg-gray-900 rounded-lg hover:bg-gray-800 hover:shadow-lg"
                    >
                      Apply{" "}
                      {tempSelected.length > 0 && `(${tempSelected.length})`}
                    </button>
                  </div>
                </div>
              </div>

              {isMobile && <div className="h-safe-area-inset-bottom" />}
            </div>
          </>,
          document.body
        )}
    </div>
  );
}

// // Demo Component
// function Demo() {
//   const [selectedFilters, setSelectedFilters] = useState<FilterOption[]>([]);
//   const [searchValue, setSearchValue] = useState("");

//   const allOptions: FilterOption[] = [
//     { label: "Apple", value: "apple-1" },
//     { label: "Banana", value: "banana-2" },
//     { label: "Cherry", value: "cherry-3" },
//     { label: "Date", value: "date-4" },
//     { label: "Elderberry", value: "elderberry-5" },
//     { label: "Fig", value: "fig-6" },
//     { label: "Grape", value: "grape-7" },
//     { label: "Honeydew", value: "honeydew-8" },
//     { label: "Kiwi", value: "kiwi-9" },
//     { label: "Lemon", value: "lemon-10" },
//     { label: "Mango", value: "mango-11" },
//     { label: "Orange", value: "orange-12" },
//   ];

//   const filteredOptions = allOptions.filter((opt) =>
//     opt.label.toLowerCase().includes(searchValue.toLowerCase())
//   );

//   const removeBadge = (value: string | number) => {
//     setSelectedFilters(selectedFilters.filter((f) => f.value !== value));
//   };

//   return (
//     <div className="min-h-screen p-8 bg-gray-50">
//       <div className="max-w-4xl mx-auto">
//         <h1 className="mb-6 text-2xl font-bold text-gray-900">
//           Multi-Select Filter Demo
//         </h1>

//         <div className="p-6 mb-6 bg-white rounded-lg shadow-sm">
//           <SearchableMultiSelectFilter
//             label="Select Fruits"
//             mobileLabel="Choose Your Fruits"
//             name="fruits"
//             value={selectedFilters}
//             onApply={setSelectedFilters}
//             options={filteredOptions}
//             searchValue={searchValue}
//             onSearchChange={setSearchValue}
//             placeholder="Select fruits..."
//             maxDisplayCount={2}
//             popupWidth={450}
//             popupMaxHeight={400}
//           />
//         </div>

//         <div className="p-6 bg-white rounded-lg shadow-sm">
//           <h2 className="mb-3 text-lg font-semibold text-gray-900">
//             Active Filters
//           </h2>

//           {selectedFilters.length === 0 ? (
//             <p className="text-sm text-gray-500">No filters selected</p>
//           ) : (
//             <div className="flex flex-wrap gap-2">
//               {selectedFilters.map((filter) => (
//                 <span
//                   key={String(filter.value)}
//                   className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-full"
//                 >
//                   <span>{filter.label}</span>
//                   <span className="text-xs text-gray-500">
//                     ({filter.value})
//                   </span>
//                   <button
//                     onClick={() => removeBadge(filter.value)}
//                     className="transition-colors hover:text-gray-900"
//                   >
//                     <X size={14} />
//                   </button>
//                 </span>
//               ))}
//             </div>
//           )}

//           <div className="p-4 mt-4 rounded-lg bg-gray-50">
//             <p className="mb-2 text-xs font-semibold text-gray-600">
//               Selected Values (for API):
//             </p>
//             <pre className="text-xs text-gray-700">
//               {JSON.stringify(
//                 selectedFilters.map((f) => f.value),
//                 null,
//                 2
//               )}
//             </pre>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Demo;
