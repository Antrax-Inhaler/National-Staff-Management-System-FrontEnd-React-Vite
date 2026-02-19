import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Users, 
  Calendar, 
  FileText, 
  Mail, 
  UserCheck,
  TrendingUp,
  Target,
  PieChart,
  BarChart3
} from 'lucide-react';
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
import { Doughnut, Line, Bar } from 'react-chartjs-2';

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
  affiliate_overview: {
    affiliate_name: string;
    total_members: number;
    officer_roster: Array<{
      position: string;
      member_name: string;
      start_date: string;
      end_date: string;
    }>;
    vacant_positions: string[];
    vacant_positions_count: number;
  };
  member_management: {
    employment_breakdown: Record<string, number>;
    status_breakdown: Record<string, number>;
    recent_members: Array<{
      name: string;
      member_id: string;
      employment_status: string;
      level: string;
      joined_date: string;
    }>;
    total_members: number;
  };
  events: {
    upcoming_events: Array<{
      id: number;
      title: string;
      start_date: string;
      end_date: string;
      location: string;
      attendee_count: number;
    }>;
    participation_stats: Record<string, number>;
    total_events: number;
  };
  documents: {
    documents: Array<{
      type: string;
      id: number;
      title: string;
      description: string;
      file_name: string;
      file_size: number;
      uploaded_at: string;
    }>;
    contracts_count: number;
    arbitrations_count: number;
    total_documents: number;
  };
  communications: {
    recent_communications: Array<{
      id: number;
      subject: string;
      message_preview: string;
      communication_type: string;
      status: string;
      sent_at: string;
      recipient_count: number;
    }>;
    communication_stats: Record<string, number>;
    total_communications: number;
  };
  reports: {
    member_growth: Array<{
      period: string;
      new_members: number;
    }>;
    event_participation: Array<{
      period: string;
      registrations: number;
      attended: number;
      attendance_rate: number;
    }>;
  };
}

// Skeleton Components
const MetricSkeleton = () => (
  <div className="p-4 bg-white rounded-lg animate-pulse">
    <div className="flex items-center">
      <div className="w-8 h-8 bg-gray-200 rounded"></div>
      <div className="ml-3 space-y-2">
        <div className="w-20 h-4 bg-gray-200 rounded"></div>
        <div className="w-12 h-6 bg-gray-200 rounded"></div>
        <div className="w-24 h-3 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
);

const ChartSkeleton = () => (
  <div className="p-4 bg-white rounded-lg animate-pulse">
    <div className="w-32 h-5 mb-4 bg-gray-200 rounded"></div>
    <div className="h-40 bg-gray-100 rounded"></div>
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

export default function AffiliateDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const token = session.access_token;
      const response = await fetch(`${apiUrl}/api/affiliate/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch dashboard data');

      const result = await response.json();
      if (result.success) {
        setDashboardData(result.data);
      } else {
        throw new Error(result.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Chart configurations
  const getMemberStatusChart = () => ({
    data: {
      labels: dashboardData ? Object.keys(dashboardData.member_management.status_breakdown) : [],
      datasets: [{
        data: dashboardData ? Object.values(dashboardData.member_management.status_breakdown) : [],
        backgroundColor: ['#10B981', '#EF4444', '#F59E0B', '#6B7280'],
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' as const } },
      cutout: '70%',
    },
  });

  const getMemberGrowthChart = () => ({
    data: {
      labels: dashboardData?.reports.member_growth.slice(-6).map(item => {
        const [year, month] = item.period.split('-');
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { 
          month: 'short' 
        });
      }) || [],
      datasets: [{
        label: 'New Members',
        data: dashboardData?.reports.member_growth.slice(-6).map(item => item.new_members) || [],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.05)' } },
        x: { grid: { display: false } },
      },
    },
  });

  const getOfficerPositionsChart = () => ({
    data: {
      labels: ['Filled', 'Vacant'],
      datasets: [{
        data: dashboardData ? [
          dashboardData.affiliate_overview.officer_roster.length,
          dashboardData.affiliate_overview.vacant_positions_count
        ] : [0, 0],
        backgroundColor: ['#10B981', '#EF4444'],
        borderWidth: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' as const } },
      cutout: '70%',
    },
  });

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
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
  }

  return (
    <div className="">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            {loading ? (
              <div className="w-64 h-8 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              dashboardData?.affiliate_overview.affiliate_name + ' Dashboard'
            )}
          </h1>
          <p className="mt-1 text-sm text-gray-600">Affiliate Management Portal</p>
        </div>

        {/* Top Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-6 lg:grid-cols-4">
          {loading ? (
            <>
              <MetricSkeleton />
              <MetricSkeleton />
              <MetricSkeleton />
              <MetricSkeleton />
            </>
          ) : dashboardData ? (
            <>
              <div className="p-4 bg-white rounded-lg">
                <div className="flex items-center">
                  <Users className="w-6 h-6 text-blue-500" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Total Members</p>
                    <p className="text-xl font-semibold">{dashboardData.affiliate_overview.total_members}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-lg">
                <div className="flex items-center">
                  <UserCheck className="w-6 h-6 text-green-500" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Officers</p>
                    <p className="text-xl font-semibold">{dashboardData.affiliate_overview.officer_roster.length}</p>
                    <p className="text-xs text-gray-500">{dashboardData.affiliate_overview.vacant_positions_count} vacant</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-lg">
                <div className="flex items-center">
                  <Calendar className="w-6 h-6 text-orange-500" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Upcoming Events</p>
                    <p className="text-xl font-semibold">{dashboardData.events.total_events}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-lg">
                <div className="flex items-center">
                  <FileText className="w-6 h-6 text-purple-500" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Documents</p>
                    <p className="text-xl font-semibold">{dashboardData.documents.total_documents}</p>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Main Content - 80% left, 20% right */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          {/* Left Column - 80% */}
          <div className="space-y-4 lg:col-span-4">
            {/* First Row - Key Metrics */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Officer Positions */}
              {loading ? (
                <ChartSkeleton />
              ) : dashboardData ? (
                <div className="p-4 bg-white rounded-lg">
                  <h3 className="flex items-center gap-2 mb-3 font-medium text-gray-900">
                    <Target className="w-4 h-4 text-green-500" />
                    Officer Positions
                  </h3>
                  <div className="h-40">
                    <Doughnut 
                      data={getOfficerPositionsChart().data} 
                      options={getOfficerPositionsChart().options} 
                    />
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-sm text-gray-600">
                      {dashboardData.affiliate_overview.officer_roster.length} filled •{' '}
                      {dashboardData.affiliate_overview.vacant_positions_count} vacant
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Member Growth */}
              {loading ? (
                <ChartSkeleton />
              ) : dashboardData ? (
                <div className="p-4 bg-white rounded-lg lg:col-span-2">
                  <h3 className="flex items-center gap-2 mb-3 font-medium text-gray-900">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    Member Growth (6 months)
                  </h3>
                  <div className="h-40">
                    <Line 
                      data={getMemberGrowthChart().data} 
                      options={getMemberGrowthChart().options} 
                    />
                  </div>
                </div>
              ) : null}
            </div>

            {/* Second Row - Lists */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Officer Roster */}
              {loading ? (
                <ListSkeleton items={4} />
              ) : dashboardData ? (
                <div className="p-4 bg-white rounded-lg">
                  <h3 className="flex items-center gap-2 mb-3 font-medium text-gray-900">
                    <UserCheck className="w-4 h-4 text-green-500" />
                    Officer Roster
                  </h3>
                  <div className="space-y-2 text-sm">
                    {dashboardData.affiliate_overview.officer_roster.slice(0, 4).map((officer, index) => (
                      <div key={index} className="flex items-center justify-between py-2">
                        <div>
                          <p className="font-medium">{officer.position}</p>
                          <p className="text-xs text-gray-500">{officer.member_name}</p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(officer.start_date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                    ))}
                    {dashboardData.affiliate_overview.vacant_positions_count > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs font-medium text-orange-600">
                          {dashboardData.affiliate_overview.vacant_positions_count} positions vacant
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Upcoming Events */}
              {loading ? (
                <ListSkeleton items={3} />
              ) : dashboardData ? (
                <div className="p-4 bg-white rounded-lg">
                  <h3 className="flex items-center gap-2 mb-3 font-medium text-gray-900">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    Upcoming Events
                  </h3>
                  <div className="space-y-2 text-sm">
                    {dashboardData.events.upcoming_events.slice(0, 3).map((event) => (
                      <div key={event.id} className="py-2">
                        <p className="font-medium">{event.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(event.start_date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })} • {event.location}
                        </p>
                        <p className="text-xs text-gray-400">{event.attendee_count} registered</p>
                      </div>
                    ))}
                    {dashboardData.events.upcoming_events.length === 0 && (
                      <p className="text-sm text-gray-400">No upcoming events</p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Third Row - Additional Content */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Recent Communications */}
              {loading ? (
                <ListSkeleton items={2} />
              ) : dashboardData ? (
                <div className="p-4 bg-white rounded-lg">
                  <h3 className="flex items-center gap-2 mb-3 font-medium text-gray-900">
                    <Mail className="w-4 h-4 text-purple-500" />
                    Recent Communications
                  </h3>
                  <div className="space-y-2 text-sm">
                    {dashboardData.communications.recent_communications.slice(0, 2).map((comm) => (
                      <div key={comm.id} className="py-2">
                        <p className="font-medium">{comm.subject}</p>
                        <p className="text-xs text-gray-500 truncate">{comm.message_preview}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(comm.sent_at).toLocaleDateString()} • {comm.recipient_count} recipients
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Recent Documents */}
              {loading ? (
                <ListSkeleton items={2} />
              ) : dashboardData ? (
                <div className="p-4 bg-white rounded-lg">
                  <h3 className="flex items-center gap-2 mb-3 font-medium text-gray-900">
                    <FileText className="w-4 h-4 text-gray-500" />
                    Recent Documents
                  </h3>
                  <div className="space-y-2 text-sm">
                    {dashboardData.documents.documents.slice(0, 2).map((doc) => (
                      <div key={doc.id} className="py-2">
                        <p className="font-medium capitalize">{doc.type}: {doc.title}</p>
                        <p className="text-xs text-gray-500 truncate">{doc.description}</p>
                        <p className="text-xs text-gray-400">{doc.file_name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Right Column - 20% */}
          <div className="space-y-4">
            {/* Member Status Chart */}
            {loading ? (
              <ChartSkeleton />
            ) : dashboardData ? (
              <div className="p-4 bg-white rounded-lg">
                <h3 className="flex items-center gap-2 mb-3 font-medium text-gray-900">
                  <PieChart className="w-4 h-4 text-blue-500" />
                  Member Status
                </h3>
                <div className="h-48">
                  <Doughnut 
                    data={getMemberStatusChart().data} 
                    options={getMemberStatusChart().options} 
                  />
                </div>
              </div>
            ) : null}

            {/* Quick Stats */}
            {loading ? (
              <ListSkeleton items={2} />
            ) : dashboardData ? (
              <div className="p-4 bg-white rounded-lg">
                <h3 className="flex items-center gap-2 mb-3 font-medium text-gray-900">
                  <BarChart3 className="w-4 h-4 text-green-500" />
                  Quick Stats
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="p-3 text-center rounded bg-blue-50">
                    <div className="text-lg font-semibold text-blue-600">
                      {Math.round(
                        (dashboardData.affiliate_overview.officer_roster.length / 
                         (dashboardData.affiliate_overview.officer_roster.length + 
                          dashboardData.affiliate_overview.vacant_positions_count)) * 100
                      )}%
                    </div>
                    <div className="text-xs text-blue-800">Position Fill Rate</div>
                  </div>
                  
                  <div className="p-3 text-center rounded bg-green-50">
                    <div className="text-lg font-semibold text-green-600">
                      {dashboardData.reports.event_participation.length > 0 
                        ? `${Math.round(
                            dashboardData.reports.event_participation[
                              dashboardData.reports.event_participation.length - 1
                            ]?.attendance_rate || 0
                          )}%`
                        : '0%'
                      }
                    </div>
                    <div className="text-xs text-green-800">Attendance Rate</div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}