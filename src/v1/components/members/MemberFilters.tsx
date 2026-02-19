// src/components/members/MemberFilters.tsx
import { Filter } from "lucide-react";
import FilterDropdown from "../ui/FilterDropdown";
import PositionFilterDropdown from "../ui/PositionFilterDropdown";

export interface MemberFiltersState {
  positions: string[];
  employment_status: string[];
  level: string[];
  gender: string[];
  status: string[];
  has_position: string[];
  has_email: string[];
  has_phone: string[];
  affiliate: string[];
  position?: string[];
  specific_positions?: string[];
}
interface MemberFiltersProps {
  filters: MemberFiltersState;
  onFiltersChange: (filters: MemberFiltersState) => void;
  onReset: () => void;
  onRefresh?: () => void;
  showAffiliateFilter?: boolean;
  isMobile?: boolean;
}

// Main filter options (REMOVED position filter)
const MAIN_FILTER_OPTIONS = {
  employment_status: ["Full Time", "Part Time", "Not Set"],
  level: ["Associate", "Professional", "Not Set"],
  gender: ["male", "female", "Not Set"],
  status: ["Active", "Inactive", "Retired", "Not Set"],
  has_position: ["Has Position", "No Position"],
  has_email: ["Has Email", "No Email"],
  has_phone: ["Has Phone", "No Phone"],
  affiliate: ["With Affiliate", "Without Affiliate"],
};

export default function MemberFilters({
  filters,
  onFiltersChange,
  onReset,
  onRefresh,
  showAffiliateFilter = true,
  isMobile = false,
}: MemberFiltersProps) {
const handleMainFilterApply = (selected: Record<string, string[]>) => {
  onFiltersChange({
    ...filters,
    ...selected,
  });
};
const handleFilterReset = () => {
  const resetFilters: MemberFiltersState = {
    positions: [],
    employment_status: [],
    level: [],
    gender: [],
    status: [],
    has_position: [],
    has_email: [],
    has_phone: [],
    affiliate: showAffiliateFilter ? [] : filters.affiliate, // Preserve if not shown
  };
  onFiltersChange(resetFilters);
  onReset();
};

  const handlePositionsChange = (positions: string[]) => {
    onFiltersChange({
      ...filters,
      positions,
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    // Count all filters except positions (which has its own dropdown)
    count += filters.employment_status.length;
    count += filters.level.length;
    count += filters.gender.length;
    count += filters.status.length;
    count += filters.has_position.length;
    count += filters.has_email.length;
    count += filters.has_phone.length;
    if (showAffiliateFilter) {
      count += filters.affiliate.length;
    }
    return count;
  };

  return (
    <div className="flex items-center gap-2">
      {/* Main Filter Dropdown (without position) */}
      <FilterDropdown
        options={MAIN_FILTER_OPTIONS}
        value={{
          employment_status: filters.employment_status,
          level: filters.level,
          gender: filters.gender,
          status: filters.status,
          has_position: filters.has_position,
          has_email: filters.has_email,
          has_phone: filters.has_phone,
          affiliate: showAffiliateFilter ? filters.affiliate : [],
        }}
        onApply={handleMainFilterApply}
        onReset={onReset}
        buttonLabel="Filters"
        buttonIcon={<Filter size={16} />}
        size={isMobile ? "sm" : "md"}
        disabledOptions={!showAffiliateFilter ? ["affiliate"] : []}
        // Remove activeCount prop if FilterDropdown doesn't support it
        // activeCount={getActiveFilterCount()}
      />

      {/* Separate Position Filter Dropdown */}
      <PositionFilterDropdown
        value={filters.positions}
        onChange={handlePositionsChange}
        size={isMobile ? "sm" : "md"}
        buttonLabel="Positions"
        activeCount={filters.positions.length} // Position dropdown might support this
      />
    </div>
  );
}