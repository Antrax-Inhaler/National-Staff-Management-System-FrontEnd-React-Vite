import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useDebounce } from "use-debounce";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Building2, 
  Eye, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock as ClockIcon,
  Search,
  ChevronDown,
  ChevronUp,
  Calendar as CalendarIcon,
  Video,
  UserCheck
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import toast from 'react-hot-toast';
import DataTable from "./../../../components/ui/DataTable";
import type { Column, Paginated } from "./../../../components/ui/DataTable";
import SearchInput from "./../../../components/ui/SearchInput";
import SelectField from "./../../../components/ui/SelectField";
import Badge from "./../../../components/ui/Badge";
import Modal from "./../../../components/ui/Modal";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Event {
  id: number;
  title: string;
  description?: string;
  event_type: string;
  status: string;
  start_date: string;
  end_date?: string;
  time_zone?: string;
  venue_name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  is_virtual: boolean;
  registration_url?: string;
  registration_limit?: number;
  registration_deadline?: string;
  attendance_mode?: string;
  is_waitlist_enabled: boolean;
  affiliate_id?: number;
  affiliate_name?: string;
  is_national_event: boolean;
  attendance_count: number;
  location?: string;
  created_at: string;
  updated_at: string;
  
  // Member-specific fields
  my_attendance_status?: string;
  my_registered_at?: string;
  my_attended_at?: string;
  attendance_summary?: {
    total_registrations: number;
    attended_count: number;
    registered_count: number;
  };
}

interface MemberInfo {
  id: number;
  affiliate_id: number;
  affiliate_name: string;
}

export default function MemberEvents() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [affiliateFilter, setAffiliateFilter] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [locationTypeFilter, setLocationTypeFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "details">("list");
  const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [viewType, setViewType] = useState<"grid" | "list">("grid");

  const columns: Column<Event>[] = [
    { 
      key: "title", 
      header: "Event", 
      accessor: (event) => (
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
            event.is_virtual ? 'bg-purple-100' : 'bg-blue-100'
          }`}>
            {event.is_virtual ? (
              <Video className="w-6 h-6 text-purple-600" />
            ) : (
              <Calendar className="w-6 h-6 text-blue-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 line-clamp-2">{event.title}</div>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
              {event.is_national_event ? (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  National
                </span>
              ) : event.affiliate_name ? (
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {event.affiliate_name}
                </span>
              ) : null}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(event.start_date).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      )
    },
    {
      key: "location",
      header: "Location",
      accessor: (event) => (
        <div className="text-sm">
          {event.is_virtual ? (
            <div className="flex items-center gap-2 text-purple-700">
              <Video className="w-4 h-4" />
              <span>Virtual</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-600" />
              <span className="text-gray-700">{event.city || event.venue_name || 'TBA'}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "attendance",
      header: "My Status",
      accessor: (event) => (
        <div className="flex justify-center">
          {event.my_attendance_status ? (
            <Badge 
              variant={
                event.my_attendance_status === 'Attended' ? 'success' :
                event.my_attendance_status === 'Registered' ? 'primary' :
                event.my_attendance_status === 'Waitlisted' ? 'warning' : 'error'
              }
              className="px-3 py-1.5 text-sm font-medium"
            >
              <UserCheck className="w-3 h-3 mr-1" />
              {event.my_attendance_status}
            </Badge>
          ) : (
            <span className="text-gray-400 text-sm">Not Registered</span>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      accessor: (event) => (
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => {
              setSelectedEvent(event);
              setViewMode("details");
            }}
            className="p-2 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors duration-200"
            title="View Details"
          >
            <Eye size={18} />
          </button>
          
          {!event.my_attendance_status || event.my_attendance_status === 'Cancelled' ? (
            <button
              onClick={() => handleRegister(event.id)}
              disabled={actionLoading === event.id}
              className="p-2 text-green-600 rounded-lg hover:bg-green-50 transition-colors duration-200 disabled:opacity-50"
              title="Register for Event"
            >
              {actionLoading === event.id ? (
                <ClockIcon className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle size={18} />
              )}
            </button>
          ) : event.my_attendance_status === 'Registered' || event.my_attendance_status === 'Waitlisted' ? (
            <button
              onClick={() => handleCancelRegistration(event.id)}
              disabled={actionLoading === event.id}
              className="p-2 text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200 disabled:opacity-50"
              title="Cancel Registration"
            >
              {actionLoading === event.id ? (
                <ClockIcon className="w-4 h-4 animate-spin" />
              ) : (
                <XCircle size={18} />
              )}
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  // Grid View Card Component
  const EventCard = ({ event }: { event: Event }) => {
    const isRegistrationOpen = !event.registration_deadline || new Date(event.registration_deadline) > new Date();
    const isEventInFuture = new Date(event.start_date) > new Date();

    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:border-blue-200">
        {/* Event Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1">
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
              event.is_virtual ? 'bg-purple-100' : 'bg-blue-100'
            }`}>
              {event.is_virtual ? (
                <Video className="w-6 h-6 text-purple-600" />
              ) : (
                <Calendar className="w-6 h-6 text-blue-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 line-clamp-2 text-lg leading-tight">
                {event.title}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {event.is_national_event ? (
                  <Badge variant="primary" className="text-xs">
                    <Building2 className="w-3 h-3 mr-1" />
                    National
                  </Badge>
                ) : event.affiliate_name ? (
                  <Badge variant="success" className="text-xs">
                    <Users className="w-3 h-3 mr-1" />
                    {event.affiliate_name}
                  </Badge>
                ) : null}
                <Badge variant="gray" className="text-xs">
                  {event.event_type}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Event Details */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CalendarIcon className="w-4 h-4" />
            <span>{new Date(event.start_date).toLocaleDateString()}</span>
            <span className="text-gray-400">•</span>
            <span>{new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {event.is_virtual ? (
              <>
                <Video className="w-4 h-4" />
                <span>Virtual Event</span>
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4" />
                <span>{event.city || event.venue_name || 'Location TBA'}</span>
              </>
            )}
          </div>

          {/* Attendance Status */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {event.attendance_count} registered
            </div>
            {event.my_attendance_status ? (
              <Badge 
                variant={
                  event.my_attendance_status === 'Attended' ? 'success' :
                  event.my_attendance_status === 'Registered' ? 'primary' :
                  event.my_attendance_status === 'Waitlisted' ? 'warning' : 'error'
                }
                className="text-xs font-medium"
              >
                {event.my_attendance_status}
              </Badge>
            ) : (
              <span className="text-gray-400 text-sm">Not Registered</span>
            )}
          </div>
        </div>

        {/* Description Preview */}
        {event.description && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 line-clamp-2">
              {event.description}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t border-gray-100">
          <button
            onClick={() => {
              setSelectedEvent(event);
              setViewMode("details");
            }}
            className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200"
          >
            View Details
          </button>
          
          {!event.my_attendance_status || event.my_attendance_status === 'Cancelled' ? (
            <button
              onClick={() => handleRegister(event.id)}
              disabled={!isRegistrationOpen || actionLoading === event.id || !isEventInFuture}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {actionLoading === event.id ? (
                <ClockIcon className="w-4 h-4 mx-auto animate-spin" />
              ) : !isRegistrationOpen ? (
                "Closed"
              ) : !isEventInFuture ? (
                "Ended"
              ) : (
                "Register"
              )}
            </button>
          ) : event.my_attendance_status === 'Registered' || event.my_attendance_status === 'Waitlisted' ? (
            <button
              onClick={() => handleCancelRegistration(event.id)}
              disabled={actionLoading === event.id || !isEventInFuture}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {actionLoading === event.id ? (
                <ClockIcon className="w-4 h-4 mx-auto animate-spin" />
              ) : !isEventInFuture ? (
                "Ended"
              ) : (
                "Cancel"
              )}
            </button>
          ) : null}
        </div>
      </div>
    );
  };

  const fetchEvents = async (
    page: number,
    perPage: number | "All"
  ): Promise<Paginated<Event>> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const token = session.access_token;
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage === "All" ? "1000" : perPage.toString(),
      });

      if (debouncedSearch) params.append("search", debouncedSearch);
      if (affiliateFilter) params.append("affiliate", affiliateFilter);
      if (eventTypeFilter) params.append("event_type", eventTypeFilter);
      if (locationTypeFilter) params.append("location_type", locationTypeFilter);
      if (startDateFilter) params.append("start_date", startDateFilter);
      if (endDateFilter) params.append("end_date", endDateFilter);

      const response = await fetch(`${apiUrl}/api/member/events?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch events");

      const result = await response.json();

      if (result.success) {
        setMemberInfo(result.member);
        return {
          items: result.data,
          current_page: result.meta?.current_page || 1,
          last_page: result.meta?.last_page || 1,
          per_page: result.meta?.per_page || (typeof perPage === "number" ? perPage : 20),
          total: result.meta?.total || result.data.length,
        };
      } else {
        throw new Error(result.message || "Failed to fetch events");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load events");
      toast.error(err.message || "Failed to load events");
      return {
        items: [],
        current_page: 1,
        last_page: 1,
        per_page: typeof perPage === "number" ? perPage : 20,
        total: 0,
      };
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (eventId: number) => {
    setActionLoading(eventId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const token = session.access_token;
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/member/events/${eventId}/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to register for event");
      }

      toast.success(result.message || "Registered for event successfully!");
      refreshTable();
    } catch (err: any) {
      toast.error(err.message || "Failed to register for event");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelRegistration = async (eventId: number) => {
    if (!confirm("Are you sure you want to cancel your registration for this event?")) {
      return;
    }

    setActionLoading(eventId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const token = session.access_token;
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/member/events/${eventId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to cancel registration");
      }

      toast.success(result.message || "Registration cancelled successfully!");
      refreshTable();
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel registration");
    } finally {
      setActionLoading(null);
    }
  };

  const refreshTable = () => {
    queryClient.invalidateQueries({
      queryKey: ["member-events", debouncedSearch, affiliateFilter, eventTypeFilter, locationTypeFilter, startDateFilter, endDateFilter],
    });
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedEvent(null);
  };

  return (
    <div className="min-h-screen bg-gray-50/30 p-4 lg:p-6">
      {viewMode === "list" && (
        <>
          {/* Header Section */}
          <div className="mb-6 lg:mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Events & Calendar</h1>
                <p className="mt-2 text-gray-600 text-sm lg:text-base">
                  Discover and register for upcoming events
                  {memberInfo?.affiliate_name && (
                    <span className="text-blue-600 font-medium"> • {memberInfo.affiliate_name} Member</span>
                  )}
                </p>
              </div>
              
              {/* View Toggle */}
              <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
                <button
                  onClick={() => setViewType("grid")}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    viewType === "grid" 
                      ? "bg-blue-500 text-white" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewType("list")}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    viewType === "list" 
                      ? "bg-blue-500 text-white" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  List
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-2 text-red-700">
                <XCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Search and Filters Section */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 lg:p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search events by title, description, venue..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                />
              </div>

              {/* Filter Button */}
              <div className="relative">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-3 text-gray-700 bg-gray-50 border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors duration-200 w-full lg:w-auto"
                >
                  <Filter className="w-5 h-5" />
                  <span>Filters</span>
                  {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {/* Filters Dropdown */}
                {showFilters && (
                  <div className="absolute right-0 z-20 w-full lg:w-80 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Affiliate
                        </label>
                        <select
                          value={affiliateFilter}
                          onChange={(e) => setAffiliateFilter(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        >
                          <option value="">All Events</option>
                          <option value="my_affiliate">My Affiliate</option>
                          <option value="national">National Events</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Event Type
                        </label>
                        <select
                          value={eventTypeFilter}
                          onChange={(e) => setEventTypeFilter(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        >
                          <option value="">All Types</option>
                          <option value="Meeting">Meeting</option>
                          <option value="Training">Training</option>
                          <option value="Workshop">Workshop</option>
                          <option value="Seminar">Seminar</option>
                          <option value="Networking">Networking</option>
                          <option value="Social">Social</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Location Type
                        </label>
                        <select
                          value={locationTypeFilter}
                          onChange={(e) => setLocationTypeFilter(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        >
                          <option value="">All Locations</option>
                          <option value="virtual">Virtual</option>
                          <option value="in_person">In-Person</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            From
                          </label>
                          <input
                            type="date"
                            value={startDateFilter}
                            onChange={(e) => setStartDateFilter(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            To
                          </label>
                          <input
                            type="date"
                            value={endDateFilter}
                            onChange={(e) => setEndDateFilter(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setAffiliateFilter("");
                          setEventTypeFilter("");
                          setLocationTypeFilter("");
                          setStartDateFilter("");
                          setEndDateFilter("");
                          toast.success("Filters cleared");
                        }}
                        className="w-full px-4 py-3 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Events Display */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {viewType === "grid" ? (
              // Grid View
              <div className="p-4 lg:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                  {loading ? (
                    // Loading Skeleton for Grid
                    Array.from({ length: 6 }).map((_, index) => (
                      <div key={index} className="bg-gray-100 rounded-2xl p-6 animate-pulse">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-12 h-12 bg-gray-300 rounded-xl"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-300 rounded"></div>
                          <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    // Actual Grid Content
                    <DataTable
                      columns={columns}
                      queryFn={fetchEvents}
                      queryKey={["member-events", debouncedSearch, affiliateFilter, eventTypeFilter, locationTypeFilter, startDateFilter, endDateFilter]}
                      pagination={true}
                      perPageOptions={[9, 18, 36, "All"]}
                      renderGrid={EventCard}
                    />
                  )}
                </div>
              </div>
            ) : (
              // List View
              <div className="p-4 lg:p-6">
                <DataTable
                  columns={columns}
                  queryFn={fetchEvents}
                  queryKey={["member-events", debouncedSearch, affiliateFilter, eventTypeFilter, locationTypeFilter, startDateFilter, endDateFilter]}
                  pagination={true}
                  perPageOptions={[10, 25, 50, "All"]}
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* Event Details Modal */}
      <Modal
        isOpen={viewMode === "details"}
        onClose={handleBackToList}
        title=""
        className="max-w-4xl"
        hideHeader={true}
      >
        {selectedEvent && (
          <EventDetails 
            event={selectedEvent} 
            onBack={handleBackToList}
            onRegister={() => handleRegister(selectedEvent.id)}
            onCancelRegistration={() => handleCancelRegistration(selectedEvent.id)}
            actionLoading={actionLoading === selectedEvent.id}
          />
        )}
      </Modal>
    </div>
  );
}

// Modern Event Details Component
function EventDetails({ 
  event, 
  onBack, 
  onRegister, 
  onCancelRegistration, 
  actionLoading 
}: { 
  event: Event; 
  onBack: () => void;
  onRegister: () => void;
  onCancelRegistration: () => void;
  actionLoading: boolean;
}) {
  const isRegistrationOpen = !event.registration_deadline || new Date(event.registration_deadline) > new Date();
  const isEventInFuture = new Date(event.start_date) > new Date();

  return (
    <div className="bg-white rounded-2xl">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 p-6 border-b border-gray-200">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
        >
          <ChevronDown className="w-5 h-5 rotate-90" />
          <span className="font-medium">Back to Events</span>
        </button>
      </div>

      <div className="p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Header */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                {event.is_national_event ? (
                  <Badge variant="primary" className="text-sm">
                    <Building2 className="w-4 h-4 mr-1" />
                    National Event
                  </Badge>
                ) : event.affiliate_name ? (
                  <Badge variant="success" className="text-sm">
                    <Users className="w-4 h-4 mr-1" />
                    {event.affiliate_name}
                  </Badge>
                ) : null}
                <Badge variant="gray" className="text-sm">
                  {event.event_type}
                </Badge>
                {event.is_virtual && (
                  <Badge variant="purple" className="text-sm">
                    <Video className="w-4 h-4 mr-1" />
                    Virtual
                  </Badge>
                )}
              </div>
              
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
                {event.title}
              </h1>

              {/* Date and Time */}
              <div className="flex flex-wrap items-center gap-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  <span className="font-medium">{new Date(event.start_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {event.end_date && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">to</span>
                    <span>{new Date(event.end_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                {event.is_virtual ? (
                  <>
                    <Video className="w-6 h-6 text-purple-600" />
                    <div>
                      <div className="font-medium text-gray-900">Virtual Event</div>
                      <div className="text-gray-600 text-sm">Join online from anywhere</div>
                    </div>
                  </>
                ) : (
                  <>
                    <MapPin className="w-6 h-6 text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-900">{event.venue_name || 'Location TBA'}</div>
                      <div className="text-gray-600 text-sm">
                        {[event.address, event.city, event.state, event.country].filter(Boolean).join(', ') || 'Address to be announced'}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">About this Event</h3>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {event.description}
                  </p>
                </div>
              </div>
            )}

            {/* Registration Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Registration Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {event.registration_deadline && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="text-sm font-medium text-blue-900">Registration Deadline</div>
                    <div className="text-blue-700 font-semibold">
                      {new Date(event.registration_deadline).toLocaleString()}
                    </div>
                    {!isRegistrationOpen && (
                      <div className="text-red-600 text-sm font-medium mt-1">Registration closed</div>
                    )}
                  </div>
                )}
                
                {event.registration_limit && (
                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="text-sm font-medium text-green-900">Capacity</div>
                    <div className="text-green-700 font-semibold">
                      {event.attendance_count} / {event.registration_limit} registered
                    </div>
                    {event.attendance_count >= event.registration_limit && event.is_waitlist_enabled && (
                      <div className="text-orange-600 text-sm font-medium mt-1">Waitlist available</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Registration Actions */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Registration</h3>
              
              {event.my_attendance_status ? (
                <div className="text-center">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                    event.my_attendance_status === 'Attended' ? 'bg-green-100 text-green-800' :
                    event.my_attendance_status === 'Registered' ? 'bg-blue-100 text-blue-800' :
                    event.my_attendance_status === 'Waitlisted' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    <UserCheck className="w-4 h-4" />
                    {event.my_attendance_status}
                  </div>
                  
                  {event.my_registered_at && (
                    <div className="mt-3 text-sm text-gray-600">
                      <div>Registered: {new Date(event.my_registered_at).toLocaleDateString()}</div>
                      {event.my_attended_at && (
                        <div className="mt-1">Attended: {new Date(event.my_attended_at).toLocaleDateString()}</div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  You are not registered for this event
                </div>
              )}
            </div>

            {/* Action Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Actions</h3>
              
              <div className="space-y-3">
                {!event.my_attendance_status || event.my_attendance_status === 'Cancelled' ? (
                  <button
                    onClick={onRegister}
                    disabled={!isRegistrationOpen || actionLoading || !isEventInFuture}
                    className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none"
                  >
                    {actionLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <ClockIcon className="w-5 h-5 animate-spin" />
                        Processing...
                      </div>
                    ) : !isRegistrationOpen ? (
                      "Registration Closed"
                    ) : !isEventInFuture ? (
                      "Event Completed"
                    ) : (
                      "Register for Event"
                    )}
                  </button>
                ) : event.my_attendance_status === 'Registered' || event.my_attendance_status === 'Waitlisted' ? (
                  <button
                    onClick={onCancelRegistration}
                    disabled={actionLoading || !isEventInFuture}
                    className="w-full px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none"
                  >
                    {actionLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <ClockIcon className="w-5 h-5 animate-spin" />
                        Processing...
                      </div>
                    ) : !isEventInFuture ? (
                      "Event Completed"
                    ) : (
                      "Cancel Registration"
                    )}
                  </button>
                ) : event.my_attendance_status === 'Attended' ? (
                  <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-green-800 font-semibold">You attended this event</div>
                  </div>
                ) : null}

                {event.registration_url && (
                  <a
                    href={event.registration_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full px-6 py-3 text-center text-blue-600 bg-blue-50 border border-blue-200 rounded-xl font-medium hover:bg-blue-100 transition-colors duration-200"
                  >
                    Visit Registration Page
                  </a>
                )}
              </div>
            </div>

            {/* Quick Info */}
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Quick Info</h3>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex justify-between">
                  <span>Event Type:</span>
                  <span className="font-medium">{event.event_type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Registered:</span>
                  <span className="font-medium">{event.attendance_count}</span>
                </div>
                {event.registration_limit && (
                  <div className="flex justify-between">
                    <span>Capacity:</span>
                    <span className="font-medium">{event.registration_limit}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}