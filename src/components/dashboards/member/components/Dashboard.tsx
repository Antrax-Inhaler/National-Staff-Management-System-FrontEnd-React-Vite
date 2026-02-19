import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { 
  Calendar, 
  Mail, 
  FileText, 
  Link, 
  User, 
  Award, 
  Users,
  TrendingUp,
  CheckCircle,
  MessageSquare
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
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

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

interface DashboardData {
  profile_summary: {
    name: string;
    member_id: string;
    affiliate: string;
    employment_status: string;
    level: string;
    status: string;
    work_email: string;
    work_phone: string;
    profile_completion: number;
  };
  current_positions: Array<{
    position: string;
    affiliate: string;
    start_date: string;
    end_date: string;
  }>;
  national_roles: Array<{
    role: string;
    description: string;
  }>;
  upcoming_events: Array<{
    event_id: number;
    title: string;
    start_date: string;
    end_date: string;
    location: string;
    attendance_status: string;
    registered_at: string;
  }>;
  attendance_history: Array<{
    event_id: number;
    title: string;
    start_date: string;
    attendance_status: string;
    attended_at: string;
  }>;
  communications: Array<{
    id: number;
    subject: string;
    message: string;
    communication_type: string;
    sent_at: string;
    sent_by: number;
  }>;
  resources: Array<{
    category: string;
    links: Array<{
      title: string;
      url: string;
      description: string;
    }>;
  }>;
  documents: Array<{
    type: string;
    id: number;
    title: string;
    description: string;
    file_name: string;
    file_size: number;
    uploaded_at: string;
  }>;
}

// Skeleton Loader Components
const MetricCardSkeleton = () => (
  <div className="p-4 bg-white rounded-lg animate-pulse">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="w-20 h-4 bg-gray-200 rounded"></div>
        <div className="w-16 h-6 bg-gray-200 rounded"></div>
      </div>
      <div className="w-8 h-8 bg-gray-200 rounded"></div>
    </div>
  </div>
);

const ChartSkeleton = ({ height = 200 }) => (
  <div className="p-4 bg-white rounded-lg animate-pulse">
    <div className="w-32 h-4 mb-4 bg-gray-200 rounded"></div>
    <div className="w-20 h-4 mb-6 bg-gray-200 rounded"></div>
    <div className={`h-[${height}px] bg-gray-100 rounded`}></div>
  </div>
);

const ListSkeleton = ({ items = 3 }) => (
  <div className="p-4 bg-white rounded-lg animate-pulse">
    <div className="w-32 h-5 mb-4 bg-gray-200 rounded"></div>
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="w-full h-4 bg-gray-200 rounded"></div>
          <div className="w-3/4 h-3 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

export default function MemberDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const token = session.access_token;
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/member-dashboard`, {
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

  // Process data for charts
  const getAttendanceChartData = () => {
    if (!dashboardData?.attendance_history) return null;

    const monthlyData = dashboardData.attendance_history.reduce((acc, event) => {
      const date = new Date(event.start_date);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthYear]) {
        acc[monthYear] = 0;
      }
      if (event.attendance_status === 'Attended') {
        acc[monthYear]++;
      }
      return acc;
    }, {} as Record<string, number>);

    const labels = Object.keys(monthlyData).sort().slice(-6); // Last 6 months
    const data = labels.map(label => monthlyData[label]);

    return {
      labels: labels.map(label => {
        const date = new Date(label + '-01');
        return date.toLocaleDateString('en-US', { month: 'short' });
      }),
      datasets: [
        {
          label: 'Events Attended',
          data,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.1,
          fill: true,
        },
      ],
    };
  };

  const getProfileCompletionData = () => {
    const completion = dashboardData?.profile_summary.profile_completion || 0;
    
    return {
      labels: ['Completed', 'Remaining'],
      datasets: [
        {
          data: [completion, 100 - completion],
          backgroundColor: [
            'rgb(34, 197, 94)',
            'rgb(243, 244, 246)',
          ],
          borderWidth: 0,
        },
      ],
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  if (error) return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-gray-50">
      <div className="max-w-md text-center">
        <div className="p-6 text-red-700 rounded-lg bg-red-50">
          <p className="font-semibold">Error Loading Dashboard</p>
          <p className="mt-2 text-sm">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="px-4 py-2 mt-4 text-sm text-white bg-red-600 rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">Welcome back! Here's your latest activity.</p>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 gap-3 mb-6 lg:grid-cols-4">
          {loading ? (
            <>
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
            </>
          ) : dashboardData ? (
            <>
              <div className="p-4 bg-white rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Profile Complete</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {dashboardData.profile_summary.profile_completion}%
                    </p>
                  </div>
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
              </div>

              <div className="p-4 bg-white rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Upcoming Events</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {dashboardData.upcoming_events.length}
                    </p>
                  </div>
                  <Calendar className="w-6 h-6 text-blue-500" />
                </div>
              </div>

              <div className="p-4 bg-white rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Messages</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {dashboardData.communications.length}
                    </p>
                  </div>
                  <Mail className="w-6 h-6 text-purple-500" />
                </div>
              </div>

              <div className="p-4 bg-white rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Positions</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {dashboardData.current_positions.length}
                    </p>
                  </div>
                  <Users className="w-6 h-6 text-orange-500" />
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Left Column - Charts */}
          <div className="space-y-4 lg:col-span-2">
            {/* Attendance Chart */}
            {loading ? (
              <ChartSkeleton height={200} />
            ) : dashboardData ? (
              <div className="p-4 bg-white rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="flex items-center gap-2 font-medium text-gray-900">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    Event Attendance
                  </h3>
                  <span className="text-xs text-gray-500">Last 6 months</span>
                </div>
                <div className="h-48">
                  {getAttendanceChartData() ? (
                    <Line 
                      data={getAttendanceChartData()!} 
                      options={chartOptions}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-gray-400">
                      No attendance data
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Profile Summary */}
            {loading ? (
              <ListSkeleton items={4} />
            ) : dashboardData ? (
              <div className="p-4 bg-white rounded-lg">
                <h3 className="flex items-center gap-2 mb-3 font-medium text-gray-900">
                  <User className="w-4 h-4 text-gray-600" />
                  Profile Summary
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Member ID</p>
                    <p className="font-medium">{dashboardData.profile_summary.member_id}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Affiliate</p>
                    <p className="font-medium">{dashboardData.profile_summary.affiliate || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Level</p>
                    <p className="font-medium">{dashboardData.profile_summary.level}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Status</p>
                    <p className="font-medium">{dashboardData.profile_summary.status}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Upcoming Events */}
            {loading ? (
              <ListSkeleton items={2} />
            ) : dashboardData ? (
              <div className="p-4 bg-white rounded-lg">
                <h3 className="flex items-center gap-2 mb-3 font-medium text-gray-900">
                  <Calendar className="w-4 h-4 text-green-500" />
                  Upcoming Events
                </h3>
                <div className="space-y-2">
                  {dashboardData.upcoming_events.slice(0, 3).map((event) => (
                    <div key={event.event_id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(event.start_date)} • {event.location || 'Virtual'}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        event.attendance_status === 'Registered' 
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {event.attendance_status}
                      </span>
                    </div>
                  ))}
                  {dashboardData.upcoming_events.length === 0 && (
                    <p className="text-sm text-gray-400">No upcoming events</p>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* Right Column - Compact Info */}
          <div className="space-y-4">
            {/* Profile Completion Chart */}
            {loading ? (
              <ChartSkeleton height={160} />
            ) : dashboardData ? (
              <div className="p-4 bg-white rounded-lg">
                <div className="text-center">
                  <div className="h-32 mx-auto mb-2">
                    <Doughnut 
                      data={getProfileCompletionData()} 
                      options={doughnutOptions}
                    />
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {dashboardData.profile_summary.profile_completion}% Complete
                  </p>
                  <p className="text-xs text-gray-500">Profile Completion</p>
                </div>
              </div>
            ) : null}

            {/* Current Positions */}
            {loading ? (
              <ListSkeleton items={2} />
            ) : dashboardData ? (
              <div className="p-4 bg-white rounded-lg">
                <h3 className="flex items-center gap-2 mb-3 font-medium text-gray-900">
                  <Users className="w-4 h-4 text-orange-500" />
                  Current Positions
                </h3>
                <div className="space-y-2 text-sm">
                  {dashboardData.current_positions.slice(0, 3).map((position, index) => (
                    <div key={index}>
                      <p className="font-medium">{position.position}</p>
                      <p className="text-xs text-gray-500">{position.affiliate}</p>
                    </div>
                  ))}
                  {dashboardData.current_positions.length === 0 && (
                    <p className="text-sm text-gray-400">No positions</p>
                  )}
                </div>
              </div>
            ) : null}

            {/* National Roles */}
            {dashboardData?.national_roles && dashboardData.national_roles.length > 0 && (
              <div className="p-4 bg-white rounded-lg">
                <h3 className="flex items-center gap-2 mb-3 font-medium text-gray-900">
                  <Award className="w-4 h-4 text-yellow-500" />
                  National Roles
                </h3>
                <div className="space-y-2 text-sm">
                  {dashboardData.national_roles.slice(0, 2).map((role, index) => (
                    <div key={index}>
                      <p className="font-medium">{role.role}</p>
                      <p className="text-xs text-gray-500">{role.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Resources */}
            {loading ? (
              <ListSkeleton items={2} />
            ) : dashboardData ? (
              <div className="p-4 bg-white rounded-lg">
                <h3 className="flex items-center gap-2 mb-3 font-medium text-gray-900">
                  <Link className="w-4 h-4 text-blue-500" />
                  Quick Resources
                </h3>
                <div className="space-y-1 text-sm">
                  {dashboardData.resources.slice(0, 3).flatMap(category => 
                    category.links.slice(0, 2).map((link, index) => (
                      <a 
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-blue-600 truncate hover:text-blue-800 hover:underline"
                        title={link.title}
                      >
                        {link.title}
                      </a>
                    ))
                  )}
                  {dashboardData.resources.length === 0 && (
                    <p className="text-sm text-gray-400">No resources</p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}