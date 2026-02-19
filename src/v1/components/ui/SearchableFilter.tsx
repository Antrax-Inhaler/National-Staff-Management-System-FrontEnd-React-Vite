import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, X, ChevronDown } from "lucide-react";

interface SearchableFilterProps {
  mobileLabel?: string;
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
  disabled?: boolean;
  placeholder?: string;
  noResultsText?: string;
  showClearButton?: boolean;
}

export default function SearchableFilter({
  mobileLabel,
  label,
  name,
  value,
  onChange,
  options,
  searchValue,
  onSearchChange,
  loading = false,
  disabled = false,
  placeholder = "All",
  noResultsText = "No results found",
  showClearButton = true,
}: SearchableFilterProps) {
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

  const selectedLabel = options.find((opt) => opt.value === value)?.label ?? "";
  const hasValue = value !== null && value !== undefined && value !== "";

  // Synthetic change event
  const emitChangeEvent = (val: string | number | null) => {
    const synthetic = {
      target: { name, value: val },
    } as unknown as React.ChangeEvent<HTMLInputElement | HTMLSelectElement>;

    onChange(synthetic);
  };

  const handleSelect = (val: string | number) => {
    emitChangeEvent(val);
    closeDropdown();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    emitChangeEvent(null);
    onSearchChange("");
  };

  // Toggle dropdown (handles mobile open animation)
  const toggleDropdown = () => {
    if (disabled) return;

    if (!isOpen) {
      if (isMobile) {
        setIsOpen(true);
        setIsAnimating(true); // start off-screen
        // trigger animation on next tick
        setTimeout(() => setIsAnimating(false), 10);
      } else {
        setIsOpen(true);
      }
    } else {
      closeDropdown();
    }
  };

  // Close dropdown
  const closeDropdown = () => {
    if (isMobile) {
      setIsAnimating(true); // start closing animation
      setTimeout(() => {
        setIsOpen(false);
        setIsAnimating(false);
      }, 300); // match CSS transition duration
    } else {
      setIsOpen(false);
    }
  };

  // Desktop dropdown positioning
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

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [isOpen]);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Prevent initial desktop animation jump
  useEffect(() => setMounted(true), []);

  // Lock body scroll + handle outside clicks
  useEffect(() => {
    if (!isOpen) return;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        dropdownRef.current &&
        !triggerRef.current.contains(target) &&
        !dropdownRef.current.contains(target)
      ) closeDropdown();
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isOpen, isMobile]);

  return (
    <div className="relative inline-block">
      {label && (
        <label className="block mb-1 text-xs font-medium text-gray-600">
          {label}
        </label>
      )}

      {/* Filter Button */}
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
              ? "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
        `}
      >
        <Search size={14} className={hasValue ? "text-blue-500" : "text-gray-400"} />
        <span className="max-w-[150px] truncate">{selectedLabel || placeholder}</span>
        {hasValue && showClearButton ? (
          <X size={14} className="text-blue-500 hover:text-blue-700" onClick={handleClear} />
        ) : (
          <ChevronDown size={14} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
        )}
      </button>

      {/* Dropdown */}
      {isOpen &&
        !disabled &&
        createPortal(
          <>
            {/* Backdrop */}
            <div
              className={`fixed inset-0 transition-opacity duration-300 ${
                isMobile
                  ? `z-[9998] ${isAnimating ? "bg-transparent" : "bg-black/20"}`
                  : "z-[9998] bg-black/20 bg-opacity-10"
              }`}
              onClick={closeDropdown}
            />

            {/* Dropdown / Action Sheet */}
            <div
              ref={dropdownRef}
              className={`
                bg-white shadow-lg ${isMobile ? "transition-all duration-300" : ""}
                ${isMobile
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
                      width: Math.max(dropdownPos.width, 250),
                    }
              }
            >
              {/* Mobile Header */}
              {isMobile && (
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900">{mobileLabel || "Select Option"}</h3>
                  <button
                    onClick={closeDropdown}
                    className="p-1 text-gray-400 transition-colors rounded-lg hover:text-gray-600 hover:bg-gray-100"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}

              {/* Search Input */}
              <div className={`p-2 border-b border-gray-200 ${isMobile ? "flex-shrink-0" : ""}`}>
                <div className="relative">
                  <Search size={14} className="absolute text-gray-400 transform -translate-y-1/2 left-2 top-1/2" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search..."
                    className="w-full py-1.5 pl-8 pr-2 text-xs border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Options List */}
              <div className={`overflow-y-auto text-xs ${isMobile ? "flex-1" : "max-h-60"}`}>
                {loading ? (
                  <div className="px-4 py-8 text-center text-gray-400">
                    <div className="inline-block w-5 h-5 border-2 border-gray-300 rounded-full border-t-blue-500 animate-spin"></div>
                    <p className="mt-2 text-xs">Loading...</p>
                  </div>
                ) : options.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-400">
                    <Search size={24} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs">{noResultsText}</p>
                  </div>
                ) : (
                  options.map((opt) => (
                    <div
                      key={String(opt.value)}
                      className={`px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                        value === opt.value
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-gray-700"
                      } ${isMobile ? "py-3" : ""}`}
                      onClick={() => handleSelect(opt.value)}
                    >
                      <span className="flex items-center gap-2">
                        {value === opt.value && (
                          <span className="flex items-center justify-center w-4 h-4 bg-blue-500 rounded-full">
                            <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                          </span>
                        )}
                        {opt.label}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Mobile safe area */}
              {isMobile && <div className="h-safe-area-inset-bottom" />}
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
