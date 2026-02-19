// src/components/dashboard/ExecutiveSummary.tsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  UserCheck, 
  Building, 
  UsersRound, 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Equal,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { InfoTooltip } from "./InfoTooltip";
import { MetricCard } from "./MetricCard";

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

interface ExecutiveSummaryProps {
  data?: ExecutiveMetrics;
  loading?: boolean;
  filters?: any;
  getMembersLink: (filters?: Record<string, string>) => string;
  getAffiliateLink: (publicUid?: string, affiliateType?: string) => string;
}

export function ExecutiveSummary({ 
  data, 
  loading = false, 
  filters = {},
  getMembersLink,
  getAffiliateLink 
}: ExecutiveSummaryProps) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);

  const metricPages = useMemo(() => {
    if (!data?.key_metrics) return [];
    
    const allMetrics = [
      {
        title: "Total Members",
        value: data.key_metrics.total_members,
        icon: Users,
        color: "blue" as const,
        trend: data.trend_indicators?.members_trend,
        linkTo: getMembersLink(),
        tooltip: "Total number of registered members across all affiliates. Filtered by current selection.",
      },
      {
        title: "Active Members",
        value: data.key_metrics.active_inactive_ratio?.active_count || 0,
        icon: UserCheck,
        color: "green" as const,
        trend: data.trend_indicators?.active_members_trend,
        subtitle: `${data.key_metrics.active_inactive_ratio?.active || 0}% active`,
        linkTo: getMembersLink({ status: 'Active' }),
        tooltip: "Members currently engaged with the organization.",
      },
      {
        title: "Total Affiliates",
        value: data.key_metrics.total_affiliates,
        icon: Building,
        color: "purple" as const,
        trend: data.cards_data?.affiliates_trend,
        linkTo: getAffiliateLink(),
        tooltip: "Number of affiliate organizations registered.",
      },
      {
        title: "New Members (30d)",
        value: data.key_metrics.new_members_last_30_days,
        icon: UsersRound,
        color: "indigo" as const,
        trend: data.trend_indicators?.new_members_trend,
        linkTo: getMembersLink({ sort: 'created_at:desc' }),
        tooltip: "Members who joined in the last 30 days.",
      },
      {
        title: "Engagement Rate",
        value: data.cards_data?.engagement_rate || 0,
        icon: Activity,
        color: "teal" as const,
        format: "percentage" as const,
        tooltip: "Percentage of members with active status.",
      },
      {
        title: "Pending Actions",
        value: data.key_metrics.pending_actions,
        icon: AlertCircle,
        color: "orange" as const,
        linkTo: "/audit-logs",
        tooltip: "Recent system activities requiring attention.",
      },
      {
        title: "Data Quality",
        value: data.key_metrics.data_quality_score || 0,
        icon: CheckCircle,
        color: "cyan" as const,
        format: "percentage" as const,
        subtitle: "Overall completeness",
        linkTo: "/system-governance",
        tooltip: "Weighted average of data completeness across critical fields.",
      },
      {
        title: "Inactive Members",
        value: data.key_metrics.active_inactive_ratio?.inactive_count || 0,
        icon: AlertTriangle,
        color: "red" as const,
        subtitle: `${data.key_metrics.active_inactive_ratio?.inactive || 0}% inactive`,
        linkTo: getMembersLink({ status: 'Inactive' }),
        tooltip: "Members not currently active.",
      },
    ];
    
    // Split into pages of 4
    const pages = [];
    for (let i = 0; i < allMetrics.length; i += 4) {
      pages.push(allMetrics.slice(i, i + 4));
    }
    return pages;
  }, [data, getMembersLink, getAffiliateLink]);

  useEffect(() => {
    if (metricPages.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % metricPages.length);
    }, 7000);
    
    return () => clearInterval(interval);
  }, [metricPages.length]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="p-4 bg-white rounded-lg shadow-sm animate-pulse border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="w-6 h-6 bg-gray-200 rounded-md"></div>
              <div className="w-10 h-4 bg-gray-200 rounded"></div>
            </div>
            <div className="mb-1 bg-gray-200 rounded h-6"></div>
            <div className="w-1/2 h-3 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (metricPages.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Executive Summary</h2>
            <p className="text-gray-600 mt-1 text-sm">Key performance indicators</p>
          </div>
        </div>
        <p className="text-gray-500 text-center py-8">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Executive Summary</h2>
          <p className="text-gray-600 mt-1 text-sm">
            Key performance indicators
            {filters.affiliate_id && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                Filtered
              </span>
            )}
          </p>
        </div>
        <InfoTooltip 
          content="Metrics auto-rotate every 7 seconds. Click on any metric to drill down."
          className="hidden md:block"
        >
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <RefreshCw size={12} />
            <span>Auto-rotating</span>
          </div>
        </InfoTooltip>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metricPages[currentPage].map((metric, index) => (
          <MetricCard 
            key={`${currentPage}-${index}`} 
            {...metric} 
            delay={index * 100} 
          />
        ))}
      </div>

      {/* Pagination Dots */}
      {metricPages.length > 1 && (
        <div className="flex justify-center gap-2">
          {metricPages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentPage 
                  ? 'bg-blue-600 w-8' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to metrics page ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}