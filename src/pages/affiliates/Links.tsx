import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useDebounce } from "use-debounce";
import { ExternalLink, Search, Filter, Link as LinkIcon, Folder, Download } from "lucide-react";
import DataTable from "./../../components/ui/DataTable";
import type { Column, Paginated } from "./../../components/ui/DataTable";
import SearchInput from "./../../components/ui/SearchInput";
import SelectField from "./../../components/ui/SelectField";
import Badge from "./../../components/ui/Badge";

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
}

// Skeleton Loader Components
function LinkCardSkeleton() {
  return (
    <div className="p-4 bg-white rounded-lg animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="w-3/4 h-5 bg-gray-200 rounded"></div>
          <div className="w-full h-4 bg-gray-200 rounded"></div>
          <div className="w-1/2 h-3 bg-gray-200 rounded"></div>
        </div>
        <div className="w-6 h-6 ml-4 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-white rounded">
            {[...Array(4)].map((_, j) => (
              <div key={j} className="w-1/4 h-4 mx-2 bg-gray-200 rounded"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LinkLibrary() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [categories, setCategories] = useState<string[]>([]);
  const [links, setLinks] = useState<Link[]>([]);

  useEffect(() => {
    fetchLinks();
  }, [debouncedSearch, categoryFilter]);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const token = session.access_token;

      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (categoryFilter) params.append("category", categoryFilter);
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/links?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch links");

      const result = await response.json();

      if (result.success) {
        setLinks(result.data);
        // Extract unique categories
        const uniqueCategories = [...new Set(result.data.map((link: Link) => link.category).filter(Boolean))] as string[];
        setCategories(uniqueCategories);
      } else {
        throw new Error(result.message || "Failed to fetch links");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load links");
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<Link>[] = [
    { 
      key: "title", 
      header: "Title", 
      accessor: (link) => (
        <div className="flex items-center gap-3">
          <LinkIcon className="flex-shrink-0 w-4 h-4 text-blue-500" />
          <div>
            <div className="font-medium text-gray-900">{link.title}</div>
            {link.description && (
              <div className="mt-1 text-sm text-gray-600">{link.description}</div>
            )}
          </div>
        </div>
      )
    },
    {
      key: "category",
      header: "Category",
      accessor: (link) => link.category ? (
        <Badge variant="gray">{link.category}</Badge>
      ) : (
        <span className="text-sm text-gray-400">Uncategorized</span>
      ),
    },
    {
      key: "url",
      header: "Link",
      accessor: (link) => (
        <a 
          href={link.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
        >
          Open Link
          <ExternalLink size={14} />
        </a>
      ),
    },
  ];

  const fetchLinksForTable = async (
    page: number,
    perPage: number | "All"
  ): Promise<Paginated<Link>> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const token = session.access_token;

      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage === "All" ? "1000" : perPage.toString(),
      });

      if (debouncedSearch) params.append("search", debouncedSearch);
      if (categoryFilter) params.append("category", categoryFilter);
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
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
      return {
        items: [],
        current_page: 1,
        last_page: 1,
        per_page: typeof perPage === "number" ? perPage : 20,
        total: 0,
      };
    }
  };

  const LinkCard = ({ link }: { link: Link }) => (
    <div className="p-4 bg-white rounded-lg hover:shadow-sm ">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {link.category && (
            <Badge variant="gray" className="text-xs">
              {link.category}
            </Badge>
          )}
        </div>
        <ExternalLink size={16} className="text-gray-400" />
      </div>
      
      <h3 className="mb-2 font-semibold text-gray-900 line-clamp-2">{link.title}</h3>
      
      {link.description && (
        <p className="mb-3 text-sm text-gray-600 line-clamp-2">{link.description}</p>
      )}
      
      <a 
        href={link.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
      >
        Visit Resource
        <ExternalLink size={14} />
      </a>
    </div>
  );

  const CategoryFilter = () => (
    <div className="flex flex-wrap gap-2 mb-4">
      <button
        onClick={() => setCategoryFilter("")}
        className={`px-3 py-1 rounded-full text-sm border ${
          categoryFilter === "" 
            ? "bg-blue-50 border-blue-200 text-blue-700" 
            : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
        }`}
      >
        All Categories
      </button>
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => setCategoryFilter(category)}
          className={`px-3 py-1 rounded-full text-sm border ${
            categoryFilter === category 
              ? "bg-blue-50 border-blue-200 text-blue-700" 
              : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
        <div className="max-w-md text-center">
          <div className="px-4 py-3 text-red-700 border border-red-200 rounded-lg bg-red-50">
            <p className="font-semibold">Error Loading Links</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Resource Library</h1>
              <p className="mt-1 text-gray-600">Access helpful links and resourcessss</p>
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
                  placeholder="Search resources..."
                  className="w-full pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SelectField
                label=""
                name="category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={[
                  { label: "All Categories", value: "" },
                  ...categories.map(cat => ({ label: cat, value: cat }))
                ]}
                className="min-w-40"
              />
            </div>
          </div>
          
          {/* Category Quick Filters */}
          {categories.length > 0 && (
            <div className="mt-4">
              <CategoryFilter />
            </div>
          )}
        </div>

        {/* Results Count */}
        {!loading && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Showing {links.length} resource{links.length !== 1 ? 's' : ''}
              {categoryFilter && ` in "${categoryFilter}"`}
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
                  <LinkCardSkeleton key={i} />
                ))}
              </div>
            ) : links.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {links.map((link) => (
                  <LinkCard key={link.id} link={link} />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-white rounded-lg">
                <Folder className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="mb-2 text-lg font-medium text-gray-900">No resources found</h3>
                <p className="text-gray-600">
                  {debouncedSearch || categoryFilter 
                    ? "Try adjusting your search or filter criteria" 
                    : "No resources are currently available"
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
            ) : links.length > 0 ? (
              <DataTable
                columns={columns}
                queryFn={fetchLinksForTable}
                queryKey={["links", debouncedSearch, categoryFilter]}
                pagination={true}
                perPageOptions={[10, 25, 50]}
                // showSearch={false}
              />
            ) : (
              <div className="p-8 text-center">
                <Folder className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="mb-2 text-lg font-medium text-gray-900">No resources found</h3>
                <p className="text-gray-600">
                  {debouncedSearch || categoryFilter 
                    ? "Try adjusting your search or filter criteria" 
                    : "No resources are currently available"
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {/* Quick Tips */}
        {!loading && links.length > 0 && (
          <div className="p-4 mt-6 border border-blue-200 rounded-lg bg-blue-50">
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <InfoIcon className="w-4 h-4" />
              <span>
                <strong>Tip:</strong> Click on any resource to open it in a new tab. Use categories to filter specific types of resources.
              </span>
            </div>
          </div>
        )}
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