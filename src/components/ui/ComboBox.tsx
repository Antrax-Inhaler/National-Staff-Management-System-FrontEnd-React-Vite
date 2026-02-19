import {
  useState,
  useRef,
  useEffect,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";

interface ComboBoxProps {
  name: string;
  value: string;
  required?: boolean;
  onChange: (e: { target: { name: string; value: string } }) => void;
  options?: string[];
  placeholder?: string;
  error?: string | null;
  allowAddNew?: boolean;
  addNewLabel?: string;
  className?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const ComboBox: React.FC<ComboBoxProps> = ({
  name,
  value,
  required = false,
  onChange,
  options = [],
  placeholder = "Select or type...",
  error = null,
  allowAddNew = true,
  addNewLabel = "Add new:",
  className = "",
  onRefresh,
  isRefreshing = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter(
    (option) =>
      typeof option === "string" &&
      option.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Check if we should show "Add new" option
  const showAddNew =
    allowAddNew &&
    searchTerm.length > 0 &&
    !options.some(
      (opt) =>
        typeof opt === "string" &&
        opt.toLowerCase() === searchTerm.toLowerCase(),
    );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    if (isOpen) {
      // Use setTimeout to avoid conflicts with the click that opened the dropdown
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown") {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    const itemCount = filteredOptions.length + (showAddNew ? 1 : 0);

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < itemCount - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex === -1 && filteredOptions.length > 0) {
          handleSelect(filteredOptions[0]);
        } else if (highlightedIndex >= 0) {
          if (showAddNew && highlightedIndex === filteredOptions.length) {
            handleAddNew();
          } else if (highlightedIndex < filteredOptions.length) {
            handleSelect(filteredOptions[highlightedIndex]);
          }
        } else if (showAddNew) {
          handleAddNew();
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSearchTerm("");
        break;
      default:
        break;
    }
  };

  const handleSelect = (option: string) => {
    onChange({
      target: {
        name,
        value: option,
      },
    });
    setSearchTerm("");
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleAddNew = () => {
    if (searchTerm.trim()) {
      onChange({
        target: {
          name,
          value: searchTerm.trim(),
        },
      });
      setSearchTerm("");
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (!isOpen) setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleInputClick = () => {
    setIsOpen((prev) => !prev); // Toggle instead of just opening
  };

  const displayValue = value || searchTerm;

  return (
    <div className={className}>
      <div className="flex gap-2">
        <div ref={dropdownRef} className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            name={name}
            value={isOpen ? searchTerm : displayValue}
            onChange={handleInputChange}
            onClick={handleInputClick}
            onKeyDown={handleKeyDown}
            className={`w-full px-3 py-1.5 text-xs transition border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              error ? "border-red-300" : "border-gray-300"
            }`}
            placeholder={placeholder}
            autoComplete="off"
            required={required}
          />

          {/* Dropdown arrow indicator */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>

          {/* Dropdown menu */}
          {isOpen && (
            <div className="absolute z-10 w-full mt-1 overflow-auto bg-white border border-gray-300 rounded-lg shadow-lg max-h-60">
              {filteredOptions.length === 0 && !showAddNew ? (
                <div className="px-3 py-2 text-xs text-gray-500">
                  No options found
                </div>
              ) : (
                <>
                  {filteredOptions.map((option, index) => (
                    <div
                      key={option}
                      onClick={() => handleSelect(option)}
                      className={`px-3 py-2 text-xs cursor-pointer transition ${
                        index === highlightedIndex
                          ? "bg-blue-50 text-blue-700"
                          : "hover:bg-gray-50"
                      } ${value === option ? "bg-blue-100 font-medium" : ""}`}
                    >
                      {option}
                    </div>
                  ))}

                  {showAddNew && (
                    <div
                      onClick={handleAddNew}
                      className={`px-3 py-2 text-xs cursor-pointer border-t border-gray-200 transition ${
                        highlightedIndex === filteredOptions.length
                          ? "bg-blue-50 text-blue-700"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <span className="font-medium text-blue-600">
                        {addNewLabel}
                      </span>{" "}
                      <span className="text-gray-700">"{searchTerm}"</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Refresh button */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="px-3 py-1.5 text-xs transition border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            title="Refresh options"
          >
            <svg
              className={`w-4 h-4 text-gray-600 ${isRefreshing ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Error message */}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default ComboBox;
