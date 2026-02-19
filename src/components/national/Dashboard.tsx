import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Users,
  TrendingUp,
  Calendar,
  CheckCircle,
  FileText,
  BarChart3,
  PieChart,
  MapPin,
  Download,
  Eye,
} from "lucide-react";
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
} from "chart.js";
import { Line, Bar, Doughnut, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface NationalDashboardData {
  affiliates_by_size: Array<{
    affiliate_id: number;
    affiliate_name: string;
    member_count: number;
  }>;
  membership_trend: Array<{
    month: string;
    new_members: number;
    active_affiliates: number;
    total_members: number;
  }>;
  event_engagement: Array<{
    event_id: number;
    event_title: string;
    start_date: string;
    total_attendance: number;
    affiliates_represented: number;
    affiliate_names: string[];
  }>;
  compliance_overview: {
    summary: {
      compliant_affiliates: number;
      non_compliant_affiliates: number;
      total_affiliates: number;
      compliance_rate: number;
    };
    detailed_data: Array<{
      affiliate_id: number;
      affiliate_name: string;
      filled_positions: number;
      total_positions: number;
      completion_rate: number;
      is_compliant: boolean;
    }>;
  };
  contract_arbitration_timeline: Array<{
    month: string;
    contracts_count: number;
    arbitrations_count: number;
    total_uploads: number;
    uploads: Array<{
      id: number;
      title: string;
      type: string;
      date: string;
      affiliate_id: number;
    }>;
  }>;
  key_metrics: {
    total_members: number;
    total_affiliates: number;
    recent_events: number;
    recent_uploads: number;
    active_members: number;
    avg_members_per_affiliate: number;
  };
}

export default function NationalDashboard() {
  const [dashboardData, setDashboardData] =
    useState<NationalDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const token = session.access_token;
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/national/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setDashboardData(result.data);
      } else {
        throw new Error(result.message || "Failed to fetch dashboard data");
      }
    } catch (err: any) {
      console.error("Error fetching national dashboard:", err);
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  // Chart data processing functions
  const getAffiliatesBySizeChartData = () => {
    if (!dashboardData?.affiliates_by_size) return null;

    const sortedData = [...dashboardData.affiliates_by_size]
      .sort((a, b) => b.member_count - a.member_count)
      .slice(0, 10); // Top 10 affiliates

    return {
      labels: sortedData.map((item) => item.affiliate_name),
      datasets: [
        {
          label: "Number of Members",
          data: sortedData.map((item) => item.member_count),
          backgroundColor: "rgba(59, 130, 246, 0.8)",
          borderColor: "rgb(59, 130, 246)",
          borderWidth: 1,
        },
      ],
    };
  };

  const getMembershipTrendChartData = () => {
    if (!dashboardData?.membership_trend) return null;

    return {
      labels: dashboardData.membership_trend.map((item) => {
        const date = new Date(item.month + "-01");
        return date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
      }),
      datasets: [
        {
          label: "New Members",
          data: dashboardData.membership_trend.map((item) => item.new_members),
          borderColor: "rgb(34, 197, 94)",
          backgroundColor: "rgba(34, 197, 94, 0.1)",
          tension: 0.1,
        },
        {
          label: "Total Members",
          data: dashboardData.membership_trend.map(
            (item) => item.total_members
          ),
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.1,
        },
      ],
    };
  };

  const getEventEngagementChartData = () => {
    if (!dashboardData?.event_engagement) return null;

    return {
      labels: dashboardData.event_engagement.map((item) => item.event_title),
      datasets: [
        {
          label: "Total Attendance",
          data: dashboardData.event_engagement.map(
            (item) => item.total_attendance
          ),
          backgroundColor: "rgba(168, 85, 247, 0.8)",
        },
        {
          label: "Affiliates Represented",
          data: dashboardData.event_engagement.map(
            (item) => item.affiliates_represented
          ),
          backgroundColor: "rgba(245, 158, 11, 0.8)",
        },
      ],
    };
  };

  const getComplianceChartData = () => {
    if (!dashboardData?.compliance_overview) return null;

    return {
      labels: ["Compliant", "Non-Compliant"],
      datasets: [
        {
          data: [
            dashboardData.compliance_overview.summary.compliant_affiliates,
            dashboardData.compliance_overview.summary.non_compliant_affiliates,
          ],
          backgroundColor: ["rgb(34, 197, 94)", "rgb(239, 68, 68)"],
          borderWidth: 0,
        },
      ],
    };
  };

  const getContractArbitrationChartData = () => {
    if (!dashboardData?.contract_arbitration_timeline) return null;

    const sortedData = [...dashboardData.contract_arbitration_timeline].sort(
      (a, b) => a.month.localeCompare(b.month)
    );

    return {
      labels: sortedData.map((item) => {
        const date = new Date(item.month + "-01");
        return date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
      }),
      datasets: [
        {
          label: "Contracts",
          data: sortedData.map((item) => item.contracts_count),
          backgroundColor: "rgba(59, 130, 246, 0.8)",
        },
        {
          label: "Arbitrations",
          data: sortedData.map((item) => item.arbitrations_count),
          backgroundColor: "rgba(239, 68, 68, 0.8)",
        },
      ],
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
  };

  const barChartOptions = {
    ...chartOptions,
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
    },
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading national dashboard...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="max-w-md px-6 py-4 text-red-700 border border-red-200 rounded-lg bg-red-50">
            <p className="font-semibold">Error Loading Dashboard</p>
            <p className="mt-2">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 mt-4 text-white bg-red-600 rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );

  if (!dashboardData) return null;

  const affiliatesBySizeData = getAffiliatesBySizeChartData();
  const membershipTrendData = getMembershipTrendChartData();
  const eventEngagementData = getEventEngagementChartData();
  const complianceData = getComplianceChartData();
  const contractArbitrationData = getContractArbitrationChartData();

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            National Administration Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Comprehensive overview of all affiliates and national activities
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Members
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(dashboardData.key_metrics.total_members)}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Affiliates
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(dashboardData.key_metrics.total_affiliates)}
                </p>
              </div>
              <MapPin className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Compliance Rate
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.compliance_overview.summary.compliance_rate}%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Recent Uploads
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(dashboardData.key_metrics.recent_uploads)}
                </p>
              </div>
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-2">
          {/* Affiliates by Size */}
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <BarChart3 className="text-blue-600" size={24} />
                Top Affiliates by Size
              </h2>
              <span className="text-sm text-gray-500">Member Count</span>
            </div>
            <div className="h-80">
              {affiliatesBySizeData ? (
                <Bar data={affiliatesBySizeData} options={barChartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No affiliate data available
                </div>
              )}
            </div>
          </div>

          {/* Membership Trend */}
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <TrendingUp className="text-green-600" size={24} />
                National Membership Trend
              </h2>
              <span className="text-sm text-gray-500">Last 12 months</span>
            </div>
            <div className="h-80">
              {membershipTrendData ? (
                <Line data={membershipTrendData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No trend data available
                </div>
              )}
            </div>
          </div>

          {/* Event Engagement */}
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <Calendar className="text-purple-600" size={24} />
                Event Engagement
              </h2>
              <span className="text-sm text-gray-500">Recent events</span>
            </div>
            <div className="h-80">
              {eventEngagementData ? (
                <Bar data={eventEngagementData} options={barChartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No event data available
                </div>
              )}
            </div>
          </div>

          {/* Compliance Overview */}
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <PieChart className="text-red-600" size={24} />
                Compliance Overview
              </h2>
              <span className="text-sm text-gray-500">
                {dashboardData.compliance_overview.summary.compliance_rate}%
                compliant
              </span>
            </div>
            <div className="h-80">
              {complianceData ? (
                <Pie data={complianceData} options={pieChartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No compliance data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contract/Arbitration Timeline */}
        <div className="p-6 mb-6 bg-white rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <FileText className="text-orange-600" size={24} />
              Document Upload Timeline
            </h2>
            <span className="text-sm text-gray-500">
              Contracts vs Arbitrations
            </span>
          </div>
          <div className="h-80">
            {contractArbitrationData ? (
              <Bar data={contractArbitrationData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No document data available
              </div>
            )}
          </div>
        </div>

        {/* Detailed Tables */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Compliance Details */}
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Compliance Details</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">
                      Affiliate
                    </th>
                    <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">
                      Filled Positions
                    </th>
                    <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">
                      Completion
                    </th>
                    <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dashboardData.compliance_overview.detailed_data
                    .slice(0, 5)
                    .map((affiliate) => (
                      <tr key={affiliate.affiliate_id}>
                        <td className="px-4 py-2 text-sm">
                          {affiliate.affiliate_name}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {affiliate.filled_positions}/
                          {affiliate.total_positions}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {affiliate.completion_rate}%
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              affiliate.is_compliant
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {affiliate.is_compliant
                              ? "Compliant"
                              : "Non-Compliant"}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Event Engagement */}
          <div className="p-6 bg-white rounded-lg shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">
              Recent Event Engagement
            </h2>
            <div className="space-y-3">
              {dashboardData.event_engagement.slice(0, 5).map((event) => (
                <div key={event.event_id} className="p-3 border rounded-lg">
                  <h3 className="text-sm font-semibold">{event.event_title}</h3>
                  <div className="flex justify-between mt-1 text-xs text-gray-600">
                    <span>{formatDate(event.start_date)}</span>
                    <span>{event.total_attendance} attendees</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {event.affiliates_represented} affiliates represented
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
