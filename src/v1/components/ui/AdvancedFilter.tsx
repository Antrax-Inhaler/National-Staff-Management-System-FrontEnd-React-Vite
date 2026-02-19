import React, {
  useState,
  useRef,
  useEffect,
  type JSX,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Filter, X, ChevronDown, Loader2, RefreshCw } from "lucide-react";

type FilterType =
  | "checkbox"
  | "text"
  | "select"
  | "multiselect"
  | "date"
  | "dateRange"
  | "custom";

interface CustomFilterProps {
  value: any;
  onChange: (value: any) => void;
  filter: FilterConfig;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: FilterType;
  placeholder?: string;
  options?: { label: string; value: string }[];
  urlKey?: string;
  fromKey?: string;
  toKey?: string;
  component?: React.ComponentType<CustomFilterProps>;
  getBadgeLabel?: (value: any) => string | null;
  getUrlValue?: (value: any) => string | string[];
  parseUrlValue?: (params: URLSearchParams) => any;
  defaultValue?: any;
  searchable?: boolean;
  onSearch?: (
    query: string,
  ) =>
    | { label: string; value: string }[]
    | Promise<{ label: string; value: string }[]>;
  searchPlaceholder?: string;
  loading?: boolean;
  onOpen?: () => void;
  onRefresh?: () => void | Promise<void>;
  refreshing?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  singleSelect?: boolean;
}

export interface FilterSection {
  title?: string;
  description?: string;
  filters: FilterConfig[];
  layout?: "stack" | "grid" | "inline";
  gridCols?: 1 | 2 | 3 | 4;
  icon?: React.ComponentType<{ className?: string }>;
}

interface AdvancedFilterProps {
  sections?: FilterSection[];
  filters?: FilterConfig[];
  searchParams: URLSearchParams;
  onApply: (params: URLSearchParams) => void;
  activeFilter?: boolean;
  customRender?: ReactNode;
  customActiveBadges?: ReactNode;
  onClear?: () => void;
  title?: string;
  label?: string;
  icon?: React.ComponentType<{ className?: string }>;
  showClearButton?: boolean;
  showActiveFilters?: boolean;
}

interface GetFiltersFromUrlOptions {
  sections?: FilterSection[];
  legacyFilters?: FilterConfig[];
  searchParams: URLSearchParams;
}

/**
 * Helper function to remove all filters from URLSearchParams
 */
export function removeFilterFromParams(
  searchParams: URLSearchParams,
  filters: FilterConfig[],
  filterKey: string,
  value: string | null = null,
): URLSearchParams {
  const newParams = new URLSearchParams(searchParams);
  const filter = filters.find((f) => f.key === filterKey);

  if (!filter) return newParams;

  if (filter.type === "checkbox" && filter.singleSelect) {
    newParams.delete(filter.urlKey || filter.key);
  } else if (
    (filter.type === "checkbox" || filter.type === "multiselect") &&
    value
  ) {
    const values = searchParams.getAll(filter.urlKey || filter.key);
    newParams.delete(filter.urlKey || filter.key);
    values
      .filter((v) => v !== value)
      .forEach((v) => newParams.append(filter.urlKey || filter.key, v));
  } else if (filter.type === "dateRange") {
    newParams.delete(filter.fromKey || `${filter.key}_from`);
    newParams.delete(filter.toKey || `${filter.key}_to`);
  } else {
    newParams.delete(filter.urlKey || filter.key);
  }

  newParams.set("page", "1");
  return newParams;
}

/**
 * Helper function to clear all filters from URLSearchParams
 */
export function clearAllFilters(
  searchParams: URLSearchParams,
  filters: FilterConfig[],
): URLSearchParams {
  const newParams = new URLSearchParams(searchParams);

  filters.forEach((filter) => {
    if (filter.type === "dateRange") {
      newParams.delete(filter.fromKey || `${filter.key}_from`);
      newParams.delete(filter.toKey || `${filter.key}_to`);
    } else {
      newParams.delete(filter.urlKey || filter.key);
    }
  });

  newParams.set("page", "1");
  return newParams;
}

/**
 * Returns an object of active filters from the URL search params
 */
export function getFiltersFromUrl({
  sections,
  legacyFilters,
  searchParams,
}: GetFiltersFromUrlOptions): Record<string, any> {
  const allSections: FilterSection[] =
    sections || (legacyFilters ? [{ filters: legacyFilters }] : []);
  const filters = allSections.flatMap((section) => section.filters);
  const result: Record<string, any> = {};

  filters.forEach((filter) => {
    const urlKey = filter.urlKey || filter.key;

    switch (filter.type) {
      case "custom":
        if (filter.parseUrlValue) {
          result[filter.key] = filter.parseUrlValue(searchParams);
        } else {
          result[filter.key] = filter.defaultValue ?? null;
        }
        break;

      case "checkbox":
        if (filter.singleSelect) {
          result[filter.key] = searchParams.get(urlKey) || "";
        } else {
          result[filter.key] = searchParams.getAll(urlKey);
        }
        break;

      case "multiselect":
        result[filter.key] = searchParams.getAll(urlKey);
        break;

      case "dateRange":
        result[filter.key] = {
          from: searchParams.get(filter.fromKey || `${filter.key}_from`) || "",
          to: searchParams.get(filter.toKey || `${filter.key}_to`) || "",
        };
        break;

      default:
        // fallback for input/select
        result[filter.key] = searchParams.get(urlKey) || "";
    }
  });

  return result;
}

// Export this helper function
export function renderActiveFilterBadges(
  searchParams: URLSearchParams,
  filters: FilterConfig[],
  onRemove: (filterKey: string, value?: string | null) => void,
): JSX.Element[] {
  const appliedFilters = getFiltersFromUrl({
    searchParams,
    legacyFilters: filters,
  });

  const chips: JSX.Element[] = [];
  filters.forEach((filter) => {
    const value = appliedFilters[filter.key];
    if (filter.type === "custom" && filter.getBadgeLabel) {
      const badgeLabel = filter.getBadgeLabel(value);
      if (badgeLabel) {
        chips.push(
          <span
            key={filter.key}
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 transition-all duration-200 bg-gray-100 rounded-full hover:bg-gray-200"
          >
            {badgeLabel}
            <button
              onClick={() => onRemove(filter.key)}
              className="transition-all duration-200 rounded-full hover:bg-gray-300 p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </span>,
        );
      }
    } else if (filter.type === "checkbox" && filter.singleSelect && value) {
      const option = filter.options?.find((o) => o.value === value);
      chips.push(
        <span
          key={filter.key}
          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 transition-all duration-200 bg-gray-100 rounded-full hover:bg-gray-200"
        >
          {filter.label}: {option?.label || value}
          <button
            onClick={() => onRemove(filter.key)}
            className="transition-all duration-200 rounded-full hover:bg-gray-300 p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </span>,
      );
    } else if (
      (filter.type === "checkbox" || filter.type === "multiselect") &&
      Array.isArray(value)
    ) {
      value.forEach((v) => {
        const option = filter.options?.find((o) => o.value === v);
        chips.push(
          <span
            key={`${filter.key}-${v}`}
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 transition-all duration-200 bg-gray-100 rounded-full hover:bg-gray-200"
          >
            {filter.label}: {option?.label || v}
            <button
              onClick={() => onRemove(filter.key, v)}
              className="transition-all duration-200 rounded-full hover:bg-gray-300 p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </span>,
        );
      });
    } else if (filter.type === "dateRange" && (value?.from || value?.to)) {
      chips.push(
        <span
          key={filter.key}
          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 transition-all duration-200 bg-gray-100 rounded-full hover:bg-gray-200"
        >
          {filter.label}: {value.from || "..."} to {value.to || "..."}
          <button
            onClick={() => onRemove(filter.key)}
            className="transition-all duration-200 rounded-full hover:bg-gray-300 p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </span>,
      );
    } else if (value && typeof value === "string") {
      const displayValue =
        filter.type === "select"
          ? filter.options?.find((o) => o.value === value)?.label || value
          : value;
      chips.push(
        <span
          key={filter.key}
          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 transition-all duration-200 bg-gray-100 rounded-full hover:bg-gray-200"
        >
          {filter.label}: {displayValue}
          <button
            onClick={() => onRemove(filter.key)}
            className="transition-all duration-200 rounded-full hover:bg-gray-300 p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </span>,
      );
    }
  });
  return chips;
}

export default function AdvancedFilter({
  sections,
  filters: legacyFilters,
  searchParams,
  onApply,
  activeFilter = false,
  customRender,
  customActiveBadges,
  onClear,
  title = "Filter Items",
  label = "Filters",
  icon,
  showClearButton = true,
  showActiveFilters = true,
}: AdvancedFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [openMultiselects, setOpenMultiselects] = useState<
    Record<string, boolean>
  >({});
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>(
    {},
  );
  const [searchLoading, setSearchLoading] = useState<Record<string, boolean>>(
    {},
  );
  const [searchResults, setSearchResults] = useState<
    Record<string, { label: string; value: string }[]>
  >({});
  const multiselectRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const multiselectDropdownRefs = useRef<Record<string, HTMLDivElement | null>>(
    {},
  );

  const allSections: FilterSection[] =
    sections || (legacyFilters ? [{ filters: legacyFilters }] : []);
  const filters = allSections.flatMap((section) => section.filters);

  // const getFiltersFromUrl = () => {
  //   const result: Record<string, any> = {};
  //   filters.forEach((filter) => {
  //     if (filter.type === "custom" && filter.parseUrlValue) {
  //       result[filter.key] = filter.parseUrlValue(searchParams);
  //     } else if (filter.type === "checkbox") {
  //       const urlKey = filter.urlKey || filter.key;
  //       if (filter.singleSelect) {
  //         result[filter.key] = searchParams.get(urlKey) || "";
  //       } else {
  //         result[filter.key] = searchParams.getAll(urlKey);
  //       }
  //     } else if (filter.type === "multiselect") {
  //       const urlKey = filter.urlKey || filter.key;
  //       result[filter.key] = searchParams.getAll(urlKey);
  //     } else if (filter.type === "dateRange") {
  //       result[filter.key] = {
  //         from: searchParams.get(filter.fromKey || `${filter.key}_from`) || "",
  //         to: searchParams.get(filter.toKey || `${filter.key}_to`) || "",
  //       };
  //     } else if (filter.type === "custom") {
  //       result[filter.key] = filter.defaultValue ?? null;
  //     } else {
  //       const urlKey = filter.urlKey || filter.key;
  //       result[filter.key] = searchParams.get(urlKey) || "";
  //     }
  //   });
  //   return result;
  // };

  const [tempFilters, setTempFilters] = useState(
    getFiltersFromUrl({
      legacyFilters: legacyFilters,
      sections: sections,
      searchParams,
    }),
  );
  const appliedFilters = getFiltersFromUrl({
    legacyFilters: legacyFilters,
    sections: sections,
    searchParams,
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect());
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTempFilters(
        getFiltersFromUrl({
          legacyFilters: legacyFilters,
          sections: sections,
          searchParams,
        }),
      );
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setOpenMultiselects({});
      setSearchQueries({});
      setSearchResults({});
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const updatePosition = () => {
      if (buttonRef.current) {
        setButtonRect(buttonRef.current.getBoundingClientRect());
      }
    };
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, isMobile]);

  useEffect(() => {
    if (!Object.values(openMultiselects).some(Boolean)) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isClickInsideMultiselect = Object.values(
        multiselectRefs.current,
      ).some((ref) => ref && ref.contains(target));
      const isClickInsideDropdown = Object.values(
        multiselectDropdownRefs.current,
      ).some((ref) => ref && ref.contains(target));
      if (!isClickInsideMultiselect && !isClickInsideDropdown) {
        setOpenMultiselects({});
      }
    };
    setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside, true);
    }, 0);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [openMultiselects]);

  const getDropdownStyle = () => {
    if (!buttonRect) return {};
    const dropdownWidth = 600;
    const padding = 16;
    if (isMobile) {
      return {
        bottom: "0",
        left: "0",
        right: "0",
        width: "100%",
        maxHeight: "90vh",
        borderRadius: "16px 16px 0 0",
      };
    } else {
      let left = buttonRect.left;
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - buttonRect.bottom - padding;
      const spaceAbove = buttonRect.top - padding;
      if (left + dropdownWidth > window.innerWidth - padding) {
        left = window.innerWidth - dropdownWidth - padding;
      }
      if (left < padding) {
        left = padding;
      }
      const preferBelow = spaceBelow > 400 || spaceBelow > spaceAbove;
      if (preferBelow) {
        const maxHeight = Math.min(spaceBelow - 8, 600);
        return {
          top: `${buttonRect.bottom + 8}px`,
          left: `${left}px`,
          width: `${dropdownWidth}px`,
          maxWidth: "calc(100vw - 32px)",
          maxHeight: `${maxHeight}px`,
        };
      } else {
        const maxHeight = Math.min(spaceAbove - 8, 600);
        return {
          bottom: `${viewportHeight - buttonRect.top + 8}px`,
          left: `${left}px`,
          width: `${dropdownWidth}px`,
          maxWidth: "calc(100vw - 32px)",
          maxHeight: `${maxHeight}px`,
        };
      }
    }
  };

  const getContentMaxHeight = () => {
    if (!buttonRect) return "400px";
    if (isMobile) {
      return "calc(90vh - 160px)";
    } else {
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - buttonRect.bottom - 16;
      const spaceAbove = buttonRect.top - 16;
      const preferBelow = spaceBelow > 400 || spaceBelow > spaceAbove;
      const availableSpace = preferBelow ? spaceBelow - 8 : spaceAbove - 8;
      const maxHeight = Math.min(availableSpace, 600);
      return `${maxHeight - 152}px`;
    }
  };

  const handleCheckboxChange = (
    filterKey: string,
    value: string,
    singleSelect?: boolean,
  ) => {
    setTempFilters((prev) => {
      if (singleSelect) {
        const currentValue = prev[filterKey] as string;
        return {
          ...prev,
          [filterKey]: currentValue === value ? "" : value,
        };
      } else {
        const currentValues = prev[filterKey] as string[];
        const newValues = currentValues.includes(value)
          ? currentValues.filter((v) => v !== value)
          : [...currentValues, value];
        return { ...prev, [filterKey]: newValues };
      }
    });
  };

  const handleMultiselectToggle = (filterKey: string, value: string) => {
    setTempFilters((prev) => {
      const currentValues = (prev[filterKey] as string[]) || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];
      return { ...prev, [filterKey]: newValues };
    });
  };

  const handleInputChange = (
    filterKey: string,
    value: string | { from: string; to: string } | any,
  ) => {
    setTempFilters((prev) => ({ ...prev, [filterKey]: value }));
  };

  const handleSearch = async (
    filterKey: string,
    query: string,
    filter: FilterConfig,
  ) => {
    if (!filter.onSearch) return;

    setSearchLoading((prev) => ({ ...prev, [filterKey]: true }));
    try {
      const results = await Promise.resolve(filter.onSearch(query));
      setSearchResults((prev) => ({ ...prev, [filterKey]: results }));
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults((prev) => ({ ...prev, [filterKey]: [] }));
    } finally {
      setSearchLoading((prev) => ({ ...prev, [filterKey]: false }));
    }
  };

  const handleRefresh = async (filter: FilterConfig) => {
    if (!filter.onRefresh) return;
    await Promise.resolve(filter.onRefresh());
  };

  const toggleMultiselectDropdown = (
    filterKey: string,
    e: React.MouseEvent,
    filter: FilterConfig,
  ) => {
    e.stopPropagation();

    const willOpen = !openMultiselects[filterKey];

    setOpenMultiselects((prev) => {
      const newState: Record<string, boolean> = {};
      Object.keys(prev).forEach((key) => {
        newState[key] = false;
      });
      newState[filterKey] = willOpen;
      return newState;
    });

    if (willOpen) {
      if (filter.onOpen) {
        filter.onOpen();
      }
      if (filter.searchable && filter.options) {
        setSearchResults((prev) => ({
          ...prev,
          [filterKey]: filter.options || [],
        }));
      }
    } else {
      setSearchQueries((prev) => ({ ...prev, [filterKey]: "" }));
      setSearchResults((prev) => ({ ...prev, [filterKey]: [] }));
    }
  };

  const handleApply = () => {
    const newParams = new URLSearchParams(searchParams);
    filters.forEach((filter) => {
      if (filter.type === "dateRange") {
        newParams.delete(filter.fromKey || `${filter.key}_from`);
        newParams.delete(filter.toKey || `${filter.key}_to`);
      } else if (filter.type === "custom" && filter.parseUrlValue) {
        newParams.delete(filter.urlKey || filter.key);
      } else {
        newParams.delete(filter.urlKey || filter.key);
      }
    });
    filters.forEach((filter) => {
      const value = tempFilters[filter.key];
      if (filter.type === "custom" && filter.getUrlValue) {
        const urlValue = filter.getUrlValue(value);
        if (Array.isArray(urlValue)) {
          urlValue.forEach((v) =>
            newParams.append(filter.urlKey || filter.key, v),
          );
        } else if (urlValue) {
          newParams.set(filter.urlKey || filter.key, urlValue);
        }
      } else if (filter.type === "checkbox" && filter.singleSelect) {
        if (value && typeof value === "string") {
          newParams.set(filter.urlKey || filter.key, value);
        }
      } else if (
        (filter.type === "checkbox" || filter.type === "multiselect") &&
        Array.isArray(value)
      ) {
        value.forEach((v) => newParams.append(filter.urlKey || filter.key, v));
      } else if (filter.type === "dateRange" && typeof value === "object") {
        if (value?.from)
          newParams.set(filter.fromKey || `${filter.key}_from`, value.from);
        if (value?.to)
          newParams.set(filter.toKey || `${filter.key}_to`, value.to);
      } else if (value && typeof value === "string") {
        newParams.set(filter.urlKey || filter.key, value);
      }
    });
    newParams.set("page", "1");
    onApply(newParams);
    setIsOpen(false);
  };

  const handleClear = () => {
    const emptyFilters: Record<string, any> = {};
    filters.forEach((filter) => {
      if (filter.type === "checkbox" && filter.singleSelect) {
        emptyFilters[filter.key] = "";
      } else if (filter.type === "checkbox" || filter.type === "multiselect") {
        emptyFilters[filter.key] = [];
      } else if (filter.type === "dateRange") {
        emptyFilters[filter.key] = { from: "", to: "" };
      } else if (filter.type === "custom") {
        emptyFilters[filter.key] = filter.defaultValue ?? null;
      } else {
        emptyFilters[filter.key] = "";
      }
    });
    setTempFilters(emptyFilters);
    const newParams = new URLSearchParams(searchParams);
    filters.forEach((filter) => {
      if (filter.type === "dateRange") {
        newParams.delete(filter.fromKey || `${filter.key}_from`);
        newParams.delete(filter.toKey || `${filter.key}_to`);
      } else {
        newParams.delete(filter.urlKey || filter.key);
      }
    });
    newParams.set("page", "1");
    onApply(newParams);
    if (onClear) onClear();
  };

  const handleCancel = () => {
    setTempFilters(
      getFiltersFromUrl({
        legacyFilters: legacyFilters,
        sections: sections,
        searchParams,
      }),
    );
    setIsOpen(false);
  };

  const removeFilter = (filterKey: string, value: string | null = null) => {
    const newParams = new URLSearchParams(searchParams);
    const filter = filters.find((f) => f.key === filterKey);
    if (!filter) return;
    if (filter.type === "checkbox" && filter.singleSelect) {
      newParams.delete(filter.urlKey || filter.key);
    } else if (
      (filter.type === "checkbox" || filter.type === "multiselect") &&
      value
    ) {
      const values = searchParams.getAll(filter.urlKey || filter.key);
      newParams.delete(filter.urlKey || filter.key);
      values
        .filter((v) => v !== value)
        .forEach((v) => newParams.append(filter.urlKey || filter.key, v));
    } else if (filter.type === "dateRange") {
      newParams.delete(filter.fromKey || `${filter.key}_from`);
      newParams.delete(filter.toKey || `${filter.key}_to`);
    } else {
      newParams.delete(filter.urlKey || filter.key);
    }
    newParams.set("page", "1");
    onApply(newParams);
  };

  const activeFiltersCount = filters.reduce((count, filter) => {
    const value = appliedFilters[filter.key];
    if (filter.type === "custom" && filter.getBadgeLabel) {
      const badgeLabel = filter.getBadgeLabel(value);
      return count + (badgeLabel ? 1 : 0);
    } else if (filter.type === "checkbox" && filter.singleSelect) {
      return count + (value ? 1 : 0);
    } else if (filter.type === "checkbox" || filter.type === "multiselect") {
      return count + (Array.isArray(value) ? value.length : 0);
    } else if (filter.type === "dateRange") {
      return count + (value?.from || value?.to ? 1 : 0);
    } else {
      return count + (value ? 1 : 0);
    }
  }, 0);

  const renderFilterInput = (filter: FilterConfig) => {
    const value = tempFilters[filter.key];

    switch (filter.type) {
      case "custom":
        if (!filter.component) {
          return (
            <div className="text-xs text-red-500">
              Custom component not provided
            </div>
          );
        }
        const CustomComponent = filter.component;
        return (
          <CustomComponent
            value={value}
            onChange={(newValue) => handleInputChange(filter.key, newValue)}
            filter={filter}
          />
        );

      case "multiselect":
        const selectedValues = (value as string[]) || [];
        const selectedLabels = selectedValues
          .map((v) => filter.options?.find((o) => o.value === v)?.label)
          .filter(Boolean);

        const searchQuery = searchQueries[filter.key] || "";
        const isSearching = searchLoading[filter.key] || false;
        const displayOptions = filter.searchable
          ? searchResults[filter.key] || filter.options || []
          : filter.options || [];

        return (
          <div
            ref={(el) => (multiselectRefs.current[filter.key] = el)}
            className="relative"
          >
            <div className="flex gap-2">
              <button
                type="button"
                onClick={(e) =>
                  toggleMultiselectDropdown(filter.key, e, filter)
                }
                disabled={filter.loading}
                className="flex items-center justify-between flex-1 px-3 py-2 text-xs text-left transition-all duration-200 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span
                  className={
                    selectedValues.length === 0
                      ? "text-gray-500"
                      : "text-gray-900"
                  }
                >
                  {filter.loading
                    ? "Loading..."
                    : selectedValues.length === 0
                      ? filter.placeholder || "Select..."
                      : ``}
                </span>
                {selectedValues.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedLabels.map((label, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 rounded"
                      >
                        {label}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMultiselectToggle(
                              filter.key,
                              selectedValues[idx],
                            );
                          }}
                          className="hover:bg-gray-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {filter.loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      openMultiselects[filter.key] ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>
              {filter.onRefresh && (
                <button
                  type="button"
                  onClick={() => handleRefresh(filter)}
                  disabled={filter.refreshing}
                  className="flex items-center justify-center p-2 text-gray-700 transition-all duration-200 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh options"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${filter.refreshing ? "animate-spin" : ""}`}
                  />
                </button>
              )}
            </div>
            {openMultiselects[filter.key] &&
              multiselectRefs.current[filter.key] &&
              createPortal(
                <div
                  ref={(el) =>
                    (multiselectDropdownRefs.current[filter.key] = el)
                  }
                  className="fixed bg-white border border-gray-300 rounded-lg shadow-lg"
                  style={{
                    zIndex: 100000,
                    top: `${multiselectRefs.current[filter.key]!.getBoundingClientRect().bottom + 4}px`,
                    left: `${multiselectRefs.current[filter.key]!.getBoundingClientRect().left}px`,
                    width: `${multiselectRefs.current[filter.key]!.getBoundingClientRect().width}px`,
                  }}
                >
                  {filter.searchable && (
                    <div className="p-2 border-b border-gray-200">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          e.stopPropagation();
                          const query = e.target.value;
                          setSearchQueries((prev) => ({
                            ...prev,
                            [filter.key]: query,
                          }));
                          handleSearch(filter.key, query, filter);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        placeholder={filter.searchPlaceholder || "Search..."}
                        className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        autoFocus
                      />
                    </div>
                  )}
                  <div className="overflow-y-auto max-h-48">
                    {isSearching ? (
                      <div className="flex items-center justify-center gap-2 px-3 py-4">
                        <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
                        <span className="text-xs text-gray-500">
                          Searching...
                        </span>
                      </div>
                    ) : displayOptions.length === 0 ? (
                      <div className="px-3 py-4 text-xs text-center text-gray-500">
                        No options found
                      </div>
                    ) : (
                      displayOptions.map((option) => (
                        <label
                          key={option.value}
                          className="flex items-center gap-2 px-3 py-2 transition-colors cursor-pointer hover:bg-gray-50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedValues.includes(option.value)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleMultiselectToggle(filter.key, option.value);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 text-gray-900 transition-all duration-200 border-gray-300 rounded focus:ring-2 focus:ring-gray-900"
                          />
                          <span className="text-xs text-gray-700">
                            {option.label}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>,
                document.body,
              )}
          </div>
        );

      case "checkbox":
        return (
          <div className="grid grid-cols-2 gap-1">
            {filter.options?.map((option) => {
              const isChecked = filter.singleSelect
                ? value === option.value
                : Array.isArray(value) && value.includes(option.value);

              return (
                <label
                  key={option.value}
                  className="flex items-center gap-2 p-2 transition-all duration-200 border border-transparent rounded-lg cursor-pointer hover:border-gray-200 hover:bg-gray-50"
                >
                  <input
                    type={filter.singleSelect ? "radio" : "checkbox"}
                    checked={isChecked}
                    onChange={() =>
                      handleCheckboxChange(
                        filter.key,
                        option.value,
                        filter.singleSelect,
                      )
                    }
                    className="w-4 h-4 text-gray-900 transition-all duration-200 border-gray-300 rounded focus:ring-2 focus:ring-gray-900"
                  />
                  <span className="text-xs text-gray-700">{option.label}</span>
                </label>
              );
            })}
          </div>
        );

      case "select":
        return (
          <select
            value={value as string}
            onChange={(e) => handleInputChange(filter.key, e.target.value)}
            disabled={filter.loading}
            className="w-full px-3 py-2 text-xs transition-all duration-200 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">
              {filter.loading
                ? "Loading..."
                : filter.placeholder || "Select..."}
            </option>
            {filter.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case "date":
        return (
          <input
            type="date"
            value={value as string}
            onChange={(e) => handleInputChange(filter.key, e.target.value)}
            className="w-full px-3 py-2 text-xs transition-all duration-200 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent hover:border-gray-400"
          />
        );

      case "dateRange":
        const rangeValue = (value as { from: string; to: string }) || {
          from: "",
          to: "",
        };
        return (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block mb-1 text-xs text-gray-600">From</label>
              <input
                type="date"
                value={rangeValue.from}
                onChange={(e) =>
                  handleInputChange(filter.key, {
                    ...rangeValue,
                    from: e.target.value,
                  })
                }
                className="w-full px-3 py-2 text-xs transition-all duration-200 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent hover:border-gray-400"
              />
            </div>
            <div>
              <label className="block mb-1 text-xs text-gray-600">To</label>
              <input
                type="date"
                value={rangeValue.to}
                onChange={(e) =>
                  handleInputChange(filter.key, {
                    ...rangeValue,
                    to: e.target.value,
                  })
                }
                className="w-full px-3 py-2 text-xs transition-all duration-200 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent hover:border-gray-400"
              />
            </div>
          </div>
        );

      case "text":
      default:
        return (
          <input
            type="text"
            value={value as string}
            onChange={(e) => handleInputChange(filter.key, e.target.value)}
            placeholder={filter.placeholder || "Enter value..."}
            className="w-full px-3 py-2 text-xs transition-all duration-200 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent hover:border-gray-400"
          />
        );
    }
  };

  const renderActiveFilters = () => {
    return renderActiveFilterBadges(searchParams, filters, removeFilter);
  };

  // const renderActiveFilters = () => {
  //   const chips: JSX.Element[] = [];
  //   filters.forEach((filter) => {
  //     const value = appliedFilters[filter.key];
  //     if (filter.type === "custom" && filter.getBadgeLabel) {
  //       const badgeLabel = filter.getBadgeLabel(value);
  //       if (badgeLabel) {
  //         chips.push(
  //           <span
  //             key={filter.key}
  //             className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 transition-all duration-200 bg-gray-100 rounded-full hover:bg-gray-200"
  //           >
  //             {badgeLabel}
  //             <button
  //               onClick={() => removeFilter(filter.key)}
  //               className="transition-all duration-200 rounded-full hover:bg-gray-300 p-0.5"
  //             >
  //               <X className="w-3 h-3" />
  //             </button>
  //           </span>,
  //         );
  //       }
  //     } else if (filter.type === "checkbox" && filter.singleSelect && value) {
  //       const option = filter.options?.find((o) => o.value === value);
  //       chips.push(
  //         <span
  //           key={filter.key}
  //           className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 transition-all duration-200 bg-gray-100 rounded-full hover:bg-gray-200"
  //         >
  //           {filter.label}: {option?.label || value}
  //           <button
  //             onClick={() => removeFilter(filter.key)}
  //             className="transition-all duration-200 rounded-full hover:bg-gray-300 p-0.5"
  //           >
  //             <X className="w-3 h-3" />
  //           </button>
  //         </span>,
  //       );
  //     } else if (
  //       (filter.type === "checkbox" || filter.type === "multiselect") &&
  //       Array.isArray(value)
  //     ) {
  //       value.forEach((v) => {
  //         const option = filter.options?.find((o) => o.value === v);
  //         chips.push(
  //           <span
  //             key={`${filter.key}-${v}`}
  //             className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 transition-all duration-200 bg-gray-100 rounded-full hover:bg-gray-200"
  //           >
  //             {filter.label}: {option?.label || v}
  //             <button
  //               onClick={() => removeFilter(filter.key, v)}
  //               className="transition-all duration-200 rounded-full hover:bg-gray-300 p-0.5"
  //             >
  //               <X className="w-3 h-3" />
  //             </button>
  //           </span>,
  //         );
  //       });
  //     } else if (filter.type === "dateRange" && (value?.from || value?.to)) {
  //       chips.push(
  //         <span
  //           key={filter.key}
  //           className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 transition-all duration-200 bg-gray-100 rounded-full hover:bg-gray-200"
  //         >
  //           {filter.label}: {value.from || "..."} to {value.to || "..."}
  //           <button
  //             onClick={() => removeFilter(filter.key)}
  //             className="transition-all duration-200 rounded-full hover:bg-gray-300 p-0.5"
  //           >
  //             <X className="w-3 h-3" />
  //           </button>
  //         </span>,
  //       );
  //     } else if (value && typeof value === "string") {
  //       const displayValue =
  //         filter.type === "select"
  //           ? filter.options?.find((o) => o.value === value)?.label || value
  //           : value;
  //       chips.push(
  //         <span
  //           key={filter.key}
  //           className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 transition-all duration-200 bg-gray-100 rounded-full hover:bg-gray-200"
  //         >
  //           {filter.label}: {displayValue}
  //           <button
  //             onClick={() => removeFilter(filter.key)}
  //             className="transition-all duration-200 rounded-full hover:bg-gray-300 p-0.5"
  //           >
  //             <X className="w-3 h-3" />
  //           </button>
  //         </span>,
  //       );
  //     }
  //   });
  //   return chips;
  // };

  const Icon = icon ?? Filter;

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-2">
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
            activeFiltersCount > 0
              ? "bg-gray-900 text-white hover:bg-gray-800 shadow-md"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400"
          }`}
        >
          <Icon className="w-4 h-4" />
          {label}
          {activeFiltersCount > 0 && (
            <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-gray-900 bg-white rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {customRender}
        {(activeFilter || activeFiltersCount > 0) && showClearButton && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
          >
            <X className="w-3.5 h-3.5" />
            Clear all
          </button>
        )}
      </div>

      {isOpen &&
        buttonRect &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[99998] bg-black/20 transition-opacity duration-200"
              onClick={handleCancel}
            />
            <div
              className={`fixed bg-white border border-gray-200 shadow-2xl z-[99999] overflow-hidden flex flex-col ${
                isMobile ? "animate-slide-up" : "rounded-lg animate-fadeIn"
              }`}
              style={getDropdownStyle()}
            >
              <div className="flex-shrink-0 p-2 px-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900">
                    {title}
                  </h3>
                  <button
                    onClick={handleCancel}
                    className="p-1.5 transition-all duration-200 rounded-lg hover:bg-gray-200 hover:rotate-90"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              <div
                className="flex-1 p-2 px-4 overflow-y-auto filter-modal-content"
                style={{ maxHeight: getContentMaxHeight() }}
              >
                <div className="mb-10 space-y-6">
                  {allSections.map((section, sectionIdx) => (
                    <div
                      key={sectionIdx}
                      className={
                        sectionIdx > 0 ? "pt-4 border-t border-gray-200" : ""
                      }
                    >
                      {section.title && (
                        <div className="mb-3">
                          <div className="flex items-center gap-2">
                            {section.icon && (
                              <section.icon className="w-4 h-4 text-gray-700" />
                            )}
                            <h4 className="text-sm font-semibold text-gray-900">
                              {section.title}
                            </h4>
                          </div>
                          {section.description && (
                            <p className="mt-1 text-xs text-gray-500">
                              {section.description}
                            </p>
                          )}
                        </div>
                      )}
                      <div
                        className={
                          section.layout === "grid"
                            ? `grid gap-3 ${
                                section.gridCols === 1
                                  ? "grid-cols-1"
                                  : section.gridCols === 3
                                    ? "grid-cols-1 sm:grid-cols-3"
                                    : section.gridCols === 4
                                      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                                      : "grid-cols-1 sm:grid-cols-2"
                              }`
                            : section.layout === "inline"
                              ? "flex flex-wrap gap-3"
                              : "space-y-3"
                        }
                      >
                        {section.filters.map((filter) => (
                          <div
                            key={filter.key}
                            className="transition-all duration-200"
                          >
                            <label className="flex items-center gap-2 mb-2 text-xs font-medium text-gray-700">
                              {filter.icon && (
                                <filter.icon className="w-4 h-4 text-gray-600" />
                              )}
                              {filter.label}
                            </label>
                            {renderFilterInput(filter)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-shrink-0 p-4 border-t border-gray-200 ">
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
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>,
          document.body,
        )}

      {(activeFiltersCount > 0 || customActiveBadges) && showActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-4 animate-fadeIn">
          {renderActiveFilters()}
          {customActiveBadges}
        </div>
      )}
    </div>
  );
}
