import React, { useState, useRef, useEffect } from "react";
import { Filter as FilterIcon } from "lucide-react";

export interface FilterOptions {
  [category: string]: string[];
}

interface FilterDropdownProps {
  options: FilterOptions;
  value: Record<string, string[]>; // current selections
  onApply: (selected: Record<string, string[]>) => void;
  onReset?: () => void;
  buttonLabel?: string;
  buttonIcon?: React.ReactNode;
  defaultValue?: Record<string, string[]>; // optional default
}

export default function FilterDropdown({
  options,
  value,
  onApply,
  onReset,
  buttonLabel = "Filter",
buttonIcon,
  defaultValue
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] =
    useState<Record<string, string[]>>(value);
  const ref = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Adjust dropdown position to prevent going off-screen
  useEffect(() => {
    if (open && dropdownRef.current) {
      const dropdown = dropdownRef.current;
      const rect = dropdown.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      // If dropdown goes beyond right edge of viewport
      if (rect.right > viewportWidth) {
        const overflow = rect.right - viewportWidth;
        dropdown.style.right = 'auto';
        dropdown.style.left = `-${overflow + 10}px`;
      }
      
      // If dropdown goes beyond left edge of viewport
      if (rect.left < 0) {
        const overflow = Math.abs(rect.left);
        dropdown.style.left = 'auto';
        dropdown.style.right = `-${overflow + 10}px`;
      }
    }
  }, [open]);

  // toggle checkbox
  const toggle = (category: string, option: string) => {
    setLocalFilters((prev) => {
      const set = new Set(prev[category] ?? []);
      set.has(option) ? set.delete(option) : set.add(option);
      return { ...prev, [category]: Array.from(set) };
    });
  };

  const resetFilters = () => {
    const cleared = defaultValue
      ? { ...defaultValue }
      : Object.fromEntries(Object.keys(options).map((k) => [k, []]));

    setLocalFilters(cleared);
    onReset?.();
    onApply?.(cleared);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
      >
        {buttonIcon ?? <FilterIcon size={16} />}
        {buttonLabel}
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute left-0 z-[99999999] mt-2 w-72 rounded-lg border border-gray-200
                     bg-white shadow-xl"
          style={{ 
            minWidth: '280px',
            maxWidth: '90vw'
          }}
        >
          <div className="p-4 space-y-4 overflow-y-auto max-h-80">
            {Object.entries(options).map(([category, opts]) => (
              <div key={category}>
                <p className="mb-2 text-sm font-semibold text-gray-700 capitalize">
                  {category.replace("_", " ")}
                </p>
                <div className="space-y-1">
                  {opts.map((opt) => (
                    <label
                      key={opt}
                      className="flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={localFilters[category]?.includes(opt) ?? false}
                        onChange={() => toggle(category, opt)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex justify-between p-3 border-t border-gray-200 rounded-b-lg bg-gray-50">
            <button
              onClick={resetFilters}
              className="rounded-md bg-gray-100 px-3 py-1.5 text-sm
                         font-medium text-gray-700 hover:bg-gray-200"
            >
              Reset
            </button>
            <button
              onClick={() => {
                onApply(localFilters);
                setOpen(false);
              }}
              className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium
                         text-white hover:bg-blue-700"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}