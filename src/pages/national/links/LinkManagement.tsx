// src/pages/national/links/LinkManagement.tsx
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useDebounce } from "use-debounce";
import { Plus, Filter, Eye, Pencil, Trash2, Link as LinkIcon, Download, ExternalLink } from "lucide-react";
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

interface Link {
  id: number;
  title: string;
  url: string;
  description?: string;
  category?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

interface LinkFormData {
  title: string;
  url: string;
  description: string;
  category: string;
  display_order: number;
  is_active: boolean;
}

export default function LinkManagement() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "details" | "create" | "edit">("list");
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const columns: Column<Link>[] = [
    { 
      key: "title", 
      header: "Title", 
      accessor: (link) => (
        <div className="flex items-center gap-2">
          <LinkIcon className="w-4 h-4 text-blue-500" />
          <span className="font-medium">{link.title}</span>
        </div>
      )
    },
    {
      key: "url",
      header: "URL",
      accessor: (link) => (
        <a 
          href={link.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block max-w-xs text-blue-600 truncate hover:text-blue-800"
          title={link.url}
        >
          {link.url.length > 50 ? `${link.url.substring(0, 50)}...` : link.url}
        </a>
      ),
    },
    {
      key: "category",
      header: "Category",
      accessor: (link) => link.category || (
        <span className="italic text-gray-400">Uncategorized</span>
      ),
    },
    {
      key: "display_order",
      header: "Order",
      accessor: (link) => (
        <Badge variant="gray">{link.display_order}</Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      accessor: (link) => (
        <Badge variant={link.is_active ? "success" : "gray"}>
          {link.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      accessor: (link) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedLink(link);
              setViewMode("details");
            }}
            className="p-1 text-blue-600 rounded-lg hover:text-blue-800 hover:bg-gray-100"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => {
              setEditingLink(link);
              setViewMode("edit");
            }}
            className="p-1 text-green-600 rounded-lg hover:text-green-800 hover:bg-gray-100"
            title="Edit Link"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => handleDeleteLink(link.id)}
            className="p-1 text-red-600 rounded-lg hover:text-red-800 hover:bg-gray-100"
            title="Delete Link"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const fetchLinks = async (
    page: number,
    perPage: number | "All"
  ): Promise<Paginated<Link>> => {
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
      if (categoryFilter) params.append("category", categoryFilter);
      if (statusFilter) params.append("is_active", statusFilter);

      const response = await fetch(`${apiUrl}/api/links?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch links");

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
        throw new Error(result.message || "Failed to fetch links");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load links");
      toast.error(err.message || "Failed to load links");
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

  const fetchAllLinksForExport = async (): Promise<Link[]> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const token = session.access_token;
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/links?per_page=10000`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch links for export");

      const result = await response.json();

      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.message || "Failed to fetch links for export");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to export links");
      return [];
    }
  };

  const exportToCSV = async () => {
    setExportLoading(true);
    try {
      const links = await fetchAllLinksForExport();
      
      if (links.length === 0) {
        toast.error("No links to export");
        return;
      }

      const csvData = links.map(link => ({
        'Title': link.title,
        'URL': link.url,
        'Description': link.description || '',
        'Category': link.category || '',
        'Display Order': link.display_order,
        'Status': link.is_active ? 'Active' : 'Inactive',
        'Created Date': new Date(link.created_at).toLocaleDateString(),
      }));

      const csv = Papa.unparse(csvData);
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const downloadLink = document.createElement('a');
      const url = URL.createObjectURL(blob);
      downloadLink.setAttribute('href', url);
      downloadLink.setAttribute('download', `links-export-${new Date().toISOString().split('T')[0]}.csv`);
      downloadLink.style.visibility = 'hidden';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast.success(`Exported ${links.length} links successfully`);
    } catch (err: any) {
      toast.error(err.message || "Failed to export links");
    } finally {
      setExportLoading(false);
    }
  };

  const handleCreateLink = async (formData: LinkFormData) => {
    setFormLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const token = session.access_token;
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/links`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create link");
      }

      toast.success("Link created successfully!");
      handleBackToList();
      refreshTable();
    } catch (err: any) {
      toast.error(err.message || "Failed to create link");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateLink = async (formData: LinkFormData) => {
    if (!editingLink) return;

    setFormLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const token = session.access_token;
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      
      const response = await fetch(`${apiUrl}/api/links/${editingLink.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update link");
      }

      toast.success("Link updated successfully!");
      handleBackToList();
      refreshTable();
    } catch (err: any) {
      toast.error(err.message || "Failed to update link");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteLink = async (linkId: number) => {
    if (!confirm("Are you sure you want to delete this link? This action cannot be undone.")) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const token = session.access_token;
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/links/${linkId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Failed to delete link");
      }

      toast.success("Link deleted successfully!");
      refreshTable();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete link");
    }
  };

  const refreshTable = () => {
    queryClient.invalidateQueries({
      queryKey: ["links", debouncedSearch, categoryFilter, statusFilter],
    });
  };

  const handleCreate = () => setViewMode("create");
  const handleBackToList = () => {
    setViewMode("list");
    setSelectedLink(null);
    setEditingLink(null);
  };

  // Get unique categories for filter
  const getUniqueCategories = (links: Link[]) => {
    const categories = links.map(link => link.category).filter(Boolean) as string[];
    return [...new Set(categories)];
  };

  return (
    <div className="p-6">
      {viewMode === "list" && (
        <>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Link Management</h1>
              <p className="mt-1 text-gray-600">Manage and organize important links for your organization</p>
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
                  placeholder="Search by title, URL, or description..."
                  className="w-full"
                />
              </div>

              <div className="flex items-center gap-3">
                {/* Export Button */}
                <div className="relative">
                  <button
                    disabled={exportLoading}
                    onClick={exportToCSV}
                    className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed"
                  >
                    <Download size={18} />
                    {exportLoading ? "Exporting..." : "Export CSV"}
                  </button>
                </div>

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
                      <SelectField
                        label="Category"
                        name="category"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        options={[
                          { label: "All Categories", value: "" },
                          { label: "Resources", value: "Resources" },
                          { label: "Documents", value: "Documents" },
                          { label: "Tools", value: "Tools" },
                          { label: "External", value: "External" },
                        ]}
                      />

                      <SelectField
                        label="Status"
                        name="status"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        options={[
                          { label: "All Statuses", value: "" },
                          { label: "Active", value: "true" },
                          { label: "Inactive", value: "false" },
                        ]}
                      />

                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setCategoryFilter("");
                          setStatusFilter("");
                          toast("Filters cleared", { icon: "🧹" });
                        }}
                        className="w-full px-3 py-2 mt-3 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                      >
                        Clear Filters
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleCreate}
                  className="flex items-center gap-2 px-4 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  <Plus size={20} />
                  Add Link
                </button>
              </div>
            </div>

            {/* DataTable */}
            <DataTable
              columns={columns}
              queryFn={fetchLinks}
              queryKey={["links", debouncedSearch, categoryFilter, statusFilter]}
              pagination={true}
              perPageOptions={[10, 25, 50, 100, "All"]}
            />
          </div>
        </>
      )}

      {/* Details Modal */}
      <Modal
        isOpen={viewMode === "details"}
        onClose={handleBackToList}
        title="Link Details"
        className="max-w-2xl"
      >
        {selectedLink && (
          <LinkDetails link={selectedLink} onBack={handleBackToList} />
        )}
      </Modal>

      {/* Create Modal */}
      <Modal
        isOpen={viewMode === "create"}
        onClose={handleBackToList}
        title="Add New Link"
        className="max-w-2xl"
      >
        <LinkForm 
          onCancel={handleBackToList} 
          onSubmit={handleCreateLink}
          loading={formLoading}
          mode="create"
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={viewMode === "edit"}
        onClose={handleBackToList}
        title="Edit Link"
        className="max-w-2xl"
      >
        {editingLink && (
          <LinkForm 
            link={editingLink}
            onCancel={handleBackToList} 
            onSubmit={handleUpdateLink}
            loading={formLoading}
            mode="edit"
          />
        )}
      </Modal>
    </div>
  );
}

// Link Details Component
function LinkDetails({ link, onBack }: { link: Link; onBack: () => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <p className="mt-1 text-sm font-medium text-gray-900">{link.title}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">URL</label>
          <a 
            href={link.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 mt-1 text-sm text-blue-600 hover:text-blue-800"
          >
            {link.url}
            <ExternalLink size={14} />
          </a>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <p className="mt-1 text-sm text-gray-900">{link.description || "No description provided"}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <p className="mt-1 text-sm text-gray-900">{link.category || "Uncategorized"}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Display Order</label>
            <p className="mt-1 text-sm text-gray-900">{link.display_order}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <Badge variant={link.is_active ? "success" : "gray"} className="mt-1">
              {link.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Updated</label>
            <p className="mt-1 text-sm text-gray-900">
              {new Date(link.updated_at).toLocaleDateString()}
            </p>
          </div>
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

// Link Form Component
function LinkForm({ 
  link, 
  onCancel, 
  onSubmit, 
  loading, 
  mode 
}: { 
  link?: Link;
  onCancel: () => void;
  onSubmit: (data: LinkFormData) => void;
  loading: boolean;
  mode: "create" | "edit";
}) {
  const [formData, setFormData] = useState<LinkFormData>({
    title: link?.title || "",
    url: link?.url || "",
    description: link?.description || "",
    category: link?.category || "",
    display_order: link?.display_order || 0,
    is_active: link?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof LinkFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title *
          </label>
          <input
            type="text"
            id="title"
            required
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className="block w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter link title"
          />
        </div>

        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700">
            URL *
          </label>
          <input
            type="url"
            id="url"
            required
            value={formData.url}
            onChange={(e) => handleChange('url', e.target.value)}
            className="block w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://example.com"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="block w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Optional description of the link"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="block w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Category</option>
              <option value="Resources">Resources</option>
              <option value="Documents">Documents</option>
              <option value="Tools">Tools</option>
              <option value="External">External</option>
              <option value="Internal">Internal</option>
            </select>
          </div>

          <div>
            <label htmlFor="display_order" className="block text-sm font-medium text-gray-700">
              Display Order
            </label>
            <input
              type="number"
              id="display_order"
              min="0"
              value={formData.display_order}
              onChange={(e) => handleChange('display_order', parseInt(e.target.value) || 0)}
              className="block w-full p-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => handleChange('is_active', e.target.checked)}
              className="text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Active</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
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
          {loading ? "Saving..." : mode === "create" ? "Create Link" : "Update Link"}
        </button>
      </div>
    </form>
  );
}