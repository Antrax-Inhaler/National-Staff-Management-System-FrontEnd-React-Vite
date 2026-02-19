import type { FilterOptions } from "@/components/ui/FilterDropdown";
import { useQuery } from "@tanstack/react-query";
import { links, type linkFilter } from "@v1/api/link";
import Badge from "@v1/components/ui/Badge";
import type { Column } from "@v1/components/ui/DataTable";
import DataTable from "@v1/components/ui/DataTable";
import FilterDropdown from "@v1/components/ui/FilterDropdown";
import SearchInput from "@v1/components/ui/SearchInput";
import { ExternalLink, Link as LinkIcon, Unlink, Globe, Lock, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebounce } from "use-debounce";
import Modal from "@/components/ui/Modal";

export interface Link {
  id: number;
  title: string;
  url: string;
  description?: string;
  category?: string;
  is_public: boolean;
  display_order: number;
  affiliate_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const FILTER_OPTIONS: FilterOptions = {
  status: ["Active", "Inactive"],
};

interface LinkDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: Link | null;
}

function LinkDetailsModal({ isOpen, onClose, link }: LinkDetailsModalProps) {
  if (!link) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Link Details"
      size="lg"
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{link.title}</h3>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            {link.url}
            <ExternalLink size={14} />
          </a>
        </div>

        {link.description && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-700 mb-2">Description</h4>
            <p className="text-gray-600 whitespace-pre-wrap">{link.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {link.category && (
                <Badge variant="gray">{link.category}</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {link.is_public ? (
                <>
                  <Globe size={14} className="text-blue-500" />
                  <span>Public Resource</span>
                </>
              ) : (
                <>
                  <Lock size={14} className="text-gray-500" />
                  <span>Private Resource</span>
                </>
              )}
            </div>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar size={14} />
              <span>Created: {new Date(link.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} />
              <span>Updated: {new Date(link.updated_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            Visit Resource
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </Modal>
  );
}

function LinkStrip({ link, onClick }: { link: Link; onClick: () => void }) {
  return (
    <div 
      className="flex items-center justify-between w-full p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-center flex-1 min-w-0">
        <div className="flex-shrink-0 mr-4">
          <LinkIcon className="w-5 h-5 text-blue-500" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {link.title}
            </h3>
            
            {link.category && (
              <Badge 
                variant="gray" 
                size="sm"
                className="capitalize flex-shrink-0"
              >
                {link.category}
              </Badge>
            )}
            
            <div className="flex items-center gap-1 text-sm text-gray-500 flex-shrink-0">
              {link.is_public ? (
                <>
                  <Globe className="w-3 h-3" />
                  <span>Public</span>
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3" />
                  <span>ORG Member Link Only</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {link.description && (
              <div className="text-gray-600 truncate max-w-md">
                {link.description}
              </div>
            )}
            
            <div className="flex items-center gap-1 min-w-0">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 truncate max-w-md inline-flex items-center gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(link.url, '_blank', 'noopener,noreferrer');
                }}
              >
                <span className="truncate">{link.url}</span>
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="ml-4 flex-shrink-0">
          <button
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="View Details"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <Eye size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

const SkeletonStrip = () => (
  <div className="flex items-center p-4 bg-white border border-gray-200 rounded-lg animate-pulse">
    <div className="flex-shrink-0 mr-4">
      <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-48 h-6 bg-gray-200 rounded"></div>
        <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-64 h-4 bg-gray-200 rounded"></div>
        <div className="w-32 h-4 bg-gray-200 rounded"></div>
      </div>
    </div>
    <div className="ml-4">
      <div className="w-8 h-8 bg-gray-200 rounded"></div>
    </div>
  </div>
);

export default function LinksView() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize state from URL params
  const urlSearch = searchParams.get("search") || "";
  const urlCategory = searchParams.get("category") || "";
  const urlStatus = searchParams.get("status") as "Active" | "Inactive" || undefined;
  const urlViewMode = (searchParams.get("view") as "strip" | "list") || "strip";

  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [viewMode, setViewMode] = useState<"strip" | "list">(urlViewMode);
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initialize filters from URL params
  const initialFilters: linkFilter = {
    search: urlSearch || undefined,
    category: urlCategory || undefined,
    status: urlStatus,
  };

  const [filters, setFilters] = useState<linkFilter>(initialFilters);
  const [appliedFilters, setApplyFilter] = useState<linkFilter>(initialFilters);

  // Update URL params whenever state changes
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (appliedFilters.search) {
      params.set("search", appliedFilters.search);
    } else {
      params.delete("search");
    }
    
    if (appliedFilters.category) {
      params.set("category", appliedFilters.category);
    } else {
      params.delete("category");
    }
    
    if (appliedFilters.status) {
      params.set("status", appliedFilters.status);
    } else {
      params.delete("status");
    }
    
    params.set("view", viewMode);
    
    // Only update if there are changes to avoid unnecessary navigation
    const currentParams = searchParams.toString();
    const newParams = params.toString();
    
    if (currentParams !== newParams) {
      setSearchParams(params, { replace: true });
    }
  }, [appliedFilters, viewMode, setSearchParams, searchParams]);

  // Handle filter changes
  const handleFilterChange = () => {
    setApplyFilter(filters);
  };

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["links-categories"],
    queryFn: () => links.categories(),
    staleTime: 30 * 60 * 1000,
  });

  const clearFilters = (keys: (keyof linkFilter)[]) => {
    setFilters((prev) => {
      const updated = { ...prev };
      keys.forEach((key) => delete updated[key]);
      return updated;
    });

    setApplyFilter((prev) => {
      const updated = { ...prev };
      keys.forEach((key) => delete updated[key]);
      return updated;
    });
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
              <div className="mt-1 text-sm text-gray-600">
                {link.description}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      accessor: (link) =>
        link.category ? (
          <Badge variant="gray">{link.category}</Badge>
        ) : (
          <span className="text-sm text-gray-400">Uncategorized</span>
        ),
    },
    {
      key: "visibility",
      header: "Visibility",
      accessor: (link) => (
        <div className="flex items-center gap-1">
          {link.is_public ? (
            <>
              <Globe className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-700">Public</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">ORG Member Link Only</span>
            </>
          )}
        </div>
      ),
    },
  ];

  const handleViewDetails = (link: Link) => {
    setSelectedLink(link);
    setIsModalOpen(true);
  };

  const handleViewModeChange = (mode: "strip" | "list") => {
    setViewMode(mode);
  };

  const CategoryFilter = () => {
    const total = categories?.reduce((sum, item) => sum + item.total, 0);
    const currentCategory = appliedFilters.category || "";
    
    return (
      <div className="flex flex-wrap gap-3">
        {/* All Categories */}
        <button
          onClick={() => {
            setFilters((prev) => ({ ...prev, category: "" }));
            setApplyFilter((prev) => ({ ...prev, category: "" }));
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all border ${
            currentCategory === ""
              ? "bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]"
              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
          }`}
        >
          <span>All Categories</span>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              currentCategory === ""
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {total}
          </span>
        </button>

        {/* Individual Categories */}
        {categories?.map((category) => {
          const isActive = currentCategory === category.category;
          return (
            <button
              key={category.category}
              onClick={() => {
                setFilters((prev) => ({ ...prev, category: category.category }));
                setApplyFilter((prev) => ({ ...prev, category: category.category }));
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all border ${
                isActive
                  ? "bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              <span>{category.category}</span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isActive
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {category.total}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  // Custom Strip View Component
  const StripView = () => {
    const { data, isLoading, isError } = useQuery({
      queryKey: ["strip-links", appliedFilters],
      queryFn: () => links.all({ filters: appliedFilters, perPage: "All" }),
    });

    if (isLoading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonStrip key={index} />
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <div className="p-8 text-center">
          <Unlink className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            Error loading resources
          </h3>
          <p className="text-gray-600">
            Unable to load resources. Please try again.
          </p>
        </div>
      );
    }

    const linksData = data?.items || [];

    if (linksData.length === 0) {
      return (
        <div className="p-8 text-center">
          <Unlink className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            No resources found
          </h3>
          <p className="text-gray-600">
            {Object.keys(appliedFilters).length > 0
              ? "No resources match your current filters. Try adjusting your search criteria."
              : "There are no resources available at this time."}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {linksData.map((link: Link) => (
          <LinkStrip 
            key={link.id} 
            link={link} 
            onClick={() => handleViewDetails(link)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      {/* Link Details Modal */}
      <LinkDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        link={selectedLink}
      />

      <div className="mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Resource Library
              </h1>
              <p className="mt-1 text-gray-600">
                Access helpful links and resources
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleViewModeChange(viewMode === "strip" ? "list" : "strip")}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {viewMode === "strip" ? "Table View" : "Strip View"}
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-4 mb-4 bg-white rounded-lg">
          <div className="flex flex-col gap-4 md:flex-row md:justify-between">
            <div className="flex-1">
              <div className="relative flex gap-2">
                <SearchInput
                  value={filters.search ?? ""}
                  onChange={(value) => {
                    setFilters((prev) => ({
                      ...prev,
                      search: value,
                    }));
                    // Auto-apply search after typing stops
                  }}
                  onEnter={handleFilterChange}
                  onBlur={handleFilterChange}
                  placeholder="Search resources ..."
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Category Quick Filters */}
          {categories && categories.length > 0 && (
            <div className="mt-4">
              <CategoryFilter />
            </div>
          )}

          {/* Active Filters Display */}
          {(appliedFilters.search || appliedFilters.status) && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-blue-700">
                    Active Filters:
                  </span>
                  
                  {appliedFilters.search && (
                    <div className="inline-flex items-center gap-1">
                      <Badge variant="primary" size="sm">
                        Search: {appliedFilters.search}
                      </Badge>
                      <button
                        onClick={() => clearFilters(["search"])}
                        className="text-blue-400 hover:text-blue-600"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                  
                  {appliedFilters.status && (
                    <div className="inline-flex items-center gap-1">
                      <Badge variant="success" size="sm">
                        Status: {appliedFilters.status}
                      </Badge>
                      <button
                        onClick={() => clearFilters(["status"])}
                        className="text-green-400 hover:text-green-600"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                  
                  {appliedFilters.category && (
                    <div className="inline-flex items-center gap-1">
                      <Badge variant="info" size="sm">
                        Category: {appliedFilters.category}
                      </Badge>
                      <button
                        onClick={() => clearFilters(["category"])}
                        className="text-blue-400 hover:text-blue-600"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => clearFilters(["search", "status", "category"])}
                  className="text-sm font-medium text-red-600 hover:text-red-800 whitespace-nowrap"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="rounded-lg">
          {viewMode === "strip" ? (
            <StripView />
          ) : (
            <DataTable
              columns={columns}
              queryFn={(page, perPage) =>
                links.all({ page, perPage, filters: appliedFilters })
              }
              filterKey={appliedFilters}
              queryKey={["table-links"]}
              pagination={true}
              perPageOptions={[10, 25, 50, 100]}
              fallback={
                <div className="p-8 text-center">
                  <Unlink className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="mb-2 text-lg font-medium text-gray-900">
                    No resources found
                  </h3>
                  <p className="text-gray-600">
                    {Object.keys(appliedFilters).length > 0
                      ? "No resources match your current filters. Try adjusting your search criteria."
                      : "There are no resources available at this time."}
                  </p>
                </div>
              }
              renderActions={(link) => (
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleViewDetails(link)}
                    className="flex items-center h-full gap-2 p-1 text-sm hover:bg-gray-100"
                    title="View Details"
                  >
                    <Eye size={16} className="text-gray-700" />
                  </button>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center h-full gap-2 p-1 text-sm hover:bg-blue-100"
                    title="Open Link"
                  >
                    <ExternalLink size={16} className="text-blue-700" />
                  </a>
                </div>
              )}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Import Calendar and X icons
import { Calendar, X } from "lucide-react";