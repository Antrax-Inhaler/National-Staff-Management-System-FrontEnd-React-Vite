import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useDebounce } from "use-debounce";
import { Search, Filter, Eye, FileText, Megaphone, Shield, BarChart, Calendar, ExternalLink } from "lucide-react";
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

export default function NationalInformationViewer() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [typeFilter, setTypeFilter] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedInfo, setSelectedInfo] = useState<NationalInformation | null>(null);
  const [information, setInformation] = useState<NationalInformation[]>([]);

  // Remove skeleton after data loads
  useEffect(() => {
    if (information.length > 0 || error) {
      setLoading(false);
    }
  }, [information, error]);

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
      case 'announcement': return 'primary';
      case 'policy': return 'success';
      case 'report': return 'danger';
      case 'update': return 'warning';
      default: return 'gray';
    }
  };

  useEffect(() => {
    fetchInformation();
  }, [debouncedSearch, typeFilter]);

  const fetchInformation = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const token = session.access_token;

      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (typeFilter) params.append("type", typeFilter);
      // Members can only see published information
      params.append("status", "published");
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/national-information?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch information");

      const result = await response.json();

      if (result.success) {
        setInformation(result.data);
      } else {
        throw new Error(result.message || "Failed to fetch information");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load information");
    }
  };

  const fetchInformationForTable = async (
    page: number,
    perPage: number | "All"
  ): Promise<Paginated<NationalInformation>> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const token = session.access_token;

      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage === "All" ? "1000" : perPage.toString(),
        status: "published", // Only published for members
      });

      if (debouncedSearch) params.append("search", debouncedSearch);
      if (typeFilter) params.append("type", typeFilter);
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
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
      return {
        items: [],
        current_page: 1,
        last_page: 1,
        per_page: typeof perPage === "number" ? perPage : 20,
        total: 0,
      };
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
          <span className="text-sm font-medium capitalize">{info.type}</span>
        </div>
      )
    },
    { 
      key: "title", 
      header: "Information", 
      accessor: (info) => (
        <div>
          <div className="font-medium text-gray-900">{info.title}</div>
          <div className="mt-1 text-sm text-gray-600 line-clamp-2">{info.content}</div>
        </div>
      )
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
      header: "",
      accessor: (info) => (
        <button
          onClick={() => setSelectedInfo(info)}
          className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          <Eye size={14} />
          View
        </button>
      ),
    },
  ];

  const InformationCard = ({ info }: { info: NationalInformation }) => (
    <div className="p-4 bg-white rounded-lg hover:shadow-sm ">
      <div className="flex items-center justify-between mb-3">
        <Badge variant={getTypeColor(info.type)} className="text-xs capitalize">
          {getTypeIcon(info.type)}
          <span className="ml-1">{info.type}</span>
        </Badge>
        <div className="text-xs text-gray-500">
          {new Date(info.published_at).toLocaleDateString()}
        </div>
      </div>
      
      <h3 className="mb-2 font-semibold text-gray-900 line-clamp-2">{info.title}</h3>
      
      <p className="mb-3 text-sm text-gray-600 line-clamp-3">{info.content}</p>
      
      <button
        onClick={() => setSelectedInfo(info)}
        className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        Read More
        <ExternalLink size={14} />
      </button>
    </div>
  );

  const CategoryFilter = () => {
    const categories = ['announcement', 'policy', 'report', 'update'];
    
    return (
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setTypeFilter("")}
          className={`px-3 py-1 rounded-full text-sm border ${
            typeFilter === "" 
              ? "bg-blue-50 border-blue-200 text-blue-700" 
              : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
          }`}
        >
          All Types
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setTypeFilter(category)}
            className={`px-3 py-1 rounded-full text-sm border ${
              typeFilter === category 
                ? "bg-blue-50 border-blue-200 text-blue-700" 
                : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span className="capitalize">{category}s</span>
          </button>
        ))}
      </div>
    );
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
        <div className="max-w-md text-center">
          <div className="px-4 py-3 text-red-700 border border-red-200 rounded-lg bg-red-50">
            <p className="font-semibold">Error Loading Information</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">National Information</h1>
              <p className="mt-1 text-gray-600">Stay updated with announcements, policies, and reports</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {viewMode === "grid" ? "List View" : "Grid View"}
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
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
              <button
                onClick={() => {
                  setSearchTerm("");
                  setTypeFilter("");
                }}
                className="px-3 py-2 text-sm text-gray-700 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
              >
                Clear
              </button>
            </div>
          </div>
          
          {/* Category Quick Filters */}
          <div className="mt-4">
            <CategoryFilter />
          </div>
        </div>

        {/* Results Count */}
        {!loading && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Showing {information.length} item{information.length !== 1 ? 's' : ''}
              {typeFilter && ` in "${typeFilter}s"`}
              {debouncedSearch && ` matching "${debouncedSearch}"`}
            </p>
          </div>
        )}

        {/* Content */}
        {viewMode === "grid" ? (
          // Grid View
          <div>
            {loading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="p-4 bg-white rounded-lg animate-pulse">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-1/4 h-4 bg-gray-200 rounded"></div>
                      <div className="w-1/4 h-3 bg-gray-200 rounded"></div>
                    </div>
                    <div className="w-3/4 h-5 mb-2 bg-gray-200 rounded"></div>
                    <div className="w-full h-3 mb-1 bg-gray-200 rounded"></div>
                    <div className="w-2/3 h-3 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : information.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {information.map((info) => (
                  <InformationCard key={info.id} info={info} />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-white rounded-lg">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="mb-2 text-lg font-medium text-gray-900">No information found</h3>
                <p className="text-gray-600">
                  {debouncedSearch || typeFilter 
                    ? "Try adjusting your search or filter criteria" 
                    : "No information is currently available"
                  }
                </p>
              </div>
            )}
          </div>
        ) : (
          // List View (Table)
          <div className="bg-white rounded-lg">
            {loading ? (
              <div className="p-4">
                <TableSkeleton />
              </div>
            ) : information.length > 0 ? (
              <DataTable
  columns={columns}
  queryFn={fetchInformationForTable}
  queryKey={["national-information", debouncedSearch, typeFilter]}
  pagination={true}
  perPageOptions={[10, 25, 50]}
/>

            ) : (
              <div className="p-8 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="mb-2 text-lg font-medium text-gray-900">No information found</h3>
                <p className="text-gray-600">
                  {debouncedSearch || typeFilter 
                    ? "Try adjusting your search or filter criteria" 
                    : "No information is currently available"
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {/* Quick Tips */}
        {!loading && information.length > 0 && (
          <div className="p-4 mt-6 border border-blue-200 rounded-lg bg-blue-50">
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <InfoIcon className="w-4 h-4" />
              <span>
                <strong>Tip:</strong> This is a read-only view of national information. Contact your national administrator for questions.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={!!selectedInfo}
        onClose={() => setSelectedInfo(null)}
        title={selectedInfo?.title || "Information Details"}
        className="max-w-4xl"
      >
        {selectedInfo && (
          <InformationDetails info={selectedInfo} onClose={() => setSelectedInfo(null)} />
        )}
      </Modal>
    </div>
  );
}

// Information Details Component
function InformationDetails({ info, onClose }: { info: NationalInformation; onClose: () => void }) {
  const getTypeVariant = (type: string): "success" | "warning" | "primary" | "danger" | "gray" => {
    switch (type) {
      case "announcement": return "primary";   // blue
      case "policy": return "success";        // green
      case "report": return "danger";         // red
      case "update": return "warning";        // orange
      default: return "gray";
    }
  };


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant={getTypeVariant(info.type)} className="capitalize">
          {info.type}
        </Badge>
        <div className="text-sm text-gray-600">
          Published: {new Date(info.published_at).toLocaleDateString()}
        </div>
      </div>
      
      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">{info.title}</h2>
        <div className="prose-sm prose text-gray-900 max-w-none">
          {info.content.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-3">{paragraph}</p>
          ))}
        </div>
      </div>
      
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// Simple Info Icon component
function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  );
}