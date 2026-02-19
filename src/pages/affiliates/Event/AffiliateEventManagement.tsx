import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useDebounce } from "use-debounce";
import { Plus, Filter, Eye, Pencil, Trash2, Calendar, Users, Download, MapPin, Clock, Building2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import toast from 'react-hot-toast';
import Papa from 'papaparse';
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
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
  attendance_summary?: {
    total_registrations: number;
    attended_count: number;
    registered_count: number;
    cancelled_count: number;
  };
}

interface EventFormData {
  title: string;
  description: string;
  event_type: string;
  status: string;
  start_date: string;
  end_date: string;
  time_zone: string;
  venue_name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  is_virtual: boolean;
  registration_url: string;
  registration_limit: number;
  registration_deadline: string;
  attendance_mode: string;
  is_waitlist_enabled: boolean;
}

interface AffiliateInfo {
  id: number;
  name: string;
}

export default function AffiliateEventManagement() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [myEventsOnlyFilter, setMyEventsOnlyFilter] = useState(true);
  
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "details" | "create" | "edit" | "attendance">("list");
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [affiliateInfo, setAffiliateInfo] = useState<AffiliateInfo | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const columns: Column<Event>[] = [
    { 
      key: "title", 
      header: "Event Title", 
      accessor: (event) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-500" />
          <div>
            <div className="font-medium">{event.title}</div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              {event.is_national_event ? (
                <>
                  <Building2 className="w-3 h-3" />
                  <span>National Event</span>
                </>
              ) : (
                <span>My Event</span>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      key: "event_type",
      header: "Type",
      accessor: (event) => (
        <Badge variant="primary">{event.event_type}</Badge>
      ),
    },
    {
      key: "date",
      header: "Date & Time",
      accessor: (event) => (
        <div className="text-sm">
          <div className="font-medium">
            {new Date(event.start_date).toLocaleDateString()}
          </div>
          <div className="text-gray-500">
            {new Date(event.start_date).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      ),
    },
    {
      key: "venue",
      header: "Location",
      accessor: (event) => (
        <div className="text-sm">
          {event.is_virtual ? (
            <div className="flex items-center gap-1 text-purple-600">
              <span>Virtual</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{event.city || event.venue_name || 'TBA'}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "attendance",
      header: "Attendance",
      accessor: (event) => (
        <div className="text-sm">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{event.attendance_count} registered</span>
          </div>
          {event.attendance_summary && event.attendance_summary.attended_count > 0 && (
            <div className="text-xs text-green-600">
              {event.attendance_summary.attended_count} attended
            </div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      accessor: (event) => (
        <Badge 
          variant={
            event.status === 'Published' ? 'success' :
            event.status === 'Draft' ? 'gray' :
            event.status === 'Cancelled' ? 'error' : 'warning'
          }
        >
          {event.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      accessor: (event) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedEvent(event);
              setViewMode("details");
            }}
            className="p-1 text-blue-600 rounded-lg hover:text-blue-800 hover:bg-gray-100"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          
          {!event.is_national_event && (
            <>
              <button
                onClick={() => handleViewAttendance(event.id)}
                className="p-1 text-green-600 rounded-lg hover:text-green-800 hover:bg-gray-100"
                title="View Attendance"
              >
                <Users size={16} />
              </button>
              <button
                onClick={() => {
                  setEditingEvent(event);
                  setViewMode("edit");
                }}
                className="p-1 text-orange-600 rounded-lg hover:text-orange-800 hover:bg-gray-100"
                title="Edit Event"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => handleDeleteEvent(event.id)}
                className="p-1 text-red-600 rounded-lg hover:text-red-800 hover:bg-gray-100"
                title="Delete Event"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

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
      if (eventTypeFilter) params.append("event_type", eventTypeFilter);
      if (statusFilter) params.append("status", statusFilter);
      if (startDateFilter) params.append("start_date", startDateFilter);
      if (endDateFilter) params.append("end_date", endDateFilter);
      if (myEventsOnlyFilter) params.append("my_events_only", "true");

      const response = await fetch(`${apiUrl}/api/affiliate/events?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch events");

      const result = await response.json();

      if (result.success) {
        setAffiliateInfo(result.affiliate);
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

  const fetchEventTypes = async (): Promise<string[]> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const token = session.access_token;
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/affiliate/events/types/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch event types");

      const result = await response.json();
      return result.success ? result.data : [];
    } catch (err) {
      console.error('Error fetching event types:', err);
      return [];
    }
  };

  const handleViewAttendance = async (eventId: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const token = session.access_token;
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/affiliate/events/${eventId}/attendance-report`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch attendance report");

      const result = await response.json();

      if (result.success) {
        setAttendanceData(result.data);
        setViewMode("attendance");
      } else {
        throw new Error(result.message || "Failed to fetch attendance report");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load attendance report");
    }
  };

  const handleCreateEvent = async (formData: EventFormData) => {
    setFormLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const token = session.access_token;
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/affiliate/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create event");
      }

      toast.success("Event created successfully!");
      handleBackToList();
      refreshTable();
    } catch (err: any) {
      toast.error(err.message || "Failed to create event");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateEvent = async (formData: EventFormData) => {
    if (!editingEvent) return;

    setFormLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const token = session.access_token;
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      
      const response = await fetch(`${apiUrl}/api/affiliate/events/${editingEvent.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update event");
      }

      toast.success("Event updated successfully!");
      handleBackToList();
      refreshTable();
    } catch (err: any) {
      toast.error(err.message || "Failed to update event");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const token = session.access_token;
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/affiliate/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Failed to delete event");
      }

      toast.success("Event deleted successfully!");
      refreshTable();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete event");
    }
  };

  const refreshTable = () => {
    queryClient.invalidateQueries({
      queryKey: ["affiliate-events", debouncedSearch, eventTypeFilter, statusFilter, startDateFilter, endDateFilter, myEventsOnlyFilter],
    });
  };

  const handleCreate = () => setViewMode("create");
  const handleBackToList = () => {
    setViewMode("list");
    setSelectedEvent(null);
    setEditingEvent(null);
    setAttendanceData(null);
  };

  const exportAttendanceToCSV = async () => {
    if (!attendanceData) return;

    setExportLoading(true);
    try {
      const csvData = attendanceData.attendances.map((att: any) => ({
        'First Name': att.first_name,
        'Last Name': att.last_name,
        'Email': att.email,
        'Affiliate': att.affiliate_name || '',
        'Attendance Status': att.attendance_status,
        'Ticket Type': att.ticket_type || '',
        'Registered At': att.registered_at ? new Date(att.registered_at).toLocaleString() : '',
        'Attended At': att.attended_at ? new Date(att.attended_at).toLocaleString() : '',
        'Check In Time': att.check_in_time ? new Date(att.check_in_time).toLocaleString() : '',
        'Check Out Time': att.check_out_time ? new Date(att.check_out_time).toLocaleString() : '',
      }));

      const csv = Papa.unparse(csvData);
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const downloadLink = document.createElement('a');
      const url = URL.createObjectURL(blob);
      downloadLink.setAttribute('href', url);
      downloadLink.setAttribute('download', `attendance-${attendanceData.event.title}-${new Date().toISOString().split('T')[0]}.csv`);
      downloadLink.style.visibility = 'hidden';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast.success(`Exported ${csvData.length} attendance records successfully`);
    } catch (err: any) {
      toast.error(err.message || "Failed to export attendance data");
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="p-6">
      {viewMode === "list" && (
        <>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Event Management</h1>
              <p className="mt-1 text-gray-600">
                {affiliateInfo ? `Managing events for ${affiliateInfo.name}` : 'Loading affiliate information...'}
              </p>
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 mb-6 text-red-700 border border-red-200 rounded-lg bg-red-50">
              {error}
            </div>
          )}

          {/* Card with Search, Filters & Table */}
          <div className="p-6 bg-white border border-gray-200 rounded-lg">
            {/* Top Row: Search + Filters + Add button */}
            <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <SearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Search events by title, description, venue..."
                  className="w-full"
                />
              </div>

              <div className="flex items-center gap-3">
                {/* Filters */}
                <div className="relative">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                  >
                    <Filter size={18} />
                    Filters
                  </button>
                  {showFilters && (
                    <div className="absolute right-0 z-10 w-64 p-4 mt-2 bg-white border rounded-lg shadow-lg">
                      <div className="space-y-3">
                        <SelectField
                          label="Event Type"
                          name="event_type"
                          value={eventTypeFilter}
                          onChange={(e) => setEventTypeFilter(e.target.value)}
                          options={[
                            { label: "All Types", value: "" },
                            // Will be populated dynamically
                          ]}
                        />

                        <SelectField
                          label="Status"
                          name="status"
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          options={[
                            { label: "All Statuses", value: "" },
                            { label: "Published", value: "Published" },
                            { label: "Draft", value: "Draft" },
                            { label: "Cancelled", value: "Cancelled" },
                            { label: "Completed", value: "Completed" },
                          ]}
                        />

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date Range
                          </label>
                          <div className="space-y-2">
                            <input
                              type="date"
                              value={startDateFilter}
                              onChange={(e) => setStartDateFilter(e.target.value)}
                              className="w-full p-2 text-sm border border-gray-300 rounded-md"
                            />
                            <input
                              type="date"
                              value={endDateFilter}
                              onChange={(e) => setEndDateFilter(e.target.value)}
                              className="w-full p-2 text-sm border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={myEventsOnlyFilter}
                              onChange={(e) => setMyEventsOnlyFilter(e.target.checked)}
                              className="text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">My Events Only</span>
                          </label>
                        </div>

                        <button
                          onClick={() => {
                            setSearchTerm("");
                            setEventTypeFilter("");
                            setStatusFilter("");
                            setStartDateFilter("");
                            setEndDateFilter("");
                            setMyEventsOnlyFilter(true);
                            toast("Filters cleared", { icon: "🧹" });
                          }}
                          className="w-full px-3 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleCreate}
                  className="flex items-center gap-2 px-4 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  <Plus size={20} />
                  Add Event
                </button>
              </div>
            </div>

            {/* DataTable */}
            <DataTable
              columns={columns}
              queryFn={fetchEvents}
              queryKey={["affiliate-events", debouncedSearch, eventTypeFilter, statusFilter, startDateFilter, endDateFilter, myEventsOnlyFilter]}
              pagination={true}
              perPageOptions={[10, 25, 50, 100, "All"]}
            />
          </div>
        </>
      )}

      {/* Event Details Modal */}
      <Modal
        isOpen={viewMode === "details"}
        onClose={handleBackToList}
        title="Event Details"
        className="max-w-4xl"
      >
        {selectedEvent && (
          <EventDetails event={selectedEvent} onBack={handleBackToList} />
        )}
      </Modal>

      {/* Attendance Report Modal */}
      <Modal
        isOpen={viewMode === "attendance"}
        onClose={handleBackToList}
        title="Attendance Report"
        className="max-w-6xl"
      >
        {attendanceData && (
          <AttendanceReport 
            data={attendanceData} 
            onBack={handleBackToList}
            onExport={exportAttendanceToCSV}
            exportLoading={exportLoading}
          />
        )}
      </Modal>

      {/* Create Event Modal */}
      <Modal
        isOpen={viewMode === "create"}
        onClose={handleBackToList}
        title="Create New Event"
        className="max-w-4xl"
      >
        <EventForm 
          onCancel={handleBackToList} 
          onSubmit={handleCreateEvent}
          loading={formLoading}
          mode="create"
        />
      </Modal>

      {/* Edit Event Modal */}
      <Modal
        isOpen={viewMode === "edit"}
        onClose={handleBackToList}
        title="Edit Event"
        className="max-w-4xl"
      >
        {editingEvent && (
          <EventForm 
            event={editingEvent}
            onCancel={handleBackToList} 
            onSubmit={handleUpdateEvent}
            loading={formLoading}
            mode="edit"
          />
        )}
      </Modal>
    </div>
  );
}

// Event Details Component
function EventDetails({ event, onBack }: { event: Event; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
          <dl className="mt-4 space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Title</dt>
              <dd className="mt-1 text-sm text-gray-900">{event.title}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900">{event.description || "No description"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Event Type</dt>
              <dd className="mt-1">
                <Badge variant="primary">{event.event_type}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <Badge 
                  variant={
                    event.status === 'Published' ? 'success' :
                    event.status === 'Draft' ? 'gray' :
                    event.status === 'Cancelled' ? 'error' : 'warning'
                  }
                >
                  {event.status}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Event Scope</dt>
              <dd className="mt-1">
                <Badge variant={event.is_national_event ? "primary" : "success"}>
                  {event.is_national_event ? "National Event" : "My Event"}
                </Badge>
              </dd>
            </div>
          </dl>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900">Date & Location</h3>
          <dl className="mt-4 space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Start Date & Time</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(event.start_date).toLocaleString()}
              </dd>
            </div>
            {event.end_date && (
              <div>
                <dt className="text-sm font-medium text-gray-500">End Date & Time</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(event.end_date).toLocaleString()}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">Location Type</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {event.is_virtual ? 'Virtual Event' : 'In-Person Event'}
              </dd>
            </div>
            {!event.is_virtual && (
              <>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Venue</dt>
                  <dd className="mt-1 text-sm text-gray-900">{event.venue_name || 'TBA'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {[event.address, event.city, event.state, event.country].filter(Boolean).join(', ') || 'TBA'}
                  </dd>
                </div>
              </>
            )}
          </dl>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Registration</h3>
          <dl className="mt-4 space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Registration URL</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {event.registration_url ? (
                  <a href={event.registration_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                    {event.registration_url}
                  </a>
                ) : 'Not provided'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Registration Limit</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {event.registration_limit || 'No limit'}
              </dd>
            </div>
            {event.registration_deadline && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Registration Deadline</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(event.registration_deadline).toLocaleString()}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900">Attendance</h3>
          <dl className="mt-4 space-y-3">
            {event.attendance_summary && (
              <>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Registrations</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {event.attendance_summary.total_registrations}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Attended</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {event.attendance_summary.attended_count}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Registered</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {event.attendance_summary.registered_count}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Cancelled</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {event.attendance_summary.cancelled_count}
                  </dd>
                </div>
              </>
            )}
          </dl>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// Attendance Report Component (same as national version)
function AttendanceReport({ data, onBack, onExport, exportLoading }: { 
  data: any; 
  onBack: () => void;
  onExport: () => void;
  exportLoading: boolean;
}) {
  const { event, attendances, summary } = data;

  return (
    <div className="space-y-6">
      {/* Event Summary */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900">{event.title}</h3>
        <div className="grid grid-cols-2 gap-4 mt-3 md:grid-cols-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{summary.total_registrations}</div>
            <div className="text-sm text-gray-600">Total Registered</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{summary.attended}</div>
            <div className="text-sm text-gray-600">Attended</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.registered}</div>
            <div className="text-sm text-gray-600">Registered</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{summary.cancelled}</div>
            <div className="text-sm text-gray-600">Cancelled</div>
          </div>
        </div>
        {summary.attendance_rate && (
          <div className="mt-3 text-center">
            <div className="text-lg font-semibold text-gray-900">
              Attendance Rate: {summary.attendance_rate}%
            </div>
          </div>
        )}
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={onExport}
          disabled={exportLoading}
          className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-green-400"
        >
          <Download size={16} />
          {exportLoading ? "Exporting..." : "Export to CSV"}
        </button>
      </div>

      {/* Attendance List */}
      <div className="border border-gray-200 rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Affiliate
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Registered At
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Attended At
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendances.map((attendance: any) => (
                <tr key={attendance.id}>
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                    {attendance.first_name} {attendance.last_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                    {attendance.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                    {attendance.affiliate_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant={
                        attendance.attendance_status === 'Attended' ? 'success' :
                        attendance.attendance_status === 'Registered' ? 'primary' : 'error'
                      }
                    >
                      {attendance.attendance_status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                    {attendance.registered_at ? new Date(attendance.registered_at).toLocaleString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                    {attendance.attended_at ? new Date(attendance.attended_at).toLocaleString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// Event Form Component (similar to national version but simplified)
function EventForm({ 
  event, 
  onCancel, 
  onSubmit, 
  loading, 
  mode 
}: { 
  event?: Event;
  onCancel: () => void;
  onSubmit: (data: EventFormData) => void;
  loading: boolean;
  mode: "create" | "edit";
}) {
  const [formData, setFormData] = useState<EventFormData>({
    title: event?.title || "",
    description: event?.description || "",
    event_type: event?.event_type || "",
    status: event?.status || "Draft",
    start_date: event?.start_date ? new Date(event.start_date).toISOString().slice(0, 16) : "",
    end_date: event?.end_date ? new Date(event.end_date).toISOString().slice(0, 16) : "",
    time_zone: event?.time_zone || "America/New_York",
    venue_name: event?.venue_name || "",
    address: event?.address || "",
    city: event?.city || "",
    state: event?.state || "",
    country: event?.country || "US",
    is_virtual: event?.is_virtual || false,
    registration_url: event?.registration_url || "",
    registration_limit: event?.registration_limit || 0,
    registration_deadline: event?.registration_deadline ? new Date(event.registration_deadline).toISOString().slice(0, 16) : "",
    attendance_mode: event?.attendance_mode || "in_person",
    is_waitlist_enabled: event?.is_waitlist_enabled || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof EventFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
          
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Event Title *
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="block w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter event title"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="block w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Event description"
            />
          </div>

          <div>
            <label htmlFor="event_type" className="block text-sm font-medium text-gray-700">
              Event Type *
            </label>
            <select
              id="event_type"
              required
              value={formData.event_type}
              onChange={(e) => handleChange('event_type', e.target.value)}
              className="block w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Event Type</option>
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
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status *
            </label>
            <select
              id="status"
              required
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="block w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Date & Time */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Date & Time</h3>
          
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
              Start Date & Time *
            </label>
            <input
              type="datetime-local"
              id="start_date"
              required
              value={formData.start_date}
              onChange={(e) => handleChange('start_date', e.target.value)}
              className="block w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
              End Date & Time
            </label>
            <input
              type="datetime-local"
              id="end_date"
              value={formData.end_date}
              onChange={(e) => handleChange('end_date', e.target.value)}
              className="block w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="time_zone" className="block text-sm font-medium text-gray-700">
              Time Zone
            </label>
            <select
              id="time_zone"
              value={formData.time_zone}
              onChange={(e) => handleChange('time_zone', e.target.value)}
              className="block w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Location Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Location</h3>
        
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_virtual}
              onChange={(e) => handleChange('is_virtual', e.target.checked)}
              className="text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Virtual Event</span>
          </label>
        </div>

        {!formData.is_virtual && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="venue_name" className="block text-sm font-medium text-gray-700">
                Venue Name
              </label>
              <input
                type="text"
                id="venue_name"
                value={formData.venue_name}
                onChange={(e) => handleChange('venue_name', e.target.value)}
                className="block w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Venue name"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="block w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Street address"
              />
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                City
              </label>
              <input
                type="text"
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="block w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="City"
              />
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                State
              </label>
              <input
                type="text"
                id="state"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                className="block w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="State"
              />
            </div>
          </div>
        )}
      </div>

      {/* Registration Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Registration</h3>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="registration_url" className="block text-sm font-medium text-gray-700">
              Registration URL
            </label>
            <input
              type="url"
              id="registration_url"
              value={formData.registration_url}
              onChange={(e) => handleChange('registration_url', e.target.value)}
              className="block w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com/register"
            />
          </div>

          <div>
            <label htmlFor="registration_limit" className="block text-sm font-medium text-gray-700">
              Registration Limit
            </label>
            <input
              type="number"
              id="registration_limit"
              min="0"
              value={formData.registration_limit}
              onChange={(e) => handleChange('registration_limit', parseInt(e.target.value) || 0)}
              className="block w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="0 for no limit"
            />
          </div>

          <div>
            <label htmlFor="registration_deadline" className="block text-sm font-medium text-gray-700">
              Registration Deadline
            </label>
            <input
              type="datetime-local"
              id="registration_deadline"
              value={formData.registration_deadline}
              onChange={(e) => handleChange('registration_deadline', e.target.value)}
              className="block w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="attendance_mode" className="block text-sm font-medium text-gray-700">
              Attendance Mode
            </label>
            <select
              id="attendance_mode"
              value={formData.attendance_mode}
              onChange={(e) => handleChange('attendance_mode', e.target.value)}
              className="block w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="in_person">In Person</option>
              <option value="virtual">Virtual</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_waitlist_enabled}
              onChange={(e) => handleChange('is_waitlist_enabled', e.target.checked)}
              className="text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Enable Waitlist</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
          disabled={loading}
        >
          {loading ? "Saving..." : mode === "create" ? "Create Event" : "Update Event"}
        </button>
      </div>
    </form>
  );
}