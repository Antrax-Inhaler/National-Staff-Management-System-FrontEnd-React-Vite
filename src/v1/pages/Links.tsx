// src/pages/Links.tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { links, type linkFilter } from "@v1/api/link";
import LinkFormModal from "@v1/components/link/LinkFormModal";
import RoleGuard from "@v1/components/RoleGuard";
import Badge from "@v1/components/ui/Badge";
import type { Column } from "@v1/components/ui/DataTable";
import DataTable from "@v1/components/ui/DataTable";
import FilterDropdown from "@v1/components/ui/FilterDropdown";
import SearchInput from "@v1/components/ui/SearchInput";
import { Roles } from "@v1/constants/roles";
import {
  ExternalLink,
  Link as LinkIcon,
  LoaderCircle,
  SquarePen,
  Trash2,
  Unlink,
  Download,
  Grid3x3,
  List,
  Filter,
  Columns3,
  X,
  Calendar,
  Building2,
  RefreshCw,
  Share2,
  Globe,
  Lock,
  Rows3,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { affiliate } from "@v1/api/affiliate";
import { ActionButton } from "@v1/components/ui/ActionButton";

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
  affiliate?: {
    id: number;
    name: string;
    public_uid?: string;
  } | null;
}

// Skeleton Loading Components
const SkeletonStrip = () => (
  <div className="flex items-center p-4 bg-white border border-gray-200 rounded-lg animate-pulse">
    <div className="flex-1">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
        <div className="w-48 h-5 bg-gray-200 rounded"></div>
        <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
        <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-64 h-4 bg-gray-200 rounded"></div>
        <div className="w-32 h-4 bg-gray-200 rounded"></div>
        <div className="w-24 h-4 bg-gray-200 rounded"></div>
      </div>
    </div>
    <div className="flex items-center gap-2 ml-4">
      <div className="w-8 h-8 bg-gray-200 rounded"></div>
      <div className="w-8 h-8 bg-gray-200 rounded"></div>
      <div className="w-8 h-8 bg-gray-200 rounded"></div>
    </div>
  </div>
);

const SkeletonTableRow = () => (
  <tr className="animate-pulse">
    <td className="px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 bg-gray-200 rounded"></div>
        <div>
          <div className="w-32 h-4 mb-1 bg-gray-200 rounded"></div>
          <div className="w-48 h-3 bg-gray-200 rounded"></div>
        </div>
      </div>
    </td>
    <td className="px-4 py-3">
      <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
    </td>
    <td className="px-4 py-3">
      <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
    </td>
    <td className="px-4 py-3">
      <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
    </td>
    <td className="px-4 py-3">
      <div className="flex gap-2">
        <div className="w-8 h-8 bg-gray-200 rounded"></div>
        <div className="w-8 h-8 bg-gray-200 rounded"></div>
        <div className="w-8 h-8 bg-gray-200 rounded"></div>
      </div>
    </td>
  </tr>
);

interface FilterOptionsType {
  [key: string]: string[];
}

interface AffiliateOption {
  id: number;
  name: string;
}

export default function Links() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"strip" | "list">(
    (searchParams.get("view") as "strip" | "list") || "strip"
  );
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Initialize state from URL params
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [term, setTerm] = useState(searchParams.get("search") || "");
  const [filters, setFilters] = useState<linkFilter>({
    category: searchParams.get("category") || undefined,
    status: searchParams.get("status") as "active" | "inactive" || undefined,
    is_public: searchParams.get("is_public") === "true" ? true : 
               searchParams.get("is_public") === "false" ? false : undefined,
    search: searchParams.get("search") || undefined,
  });

  // Fetch affiliates for filter
  const { data: affiliates = [] } = useQuery({
    queryKey: ["affiliates-filter"],
    queryFn: () => affiliate.options(""),
  });

  // Create filter options with affiliates - FIXED TypeScript error
  const FILTER_OPTIONS: FilterOptionsType = {
    status: ["active", "inactive"],
    is_public: ["true", "false"],
    affiliate: Array.isArray(affiliates) 
      ? affiliates.map((aff: AffiliateOption) => aff.name)
      : [],
  };

  const COLUMN_OPTIONS = {
    columns: ["title", "category", "status", "visibility", "url", "created_at", "updated_at", "affiliate"]
  };

  const DEFAULT_COLUMNS = ["title", "category", "status", "visibility"];
  const [visibleCols, setVisibleCols] = useState<string[]>(DEFAULT_COLUMNS);

  // Fetch categories for filter
  const { data: categories = [] } = useQuery({
    queryKey: ["links-categories", filters],
    queryFn: () => links.categories({
      affiliate_id: filters.affiliate_id,
      is_public: filters.is_public
    }),
  });

  // Add category options to filter - FIXED TypeScript error
  const filterOptionsWithCategories: FilterOptionsType = {
    ...FILTER_OPTIONS,
    category: Array.isArray(categories) 
      ? [...new Set(categories.map((cat: any) => cat.category).filter(Boolean) as string[])]
      : [],
  };

  // Update URL params whenever filters or search changes
  useEffect(() => {
    const timer = setTimeout(() => {
      updateURLParams({ search: term, filters });
    }, 300);

    return () => clearTimeout(timer);
  }, [filters, term]);

  const updateURLParams = useCallback(
    (params: { search?: string; filters?: linkFilter; page?: number }) => {
      const newParams = new URLSearchParams();

      if (params.search !== undefined && params.search) {
        newParams.set("search", params.search);
      }

      if (params.page !== undefined && params.page > 1) {
        newParams.set("page", params.page.toString());
      }

      if (params.filters) {
        const { category, status, is_public, search, affiliate_id } = params.filters;

        if (category) newParams.set("category", category);
        if (status) newParams.set("status", status);
        if (is_public !== undefined) newParams.set("is_public", is_public.toString());
        if (search) newParams.set("search", search);
        if (affiliate_id) newParams.set("affiliate_id", affiliate_id.toString());
      }

      // Always include view mode
      newParams.set("view", viewMode);

      setSearchParams(newParams, { replace: true });
      setLastUpdated(new Date());
    },
    [setSearchParams, viewMode]
  );

  // Initialize state from URL on mount
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    const urlCategory = searchParams.get("category") || undefined;
    const urlStatus = searchParams.get("status") as "active" | "inactive" || undefined;
    const urlIsPublic = searchParams.get("is_public") === "true" ? true : 
                       searchParams.get("is_public") === "false" ? false : undefined;
    const urlView = searchParams.get("view") as "strip" | "list" || "strip";
    const urlAffiliateId = searchParams.get("affiliate_id") ? parseInt(searchParams.get("affiliate_id")!) : undefined;

    setSearch(urlSearch);
    setTerm(urlSearch);
    setViewMode(urlView);
    
    setFilters({
      category: urlCategory,
      status: urlStatus,
      is_public: urlIsPublic,
      search: urlSearch || undefined,
      affiliate_id: urlAffiliateId,
    });
  }, []);

  // Check screen size for mobile
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Query for strip view
  const {
    data: stripData,
    isLoading: isLoadingStrip,
    isError: isErrorStrip,
    refetch: refetchStrip,
  } = useQuery({
    queryKey: ["strip-links", filters],
    queryFn: () => links.all({ filters, perPage: "All" }),
    enabled: viewMode === "strip",
  });

  // Query for list view - FIXED: Properly handle pagination
  const listQuery = useQuery({
    queryKey: ["table-links", filters],
    queryFn: ({ pageParam = 1 }) => 
      links.all({ 
        page: Number(pageParam), // FIXED: Convert to number
        perPage: 25, 
        filters
      }),
    enabled: viewMode === "list",
  });

  const { mutate: deleteLink } = useMutation({
    mutationFn: (id: number) => links.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table-links"] });
      queryClient.invalidateQueries({ queryKey: ["strip-links"] });
      queryClient.invalidateQueries({ queryKey: ["links-categories"] });
      toast.success("Link deleted successfully");
      setDeletingId(null);
      setLastUpdated(new Date());
    },
    onError: async (err: any) => {
      console.error(err);
      setDeletingId(null);
      toast.error(err?.message || "Failed to delete link");
    },
  });

  const { mutate: exportLinks, isPending: isExporting } = useMutation({
    mutationFn: () => links.exportToCSV(filters),
    onSuccess: () => {
      toast.success("Links exported successfully");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to export links");
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this link?")) {
      setDeletingId(id);
      deleteLink(id);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setTerm(value.trim());
    setFilters(prev => ({ 
      ...prev, 
      search: value.trim() || undefined 
    }));
  };

  const handleFilterReset = () => {
    const resetFilters: linkFilter = {};
    setFilters(resetFilters);
    setSearch("");
    setTerm("");
    updateURLParams({ search: "", filters: resetFilters });
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["strip-links"] });
    queryClient.invalidateQueries({ queryKey: ["table-links"] });
    queryClient.invalidateQueries({ queryKey: ["links-categories"] });
    setLastUpdated(new Date());
  };

  const handleRemoveFilter = (filterType: keyof linkFilter) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[filterType];
      return newFilters;
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return "Invalid date";
    }
  };

  // Format date for tooltip
  const formatFullDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return "Invalid date";
    }
  };

  // Share link function
  const handleShare = async (link: Link) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: link.title,
          text: link.description || '',
          url: link.url,
        });
        toast.success('Link shared successfully');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast.error('Failed to share link');
        }
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${link.title}: ${link.url}`)
        .then(() => toast.success('Link copied to clipboard'))
        .catch(() => toast.error('Failed to copy link'));
    }
  };

  const columns: Column<Link>[] = [
    {
      key: "title",
      header: "Title",
      accessor: (link) => (
        <div className="flex items-center gap-3">
          <LinkIcon className="flex-shrink-0 w-4 h-4 text-blue-500" />
          <div className="min-w-0">
            <div className="font-bold text-gray-900 truncate">{link.title}</div>
            {link.description && (
              <div className="mt-1 text-sm text-gray-600 line-clamp-1">
                {link.description}
              </div>
            )}
            <div className="mt-1">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 truncate inline-block max-w-xs"
                onClick={(e) => e.stopPropagation()}
              >
                {link.url}
              </a>
            </div>
          </div>
        </div>
      ),
      mobilePriority: 1,
    },
    {
      key: "category",
      header: "Category",
      accessor: (link) =>
        link.category ? (
          <Badge variant="gray" className="capitalize">
            {link.category}
          </Badge>
        ) : (
          <span className="text-sm text-gray-400">Uncategorized</span>
        ),
      mobilePriority: 2,
    },
    {
      key: "status",
      header: "Status",
      accessor: (link) => (
        <Badge variant={link.is_active ? "success" : "gray"} className="capitalize">
          {link.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
      mobilePriority: 3,
    },
    {
      key: "visibility",
      header: "Visibility",
      accessor: (link) => (
        <Badge variant={link.is_public ? "primary" : "gray"} className="capitalize">
          {link.is_public ? "Public" : "Private"}
        </Badge>
      ),
      mobilePriority: 4,
    },
    {
      key: "url",
      header: "URL",
      accessor: (link) => (
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 truncate max-w-xs inline-block"
          onClick={(e) => e.stopPropagation()}
        >
          {link.url}
        </a>
      ),
      mobilePriority: 5,
    },
    {
      key: "affiliate",
      header: "Affiliate",
      accessor: (link) => (
        <div className="flex items-center gap-1">
          {link.affiliate?.name ? (
            <>
              <Building2 className="w-3 h-3 text-gray-400" />
              <span className="text-gray-700 truncate">
                {link.affiliate.name}
              </span>
            </>
          ) : (
            <span className="text-sm text-gray-500">No affiliate</span>
          )}
        </div>
      ),
      mobilePriority: 6,
    },
    {
      key: "created_at",
      header: "Created",
      accessor: (link) => (
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-gray-400" />
          <span className="text-sm text-gray-600">
            {formatDate(link.created_at)}
          </span>
        </div>
      ),
      mobilePriority: 7,
    },
    {
      key: "updated_at",
      header: "Last Updated",
      accessor: (link) => (
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-gray-400" />
          <span className="text-sm text-gray-600">
            {formatDate(link.updated_at)}
          </span>
        </div>
      ),
      mobilePriority: 8,
    },
  ];

  // Strip View Component
  const LinkStrip = ({ link }: { link: Link }) => {
    const handleStripClick = (e: React.MouseEvent) => {
      // Don't navigate if clicking on buttons
      if ((e.target as HTMLElement).closest('button') || 
          (e.target as HTMLElement).closest('a') ||
          (e.target as HTMLElement).closest('.actions-container')) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      
      // Open link in new tab for strip click
      window.open(link.url, '_blank', 'noopener,noreferrer');
    };

    return (
      <div 
        className="flex items-center justify-between w-full p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer group"
        onClick={handleStripClick}
      >
        <div className="flex items-center flex-1 min-w-0">
          {/* Link Icon */}
          <div className="flex-shrink-0 mr-4">
            <LinkIcon className="w-5 h-5 text-blue-500" />
          </div>
          
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Title and Status Row */}
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {link.title}
              </h3>
              
              {/* Status Badge */}
              <Badge 
                variant={link.is_active ? "success" : "gray"} 
                size="sm"
                className="flex-shrink-0"
              >
                {link.is_active ? "Active" : "Inactive"}
              </Badge>
              
              {/* Visibility Indicator */}
              <div className="flex items-center gap-1 text-sm text-gray-500 flex-shrink-0">
                {link.is_public ? (
                  <>
                    <Globe className="w-3 h-3" />
                    <span>Public</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3" />
                    <span>Private</span>
                  </>
                )}
              </div>
              
              {/* Affiliate */}
              {link.affiliate?.name && (
                <div className="flex items-center gap-1 text-sm text-gray-500 flex-shrink-0">
                  <Building2 className="w-3 h-3" />
                  <span className="truncate max-w-[120px]">{link.affiliate.name}</span>
                </div>
              )}
            </div>
            
            {/* Description and Metadata Row */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {/* URL */}
              <div className="flex items-center gap-1 min-w-0">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 truncate max-w-md inline-flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="truncate">{link.url}</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              </div>
              
              {/* Description */}
              {link.description && (
                <div className="text-gray-600 truncate max-w-md">
                  {link.description}
                </div>
              )}
              
              {/* Category */}
              {link.category && (
                <Badge variant="gray" size="sm" className="capitalize flex-shrink-0">
                  {link.category}
                </Badge>
              )}
              
              {/* Last Updated */}
              <div 
                className="flex items-center gap-1 text-gray-500 flex-shrink-0"
                title={`Last updated: ${formatFullDate(link.updated_at)}`}
              >
                <Calendar className="w-3 h-3" />
                <span>{formatDate(link.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 actions-container" onClick={(e) => e.stopPropagation()}>
          {/* Share Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleShare(link);
            }}
            className="p-2 text-gray-600 transition rounded-lg hover:bg-green-100 hover:text-green-700"
            title="Share Link"
          >
            <Share2 size={16} className="text-green-600" />
          </button>
          
          {/* Edit Button */}
          <RoleGuard
            roles={[
              Roles.AFFILIATE_OFFICER,
              Roles.NATIONAL_ADMINISTRATOR,
            ]}
          >
            <LinkFormModal
              mode="edit"
              link={link}
              renderButton={
                <button 
                  className="p-2 text-gray-600 transition rounded-lg hover:bg-yellow-100 hover:text-yellow-700"
                  title="Edit Link"
                >
                  <SquarePen size={16} className="text-orange-500" />
                </button>
              }
              onSuccess={() => queryClient.invalidateQueries({ queryKey: ["strip-links"] })}
            />
          </RoleGuard>
          
          {/* Delete Button */}
          <RoleGuard
            roles={[
              Roles.AFFILIATE_OFFICER,
              Roles.NATIONAL_ADMINISTRATOR,
            ]}
          >
            <button
              disabled={deletingId === link.id}
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(link.id);
              }}
              className="p-2 text-gray-600 transition rounded-lg hover:bg-red-100 hover:text-red-700 disabled:opacity-50"
              title="Delete Link"
            >
              {deletingId === link.id ? (
                <LoaderCircle
                  size={16}
                  className="text-red-500 animate-spin"
                />
              ) : (
                <Trash2 size={16} className="text-red-500" />
              )}
            </button>
          </RoleGuard>
          
          {/* Open Link Button */}
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-600 transition rounded-lg hover:bg-blue-100 hover:text-blue-700"
            title="Open Link"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={16} className="text-blue-600" />
          </a>
        </div>
      </div>
    );
  };

  const renderStripView = () => {
    if (isLoadingStrip) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonStrip key={index} />
          ))}
        </div>
      );
    }

    if (isErrorStrip) {
      return (
        <div className="p-8 text-center">
          <Unlink className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="mb-2 text-lg font-bold text-gray-900">
            Error loading links
          </h3>
          <p className="text-gray-600 mb-4">
            Unable to load links. Please try again.
          </p>
          <button
            onClick={() => refetchStrip()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      );
    }

    const linksData = stripData?.items || [];

    if (linksData.length === 0) {
      return (
        <div className="p-8 text-center">
          <Unlink className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="mb-2 text-lg font-bold text-gray-900">
            No links found
          </h3>
          <p className="text-gray-600 mb-4">
            {Object.keys(filters).length > 0
              ? "No links match your current filters. Try adjusting your search criteria."
              : "There are no links available at this time."}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {linksData.map((link: Link) => (
          <LinkStrip key={link.id} link={link} />
        ))}
      </div>
    );
  };

  const renderListView = () => {
    if (listQuery.isLoading) {
      return (
        <div className="overflow-hidden bg-white border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">Title</th>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">Category</th>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">Status</th>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">Visibility</th>
                <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.from({ length: 5 }).map((_, index) => (
                <SkeletonTableRow key={index} />
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (listQuery.isError) {
      return (
        <div className="p-8 text-center">
          <Unlink className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="mb-2 text-lg font-bold text-gray-900">
            Error loading links
          </h3>
          <p className="text-gray-600 mb-4">
            Unable to load links. Please try again.
          </p>
          <button
            onClick={() => listQuery.refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      );
    }

    const linksData = listQuery.data?.items || [];

    if (linksData.length === 0) {
      return (
        <div className="p-8 text-center">
          <Unlink className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="mb-2 text-lg font-bold text-gray-900">
            No links found
          </h3>
          <p className="text-gray-600 mb-4">
            {Object.keys(filters).length > 0
              ? "No links match your current filters. Try adjusting your search criteria."
              : "There are no links available at this time."}
          </p>
        </div>
      );
    }

    return (
      <DataTable<Link>
        columns={columns}
        visibleColumns={visibleCols}
        queryKey={["table-links", filters]}
        filterKey={{ filters }}
        queryFn={(page, perPage) => 
          links.all({ 
            page: Number(page), 
            perPage: Number(perPage), 
            filters 
          })
        }
        pagination={true}
        perPageOptions={[10, 25, 50, 100]}
        massSelection={false}
        responsive={true}
        renderActions={(link: Link) => (
          <div className="flex items-center gap-1">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-gray-600 transition rounded-lg hover:bg-blue-100"
              title="Open link"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={16} className="text-blue-600" />
            </a>
            <button
              onClick={() => handleShare(link)}
              className="p-1.5 text-gray-600 transition rounded-lg hover:bg-green-100"
              title="Share link"
            >
              <Share2 size={16} className="text-green-600" />
            </button>
            <RoleGuard
              roles={[
                Roles.AFFILIATE_OFFICER,
                Roles.NATIONAL_ADMINISTRATOR,
              ]}
            >
              <LinkFormModal
                mode="edit"
                link={link}
                renderButton={
                  <button 
                    className="p-1.5 text-gray-600 transition rounded-lg hover:bg-yellow-100"
                    title="Edit"
                  >
                    <SquarePen size={16} className="text-orange-500" />
                  </button>
                }
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ["table-links"] })}
              />
              <button
                disabled={deletingId === link.id}
                onClick={() => handleDelete(link.id)}
                className="p-1.5 text-gray-600 transition rounded-lg hover:bg-red-100 disabled:opacity-50"
                title="Delete"
              >
                {deletingId === link.id ? (
                  <LoaderCircle
                    size={16}
                    className="text-red-500 animate-spin"
                  />
                ) : (
                  <Trash2 size={16} className="text-red-500" />
                )}
              </button>
            </RoleGuard>
          </div>
        )}
      />
    );
  };

  // Count active filters
  const getActiveFilterCount = () => {
    return Object.keys(filters).filter(key => 
      filters[key as keyof linkFilter] !== undefined && 
      filters[key as keyof linkFilter] !== ""
    ).length;
  };

  const handleFilterApply = (selected: Record<string, string[]>) => {
    const newFilters = { ...filters };
    
    // Handle status filter
    if (selected.status && selected.status.length > 0) {
      newFilters.status = selected.status[0] as "active" | "inactive";
    } else {
      delete newFilters.status;
    }
    
    // Handle is_public filter
    if (selected.is_public && selected.is_public.length > 0) {
      newFilters.is_public = selected.is_public[0] === "true";
    } else {
      delete newFilters.is_public;
    }
    
    // Handle category filter
    if (selected.category && selected.category.length > 0) {
      newFilters.category = selected.category[0];
    } else {
      delete newFilters.category;
    }
    
    // Handle affiliate filter
    if (selected.affiliate && selected.affiliate.length > 0) {
      const affiliateName = selected.affiliate[0];
      const affiliateObj = Array.isArray(affiliates) 
        ? affiliates.find((aff: AffiliateOption) => aff.name === affiliateName)
        : undefined;
      if (affiliateObj) {
        newFilters.affiliate_id = affiliateObj.id;
      }
    } else {
      delete newFilters.affiliate_id;
    }
    
    setFilters(newFilters);
  };

  const getCurrentFilterValues = () => {
    const values: Record<string, string[]> = {};
    
    if (filters.status) {
      values.status = [filters.status];
    }
    
    if (filters.is_public !== undefined) {
      values.is_public = [filters.is_public.toString()];
    }
    
    if (filters.category) {
      values.category = [filters.category];
    }
    
    if (filters.affiliate_id && Array.isArray(affiliates)) {
      const affiliateObj = affiliates.find((aff: AffiliateOption) => aff.id === filters.affiliate_id);
      if (affiliateObj) {
        values.affiliate = [affiliateObj.name];
      }
    }
    
    return values;
  };

  const handleFilterResetAll = () => {
    const newFilters = { ...filters };
    delete newFilters.status;
    delete newFilters.is_public;
    delete newFilters.category;
    delete newFilters.affiliate_id;
    setFilters(newFilters);
  };

  return (
    <div className="flex flex-col flex-1 p-4 bg-white rounded-lg shadow md:p-5">
      {isMobile && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Resource Library</h1>
            <p className="text-xs text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="p-2 text-gray-600 bg-white border border-gray-300 rounded-lg shadow-sm"
          >
            {showMobileFilters ? <X size={20} /> : <Filter size={20} />}
          </button>
        </div>
      )}

      <div
        className={`flex flex-col gap-4 mb-4 ${
          isMobile && !showMobileFilters ? "hidden" : ""
        }`}
      >
        {/* HEADER SECTION - Updated to match Member Management */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
          <header className="md:flex-1">
            <h1 className="text-xl font-bold text-gray-900">Resource Library</h1>
            <p className="mt-1 text-xs text-gray-600">
              Access helpful links and resources
            </p>
          </header>

          <div className="flex flex-wrap items-start gap-1.5 md:gap-2 md:justify-end">
            <ActionButton
              label="Export CSV"
              icon={isExporting ? LoaderCircle : Download}
              iconSize={12}
              loading={isExporting}
              onClick={() => exportLinks()}
              buttonClassName="bg-green-600! hover:bg-green-700! text-white! font-semibold! text-xs px-2.5 py-1.5"
            />

            <RoleGuard
              roles={[
                Roles.AFFILIATE_OFFICER,
                Roles.NATIONAL_ADMINISTRATOR,
              ]}
            >
              <LinkFormModal 
                mode="create"
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ["strip-links"] })}
              />
            </RoleGuard>
          </div>
        </div>

        {/* CONTROLS SECTION - Updated to match Member Management */}
        <div className="flex flex-col lg:flex-row gap-3">
          {/* LEFT SIDE: Filter, View Toggle, Columns, Refresh */}
          <div className="flex flex-wrap items-center gap-2 lg:flex-1">
            {/* View Mode Toggle - Updated styling */}
            <div className="inline-flex items-center gap-0 px-1 py-1 bg-white border border-gray-300 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode("strip")}
                disabled={isLoadingStrip || listQuery.isLoading}
                title="Strip view"
                className={`
                  inline-flex items-center justify-center
                  px-3 py-1.5 text-xs
                  rounded-md transition-all
                  ${
                    viewMode === "strip"
                      ? "bg-gray-900 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }
                  ${(isLoadingStrip || listQuery.isLoading) ? "opacity-50 cursor-not-allowed" : ""}
                `}
              >
                <List size={14} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                disabled={isLoadingStrip || listQuery.isLoading}
                title="Table view"
                className={`
                  inline-flex items-center justify-center
                  px-3 py-1.5 text-xs
                  rounded-md transition-all
                  ${
                    viewMode === "list"
                      ? "bg-gray-900 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }
                  ${(isLoadingStrip || listQuery.isLoading) ? "opacity-50 cursor-not-allowed" : ""}
                `}
              >
                <Rows3 size={14} />
              </button>
            </div>

            {/* Filters Dropdown - FIXED: Removed invalid 'size' prop */}
            <FilterDropdown
              options={filterOptionsWithCategories}
              value={getCurrentFilterValues()}
              onApply={handleFilterApply}
              onReset={handleFilterResetAll}
              buttonLabel="Filters"
              buttonIcon={<Filter size={14} />}
              showCount={true}
            />

            {/* Columns Dropdown (only for list view) - FIXED: Removed invalid 'size' prop */}
            {viewMode === "list" && (
              <FilterDropdown
                options={COLUMN_OPTIONS}
                defaultValue={{ columns: DEFAULT_COLUMNS }}
                value={{ columns: visibleCols }}
                onApply={(selected: any) => setVisibleCols(selected.columns)}
                onReset={() => setVisibleCols(DEFAULT_COLUMNS)}
                buttonLabel="Columns"
                buttonIcon={<Columns3 size={14} />}
              />
            )}

            {/* Refresh Button */}
            <ActionButton
              onClick={handleRefresh}
              label="Refresh"
              icon={RefreshCw}
              iconSize={14}
              loading={isLoadingStrip || listQuery.isLoading}
              buttonClassName="px-3 py-1.5 text-xs"
            />
          </div>

          {/* RIGHT SIDE: Search - Updated to match Member Management */}
          <div className="lg:w-64">
            <SearchInput
              placeholder="Search links by title, description, or URL..."
              value={search}
              onChange={handleSearchChange}
              showClear
            />
          </div>
        </div>

        {/* Active Filters Display - Updated styling */}
        {getActiveFilterCount() > 0 && (
          <div className="py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-700">Active Filters:</span>
                <div className="flex flex-wrap gap-1">
                  {filters.category && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-lg">
                      <span className="font-medium">Category:</span>
                      <span>{filters.category}</span>
                      <button
                        onClick={() => handleRemoveFilter('category')}
                        className="ml-1 text-blue-500 hover:text-blue-700"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  )}
                  
                  {filters.status && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-700 rounded-lg">
                      <span className="font-medium">Status:</span>
                      <span className="capitalize">{filters.status}</span>
                      <button
                        onClick={() => handleRemoveFilter('status')}
                        className="ml-1 text-green-500 hover:text-green-700"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  )}
                  
                  {filters.is_public !== undefined && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-yellow-50 text-yellow-700 rounded-lg">
                      <span className="font-medium">Visibility:</span>
                      <span>{filters.is_public ? 'Public' : 'Private'}</span>
                      <button
                        onClick={() => handleRemoveFilter('is_public')}
                        className="ml-1 text-yellow-500 hover:text-yellow-700"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  )}
                  
                  {filters.affiliate_id && Array.isArray(affiliates) && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded-lg">
                      <span className="font-medium">Affiliate:</span>
                      <span>{affiliates.find((aff: AffiliateOption) => aff.id === filters.affiliate_id)?.name || 'Unknown'}</span>
                      <button
                        onClick={() => handleRemoveFilter('affiliate_id')}
                        className="ml-1 text-purple-500 hover:text-purple-700"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  )}
                  
                  {filters.search && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-50 text-gray-700 rounded-lg">
                      <span className="font-medium">Search:</span>
                      <span>{filters.search}</span>
                      <button
                        onClick={() => handleRemoveFilter('search')}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleFilterReset}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 hover:bg-gray-100 rounded"
              >
                Clear all
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1">
        {viewMode === "strip" ? renderStripView() : renderListView()}
      </div>
    </div>
  );
}