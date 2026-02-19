import React, { useState, useRef, useEffect } from "react";
import { Filter } from "lucide-react";

export interface FilterOptions {
  [category: string]: string[];
}

interface FilterDropdownProps {
  options: FilterOptions;
  value?: Record<string, string[]>;
  defaultValue?: Record<string, string[]>;
  onApply: (selected: Record<string, string[]>) => void;
  onReset?: () => void;
  buttonLabel?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  buttonIcon?: React.ReactNode;
  activeCount?: number;
}

export default function FilterDropdown({
  options,
  value = {},
  defaultValue = {},
  onApply,
  onReset,
  buttonLabel = "Filter",
  icon: Icon,
  buttonIcon,
  activeCount = 0,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [localFilters, setLocalFilters] = useState<Record<string, string[]>>(
    () => {
      // Initialize state only once on mount
      const initialFilters: Record<string, string[]> = {};
      Object.keys(options).forEach((category) => {
        const valueForCategory = value[category] ?? defaultValue[category];
        if (Array.isArray(valueForCategory)) {
          initialFilters[category] = [...valueForCategory];
        } else {
          initialFilters[category] = [];
        }
      });
      return initialFilters;
    },
  );

  const ref = useRef<HTMLDivElement>(null);

  // Only sync when dropdown opens and external value has changed
  useEffect(() => {
    if (open && !initialized) {
      const updatedFilters: Record<string, string[]> = {};
      Object.keys(options).forEach((category) => {
        const valueForCategory = value[category] ?? defaultValue[category];
        if (Array.isArray(valueForCategory)) {
          updatedFilters[category] = [...valueForCategory];
        } else {
          updatedFilters[category] = [];
        }
      });
      setLocalFilters(updatedFilters);
      setInitialized(true);
    }
  }, [open]);

  // Reset initialized flag when dropdown closes
  useEffect(() => {
    if (!open) {
      setInitialized(false);
    }
  }, [open]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Toggle individual option
  const toggle = (category: string, option: string) => {
    setLocalFilters((prev) => {
      const set = new Set(prev[category] ?? []);
      set.has(option) ? set.delete(option) : set.add(option);
      return { ...prev, [category]: Array.from(set) };
    });
  };

  // Reset filters to defaultValue (or clear if defaultValue is empty)
  const resetFilters = () => {
    const reset: Record<string, string[]> = {};

    Object.keys(options).forEach((category) => {
      reset[category] = defaultValue[category]
        ? [...defaultValue[category]]
        : [];
    });

    setLocalFilters(reset);

    if (onReset) {
      onReset();
    } else {
      onApply(reset);
    }
  };

  const handleApply = () => {
    onApply(localFilters);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-gray-700 transition-all duration-200 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400"
      >
        {Icon ? <Icon size={14} /> : <Filter size={14} />}
        {buttonLabel}
        {activeCount > 0 && (
          <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg w-60">
          <div className="p-3 space-y-4 overflow-y-auto max-h-64">
            {Object.entries(options).map(([category, opts]) => (
              <div key={category}>
                <p className="px-1 mb-2 text-xs font-semibold tracking-wide text-gray-600 uppercase">
                  {category.replace(/_/g, " ")}
                </p>
                <div className="space-y-1">
                  {opts.map((opt) => (
                    <label
                      key={opt}
                      className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={localFilters[category]?.includes(opt) ?? false}
                        onChange={() => toggle(category, opt)}
                        className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {opt}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-xs font-medium text-gray-700 transition-all duration-200 hover:text-gray-900 hover:underline"
              >
                Reset all
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleApply}
                  className="px-4 py-2 text-xs font-medium text-white transition-all duration-200 bg-gray-900 rounded-lg hover:bg-gray-800 hover:shadow-lg"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
