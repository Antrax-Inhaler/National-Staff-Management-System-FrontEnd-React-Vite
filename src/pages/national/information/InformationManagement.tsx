import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useDebounce } from "use-debounce";
import { Plus, Search, Filter, Eye, Edit, Trash2, FileText, Megaphone, Shield, BarChart, Calendar } from "lucide-react";
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

interface NationalInformation {
  id: number;
  type: 'announcement' | 'policy' | 'report' | 'update';
  title: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  published_at: string;
  created_at: string;
  updated_at: string;
}

interface InformationFormData {
  type: string;
  title: string;
  content: string;
  status: string;
}

// Skeleton Loaders
function TableSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 bg-white rounded">
          <div className="flex items-center flex-1 gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded"></div>
            <div className="flex-1 space-y-2">
              <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
              <div className="w-1/2 h-3 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-16 h-6 bg-gray-200 rounded"></div>
            <div className="w-16 h-6 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="p-4 bg-white rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="w-1/4 h-4 bg-gray-200 rounded"></div>
            <div className="w-16 h-6 bg-gray-200 rounded"></div>
          </div>
          <div className="w-3/4 h-5 mb-2 bg-gray-200 rounded"></div>
          <div className="w-full h-3 mb-1 bg-gray-200 rounded"></div>
          <div className="w-2/3 h-3 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  );
}

export default function NationalInformationManager() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedInfo, setSelectedInfo] = useState<NationalInformation | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "details" | "create" | "edit">("list");
  const [editingInfo, setEditingInfo] = useState<NationalInformation | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement': return <Megaphone className="w-4 h-4" />;
      case 'policy': return <Shield className="w-4 h-4" />;
      case 'report': return <BarChart className="w-4 h-4" />;
      case 'update': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'announcement': return 'blue';
      case 'policy': return 'green';
      case 'report': return 'purple';
      case 'update': return 'orange';
      default: return 'gray';
    }
  };

  const columns: Column<NationalInformation>[] = [
    { 
      key: "type", 
      header: "Type", 
      accessor: (info) => (
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg bg-${getTypeColor(info.type)}-50`}>
            {getTypeIcon(info.type)}
          </div>
          <span className="font-medium capitalize">{info.type}</span>
        </div>
      )
    },
    { 
      key: "title", 
      header: "Title", 
      accessor: (info) => (
        <div>
          <div className="font-medium text-gray-900">{info.title}</div>
          <div className="mt-1 text-sm text-gray-600 line-clamp-2">{info.content}</div>
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      accessor: (info) => (
        <Badge variant={
          info.status === 'published' ? 'success' : 
          info.status === 'draft' ? 'warning' : 'gray'
        }>
          {info.status.charAt(0).toUpperCase() + info.status.slice(1)}
        </Badge>
      ),
    },
    {
      key: "published_at",
      header: "Published",
      accessor: (info) => (
        <div className="text-sm text-gray-600">
          {new Date(info.published_at).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      accessor: (info) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedInfo(info);
              setViewMode("details");
            }}
            className="p-1 text-blue-600 rounded hover:text-blue-800 hover:bg-blue-50"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => {
              setEditingInfo(info);
              setViewMode("edit");
            }}
            className="p-1 text-green-600 rounded hover:text-green-800 hover:bg-green-50"
            title="Edit"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleDeleteInfo(info.id)}
            className="p-1 text-red-600 rounded hover:text-red-800 hover:bg-red-50"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const fetchInformation = async (
    page: number,
    perPage: number | "All"
  ): Promise<Paginated<NationalInformation>> => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const token = session.access_token;
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage === "All" ? "1000" : perPage.toString(),
      });

      if (debouncedSearch) params.append("search", debouncedSearch);
      if (typeFilter) params.append("type", typeFilter);
      if (statusFilter) params.append("status", statusFilter);

      const response = await fetch(`${apiUrl}/api/national-information?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch information");

      const result = await response.json();

      if (result.success) {
        return {
          items: result.data,
          current_page: result.meta?.current_page || 1,
          last_page: result.meta?.last_page || 1,
          per_page: result.meta?.per_page || (typeof perPage === "number" ? perPage : 20),
          total: result.meta?.total || result.data.length,
        };
      } else {
        throw new Error(result.message || "Failed to fetch information");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load information");
      toast.error(err.message || "Failed to load information");
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

  const handleCreateInfo = async (formData: InformationFormData) => {
    setFormLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const token = session.access_token;
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/national-information`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create information");
      }

      toast.success("Information created successfully!");
      handleBackToList();
      refreshTable();
    } catch (err: any) {
      toast.error(err.message || "Failed to create information");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateInfo = async (formData: InformationFormData) => {
    if (!editingInfo) return;

    setFormLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const token = session.access_token;
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/national-information/${editingInfo.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update information");
      }

      toast.success("Information updated successfully!");
      handleBackToList();
      refreshTable();
    } catch (err: any) {
      toast.error(err.message || "Failed to update information");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteInfo = async (id: number) => {
    if (!confirm("Are you sure you want to delete this information? This action cannot be undone.")) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const token = session.access_token;
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/national-information/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Failed to delete information");
      }

      toast.success("Information deleted successfully!");
      refreshTable();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete information");
    }
  };

  const refreshTable = () => {
    queryClient.invalidateQueries({
      queryKey: ["national-information", debouncedSearch, typeFilter, statusFilter],
    });
  };

  const handleCreate = () => setViewMode("create");
  const handleBackToList = () => {
    setViewMode("list");
    setSelectedInfo(null);
    setEditingInfo(null);
  };

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-3 mb-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">National Information</h1>
            <p className="mt-1 text-sm text-gray-600">Manage announcements, policies, reports, and updates</p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Information
          </button>
        </div>

        {error && (
          <div className="px-4 py-3 mb-4 text-red-700 border border-red-200 rounded-lg bg-red-50">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="p-4 mb-4 bg-white rounded-lg">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                <SearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Search information..."
                  className="w-full pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SelectField
                label=""
                name="type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                options={[
                  { label: "All Types", value: "" },
                  { label: "Announcements", value: "announcement" },
                  { label: "Policies", value: "policy" },
                  { label: "Reports", value: "report" },
                  { label: "Updates", value: "update" },
                ]}
                className="min-w-32"
              />
              <SelectField
                label=""
                name="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { label: "All Status", value: "" },
                  { label: "Published", value: "published" },
                  { label: "Draft", value: "draft" },
                  { label: "Archived", value: "archived" },
                ]}
                className="min-w-32"
              />
              <button
                onClick={() => {
                  setSearchTerm("");
                  setTypeFilter("");
                  setStatusFilter("");
                  toast("Filters cleared", { icon: "🧹" });
                }}
                className="px-3 py-2 text-sm text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg">
          {loading ? (
            <div className="p-4">
              <TableSkeleton />
            </div>
          ) : (
            <DataTable
              columns={columns}
              queryFn={fetchInformation}
              queryKey={["national-information", debouncedSearch, typeFilter, statusFilter]}
              pagination={true}
              perPageOptions={[10, 25, 50, 100]}
            />
          )}
        </div>
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={viewMode === "details"}
        onClose={handleBackToList}
        title="Information Details"
        className="max-w-4xl"
      >
        {selectedInfo && (
          <InformationDetails info={selectedInfo} onBack={handleBackToList} />
        )}
      </Modal>

      {/* Create Modal */}
      <Modal
        isOpen={viewMode === "create"}
        onClose={handleBackToList}
        title="Add New Information"
        className="max-w-2xl"
      >
        <InformationForm 
          onCancel={handleBackToList} 
          onSubmit={handleCreateInfo}
          loading={formLoading}
          mode="create"
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={viewMode === "edit"}
        onClose={handleBackToList}
        title="Edit Information"
        className="max-w-2xl"
      >
        {editingInfo && (
          <InformationForm 
            info={editingInfo}
            onCancel={handleBackToList} 
            onSubmit={handleUpdateInfo}
            loading={formLoading}
            mode="edit"
          />
        )}
      </Modal>
    </div>
  );
}

// Information Details Component
function InformationDetails({ info, onBack }: { info: NationalInformation; onBack: () => void }) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'announcement': return 'primary';
      case 'policy': return 'success';
      case 'report': return 'danger';
      case 'update': return 'warning';
      default: return 'gray';
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="flex items-center justify-between">
          <Badge variant={getTypeColor(info.type)} className="capitalize">
            {info.type}
          </Badge>
          <Badge variant={
            info.status === 'published' ? 'success' : 
            info.status === 'draft' ? 'warning' : 'gray'
          }>
            {info.status}
          </Badge>
        </div>
        
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Title</label>
          <h2 className="text-lg font-semibold text-gray-900">{info.title}</h2>
        </div>
        
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Content</label>
          <div className="prose-sm prose text-gray-900 max-w-none">
            {info.content.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-2">{paragraph}</p>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <label className="font-medium text-gray-700">Published</label>
            <p className="text-gray-600">{new Date(info.published_at).toLocaleDateString()}</p>
          </div>
          <div>
            <label className="font-medium text-gray-700">Last Updated</label>
            <p className="text-gray-600">{new Date(info.updated_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// Information Form Component
function InformationForm({ 
  info, 
  onCancel, 
  onSubmit, 
  loading, 
  mode 
}: { 
  info?: NationalInformation;
  onCancel: () => void;
  onSubmit: (data: InformationFormData) => void;
  loading: boolean;
  mode: "create" | "edit";
}) {
  const [formData, setFormData] = useState<InformationFormData>({
    type: info?.type || 'announcement',
    title: info?.title || '',
    content: info?.content || '',
    status: info?.status || 'published',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof InformationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="type" className="block mb-1 text-sm font-medium text-gray-700">
              Type *
            </label>
            <select
              id="type"
              required
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
            >
              <option value="announcement">Announcement</option>
              <option value="policy">Policy</option>
              <option value="report">Report</option>
              <option value="update">Update</option>
            </select>
          </div>

          <div>
            <label htmlFor="status" className="block mb-1 text-sm font-medium text-gray-700">
              Status *
            </label>
            <select
              id="status"
              required
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="title" className="block mb-1 text-sm font-medium text-gray-700">
            Title *
          </label>
          <input
            type="text"
            id="title"
            required
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
            placeholder="Enter information title"
          />
        </div>

        <div>
          <label htmlFor="content" className="block mb-1 text-sm font-medium text-gray-700">
            Content *
          </label>
          <textarea
            id="content"
            required
            rows={6}
            value={formData.content}
            onChange={(e) => handleChange('content', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
            placeholder="Enter information content"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-blue-400"
          disabled={loading}
        >
          {loading ? "Saving..." : mode === "create" ? "Create Information" : "Update Information"}
        </button>
      </div>
    </form>
  );
}