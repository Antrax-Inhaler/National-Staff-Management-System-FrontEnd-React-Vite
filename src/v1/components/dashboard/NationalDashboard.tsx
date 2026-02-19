// src/pages/national/NationalDashboard.tsx
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Users,
  Building,
  Activity,
  Clock,
  BookOpen,
  Globe,
  RefreshCw,
  ExternalLink,
  X,
  Menu,
  Search,
  Filter,
  Bug,
} from "lucide-react";
import { dashboard } from "../../api/dashboard";
import { ClickableChart } from "./components/ClickableChart";
import { ExecutiveSummary } from "./components/ExecutiveSummary";
import { FilterPanel } from "./components/FilterPanel";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { InfoTooltip } from "./components/InfoTooltip";
import { EmptyDataMessage } from "./components/EmptyDataMessage";
// Import ChartJS
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
  defaults,
} from "chart.js";
import BugReportCard from "@v1/components/dashboard/components/BugReportCard";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler,
);

if (defaults.animation && typeof defaults.animation === "object") {
  (defaults.animation as any).duration = 800;
  (defaults.animation as any).easing = "easeInOutQuart";
}
defaults.responsive = true;
defaults.maintainAspectRatio = false;

// Interfaces - Updated to match FilterPanel expectations
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

interface ExecutiveMetrics {
  key_metrics?: {
    total_members: number;
    total_affiliates: number;
    new_members_last_30_days: number;
    pending_actions: number;
    data_quality_score?: number;
    active_inactive_ratio?: {
      active_count: number;
      inactive_count: number;
      active: number;
      inactive: number;
    };
  };
  cards_data?: {
    engagement_rate?: number;
    members_trend?: number;
    affiliates_trend?: number;
  };
  trend_indicators?: {
    members_trend?: number;
    active_members_trend?: number;
    new_members_trend?: number;
  };
}

interface DemographicData {
  state_distribution?: Array<{ state: string; count: number }>;
  gender_diversity?: Array<{
    gender: string;
    count: number;
    percentage: number;
  }>;
  employment_status?: Array<{ status: string; count: number }>;
  member_levels?: Array<{ level: string; count: number }>;
  ethnicity_self_id?: Array<{ self_id: string; count: number }>;
}

interface AffiliateData {
  members_per_affiliate?: Array<{
    affiliate_id: number;
    public_uid?: string;
    affiliate_name: string;
    affiliate_type: string;
    total_members: number;
    active_members: number;
    engagement_rate: number;
  }>;
  affiliate_types_distribution?: Array<{
    affiliate_type: string;
    affiliate_count: number;
    member_count: number;
  }>;
  regional_distribution?: Array<{
    cbc_region: string;
    affiliate_count: number;
    member_count: number;
  }>;
}

interface TemporalData {
  member_growth_timeline?: Array<{
    month: string;
    new_members: number;
    cumulative_members: number;
  }>;
  age_distribution?: Array<{
    age_group: string;
    count: number;
    percentage: number;
  }>;
  tenure_analysis?: Array<{
    tenure_group: string;
    count: number;
    has_data: boolean;
  }>;
  hiring_trends?: Array<{
    year: number;
    hire_count: number;
    has_data: boolean;
  }>;
}

interface ResearchGovernanceData {
  document_categories?: {
    research: number;
    governance: number;
    other: number;
  };
  data_quality_details?: {
    overall_score: number;
    field_details?: Array<{
      field: string;
      completeness: number;
      weight: number;
      importance: string;
      score: number;
      complete_count: number;
      is_date_field: boolean;
    }>;
    total_members: number;
    note: string;
  };
}

// Navigation sections
const navigationSections = [
  { id: "executive-summary", label: "Executive", icon: Activity },
  { id: "demographic-analysis", label: "Demographics", icon: Users },
  { id: "affiliate-analytics", label: "Affiliates", icon: Building },
  { id: "temporal-analysis", label: "Trends", icon: Clock },
  { id: "research-governance", label: "Research", icon: BookOpen },
];

export default function NationalDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [filters, setFilters] = useState<Filters>({
    time_range: "last_12_months",
  });
  const [activeFilters, setActiveFilters] = useState<
    Array<{ key: string; label: string; value: string }>
  >([]);
  const [activeSection, setActiveSection] = useState("executive-summary");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Initialize filters from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlFilters: Partial<Filters> = {};

    params.forEach((value, key) => {
      if (key === "time_range")
        urlFilters.time_range = value || "last_12_months";
      if (key === "affiliate_id") {
        // Handle comma-separated affiliate IDs for arrays
        const values = value.split(",");
        urlFilters.affiliate_id = values.length > 1 ? values : value;
      }
      if (key === "member_level") {
        const values = value.split(",");
        urlFilters.member_level = values.length > 1 ? values : value;
      }
      if (key === "state") {
        const values = value.split(",");
        urlFilters.state = values.length > 1 ? values : value;
      }
      if (key === "start_date") urlFilters.start_date = value;
      if (key === "end_date") urlFilters.end_date = value;
      if (key === "affiliate_type") {
        const values = value.split(",");
        urlFilters.affiliate_type = values.length > 1 ? values : value;
      }
      if (key === "cbc_region") {
        const values = value.split(",");
        urlFilters.cbc_region = values.length > 1 ? values : value;
      }
      if (key === "ORG_region") {
        const values = value.split(",");
        urlFilters.ORG_region = values.length > 1 ? values : value;
      }
    });

    setFilters((prev) => ({
      ...prev,
      ...urlFilters,
    }));
  }, [location.search]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (
        value &&
        value !== "" &&
        key !== "time_range" &&
        value !== "last_12_months"
      ) {
        // Handle array values
        if (Array.isArray(value)) {
          if (value.length > 0) {
            params.set(key, value.join(","));
          }
        } else {
          params.set(key, value.toString());
        }
      }
    });

    params.set("time_range", filters.time_range || "last_12_months");

    const newUrl = `${location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);

    updateActiveFilters();
  }, [filters, location.pathname]);

  // Update active filters display
  const updateActiveFilters = () => {
    const active: Array<{ key: string; label: string; value: string }> = [];

    Object.entries(filters).forEach(([key, value]) => {
      if (
        value &&
        value !== "" &&
        key !== "time_range" &&
        value !== "last_12_months"
      ) {
        let label = "";
        let displayValue = "";

        // Handle array values
        if (Array.isArray(value)) {
          if (value.length === 0) return;
          displayValue = value.join(", ");
        } else {
          displayValue = value.toString();
        }

        switch (key) {
          case "affiliate_id":
            label = "Affiliate";
            break;
          case "member_level":
            label = "Member Level";
            break;
          case "state":
            label = "State";
            break;
          case "affiliate_type":
            label = "Affiliate Type";
            break;
          case "cbc_region":
            label = "CBC Region";
            displayValue =
              displayValue === "Not Specified" ? "Not Specified" : displayValue;
            break;
          case "ORG_region":
            label = "ORG Region";
            displayValue =
              displayValue === "Not Specified"
                ? "Not Specified"
                : `Region ${displayValue}`;
            break;
          case "start_date":
            label = "Start Date";
            break;
          case "end_date":
            label = "End Date";
            break;
          default:
            label = key
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase());
        }

        active.push({ key, label, value: displayValue });
      }
    });

    setActiveFilters(active);
  };

  // Remove a specific filter
  const removeFilter = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: undefined,
    }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      time_range: "last_12_months",
    });
  };

  // Handle filter apply from FilterPanel
  const handleFilterApply = (newFilters: Filters) => {
    setFilters(newFilters);
    setIsFilterOpen(false);
  };

  // Queries
  const { data: executiveData, isLoading: execLoading } =
    useQuery<ExecutiveMetrics>({
      queryKey: ["executive-summary", filters],
      queryFn: () => dashboard.executiveSummary(filters),
    });

  const { data: demoData, isLoading: demoLoading } = useQuery<DemographicData>({
    queryKey: ["demographic-analysis", filters],
    queryFn: () => dashboard.demographicAnalysis(filters),
  });

  const { data: affiliateData, isLoading: affiliateLoading } =
    useQuery<AffiliateData>({
      queryKey: ["affiliate-analytics", filters],
      queryFn: () => dashboard.affiliateAnalytics(filters),
    });

  const { data: temporalData, isLoading: temporalLoading } =
    useQuery<TemporalData>({
      queryKey: ["temporal-analysis", filters],
      queryFn: () => dashboard.temporalAnalysis(filters),
    });

  const { data: researchData, isLoading: researchLoading } =
    useQuery<ResearchGovernanceData>({
      queryKey: ["research-governance", filters],
      queryFn: () => dashboard.researchGovernance(filters),
    });

  // Setup intersection observer for section tracking
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        root: null,
        rootMargin: "-20% 0px -70% 0px",
        threshold: 0.1,
      },
    );

    navigationSections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) {
        observerRef.current?.observe(element);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Add scroll margin to sections
  useEffect(() => {
    const sectionIds = navigationSections.map((section) => section.id);
    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.style.scrollMarginTop = "100px";
      }
    });
  }, []);

  // Scroll to section function
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setActiveSection(sectionId);
      setIsMobileMenuOpen(false);
    }
  };

  // Helper function to get members link with filters
  const getMembersLink = (additionalFilters?: Record<string, string>) => {
    const params = new URLSearchParams();

    if (filters.affiliate_id) {
      if (Array.isArray(filters.affiliate_id)) {
        params.append("affiliate_id", filters.affiliate_id.join(","));
      } else {
        params.append("affiliate_id", filters.affiliate_id);
      }
    }

    if (filters.member_level && filters.member_level !== "Not Specified") {
      if (Array.isArray(filters.member_level)) {
        params.append("level", filters.member_level.join(","));
      } else {
        params.append("level", filters.member_level);
      }
    }

    if (filters.state) {
      if (Array.isArray(filters.state)) {
        params.append("state", filters.state.join(","));
      } else {
        params.append("state", filters.state);
      }
    }

    if (filters.affiliate_type) {
      if (Array.isArray(filters.affiliate_type)) {
        params.append("affiliate_type", filters.affiliate_type.join(","));
      } else {
        params.append("affiliate_type", filters.affiliate_type);
      }
    }

    if (filters.cbc_region) {
      if (Array.isArray(filters.cbc_region)) {
        params.append("cbc_region", filters.cbc_region.join(","));
      } else {
        params.append("cbc_region", filters.cbc_region);
      }
    }

    if (filters.ORG_region) {
      if (Array.isArray(filters.ORG_region)) {
        params.append("ORG_region", filters.ORG_region.join(","));
      } else {
        params.append("ORG_region", filters.ORG_region);
      }
    }

    if (additionalFilters) {
      Object.entries(additionalFilters).forEach(([key, value]) => {
        params.append(key, value);
      });
    }

    return `/members${params.toString() ? `?${params.toString()}` : ""}`;
  };

  // Helper function to get affiliate link
  const getAffiliateLink = (publicUid?: string, affiliateType?: string) => {
    if (publicUid) {
      return `/affiliates/${publicUid}/members`;
    }
    if (affiliateType) {
      return `/affiliates?affiliate_type=${affiliateType}`;
    }
    return "/affiliates";
  };

  // Chart data preparations
  const growthChartData = temporalData?.member_growth_timeline
    ? {
        labels: temporalData.member_growth_timeline.map((item) => item.month),
        datasets: [
          {
            label: "Cumulative Members",
            data: temporalData.member_growth_timeline.map(
              (item) => item.cumulative_members,
            ),
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            fill: true,
            tension: 0.4,
            borderWidth: 3,
          },
          {
            label: "New Members",
            data: temporalData.member_growth_timeline.map(
              (item) => item.new_members,
            ),
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            borderWidth: 2,
            borderDash: [5, 5],
          },
        ],
      }
    : null;

  const ageChartData = temporalData?.age_distribution
    ? {
        labels: temporalData.age_distribution.map((item) => item.age_group),
        datasets: [
          {
            data: temporalData.age_distribution.map((item) => item.count),
            backgroundColor: "#10b981",
            borderRadius: 6,
          },
        ],
      }
    : null;

  // Handle growth chart click
  const handleGrowthChartClick = () => {
    navigate(getMembersLink({ sort: "created_at:desc" }));
  };

  // Progress Bar Component
  const ProgressBar = ({
    value,
    color = "blue",
    label,
  }: {
    value: number;
    color?: string;
    label?: string;
  }) => {
    const colorClasses = {
      blue: "bg-blue-500",
      green: "bg-green-500",
      red: "bg-red-500",
      yellow: "bg-yellow-500",
      indigo: "bg-indigo-500",
      purple: "bg-purple-500",
    };

    return (
      <div className="relative">
        {label && (
          <div className="flex justify-between mb-1 text-xs text-gray-600">
            <span>{label}</span>
            <span>{value}%</span>
          </div>
        )}
        <div className="w-full h-2 overflow-hidden bg-gray-200 rounded-full">
          <div
            className={`h-full ${colorClasses[color as keyof typeof colorClasses] || "bg-blue-500"} rounded-full transition-all duration-700 ease-out`}
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
    );
  };

  // Mobile menu component
  const MobileNavigation = () => (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-2 bg-white border-t border-gray-200 lg:hidden">
      <div className="flex justify-around">
        {navigationSections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;

          return (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`flex flex-col items-center p-2 text-xs font-medium transition-all duration-200 ${
                isActive ? "text-blue-700" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Icon size={18} />
              <span className="mt-1">{section.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-16 lg:pb-0">
      {/* Mobile Menu */}
      <MobileNavigation />

      {/* Main Header with Search and Filters */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 rounded-t-lg">
        <div className="max-w-6xl px-4 mx-auto sm:px-6">
          {/* First Row: Title and Actions */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Globe size={20} className="text-blue-600" />
                <h1 className="text-lg font-bold text-gray-900">
                  National Dashboard
                </h1>
              </div>
            </div>

            {/* Desktop Navigation - Hidden on mobile */}
            <div className="items-center hidden gap-1 lg:flex">
              {navigationSections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 relative ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={16} />
                    <span>{section.label}</span>
                    {isActive && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-blue-500 rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center gap-3 lg:hidden">
              <FilterPanel
                filters={filters}
                onFilterChange={(newFilters) => setFilters(newFilters)}
                onFilterApply={handleFilterApply}
                isLoading={execLoading || demoLoading}
                isOpen={isFilterOpen}
                onToggle={() => setIsFilterOpen(!isFilterOpen)}
              />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-600 rounded-lg hover:text-gray-900 hover:bg-gray-100"
              >
                <Menu size={20} />
              </button>
            </div>

            {/* Desktop filters */}
            <div className="items-center hidden gap-3 lg:flex">
              <FilterPanel
                filters={filters}
                onFilterChange={(newFilters) => setFilters(newFilters)}
                onFilterApply={handleFilterApply}
                isLoading={execLoading || demoLoading}
                isOpen={isFilterOpen}
                onToggle={() => setIsFilterOpen(!isFilterOpen)}
              />
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="py-2 border-t border-gray-100 lg:hidden">
              <div className="grid grid-cols-2 gap-2">
                {navigationSections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;

                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        isActive
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-200"
                      }`}
                    >
                      <Icon size={16} />
                      <span>{section.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {activeFilters.length > 0 && (
            <div className="py-2 border-t border-gray-100">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
                    Active Filters:
                  </span>
                  <div className="flex flex-wrap gap-1 max-w-[calc(100vw-120px)]">
                    {activeFilters.map((filter) => (
                      <span
                        key={filter.key}
                        className="inline-flex items-center max-w-full gap-1 px-2 py-1 text-xs text-blue-700 rounded-lg bg-blue-50"
                      >
                        <span className="font-medium truncate">
                          {filter.label}:
                        </span>
                        <span className="truncate">{filter.value}</span>
                        <button
                          onClick={() => removeFilter(filter.key)}
                          className="flex-shrink-0 ml-1 text-blue-500 hover:text-blue-700"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={clearAllFilters}
                  className="self-start px-2 py-1 text-xs text-gray-500 rounded hover:text-gray-700 hover:bg-gray-100 sm:self-center"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl px-4 py-6 mx-auto space-y-8">
        {/* Executive Summary Section */}
        <section id="executive-summary" className="scroll-mt-24">
          <ExecutiveSummary
            data={executiveData}
            loading={execLoading}
            filters={filters}
            getMembersLink={getMembersLink}
            getAffiliateLink={getAffiliateLink}
          />

          {/* Member Growth Chart */}
          {temporalData?.member_growth_timeline &&
            temporalData.member_growth_timeline.length > 0 && (
              <div className="p-6 mt-6 bg-white shadow rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Membership Growth Timeline
                  </h3>
                  <InfoTooltip content="Shows cumulative member growth over time with new member additions per month. Uses registration dates where available." />
                </div>
                <div className="h-64">
                  {temporalLoading ? (
                    <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
                  ) : growthChartData ? (
                    <ClickableChart onClick={handleGrowthChartClick}>
                      <Line
                        data={growthChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: "top",
                              labels: {
                                usePointStyle: true,
                              },
                            },
                            tooltip: {
                              callbacks: {
                                label: (context) => {
                                  const label = context.dataset.label || "";
                                  const value = context.parsed.y;
                                  return `${label}: ${value.toLocaleString()}`;
                                },
                              },
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                callback: function (value) {
                                  return value.toLocaleString();
                                },
                              },
                              grid: {
                                color: "rgba(0, 0, 0, 0.05)",
                              },
                            },
                            x: {
                              grid: {
                                color: "rgba(0, 0, 0, 0.05)",
                              },
                            },
                          },
                        }}
                      />
                    </ClickableChart>
                  ) : (
                    <EmptyDataMessage />
                  )}
                </div>
              </div>
            )}
        </section>

        {/* Demographic Analysis Section */}
        <section id="demographic-analysis" className="scroll-mt-24">
          <div className="mb-6">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Demographic Analysis
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Member distribution and diversity metrics across the
                  organization
                </p>
              </div>
              <button
                onClick={() => navigate(getMembersLink())}
                className="flex items-center self-start gap-1 text-sm text-blue-600 hover:text-blue-700 sm:self-center"
              >
                View Members <ExternalLink size={12} />
              </button>
            </div>
          </div>

          <AnalyticsDashboard
            demographicData={demoData}
            temporalData={temporalData}
            demoLoading={demoLoading}
            temporalLoading={temporalLoading}
            getMembersLink={getMembersLink}
          />
        </section>

        {/* Affiliate Analytics Section */}
        <section id="affiliate-analytics" className="scroll-mt-24">
          <div className="mb-6">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Affiliate Analytics
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Affiliate organization performance and distributions
                </p>
              </div>
              <button
                onClick={() => navigate(getAffiliateLink())}
                className="flex items-center self-start gap-1 text-sm text-blue-600 hover:text-blue-700 sm:self-center"
              >
                View All Affiliates <ExternalLink size={12} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Top Affiliates */}
            <div className="p-6 bg-white shadow lg:col-span-2 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Top Affiliates by Members
                </h3>
                <InfoTooltip content="Affiliates ranked by total member count. Engagement rate shows percentage of active members. Click to view affiliate details." />
              </div>
              {affiliateLoading ? (
                <div className="h-48 bg-gray-200 rounded animate-pulse"></div>
              ) : affiliateData?.members_per_affiliate &&
                affiliateData.members_per_affiliate.length > 0 ? (
                <div className="space-y-4">
                  {affiliateData.members_per_affiliate
                    .slice(0, 10)
                    .map((affiliate, index) => (
                      <div
                        key={affiliate.affiliate_id}
                        className="p-4 transition-shadow duration-200 rounded-lg shadow-sm cursor-pointer hover:shadow-md hover:border-blue-300 group"
                        style={{ animationDelay: `${index * 50}ms` }}
                        onClick={() =>
                          navigate(getAffiliateLink(affiliate.public_uid))
                        }
                      >
                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {affiliate.affiliate_name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded">
                                {affiliate.affiliate_type}
                              </span>
                              <span className="text-xs text-gray-500">
                                {affiliate.active_members} active
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">
                              {affiliate.total_members.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-600">
                              {affiliate.engagement_rate}% engagement
                            </div>
                          </div>
                        </div>
                        <div className="mt-2">
                          <ProgressBar
                            value={affiliate.engagement_rate}
                            color="green"
                          />
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <EmptyDataMessage />
              )}
            </div>

            {/* Affiliate Types */}
            <div className="p-6 bg-white shadow rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Affiliate Types
                </h3>
                <InfoTooltip content="Distribution of affiliates by type and their total member counts. Shows organizational structure at a glance. Click on any type to view those affiliates." />
              </div>
              {affiliateData?.affiliate_types_distribution ? (
                <div className="space-y-4">
                  {affiliateData.affiliate_types_distribution.map(
                    (type, index) => {
                      const borderColors = [
                        "#8b5cf6",
                        "#3b82f6",
                        "#10b981",
                        "#f59e0b",
                        "#ec4899",
                        "#6366f1",
                      ];

                      const borderColor =
                        borderColors[index % borderColors.length];

                      return (
                        <div
                          key={type.affiliate_type}
                          className="p-4 rounded-xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
                          style={{
                            animationDelay: `${index * 50}ms`,
                            borderLeft: `4px solid ${borderColor}`,
                          }}
                          onClick={() =>
                            navigate(
                              getAffiliateLink(undefined, type.affiliate_type),
                            )
                          }
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="flex items-center justify-center w-8 h-8 rounded-lg"
                              style={{ backgroundColor: `${borderColor}20` }}
                            >
                              <Building
                                size={16}
                                style={{ color: borderColor }}
                              />
                            </div>
                            <span className="font-semibold text-gray-900 truncate transition-colors group-hover:text-purple-600">
                              {type.affiliate_type}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <div>
                              <div className="text-xs text-gray-500">
                                Affiliates
                              </div>
                              <div className="text-lg font-semibold">
                                {type.affiliate_count}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500">
                                Members
                              </div>
                              <div className="text-lg font-semibold">
                                {type.member_count.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              ) : (
                <EmptyDataMessage />
              )}
            </div>
          </div>
        </section>

        {/* Temporal Analysis Section */}
        <section id="temporal-analysis" className="scroll-mt-24">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Temporal Analysis
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Trends and patterns over time
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Age Distribution */}
            <div className="p-6 bg-white shadow rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Age Distribution
                </h3>
                <InfoTooltip content="Member age groups based on date of birth. Calculated as of today's date. Shows workforce demographics." />
              </div>
              <div className="h-64">
                {temporalLoading ? (
                  <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
                ) : ageChartData ? (
                  <ClickableChart onClick={() => navigate(getMembersLink())}>
                    <Bar
                      data={ageChartData}
                      options={{
                        indexAxis: "y" as const,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                          tooltip: {
                            callbacks: {
                              label: (context) => {
                                const value = context.parsed.x;
                                return `Members: ${value.toLocaleString()}`;
                              },
                            },
                          },
                        },
                        scales: {
                          x: {
                            beginAtZero: true,
                            ticks: {
                              callback: function (value) {
                                return value.toLocaleString();
                              },
                            },
                          },
                        },
                      }}
                    />
                  </ClickableChart>
                ) : (
                  <EmptyDataMessage />
                )}
              </div>
            </div>

            {/* Tenure Analysis */}
            <div className="p-6 bg-white shadow rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Tenure Analysis
                </h3>
                <InfoTooltip content="Member tenure calculated from hire date or registration date. Shows organizational experience distribution." />
              </div>
              {temporalData?.tenure_analysis ? (
                <div className="space-y-4">
                  {temporalData.tenure_analysis.map((tenure, index) => (
                    <div
                      key={tenure.tenure_group}
                      className="p-3 transition-shadow duration-200 rounded-lg shadow-sm hover:shadow-md"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">
                          {tenure.tenure_group}
                        </span>
                        <span className="font-semibold text-gray-900">
                          {tenure.count}
                        </span>
                      </div>
                      {tenure.has_data && (
                        <div className="mt-2">
                          <ProgressBar
                            value={
                              (tenure.count /
                                Math.max(
                                  ...temporalData
                                    .tenure_analysis!.filter((t) => t.has_data)
                                    .map((t) => t.count),
                                )) *
                              100
                            }
                            color="orange"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyDataMessage message="No tenure data available" />
              )}
            </div>
          </div>
        </section>

        {/* Research & Governance Section */}
        <section id="research-governance" className="scroll-mt-24">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Research & Governance
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Research documentation and governance tracking
                </p>
              </div>
            </div>
          </div>

          {researchLoading ? (
            <div className="space-y-6">
              <div className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="h-48 bg-gray-200 rounded-xl animate-pulse"></div>
                <div className="h-48 bg-gray-200 rounded-xl animate-pulse"></div>
              </div>
            </div>
          ) : researchData ? (
            <div className="space-y-6">
              {/* Document Categories */}
              <div className="p-6 bg-white shadow rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">
                    Document Categories
                  </h3>
                </div>
                {researchData.document_categories ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="p-4 text-center rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
                      <div className="text-3xl font-bold text-blue-800">
                        {researchData.document_categories.research || 0}
                      </div>
                      <div className="mt-2 text-sm font-medium text-blue-700">
                        Research Documents
                      </div>
                    </div>
                    <div className="p-4 text-center rounded-lg bg-gradient-to-br from-purple-50 to-purple-100">
                      <div className="text-3xl font-bold text-purple-800">
                        {researchData.document_categories.governance || 0}
                      </div>
                      <div className="mt-2 text-sm font-medium text-purple-700">
                        Governance Documents
                      </div>
                    </div>
                    <div className="p-4 text-center rounded-lg bg-gradient-to-br from-gray-50 to-gray-100">
                      <div className="text-3xl font-bold text-gray-800">
                        {researchData.document_categories.other || 0}
                      </div>
                      <div className="mt-2 text-sm font-medium text-gray-700">
                        Other Documents
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyDataMessage message="No document category data" />
                )}
              </div>

              {/* Data Quality Details */}
              <div className="p-6 bg-white shadow rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">
                    Data Quality Details
                  </h3>
                </div>
                {researchData.data_quality_details ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-green-100">
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                        <div>
                          <div className="text-sm text-green-700">
                            Overall Data Quality
                          </div>
                          <div className="text-3xl font-bold text-green-800">
                            {researchData.data_quality_details.overall_score}%
                          </div>
                        </div>
                        <div className="text-sm text-green-700">
                          {researchData.data_quality_details.overall_score >= 80
                            ? "Excellent"
                            : researchData.data_quality_details.overall_score >=
                                60
                              ? "Good"
                              : "Needs Improvement"}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyDataMessage message="No detailed data quality information" />
                )}
              </div>
            </div>
          ) : (
            <EmptyDataMessage
              title="Research Data Not Available"
              message="Research and governance data is being collected"
            />
          )}
        </section>
        <BugReportCard />
      </div>

      {/* Footer - Hidden on mobile */}
      <div className="hidden p-3 text-xs text-center text-gray-500 border-t lg:block">
        <div className="flex flex-col items-center justify-between max-w-6xl gap-2 px-4 mx-auto md:flex-row">
          <div className="flex items-center gap-2">
            <RefreshCw size={12} className="animate-spin" />
            <span>Auto-refreshes every 5 minutes</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">•</span>
            <span>
              Last updated:{" "}
              {new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="text-gray-400">•</span>
            <span>
              Data as of:{" "}
              {new Date().toLocaleDateString([], {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {filters.affiliate_id && (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                Filtered by Affiliate
              </span>
            )}
            {filters.member_level && (
              <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">
                Filtered by Member Level
              </span>
            )}
            {filters.state && (
              <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full">
                Filtered by State:{" "}
                {Array.isArray(filters.state)
                  ? filters.state.join(", ")
                  : filters.state}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
