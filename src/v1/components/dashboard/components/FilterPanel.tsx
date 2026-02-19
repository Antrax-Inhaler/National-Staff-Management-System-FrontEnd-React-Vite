import { useState, useEffect, useRef } from "react";
import { Filter, Settings, ChevronDown, Search, X } from "lucide-react";
import { InfoTooltip } from "./InfoTooltip";
import { MultiSelectDropdown } from "../../ui/MultiSelectDropdown"; // Add this import
import { dashboard } from "../../../api/dashboard";

interface Filters {
  time_range: string;
  affiliate_id?: string | string[];
  member_level?: string | string[];
  state?: string | string[];
  start_date?: string;
  end_date?: string;
  affiliate_type?: string | string[];
  cbc_region?: string | string[];
  ORG_region?: string | string[];
}

interface FilterPanelProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  isLoading: boolean;
  filterOptions?: any; // Add filter options prop
}

// Mock data for filter options (frontend only)
const MEMBER_LEVELS = ["Associate", "Professional", "Retired"];
const CBC_REGIONS = ["Northeast", "Cooridor", "South", "Central", "Western", "Not Specified"];
const ORG_REGIONS = ["1", "2", "3", "4", "5", "6", "7", "Not Specified"];

const TIME_RANGES = [
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'last_6_months', label: 'Last 6 Months' },
  { value: 'last_12_months', label: 'Last 12 Months' },
  { value: 'ytd', label: 'Year to Date' },
  { value: 'custom', label: 'Custom Range' },
  { value: 'all_time', label: 'All Time' },
];

// Add state options from backend filter options
const getStateOptions = (filterOptions: any) => {
  if (filterOptions?.states) {
    return filterOptions.states.map((state: any) => ({
      value: state.value,
      label: state.label || state.value
    }));
  }
  
  // Fallback to static states if no filter options
  return [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", 
    "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", 
    "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", 
    "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", 
    "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", 
    "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", 
    "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", 
    "Wisconsin", "Wyoming", "Not Specified"
  ].map(state => ({
    value: state,
    label: state
  }));
};

export function FilterPanel({
  filters,
  onFilterChange,
  isLoading,
  filterOptions = {},
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [affiliateSearch, setAffiliateSearch] = useState("");
  const [affiliateSearchResults, setAffiliateSearchResults] = useState<Array<{ id: string; name: string; type?: string; state?: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<{ id: string; name: string; type?: string; state?: string } | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize selected affiliate from filter
  useEffect(() => {
    if (filters.affiliate_id) {
      // Try to get the affiliate name from search results or API
      const affiliateId = Array.isArray(filters.affiliate_id) ? filters.affiliate_id[0] : filters.affiliate_id;
      
      // If we have search results, try to find the affiliate
      const foundAffiliate = affiliateSearchResults.find(a => a.id === affiliateId);
      if (foundAffiliate) {
        setSelectedAffiliate(foundAffiliate);
      } else {
        // Fetch affiliate details
        fetchAffiliateDetails(affiliateId);
      }
    } else {
      setSelectedAffiliate(null);
    }
  }, [filters.affiliate_id]);

  // Fetch affiliate details when ID is set but we don't have the name
  const fetchAffiliateDetails = async (affiliateId: string) => {
    try {
      // Use the search API with the ID to get affiliate details
      const results = await dashboard.searchAffiliates("", 1);
      const affiliate = results.find((a: any) => a.value === affiliateId);
      if (affiliate) {
        setSelectedAffiliate({
          id: affiliate.value,
          name: affiliate.label,
          type: affiliate.type,
          state: affiliate.state
        });
      } else {
        // Fallback: just show the ID
        setSelectedAffiliate({ 
          id: affiliateId, 
          name: `Affiliate ${affiliateId}` 
        });
      }
    } catch (error) {
      console.error('Error fetching affiliate details:', error);
      setSelectedAffiliate({ 
        id: affiliateId, 
        name: `Affiliate ${affiliateId}` 
      });
    }
  };

  // Real affiliate search using API
  const handleAffiliateSearch = async (searchTerm: string) => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(async () => {
      if (!searchTerm.trim()) {
        setAffiliateSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      
      try {
        // Call the real API with the affiliate type filter if set
        const affiliateType = filters.affiliate_type 
          ? (Array.isArray(filters.affiliate_type) ? filters.affiliate_type : [filters.affiliate_type])
          : undefined;
        
        const results = await dashboard.searchAffiliates(searchTerm, 10, affiliateType);
        
        // Transform API results to match our format
        const formattedResults = results.map((affiliate: any) => ({
          id: affiliate.value,
          name: affiliate.label,
          type: affiliate.type,
          state: affiliate.state
        }));
        
        setAffiliateSearchResults(formattedResults);
      } catch (error) {
        console.error('Error searching affiliates:', error);
        setAffiliateSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const clearFilters = () => {
    onFilterChange({
      time_range: "last_12_months",
    });
    setSelectedAffiliate(null);
    setAffiliateSearch("");
    setAffiliateSearchResults([]);
    setIsOpen(false);
  };

  const handleAffiliateSelect = (affiliate: { id: string; name: string; type?: string; state?: string }) => {
    setSelectedAffiliate(affiliate);
    onFilterChange({
      ...filters,
      affiliate_id: affiliate.id,
    });
    setAffiliateSearch("");
    setAffiliateSearchResults([]);
  };

  const removeAffiliate = () => {
    setSelectedAffiliate(null);
    const { affiliate_id, ...rest } = filters;
    onFilterChange({ ...rest });
  };

  const handleSingleSelectChange = (field: keyof Filters, value: string | string[]) => {
    onFilterChange({
      ...filters,
      [field]: value === "" ? undefined : value,
    });
  };

  // Handle multi-select change
  const handleMultiSelectChange = (field: keyof Filters, values: string[]) => {
    onFilterChange({
      ...filters,
      [field]: values.length > 0 ? values : undefined,
    });
  };

  // Handle affiliate search input change
  const handleAffiliateSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAffiliateSearch(value);
    handleAffiliateSearch(value);
  };

  return (
    <div ref={filterRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 transition-all duration-200 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:shadow-sm disabled:opacity-50"
      >
        <Filter size={14} />
        <span>Filter</span>
        <ChevronDown
          size={14}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 p-5 mt-1 bg-white border border-gray-200 shadow-xl right-0 top-full w-96 rounded-xl animate-fadeIn max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Settings size={16} />
              <h3 className="font-semibold text-gray-900">Dashboard Filters</h3>
            </div>
            <button
              onClick={clearFilters}
              className="text-xs text-blue-600 transition-colors hover:text-blue-700 px-2 py-1 hover:bg-blue-50 rounded"
            >
              Reset all
            </button>
          </div>

          <div className="space-y-4">
            {/* Time Range Filter */}
            <div>
              <label className="block mb-1 text-xs font-medium text-gray-700">
                <div className="flex items-center gap-1">
                  Time Range
                  <InfoTooltip content="Select time period for trend analysis. Filters apply to temporal metrics and growth charts only." />
                </div>
              </label>
              <select
                value={filters.time_range}
                onChange={(e) => handleSingleSelectChange("time_range", e.target.value)}
                className="w-full px-3 py-1.5 text-xs transition-colors border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {TIME_RANGES.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            {filters.time_range === 'custom' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1 text-xs text-gray-700">Start Date</label>
                  <input
                    type="date"
                    value={filters.start_date || ''}
                    onChange={(e) => handleSingleSelectChange("start_date", e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-xs text-gray-700">End Date</label>
                  <input
                    type="date"
                    value={filters.end_date || ''}
                    onChange={(e) => handleSingleSelectChange("end_date", e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>
              </div>
            )}

            {/* Affiliate Single Select Filter */}
            <div>
              <label className="block mb-1 text-xs font-medium text-gray-700">
                <div className="flex items-center gap-1">
                  Affiliate
                  <InfoTooltip content="Search and select a single affiliate." />
                </div>
              </label>
              
              {/* Selected Affiliate */}
              {selectedAffiliate && (
                <div className="mb-2">
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                    <div className="min-w-0">
                      <div className="text-xs text-blue-700 truncate">{selectedAffiliate.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        {selectedAffiliate.type && (
                          <span className="text-xs text-blue-600">{selectedAffiliate.type}</span>
                        )}
                        {selectedAffiliate.state && (
                          <span className="text-xs text-gray-500">{selectedAffiliate.state}</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeAffiliate}
                      className="text-xs text-blue-500 hover:text-blue-700 ml-2"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              )}
              
              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  value={affiliateSearch}
                  onChange={handleAffiliateSearchChange}
                  placeholder="Search affiliate by name..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs transition-colors border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Search size={12} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              
              {/* Search Results */}
              {affiliateSearch && (
                <div className="mt-1 border border-gray-200 rounded-lg shadow-sm max-h-40 overflow-y-auto">
                  {isSearching ? (
                    <div className="px-3 py-2 text-xs text-gray-500 text-center">
                      Searching affiliates...
                    </div>
                  ) : affiliateSearchResults.length > 0 ? (
                    affiliateSearchResults.map(affiliate => (
                      <button
                        key={affiliate.id}
                        type="button"
                        onClick={() => handleAffiliateSelect(affiliate)}
                        className={`w-full px-3 py-2 text-xs text-left hover:bg-gray-50 ${
                          selectedAffiliate?.id === affiliate.id 
                            ? 'bg-blue-50 text-blue-700' 
                            : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-left">
                            <div className="font-medium">{affiliate.name}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {affiliate.type && (
                                <span className="text-gray-600">{affiliate.type}</span>
                              )}
                              {affiliate.state && (
                                <span className="text-gray-500">• {affiliate.state}</span>
                              )}
                            </div>
                          </div>
                          {selectedAffiliate?.id === affiliate.id && (
                            <span className="text-blue-600 ml-2">✓</span>
                          )}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-xs text-gray-500 text-center">
                      No affiliates found. Try a different search term.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Member Level Filter - Single Select */}
            <div>
              <label className="block mb-1 text-xs font-medium text-gray-700">
                <div className="flex items-center gap-1">
                  Member Level
                  <InfoTooltip content="Select member level to filter by." />
                </div>
              </label>
              <select
                value={filters.member_level || ""}
                onChange={(e) => handleSingleSelectChange("member_level", e.target.value)}
                className="w-full px-3 py-1.5 text-xs transition-colors border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Levels</option>
                {MEMBER_LEVELS.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            {/* State Filter - Multi-Select Dropdown */}
            <div>
              <MultiSelectDropdown
                label="State"
                options={getStateOptions(filterOptions)}
                selectedValues={Array.isArray(filters.state) ? filters.state : (filters.state ? [filters.state] : [])}
                onChange={(values) => handleMultiSelectChange("state", values)}
                placeholder="Select states..."
                searchable={true}
                maxSelections={5}
                disabled={isLoading}
              />
            </div>

            {/* Affiliate Type Filter - Single Select */}
            <div>
              <label className="block mb-1 text-xs font-medium text-gray-700">
                <div className="flex items-center gap-1">
                  Affiliate Type
                  <InfoTooltip content="Select affiliate type to filter by. This will also filter the affiliate search results." />
                </div>
              </label>
              <select
                value={filters.affiliate_type || ""}
                onChange={(e) => handleSingleSelectChange("affiliate_type", e.target.value)}
                className="w-full px-3 py-1.5 text-xs transition-colors border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                <option value="Associate">Associate</option>
                <option value="Professional">Professional</option>
                <option value="Wall-to-Wall">Wall-to-Wall</option>
              </select>
            </div>

            {/* CBC Region Filter - Multi-Select */}
            <div>
              <MultiSelectDropdown
                label="CBC Region"
                options={CBC_REGIONS.map(region => ({
                  value: region,
                  label: region
                }))}
                selectedValues={Array.isArray(filters.cbc_region) ? filters.cbc_region : (filters.cbc_region ? [filters.cbc_region] : [])}
                onChange={(values) => handleMultiSelectChange("cbc_region", values)}
                placeholder="Select regions..."
                searchable={false}
              />
            </div>

            {/* ORG Region Filter - Multi-Select */}
            <div>
              <MultiSelectDropdown
                label="ORG Region"
                options={ORG_REGIONS.map(region => ({
                  value: region,
                  label: region === 'Not Specified' ? 'Not Specified' : `Region ${region}`
                }))}
                selectedValues={Array.isArray(filters.ORG_region) ? filters.ORG_region : (filters.ORG_region ? [filters.ORG_region] : [])}
                onChange={(values) => handleMultiSelectChange("ORG_region", values)}
                placeholder="Select regions..."
                searchable={false}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-6 pt-4 border-t">
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Apply Filters
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}