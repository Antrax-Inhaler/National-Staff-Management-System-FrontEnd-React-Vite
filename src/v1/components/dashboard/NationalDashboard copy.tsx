// src/v1/components/dashboard/NationalDashboard.tsx
import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Users,
  TrendingUp,
  Building,
  UserCheck,
  BarChart3,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  UsersRound,
  FileText,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Briefcase,
  Clock,
  FileCheck,
  UserCog,
  Database,
  TrendingDown,
  PieChart as PieChartIcon,
  MapPin,
  Building2,
  History,
  ShieldCheck,
  BarChart2,
  LineChart,
  Users2,
  FileSpreadsheet,
} from "lucide-react";
import { dashboard, type Filters } from "../../api/dashboard"; // Import Filters from API
import ClickableAvatar from "../../../components/ui/ClickableAvatar";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  defaults,
} from "chart.js";
import { Line, Pie } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Set chart defaults
if (defaults.animation && typeof defaults.animation === "object") {
  (defaults.animation as any).duration = 800;
  (defaults.animation as any).easing = "easeInOutQuart";
}
defaults.responsive = true;
defaults.maintainAspectRatio = false;

// ==================== TYPES ====================
// Remove the duplicate Filters interface since we're importing it
// Keep only the types that are actually used

interface SearchResult {
  id: number;
  name: string;
  member_id: string;
  level: string;
  status: string;
  work_email?: string;
  work_phone?: string;
  profile_photo_url?: string;
  affiliate_name?: string;
  affiliate_logo_url?: string;
}

interface FilterOptions {
  affiliates: Array<{ id: number; name: string; affiliate_type?: string }>;
  member_levels: string[];
  states: string[];
  affiliate_types: string[];
  time_ranges: Array<{ value: string; label: string }>;
}

// ==================== COMPONENTS ====================

// Skeleton Loaders
const MetricSkeleton = () => (
  <div className="p-4 bg-white rounded-lg shadow-sm animate-pulse">
    <div className="flex items-center justify-between mb-3">
      <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
      <div className="w-12 h-5 bg-gray-200 rounded"></div>
    </div>
    <div className="mb-2 bg-gray-200 rounded h-7"></div>
    <div className="w-2/3 h-4 bg-gray-200 rounded"></div>
  </div>
);

const ChartSkeleton = ({ height = 64 }: { height?: number }) => (
  <div className="animate-pulse">
    <div
      style={{ height: `${height * 4}px` }}
      className="bg-gray-200 rounded"
    ></div>
  </div>
);

// Filter Panel Component
const FilterPanel = ({
  filters,
  filterOptions,
  onFilterChange,
  isLoading,
}: {
  filters: Filters;
  filterOptions: FilterOptions;
  onFilterChange: (filters: Filters) => void;
  isLoading: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-200 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
      >
        <Filter size={16} />
        Filters
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 z-50 p-6 mt-2 bg-white border border-gray-200 shadow-lg top-full w-80 md:w-96 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Filter Dashboard</h3>
            <button
              onClick={() => {
                onFilterChange({
                  time_range: "last_12_months",
                });
                setIsOpen(false);
              }}
              className="text-sm text-blue-600 transition-colors hover:text-blue-700"
            >
              Clear all
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Time Range
              </label>
              <select
                value={filters.time_range}
                onChange={(e) =>
                  onFilterChange({ ...filters, time_range: e.target.value })
                }
                className="w-full px-3 py-2 text-sm transition-colors border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {filterOptions.time_ranges.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Affiliate
                </label>
                <select
                  value={filters.affiliate_id || ""}
                  onChange={(e) =>
                    onFilterChange({
                      ...filters,
                      affiliate_id: e.target.value || undefined,
                    })
                  }
                  className="w-full px-3 py-2 text-sm transition-colors border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Affiliates</option>
                  {filterOptions.affiliates.map((affiliate) => (
                    <option key={affiliate.id} value={affiliate.id}>
                      {affiliate.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Member Level
                </label>
                <select
                  value={filters.member_level || ""}
                  onChange={(e) =>
                    onFilterChange({
                      ...filters,
                      member_level: e.target.value || undefined,
                    })
                  }
                  className="w-full px-3 py-2 text-sm transition-colors border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Levels</option>
                  {filterOptions.member_levels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  State
                </label>
                <select
                  value={filters.state || ""}
                  onChange={(e) =>
                    onFilterChange({
                      ...filters,
                      state: e.target.value || undefined,
                    })
                  }
                  className="w-full px-3 py-2 text-sm transition-colors border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All States</option>
                  {filterOptions.states.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Affiliate Type
                </label>
                <select
                  value={filters.affiliate_type || ""}
                  onChange={(e) =>
                    onFilterChange({
                      ...filters,
                      affiliate_type: e.target.value || undefined,
                    })
                  }
                  className="w-full px-3 py-2 text-sm transition-colors border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Types</option>
                  {filterOptions.affiliate_types.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.start_date || ""}
                  onChange={(e) =>
                    onFilterChange({ ...filters, start_date: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm transition-colors border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.end_date || ""}
                  onChange={(e) =>
                    onFilterChange({ ...filters, end_date: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm transition-colors border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Metric Card Component
const MetricCard = ({
  title,
  value,
  icon: Icon,
  trend,
  color = "blue",
  format = "number",
  onClick,
  link,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  trend?: number;
  color?: "blue" | "green" | "purple" | "orange" | "red" | "teal" | "indigo";
  format?: "number" | "percentage" | "ratio";
  onClick?: () => void;
  link?: string;
}) => {
  const colorClasses = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
    green: { bg: "bg-green-50", text: "text-green-600", border: "border-green-200" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
    orange: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
    red: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
    teal: { bg: "bg-teal-50", text: "text-teal-600", border: "border-teal-200" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-200" },
  };

  const colorClass = colorClasses[color];
  
  const formattedValue = format === "percentage" 
    ? `${value}%` 
    : format === "ratio"
    ? `${value}%`
    : typeof value === "number" 
      ? value.toLocaleString() 
      : value;

  const content = (
    <div className={`p-4 bg-white border ${colorClass.border} rounded-lg shadow-sm transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 ${colorClass.bg} rounded-lg`}>
            <Icon size={18} className={colorClass.text} />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{formattedValue}</p>
            <p className="mt-1 text-sm text-gray-600">{title}</p>
          </div>
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs font-medium ${
              trend >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend >= 0 ? (
              <TrendingUp size={12} />
            ) : (
              <TrendingDown size={12} />
            )}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );

  if (link) {
    return (
      <Link to={link} className="block">
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left">
        {content}
      </button>
    );
  }

  return content;
};

// Empty State Component
const EmptyDataMessage = ({
  title = "Insufficient Data",
  message = "Waiting for more data to be imported from legacy system",
}: {
  title?: string;
  message?: string;
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <AlertCircle size={48} className="mb-4 text-gray-300" />
      <h3 className="mb-2 text-sm font-medium text-gray-700">{title}</h3>
      <p className="max-w-xs text-xs text-gray-500">{message}</p>
    </div>
  );
};

// Tab Navigation Component
const DashboardTabs = ({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) => {
  const tabs = [
    { id: "executive", label: "Executive Summary", icon: BarChart3 },
    { id: "demographic", label: "Demographic Analysis", icon: Users },
    { id: "affiliate", label: "Affiliate Analytics", icon: Building },
    { id: "temporal", label: "Temporal Analysis", icon: History },
    { id: "system", label: "System & Governance", icon: ShieldCheck },
    { id: "research", label: "Research & Governance", icon: FileCheck },
  ];

  return (
    <div className="flex overflow-x-auto border-b border-gray-200">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
              isActive
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Icon size={16} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

export default function NationalDashboard() {
  const [filters, setFilters] = useState<Filters>({
    time_range: "last_12_months",
  });
  const [activeTab, setActiveTab] = useState("executive");
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const debouncedSearch = useRef<NodeJS.Timeout | null>(null);

  // Fetch filter options
  const { data: filterOptions, isLoading: isLoadingFilters } = useQuery({
    queryKey: ["dashboard-filter-options"],
    queryFn: async () => {
      // This would fetch from a dedicated endpoint or use cached data
      // For now, we'll return defaults
      return {
        affiliates: [],
        member_levels: ["Professional", "Associate", "Regular", "Not Specified"],
        states: [],
        affiliate_types: [],
        time_ranges: [
          { value: "last_3_months", label: "Last 3 Months" },
          { value: "last_6_months", label: "Last 6 Months" },
          { value: "last_12_months", label: "Last 12 Months" },
          { value: "ytd", label: "Year to Date" },
          { value: "qtd", label: "Quarter to Date" },
          { value: "mtd", label: "Month to Date" },
          { value: "all_time", label: "All Time" },
        ],
      };
    },
  });

  // Fetch executive summary data
  const {
    data: executiveData,
    isLoading: isLoadingExecutive,
    error: executiveError,
    refetch: refetchExecutive,
  } = useQuery({
    queryKey: ["executive-summary", filters],
    queryFn: () => dashboard.getExecutiveSummary(filters),
    enabled: activeTab === "executive",
  });

  // Fetch demographic analysis data
  const {
    data: demographicData,
    isLoading: isLoadingDemographic,
    error: demographicError,
    refetch: refetchDemographic,
  } = useQuery({
    queryKey: ["demographic-analysis", filters],
    queryFn: () => dashboard.getDemographicAnalysis(filters),
    enabled: activeTab === "demographic",
  });

  // Fetch affiliate analytics data
  const {
    data: affiliateData,
    isLoading: isLoadingAffiliate,
    error: affiliateError,
    refetch: refetchAffiliate,
  } = useQuery({
    queryKey: ["affiliate-analytics", filters],
    queryFn: () => dashboard.getAffiliateAnalytics(filters),
    enabled: activeTab === "affiliate",
  });

  // Fetch temporal analysis data
  const {
    data: temporalData,
    isLoading: isLoadingTemporal,
    error: temporalError,
    refetch: refetchTemporal,
  } = useQuery({
    queryKey: ["temporal-analysis", filters],
    queryFn: () => dashboard.getTemporalAnalysis(filters),
    enabled: activeTab === "temporal",
  });

  // Fetch system governance data
  const {
    data: systemData,
    isLoading: isLoadingSystem,
    error: systemError,
    refetch: refetchSystem,
  } = useQuery({
    queryKey: ["system-governance", filters],
    queryFn: () => dashboard.getSystemGovernance(filters),
    enabled: activeTab === "system",
  });

  // Fetch research governance data
  const {
    data: researchData,
    isLoading: isLoadingResearch,
    error: researchError,
    refetch: refetchResearch,
  } = useQuery({
    queryKey: ["research-governance", filters],
    queryFn: () => dashboard.getResearchGovernance(filters),
    enabled: activeTab === "research",
  });

  // Handle search
  const handleSearch = async (term: string) => {
    if (!term.trim() || term.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearchLoading(true);
    try {
      const results = await dashboard.searchMembers(term.trim(), {
        affiliate_id: filters.affiliate_id,
        member_level: filters.member_level,
        state: filters.state,
      });
      setSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearchLoading(false);
    }
  };

  const handleSearchInputChange = (value: string) => {
    setSearchInput(value);

    if (debouncedSearch.current) {
      clearTimeout(debouncedSearch.current);
    }

    if (!value.trim()) {
      setSearchResults([]);
      return;
    }

    if (value.trim().length >= 3) {
      debouncedSearch.current = setTimeout(() => {
        setIsSearchLoading(true);
        handleSearch(value.trim());
      }, 500);
    } else {
      setSearchResults([]);
      setIsSearchLoading(false);
    }
  };

  // Get current data based on active tab
  const getCurrentData = () => {
    switch (activeTab) {
      case "executive":
        return {
          data: executiveData,
          isLoading: isLoadingExecutive,
          error: executiveError,
          refetch: refetchExecutive,
        };
      case "demographic":
        return {
          data: demographicData,
          isLoading: isLoadingDemographic,
          error: demographicError,
          refetch: refetchDemographic,
        };
      case "affiliate":
        return {
          data: affiliateData,
          isLoading: isLoadingAffiliate,
          error: affiliateError,
          refetch: refetchAffiliate,
        };
      case "temporal":
        return {
          data: temporalData,
          isLoading: isLoadingTemporal,
          error: temporalError,
          refetch: refetchTemporal,
        };
      case "system":
        return {
          data: systemData,
          isLoading: isLoadingSystem,
          error: systemError,
          refetch: refetchSystem,
        };
      case "research":
        return {
          data: researchData,
          isLoading: isLoadingResearch,
          error: researchError,
          refetch: refetchResearch,
        };
      default:
        return {
          data: executiveData,
          isLoading: isLoadingExecutive,
          error: executiveError,
          refetch: refetchExecutive,
        };
    }
  };

  const { isLoading, error, refetch } = getCurrentData();

  // Render Executive Summary Tab
  const renderExecutiveSummary = () => {
    if (isLoadingExecutive) {
      return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array(8)
            .fill(0)
            .map((_, i) => (
              <MetricSkeleton key={i} />
            ))}
        </div>
      );
    }

    if (executiveError || !executiveData) {
      return (
        <div className="p-6 text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Unable to load executive summary
          </h3>
          <p className="mt-2 text-gray-600">
            {executiveError?.message || "Please try refreshing the page"}
          </p>
          <button
            onClick={() => refetchExecutive()}
            className="px-4 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      );
    }

    const metrics = executiveData.key_metrics;
    const trendIndicators = executiveData.trend_indicators || {};

    return (
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Members"
            value={metrics.total_members}
            icon={Users}
            trend={trendIndicators.members_trend}
            color="blue"
            link="/members"
          />
          <MetricCard
            title="Active Members"
            value={metrics.active_inactive_ratio.active}
            icon={UserCheck}
            trend={trendIndicators.active_members_trend}
            color="green"
            format="percentage"
            link="/members?status=Active"
          />
          <MetricCard
            title="Total Affiliates"
            value={metrics.total_affiliates}
            icon={Building}
            color="purple"
            link="/affiliates"
          />
          <MetricCard
            title="New Members (30 Days)"
            value={metrics.new_members_last_30_days}
            icon={UsersRound}
            trend={trendIndicators.new_members_trend}
            color="teal"
          />
          <MetricCard
            title="Active Ratio"
            value={`${metrics.active_inactive_ratio.active_count} / ${metrics.total_members}`}
            icon={TrendingUp}
            color="green"
          />
          <MetricCard
            title="Pending Actions"
            value={metrics.pending_actions}
            icon={Clock}
            color="orange"
          />
          <MetricCard
            title="Inactive Members"
            value={metrics.active_inactive_ratio.inactive}
            icon={UserCog}
            color="red"
            format="percentage"
          />
          <MetricCard
            title="Data Quality"
            value={executiveData.cards_data?.engagement_rate || 0}
            icon={Database}
            color="indigo"
            format="percentage"
          />
        </div>

        {/* Additional Charts & Cards */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Growth Trend */}
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Growth Trend
              </h3>
              <span className="text-sm text-gray-500">Last 12 months</span>
            </div>
            {/* You can add a chart here */}
          </div>

          {/* Quick Stats */}
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Quick Stats
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Avg Member Tenure</span>
                <span className="font-semibold">3.2 years</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Engagement Rate</span>
                <span className="font-semibold">85%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Retention Rate</span>
                <span className="font-semibold">92%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Demographic Analysis Tab
  const renderDemographicAnalysis = () => {
    if (isLoadingDemographic) {
      return <ChartSkeleton height={72} />;
    }

    if (demographicError || !demographicData) {
      return <EmptyDataMessage />;
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Gender Distribution */}
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Gender Diversity
              </h3>
              <PieChartIcon className="text-purple-600" size={20} />
            </div>
            <div className="h-64">
              {demographicData.gender_diversity?.length > 0 ? (
                <Pie
                  data={{
                    labels: demographicData.gender_diversity.map((g: any) => g.gender),
                    datasets: [
                      {
                        data: demographicData.gender_diversity.map((g: any) => g.count),
                        backgroundColor: [
                          '#3b82f6',
                          '#ec4899',
                          '#8b5cf6',
                          '#6b7280'
                        ],
                      },
                    ],
                  }}
                  options={{
                    plugins: {
                      legend: {
                        position: 'right',
                      },
                    },
                  }}
                />
              ) : (
                <EmptyDataMessage />
              )}
            </div>
          </div>

          {/* State Distribution */}
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                State Distribution
              </h3>
              <MapPin className="text-blue-600" size={20} />
            </div>
            <div className="h-64 overflow-y-auto">
              {demographicData.state_distribution?.length > 0 ? (
                <div className="space-y-2">
                  {demographicData.state_distribution.map((state: any) => (
                    <div key={state.state} className="flex items-center justify-between">
                      <span className="text-gray-700">{state.state}</span>
                      <span className="font-semibold">{state.count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyDataMessage />
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Employment Status */}
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Employment Status
            </h3>
            <div className="space-y-3">
              {demographicData.employment_status?.map((status: any) => (
                <div key={status.status} className="flex items-center justify-between">
                  <span className="text-gray-700">{status.status}</span>
                  <span className="font-semibold">{status.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Member Levels */}
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Member Levels
            </h3>
            <div className="space-y-3">
              {demographicData.member_levels?.map((level: any) => (
                <div key={level.level} className="flex items-center justify-between">
                  <span className="text-gray-700">{level.level}</span>
                  <span className="font-semibold">{level.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ethnicity/Self ID */}
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Ethnicity / Self ID
            </h3>
            <div className="space-y-3">
              {demographicData.ethnicity_self_id?.map((item: any) => (
                <div key={item.self_id} className="flex items-center justify-between">
                  <span className="text-gray-700">{item.self_id}</span>
                  <span className="font-semibold">{item.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Affiliate Analytics Tab
  const renderAffiliateAnalytics = () => {
    if (isLoadingAffiliate) {
      return <ChartSkeleton height={72} />;
    }

    if (affiliateError || !affiliateData) {
      return <EmptyDataMessage />;
    }

    return (
      <div className="space-y-6">
        {/* Top Affiliates by Members */}
        <div className="p-6 bg-white rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Building2 className="text-orange-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-900">
                Top Affiliates by Members
              </h3>
            </div>
            <Link
              to="/affiliates"
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              View All <ExternalLink size={14} />
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-3 text-left text-sm font-semibold text-gray-900">Affiliate</th>
                  <th className="py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                  <th className="py-3 text-left text-sm font-semibold text-gray-900">Total Members</th>
                  <th className="py-3 text-left text-sm font-semibold text-gray-900">Active Members</th>
                  <th className="py-3 text-left text-sm font-semibold text-gray-900">Engagement Rate</th>
                </tr>
              </thead>
              <tbody>
                {affiliateData.members_per_affiliate?.map((affiliate: any) => (
                  <tr key={affiliate.affiliate_id} className="border-b hover:bg-gray-50">
                    <td className="py-3">
                      <Link
                        to={`/affiliates/${affiliate.affiliate_id}/members`}
                        className="font-medium text-blue-600 hover:text-blue-700"
                      >
                        {affiliate.affiliate_name}
                      </Link>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 rounded-full">
                        {affiliate.affiliate_type}
                      </span>
                    </td>
                    <td className="py-3 font-medium">{affiliate.total_members.toLocaleString()}</td>
                    <td className="py-3">{affiliate.active_members.toLocaleString()}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 bg-green-500 rounded-full" 
                            style={{ width: `${affiliate.engagement_rate}%` }}
                          />
                        </div>
                        <span>{affiliate.engagement_rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Affiliate Types Distribution */}
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Affiliate Types Distribution
            </h3>
            {affiliateData.affiliate_types_distribution?.length > 0 ? (
              <div className="space-y-3">
                {affiliateData.affiliate_types_distribution.map((type: any) => (
                  <div key={type.affiliate_type} className="flex items-center justify-between">
                    <span className="text-gray-700">{type.affiliate_type}</span>
                    <div className="text-right">
                      <div className="font-medium">{type.affiliate_count} affiliates</div>
                      <div className="text-sm text-gray-500">{type.member_count.toLocaleString()} members</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyDataMessage />
            )}
          </div>

          {/* Regional Distribution */}
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Regional Distribution
            </h3>
            {affiliateData.regional_distribution?.length > 0 ? (
              <div className="space-y-3">
                {affiliateData.regional_distribution.map((region: any) => (
                  <div key={region.cbc_region} className="flex items-center justify-between">
                    <span className="text-gray-700">{region.cbc_region}</span>
                    <div className="text-right">
                      <div className="font-medium">{region.affiliate_count} affiliates</div>
                      <div className="text-sm text-gray-500">{region.member_count.toLocaleString()} members</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyDataMessage />
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render Temporal Analysis Tab
  const renderTemporalAnalysis = () => {
    if (isLoadingTemporal) {
      return <ChartSkeleton height={72} />;
    }

    if (temporalError || !temporalData) {
      return <EmptyDataMessage />;
    }

    return (
      <div className="space-y-6">
        {/* Member Growth Timeline */}
        <div className="p-6 bg-white rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <LineChart className="text-blue-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-900">
                Member Growth Timeline
              </h3>
            </div>
          </div>
          <div className="h-72">
            {temporalData.member_growth_timeline?.length > 0 ? (
              <Line
                data={{
                  labels: temporalData.member_growth_timeline.map((item: any) => item.month),
                  datasets: [
                    {
                      label: 'New Members',
                      data: temporalData.member_growth_timeline.map((item: any) => item.new_members),
                      borderColor: '#3b82f6',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      fill: true,
                    },
                    {
                      label: 'Cumulative Members',
                      data: temporalData.member_growth_timeline.map((item: any) => item.cumulative_members),
                      borderColor: '#10b981',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      fill: true,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                  },
                }}
              />
            ) : (
              <EmptyDataMessage />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Age Distribution */}
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Age Distribution
            </h3>
            {temporalData.age_distribution?.length > 0 ? (
              <div className="space-y-3">
                {temporalData.age_distribution.map((age: any) => (
                  <div key={age.age_group} className="flex items-center justify-between">
                    <span className="text-gray-700">{age.age_group}</span>
                    <div className="text-right">
                      <div className="font-medium">{age.count.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">{age.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyDataMessage />
            )}
          </div>

          {/* Tenure Analysis */}
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Tenure Analysis
            </h3>
            {temporalData.tenure_analysis?.length > 0 ? (
              <div className="space-y-3">
                {temporalData.tenure_analysis.map((tenure: any) => (
                  <div key={tenure.tenure_group} className="flex items-center justify-between">
                    <span className="text-gray-700">{tenure.tenure_group}</span>
                    <span className="font-medium">{tenure.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyDataMessage />
            )}
          </div>

          {/* Hiring Trends by Year */}
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Hiring Trends by Year
            </h3>
            {temporalData.hiring_trends?.length > 0 ? (
              <div className="space-y-3">
                {temporalData.hiring_trends.map((year: any) => (
                  <div key={year.year} className="flex items-center justify-between">
                    <span className="text-gray-700">{year.year}</span>
                    <span className="font-medium">{year.hire_count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyDataMessage />
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render System & Governance Tab
  const renderSystemGovernance = () => {
    if (isLoadingSystem) {
      return <ChartSkeleton height={72} />;
    }

    if (systemError || !systemData) {
      return <EmptyDataMessage />;
    }

    return (
      <div className="space-y-6">
        {/* Data Quality & Compliance */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Database className="text-indigo-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-900">Data Quality Score</h3>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">{systemData.data_quality_score}%</div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      systemData.data_quality_score >= 80 ? 'bg-green-500' :
                      systemData.data_quality_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${systemData.data_quality_score}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FileCheck className="text-green-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-900">Compliance Status</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Compliance Rate</span>
                <span className="font-semibold">{systemData.compliance_status.compliance_rate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Missing Emails</span>
                <span className="font-semibold">{systemData.compliance_status.missing_data.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Missing Phones</span>
                <span className="font-semibold">{systemData.compliance_status.missing_data.phone}</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Users2 className="text-blue-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-900">Officer Assignments</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Filled Positions</span>
                <span className="font-semibold">{systemData.officer_assignments.filled_positions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Vacant Positions</span>
                <span className="font-semibold">{systemData.officer_assignments.vacant_positions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Fill Rate</span>
                <span className="font-semibold">{systemData.officer_assignments.fill_rate}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Updates */}
        <div className="p-6 bg-white rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <History className="text-orange-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-900">Recent System Updates</h3>
            </div>
            <span className="text-sm text-gray-500">Last 30 days</span>
          </div>
          <div className="space-y-4">
            {systemData.recent_updates?.slice(0, 5).map((update: any) => (
              <div key={update.id} className="flex items-start justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{update.description}</div>
                  <div className="text-sm text-gray-500">{update.time_ago}</div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  update.event === 'created' ? 'bg-green-100 text-green-800' :
                  update.event === 'updated' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {update.event}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render Research & Governance Tab
  const renderResearchGovernance = () => {
    if (isLoadingResearch) {
      return <ChartSkeleton height={72} />;
    }

    if (researchError || !researchData) {
      return <EmptyDataMessage />;
    }

    return (
      <div className="space-y-6">
        {/* Document Categories */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FileSpreadsheet className="text-purple-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-900">Document Categories</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Research</span>
                <span className="font-semibold">{researchData.document_categories.research}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Governance</span>
                <span className="font-semibold">{researchData.document_categories.governance}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Other</span>
                <span className="font-semibold">{researchData.document_categories.other}</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FileCheck className="text-blue-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-900">Contract & Arbitration</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Total Contracts</span>
                <span className="font-semibold">{researchData.contract_arbitration_tracking.total_contracts}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Total Arbitrations</span>
                <span className="font-semibold">{researchData.contract_arbitration_tracking.total_arbitrations}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Files Uploaded</span>
                <span className="font-semibold">{researchData.contract_arbitration_tracking.files_status.uploaded}</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="text-green-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-900">Compliance Dashboard</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Compliance Rate</span>
                <span className="font-semibold">{researchData.compliance_dashboard.compliance_rate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Missing EINs</span>
                <span className="font-semibold">{researchData.compliance_dashboard.missing_eins}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Missing Contracts</span>
                <span className="font-semibold">{researchData.compliance_dashboard.missing_contracts}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Data Quality Details */}
        <div className="p-6 bg-white rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Database className="text-indigo-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-900">Data Quality Details</h3>
            </div>
            <div className="text-lg font-bold text-gray-900">
              Overall: {researchData.data_quality_details.overall_score}%
            </div>
          </div>
          <div className="space-y-4">
            {researchData.data_quality_details.field_details.map((field: any) => (
              <div key={field.field} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">{field.field}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">Weight: {field.weight}%</span>
                    <span className="font-semibold">{field.completeness}%</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      field.completeness >= 80 ? 'bg-green-500' :
                      field.completeness >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${field.completeness}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render active tab content
  const renderActiveTab = () => {
    switch (activeTab) {
      case "executive":
        return renderExecutiveSummary();
      case "demographic":
        return renderDemographicAnalysis();
      case "affiliate":
        return renderAffiliateAnalytics();
      case "temporal":
        return renderTemporalAnalysis();
      case "system":
        return renderSystemGovernance();
      case "research":
        return renderResearchGovernance();
      default:
        return renderExecutiveSummary();
    }
  };

  return (
    <div className="min-h-screen p-4 bg-gray-50 md:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                National Dashboard
              </h1>
              <p className="mt-1 text-gray-600">
                Comprehensive overview of national membership and engagement metrics
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {filterOptions && (
                <FilterPanel
                  filters={filters}
                  filterOptions={filterOptions}
                  onFilterChange={setFilters}
                  isLoading={isLoadingFilters}
                />
              )}

              <button
                onClick={() => refetch()}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={isLoading ? "animate-spin" : ""}
                />
                Refresh
              </button>

              <Link to="/csv-import">
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700">
                  <Download size={16} />
                  Import
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 bg-white rounded-lg shadow-sm">
          <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Search & Quick Actions Bar */}
        <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-5">
          {/* Main Content - 4/5 width */}
          <div className="lg:col-span-4">
            {renderActiveTab()}
          </div>

          {/* Search Sidebar - 1/5 width */}
          <div className="p-6 bg-white shadow-sm rounded-xl">
            <div className="flex items-center gap-2 mb-6">
              <Search size={20} className="text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Quick Search
              </h2>
            </div>

            <div className="mb-4">
              <div
                className={`relative transition-all duration-200 ${
                  isSearchFocused
                    ? "ring-2 ring-blue-500 ring-opacity-30"
                    : ""
                }`}
              >
                <Search
                  className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2"
                  size={18}
                />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder="Type at least 3 characters to search..."
                  className="w-full py-2 pl-10 pr-4 text-sm transition-colors border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                {isSearchLoading && (
                  <div className="absolute transform -translate-y-1/2 right-3 top-1/2">
                    <RefreshCw
                      size={16}
                      className="text-gray-400 animate-spin"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-64">
              {isSearchLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-full p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="flex-1 min-w-0">
                          <div className="w-32 h-4 mb-1 bg-gray-200 rounded animate-pulse"></div>
                          <div className="w-24 h-3 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((member) => (
                  <Link
                    key={member.id}
                    to={`/members/${member.id}`}
                    className="block w-full p-3 text-left transition-colors border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <ClickableAvatar
                        imageUrl={member.profile_photo_url}
                        alt={member.name}
                        fallbackText={member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {member.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {member.member_id} • {member.level}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              ) : searchInput.trim().length >= 3 ? (
                <div className="py-4 text-center">
                  <Search size={24} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">No members found</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Try different search terms
                  </p>
                </div>
              ) : searchInput.trim().length > 0 &&
                searchInput.trim().length < 3 ? (
                <div className="py-4 text-center">
                  <AlertCircle
                    size={24}
                    className="mx-auto mb-2 text-gray-300"
                  />
                  <p className="text-sm text-gray-500">
                    Type at least 3 characters
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Continue typing to search...
                  </p>
                </div>
              ) : (
                <div className="py-4 text-center">
                  <Sparkles size={24} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">Search for members</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Type at least 3 characters to search
                  </p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="pt-6 mt-6 border-t border-gray-200">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Link
                  to="/members"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 transition-colors rounded-lg hover:bg-gray-100"
                >
                  <Users size={14} />
                  Manage Members
                </Link>
                <Link
                  to="/affiliates"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 transition-colors rounded-lg hover:bg-gray-100"
                >
                  <Building size={14} />
                  Manage Affiliates
                </Link>
                <Link
                  to="/documents"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 transition-colors rounded-lg hover:bg-gray-100"
                >
                  <FileText size={14} />
                  View Documents
                </Link>
                <Link
                  to="/reports"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 transition-colors rounded-lg hover:bg-gray-100"
                >
                  <BarChart2 size={14} />
                  Generate Reports
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 mt-6 text-sm text-center text-gray-500 border-t border-gray-200">
          <p>
            Data last updated: {new Date().toLocaleDateString()} • Auto-refresh
            every 5 minutes
          </p>
        </div>
      </div>
    </div>
  );
}