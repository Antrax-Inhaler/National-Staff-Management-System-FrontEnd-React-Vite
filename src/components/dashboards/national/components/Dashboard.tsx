import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { 
    Users, 
    Building, 
    Calendar, 
    TrendingUp, 
    Target,
    Filter,
    Download,
    PieChart,
    BarChart3,
    LineChart
} from "lucide-react";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface DashboardData {
    key_metrics: {
        total_members: number;
        active_members: number;
        total_affiliates: number;
        events_held: number;
        avg_participation: number;
        engagement_rate: number;
    };
    membership_analytics: {
        growth_trend: Array<{ month: string; new_members: number }>;
        level_distribution: Array<{ level: string; count: number }>;
        employment_distribution: Array<{ employment_status: string; count: number }>;
    };
    affiliate_performance: Array<{
        id: number;
        affiliate_name: string;
        total_members: number;
        active_members: number;
        engagement_rate: number;
    }>;
    event_participation: Array<{
        id: number;
        title: string;
        start_date: string;
        attendance_count: number;
        affiliates_represented: number;
    }>;
    compliance_status: {
        summary: {
            compliant: number;
            non_compliant: number;
            total: number;
            compliance_rate: number;
        };
        details: Array<{
            id: number;
            affiliate_name: string;
            filled_positions: number;
            status: string;
        }>;
    };
    filter_options: {
        affiliates: Array<{ id: number; name: string }>;
        member_levels: string[];
        time_ranges: Array<{ value: string; label: string }>;
    };
}

interface Filters {
    time_range: string;
    affiliate_id: string;
    member_level: string;
}

// Skeleton Loader Components
function MetricCardSkeleton() {
    return (
        <div className="p-4 bg-white rounded-lg">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <div className="w-3/4 h-4 mb-2 bg-gray-200 rounded"></div>
                    <div className="w-1/2 h-6 mb-1 bg-gray-200 rounded"></div>
                    <div className="w-2/3 h-3 bg-gray-200 rounded"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            </div>
        </div>
    );
}

function ChartSkeleton() {
    return (
        <div className="p-4 bg-white rounded-lg">
            <div className="w-1/3 h-5 mb-4 bg-gray-200 rounded"></div>
            <div className="h-40 bg-gray-100 rounded animate-pulse"></div>
        </div>
    );
}

function ListSkeleton() {
    return (
        <div className="p-4 bg-white rounded-lg">
            <div className="w-1/3 h-5 mb-4 bg-gray-200 rounded"></div>
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                        <div className="w-2/3 h-4 bg-gray-200 rounded"></div>
                        <div className="w-1/6 h-4 bg-gray-200 rounded"></div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ProgressBarSkeleton() {
    return (
        <div className="w-full h-2 bg-gray-200 rounded-full animate-pulse">
            <div className="h-2 bg-gray-300 rounded-full" style={{ width: '60%' }}></div>
        </div>
    );
}

export default function NationalDashboard() {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filters, setFilters] = useState<Filters>({
        time_range: 'last_12_months',
        affiliate_id: '',
        member_level: ''
    });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, [filters]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError("");
            
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No active session");

            const token = session.access_token;

            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });
            const apiUrl = import.meta.env.VITE_API_BASE_URL;
            const response = await fetch(`${apiUrl}/api/national/dashboard?${params}`, {
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
            console.error("Error fetching dashboard:", err);
            setError(err.message || "Failed to load dashboard");
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key: keyof Filters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            time_range: 'last_12_months',
            affiliate_id: '',
            member_level: ''
        });
    };

    // Simple Chart Components
    const MemberGrowthChart = () => {
        if (loading || !dashboardData) return <ChartSkeleton />;
        
        const data = dashboardData.membership_analytics.growth_trend.slice(-6);
        const maxValue = Math.max(...data.map(d => d.new_members), 1);
        
        return (
            <div className="p-4 bg-white rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                    <LineChart className="w-4 h-4 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Member Growth</h3>
                </div>
                <div className="flex items-end h-40 gap-2">
                    {data.map((item, index) => (
                        <div key={index} className="flex flex-col items-center flex-1">
                            <div 
                                className="w-full transition-all duration-300 bg-blue-500 rounded-t hover:bg-blue-600"
                                style={{ 
                                    height: `${(item.new_members / maxValue) * 100}%`,
                                    minHeight: '20px'
                                }}
                            ></div>
                            <div className="w-full mt-1 text-xs text-center text-gray-500 truncate">
                                {item.month.slice(0, 3)}
                            </div>
                            <div className="text-xs font-semibold">{item.new_members}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const LevelDistributionChart = () => {
        if (loading || !dashboardData) return <ChartSkeleton />;
        
        const data = dashboardData.membership_analytics.level_distribution;
        const total = data.reduce((sum, item) => sum + item.count, 0);
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
        
        return (
            <div className="p-4 bg-white rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                    <PieChart className="w-4 h-4 text-green-600" />
                    <h3 className="font-semibold text-gray-900">Level Distribution</h3>
                </div>
                <div className="space-y-2">
                    {data.map((item, index) => {
                        const percentage = total > 0 ? (item.count / total) * 100 : 0;
                        return (
                            <div key={item.level} className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">{item.level}</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-20 h-2 bg-gray-200 rounded-full">
                                        <div 
                                            className="h-2 rounded-full"
                                            style={{ 
                                                width: `${percentage}%`,
                                                backgroundColor: colors[index % colors.length]
                                            }}
                                        ></div>
                                    </div>
                                    <span className="w-8 text-sm font-semibold text-right">
                                        {Math.round(percentage)}%
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const EngagementChart = () => {
        if (loading || !dashboardData) return <ChartSkeleton />;
        
        const data = dashboardData.affiliate_performance.slice(0, 5);
        
        return (
            <div className="p-4 bg-white rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-4 h-4 text-purple-600" />
                    <h3 className="font-semibold text-gray-900">Top Affiliate Engagement</h3>
                </div>
                <div className="space-y-3">
                    {data.map((affiliate) => (
                        <div key={affiliate.id} className="flex items-center justify-between">
                            <span className="flex-1 mr-2 text-sm text-gray-600 truncate">
                                {affiliate.affiliate_name}
                            </span>
                            <div className="flex items-center w-32 gap-2">
                                <div className="w-full h-2 bg-gray-200 rounded-full">
                                    <div 
                                        className="h-2 bg-purple-500 rounded-full"
                                        style={{ width: `${affiliate.engagement_rate}%` }}
                                    ></div>
                                </div>
                                <span className="w-8 text-sm font-semibold">
                                    {affiliate.engagement_rate}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const MetricCard = ({ title, value, icon: Icon, trend, subtitle }: any) => (
        <div className="p-4 bg-white rounded-lg">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    {loading ? (
                        <div className="mt-1 space-y-1">
                            <div className="w-3/4 h-6 bg-gray-200 rounded animate-pulse"></div>
                            {subtitle && <div className="w-1/2 h-3 bg-gray-200 rounded animate-pulse"></div>}
                        </div>
                    ) : (
                        <>
                            <p className="mt-1 text-xl font-bold text-gray-900">{value}</p>
                            {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
                        </>
                    )}
                </div>
                <div className={`p-2 rounded-full ${trend ? 'bg-green-100' : 'bg-blue-100'}`}>
                    <Icon className={`h-5 w-5 ${trend ? 'text-green-600' : 'text-blue-600'}`} />
                </div>
            </div>
        </div>
    );
    type ProgressBarColor = "blue" | "green" | "red" | "yellow" | "purple";

interface ProgressBarProps {
  value: number;
  max: number;
  color?: ProgressBarColor;
}
const ProgressBar: React.FC<ProgressBarProps> = ({ value, max, color = "blue" }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;

  const colorClasses: Record<ProgressBarColor, string> = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    red: "bg-red-500",
    yellow: "bg-yellow-500",
    purple: "bg-purple-500",
  };

        return (
            <div className="w-full h-2 bg-gray-200 rounded-full">
                <div 
                    className={`h-2 rounded-full ${colorClasses[color]}`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        );
    };

    if (error) return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
            <div className="text-center">
                <div className="max-w-md px-6 py-4 text-red-700 border border-red-200 rounded-lg bg-red-50">
                    <p className="font-semibold">Error Loading Dashboard</p>
                    <p className="mt-2 text-sm">{error}</p>
                    <button 
                        onClick={fetchDashboardData}
                        className="px-4 py-2 mt-3 text-sm text-white bg-red-600 rounded hover:bg-red-700"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        </div>
    );

    if (!loading && !dashboardData) {
        return (
            <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
                <p className="text-gray-600">No dashboard data available</p>
            </div>
        );
    }

    return (
        <div className="overflow-y-auto ">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="flex flex-col items-start justify-between gap-3 mb-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">National Dashboard</h1>
                        <p className="mt-1 text-sm text-gray-600">Organization performance overview</p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <Filter size={16} />
                            Filters
                        </button>
                        <button className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>

                {/* Filters */}
                {showFilters && dashboardData && (
                    <div className="p-4 mb-4 bg-white rounded-lg">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Time Range</label>
                                <select 
                                    value={filters.time_range}
                                    onChange={(e) => handleFilterChange('time_range', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                >
                                    {dashboardData.filter_options.time_ranges.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Affiliate</label>
                                <select 
                                    value={filters.affiliate_id}
                                    onChange={(e) => handleFilterChange('affiliate_id', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="">All Affiliates</option>
                                    {dashboardData.filter_options.affiliates.map(affiliate => (
                                        <option key={affiliate.id} value={affiliate.id}>
                                            {affiliate.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Member Level</label>
                                <select 
                                    value={filters.member_level}
                                    onChange={(e) => handleFilterChange('member_level', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="">All Levels</option>
                                    {dashboardData.filter_options.member_levels.map(level => (
                                        <option key={level} value={level}>{level}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="flex items-end">
                                <button 
                                    onClick={clearFilters}
                                    className="w-full px-3 py-2 text-sm text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 gap-3 mb-4 sm:grid-cols-2 lg:grid-cols-3">
                    {loading || !dashboardData ? (
                        [...Array(6)].map((_, i) => <MetricCardSkeleton key={i} />)
                    ) : (
                        <>
                            <MetricCard 
                                title="Total Members" 
                                value={dashboardData.key_metrics.total_members.toLocaleString()}
                                icon={Users}
                            />
                            <MetricCard 
                                title="Active Members" 
                                value={dashboardData.key_metrics.active_members.toLocaleString()}
                                subtitle={`${dashboardData.key_metrics.engagement_rate}% engagement`}
                                icon={TrendingUp}
                                trend={true}
                            />
                            <MetricCard 
                                title="Total Affiliates" 
                                value={dashboardData.key_metrics.total_affiliates}
                                icon={Building}
                            />
                            <MetricCard 
                                title="Events Held" 
                                value={dashboardData.key_metrics.events_held}
                                icon={Calendar}
                            />
                            <MetricCard 
                                title="Avg Participation" 
                                value={dashboardData.key_metrics.avg_participation}
                                subtitle="Members per affiliate"
                                icon={Target}
                            />
                            <MetricCard 
                                title="Engagement Rate" 
                                value={`${dashboardData.key_metrics.engagement_rate}%`}
                                icon={TrendingUp}
                                trend={true}
                            />
                        </>
                    )}
                </div>

                {/* Analytics Section */}
                <div className="grid grid-cols-1 gap-4 mb-4 lg:grid-cols-3">
                    <MemberGrowthChart />
                    <LevelDistributionChart />
                    <EngagementChart />
                </div>

                {/* Recent Events */}
                <div className="p-4 mb-4 bg-white rounded-lg">
                    <h3 className="mb-3 font-semibold text-gray-900">Recent Events</h3>
                    {loading || !dashboardData ? (
                        <ListSkeleton />
                    ) : (
                        <div className="space-y-3">
                            {dashboardData.event_participation.map(event => (
                                <div key={event.id} className="pb-2 border-b border-gray-100 last:border-0">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900">{event.title}</p>
                                            <p className="text-xs text-gray-500">{new Date(event.start_date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {event.attendance_count} attended • {event.affiliates_represented} affiliates
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Compliance Status */}
                <div className="p-4 bg-white rounded-lg">
                    <h3 className="mb-3 font-semibold text-gray-900">Compliance Status</h3>
                    {loading || !dashboardData ? (
                        <>
                            <ProgressBarSkeleton />
                            <ListSkeleton />
                        </>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-sm text-gray-600">Compliance Rate</p>
                                    <p className="text-xl font-bold text-gray-900">
                                        {dashboardData.compliance_status.summary.compliance_rate}%
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-green-600">Compliant</p>
                                        <p className="text-lg font-bold">{dashboardData.compliance_status.summary.compliant}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-red-600">Non-Compliant</p>
                                        <p className="text-lg font-bold">{dashboardData.compliance_status.summary.non_compliant}</p>
                                    </div>
                                </div>
                            </div>
                            <ProgressBar 
                                value={dashboardData.compliance_status.summary.compliant}
                                max={dashboardData.compliance_status.summary.total}
                                color="green"
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
