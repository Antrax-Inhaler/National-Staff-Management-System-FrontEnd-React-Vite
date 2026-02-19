// src/components/pages/NationalInformationPage.tsx (UPDATED VERSION)
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Filter,
  Calendar,
  FileText,
  Archive,
  Globe,
  BookOpen,
  Megaphone,
  CheckCircle,
  Clock,
  Columns3,
  RefreshCw,
  X,
  Menu,
  Check,
  Users,
  Lock,
  Loader2,
} from "lucide-react";
import { nationalInformation, type NationalInformation } from "../api/nationalInformation";
import AlertMessage from "@v1/components/ui/AlertMessage";
import ConfirmationPopUp from "@v1/components/ui/ConfirmationPopUp";
import SearchInput from "@v1/components/ui/SearchInput";
import FilterDropdown from "@v1/components/ui/FilterDropdown";
import DataTable, { type Column } from "@v1/components/ui/DataTable";
import RoleGuard from "@v1/components/RoleGuard";
import { Roles } from "@v1/constants/roles";
import CreateModal from "@v1/components/CreateModal";
import UpdateModal from "@v1/components/UpdateModal";
import PreviewModal from "@v1/components/PreviewModal";
import Badge from "@v1/components/ui/Badge";
import { format, isValid, parseISO } from 'date-fns';

// Import the new ViewerListModal component
import ViewerListModal from "@v1/components/ViewerListModal";

// Constants - Updated to include view_count
const DEFAULT_COLUMNS = [
  "selection",
  "type",
  "title",
  "content",
  "category",
  "author",
  "status",
  "published_at",
  "view_count",
  "attachments",
  "actions",
];

const COLUMN_OPTIONS = {
  columns: [
    "selection",
    "type",
    "title",
    "content",
    "category",
    "author",
    "status",
    "published_at",
    "view_count",
    "created_at",
    "updated_at",
    "attachments",
    "actions",
  ],
};

// Helper function to format dates
const formatDate = (dateString: string | null): string => {
  if (!dateString) return "Not set";

  try {
    const date = parseISO(dateString);
    if (!isValid(date)) {
      return "Invalid date";
    }
    return format(date, 'MM/dd/yyyy');
  } catch (error) {
    try {
      const date = new Date(dateString);
      if (!isValid(date)) {
        return "Invalid date";
      }
      return format(date, 'MM/dd/yyyy');
    } catch {
      return "Invalid date";
    }
  }
};

// Format date with time
const formatDateTime = (dateString: string | null): string => {
  if (!dateString) return "Not set";

  try {
    const date = parseISO(dateString);
    if (!isValid(date)) {
      return "Invalid date";
    }
    return format(date, 'MM/dd/yyyy hh:mm a');
  } catch (error) {
    try {
      const date = new Date(dateString);
      if (!isValid(date)) {
        return "Invalid date";
      }
      return format(date, 'MM/dd/yyyy hh:mm a');
    } catch {
      return "Invalid date";
    }
  }
};

interface InformationFilters {
  type: string[];
  category: string[];
  status: string[];
  author: string[];
}

export default function NationalInformationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [filters, setFilters] = useState<InformationFilters>({
    type: searchParams.get("type")?.split(",").filter(Boolean) || [],
    category: searchParams.get("category")?.split(",").filter(Boolean) || [],
    status: searchParams.get("status")?.split(",").filter(Boolean) || [],
    author: searchParams.get("author")?.split(",").filter(Boolean) || [],
  });
  const [visibleCols, setVisibleCols] = useState<string[]>(DEFAULT_COLUMNS);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editData, setEditData] = useState<NationalInformation | null>(null);
  const [previewData, setPreviewData] = useState<NationalInformation | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [errorMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [showViewerList, setShowViewerList] = useState<{ id: number; title: string } | null>(null);
  const queryClient = useQueryClient();

  // Initialize state from URL on mount
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    setSearch(urlSearch);

    setFilters({
      type: searchParams.get("type")?.split(",").filter(Boolean) || [],
      category: searchParams.get("category")?.split(",").filter(Boolean) || [],
      status: searchParams.get("status")?.split(",").filter(Boolean) || [],
      author: searchParams.get("author")?.split(",").filter(Boolean) || [],
    });
  }, []);

  // Update URL params whenever filters or search changes
  useEffect(() => {
    const timer = setTimeout(() => {
      updateURLParams({ search, filters });
    }, 300);

    return () => clearTimeout(timer);
  }, [filters, search]);

  const updateURLParams = useCallback(
    (params: {
      search?: string;
      filters?: InformationFilters;
      page?: number;
    }) => {
      const newParams = new URLSearchParams();

      if (params.search !== undefined && params.search) {
        newParams.set("search", params.search);
      }

      if (params.page !== undefined && params.page > 1) {
        newParams.set("page", params.page.toString());
      }

      if (params.filters) {
        const { type, category, status, author } = params.filters;

        if (type.length) newParams.set("type", type.join(","));
        if (category.length) newParams.set("category", category.join(","));
        if (status.length) newParams.set("status", status.join(","));
        if (author.length) newParams.set("author", author.join(","));
      }

      setSearchParams(newParams, { replace: true });
      setLastUpdated(new Date());
    },
    [setSearchParams]
  );

  // Build query parameters for API call
  const buildQueryParams = useCallback(
    (page: number, perPage: number | string) => {
      return {
        page,
        per_page: perPage === "All" ? 1000 : Number(perPage),
        search,
        type: filters.type[0] || '',
        category: filters.category[0] || '',
        status: filters.status[0] || '',
        author: filters.author[0] || '',
      };
    },
    [search, filters]
  );

  // Fetch data function for DataTable
  const fetchData = useCallback(
    async (page: number, perPage: number | string) => {
      const params = buildQueryParams(page, perPage);
      return nationalInformation.list({
        page: params.page,
        per_page: params.per_page,
        search: params.search,
        type: params.type,
        category: params.category,
        status: params.status,
        author: params.author,
      });
    },
    [buildQueryParams]
  );

  const filterKey = useMemo(
    () => ({ search, filters }),
    [search, filters]
  );

  const queryKey = ["national-information", filterKey, searchParams.toString()];

  // Fetch options
  const { data: options } = useQuery({
    queryKey: ["national-information-options"],
    queryFn: nationalInformation.options,
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["national-information-stats"],
    queryFn: nationalInformation.statistics,
  });

  // Delete mutation - UPDATED with proper loading state
  const deleteMutation = useMutation({
    mutationFn: (id: number) => nationalInformation.delete(id),
    onMutate: () => {
      setIsDeleting(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["national-information"] });
      queryClient.invalidateQueries({ queryKey: ["national-information-stats"] });
      setDeleteId(null);
      setIsDeleting(false);
      toast.success("Information deleted successfully");
      setSelectedRows(new Set());
    },
    onError: (error: any) => {
      setIsDeleting(false);
      toast.error(error.message || "Failed to delete information");
      setDeleteId(null);
    },
  });

  // Bulk update mutation - UPDATED with proper loading states
  const bulkUpdateMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: number[]; status: string }) =>
      nationalInformation.bulkUpdate(ids, status),
    onMutate: ({ status }) => {
      toast.loading(`${status === 'published' ? 'Publishing' : 'Archiving'} selected items...`);
    },
    onSuccess: (data, variables) => {
      const { status } = variables;
      queryClient.invalidateQueries({ queryKey: ["national-information"] });
      queryClient.invalidateQueries({ queryKey: ["national-information-stats"] });
      toast.success(`${status === 'published' ? 'Published' : 'Archived'} ${variables.ids.length} item(s) successfully`);
      setSelectedRows(new Set());
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update items");
    },
    onSettled: () => {
      toast.dismiss();
    },
  });

  const handleSearchChange = (value: string) => {
    setSearch(value);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      updateURLParams({ search: value, filters });
    }, 300);

    setSearchTimeout(timeout as unknown as NodeJS.Timeout);
  };

  const handleFilterReset = () => {
    const resetFilters: InformationFilters = {
      type: [],
      category: [],
      status: [],
      author: [],
    };
    setFilters(resetFilters);
    updateURLParams({ search, filters: resetFilters });
  };

  // FIXED: Delete handler
  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  // FIXED: Bulk update with loading states
  const handleBulkUpdate = (status: string) => {
    if (selectedRows.size > 0) {
      const ids = Array.from(selectedRows);
      bulkUpdateMutation.mutate({ ids, status });
    } else {
      toast.error("Please select items first");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-green-100 text-green-800";
      case "draft": return "bg-orange-100 text-yellow-800";
      case "archived": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "announcement": return <Megaphone className="w-4 h-4" />;
      case "news": return <Globe className="w-4 h-4" />;
      case "resource": return <BookOpen className="w-4 h-4" />;
      case "event": return <Calendar className="w-4 h-4" />;
      case "policy": return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  // Get type label
  const getTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      announcement: 'Announcement',
      news: 'News',
      resource: 'Resource',
      event: 'Event',
      policy: 'Policy',
      report: 'Report',
      update: 'Update',
    };
    return typeLabels[type] || type;
  };

  // Get filter options
  const filterOptions: Record<string, string[]> = {
    type: options?.types || [],
    category: options?.categories || [],
    status: options?.statuses || ["published", "draft", "archived"],
    author: options?.authors || [],
  };

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    Object.values(filters).forEach((filterArray) => {
      count += filterArray.length;
    });
    return count;
  };

  // Handle removing individual filter
  const handleRemoveFilter = (filterType: keyof InformationFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].filter(item => item !== value)
    }));
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Handle screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["national-information"] });
    setLastUpdated(new Date());
    toast.success("Data refreshed");
  };

  // Helper function to get view count
  const getViewCount = (articleItem: any): number | undefined => {
    return articleItem?.view_count ?? articleItem?.reader_count;
  };

  // Helper function to check if information is published
  const isPublished = (row: NationalInformation): boolean => {
    return row.status === 'published' && !!row.published_at;
  };

  // Handle title click for all statuses
  const handleTitleClick = (row: NationalInformation, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if the information is published
    if (!isPublished(row)) {
      toast.error("Please publish the information first to view details.");
      return;
    }
    
    // Log that user came from /information
    localStorage.setItem('navigation_source', '/information');
    localStorage.setItem('last_visited_list', Date.now().toString());
    
    // Navigate to detail page
    window.location.href = `/national-information/${row.public_uid}`;
  };

  // Define DataTable columns
  const columns: Column<NationalInformation>[] = [
    {
      key: "type",
      header: "Type",
      accessor: (row: NationalInformation) => (
        <div className="flex items-center gap-2">
          {getTypeIcon(row.type)}
          <span className="capitalize">{getTypeLabel(row.type)}</span>
        </div>
      ),
      mobilePriority: 1,
    },
    {
      key: "title",
      header: "Title",
      accessor: (row: NationalInformation) => {
        return (
          <span 
            className="font-medium text-gray-900 cursor-pointer hover:text-blue-600"
            onClick={(e) => handleTitleClick(row, e)}
            title={isPublished(row) ? "Click to view details" : "Publish first to view details"}
          >
            {row.title}
          </span>
        );
      },
      mobilePriority: 1,
    },
    {
      key: "content",
      header: "Content",
      accessor: (row: NationalInformation) => (
        <div className="text-sm text-gray-500 line-clamp-2">
          {row.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
        </div>
      ),
      mobilePriority: 2,
    },
    {
      key: "category",
      header: "Category",
      accessor: (row: NationalInformation) => (
        <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full capitalize">
          {row.category || "General"}
        </span>
      ),
      mobilePriority: 3,
    },
    {
      key: "author",
      header: "Author",
      accessor: (row: NationalInformation) => (
        <div className="text-sm text-gray-900">
          {row.author}
        </div>
      ),
      mobilePriority: 3,
    },
    {
      key: "status",
      header: "Status",
      accessor: (row: NationalInformation) => (
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(row.status)}`}>
            {row.status}
          </span>
        </div>
      ),
      mobilePriority: 2,
    },
    {
      key: "published_at",
      header: "Published",
      accessor: (row: NationalInformation) => {
        if (row.status === 'published' && row.published_at) {
          return (
            <div className="text-sm text-green-600">
              {formatDateTime(row.published_at)}
            </div>
          );
        } else if (row.status === 'draft') {
          return (
            <div className="text-sm text-yellow-600">
              Draft - Not published
            </div>
          );
        } else if (row.status === 'archived') {
          return (
            <div className="text-sm text-gray-600">
              Archived
            </div>
          );
        }
        return (
          <div className="text-sm text-gray-500">
            Not published
          </div>
        );
      },
      mobilePriority: 4,
    },
    {
      key: "view_count",
      header: "Views",
      accessor: (row: NationalInformation) => {
        const viewCount = getViewCount(row);
        const canViewDetails = isPublished(row);
        
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              
              if (!canViewDetails) {
                toast.error("Please publish the information first to view readers.");
                return;
              }
              
              setShowViewerList({ id: row.id, title: row.title });
            }}
            className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full transition-colors ${
              canViewDetails 
                ? 'text-gray-700 bg-gray-100 hover:bg-gray-200 cursor-pointer' 
                : 'text-gray-400 bg-gray-100 cursor-not-allowed'
            }`}
            title={canViewDetails 
              ? `${viewCount || 0} views - Click to see viewers` 
              : "Please publish first to view readers"
            }
            disabled={!canViewDetails}
          >
            <Users className="w-3 h-3" />
            <span>{viewCount || 0}</span>
          </button>
        );
      },
      mobilePriority: 3,
    },
    {
      key: "attachments",
      header: "Attachments",
      accessor: (row: NationalInformation) => (
        <div>
          {row.attachments && row.attachments.length > 0 ? (
            <Badge variant="gray" size="sm">
              {row.attachments.length} file{row.attachments.length !== 1 ? 's' : ''}
            </Badge>
          ) : (
            <span className="text-sm text-gray-400">None</span>
          )}
        </div>
      ),
      mobilePriority: 4,
    },
    {
      key: "created_at",
      header: "Created",
      accessor: (row: NationalInformation) => (
        <div className="text-sm text-gray-500">
          {formatDateTime(row.created_at)}
        </div>
      ),
      mobilePriority: 5,
    },
    {
      key: "updated_at",
      header: "Updated",
      accessor: (row: NationalInformation) => (
        <div className="text-sm text-gray-500">
          {formatDateTime(row.updated_at)}
        </div>
      ),
      mobilePriority: 5,
    },
  ];

  // Render actions for DataTable - FIXED
  const renderActions = (row: NationalInformation) => {
    const isRowPublished = isPublished(row);
    
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => setPreviewData(row)}
          className="p-1 text-gray-600 hover:text-blue-600"
          title="Preview"
          disabled={isDeleting}
        >
          <Eye size={16} />
        </button>
        <RoleGuard roles={[Roles.NATIONAL_ADMINISTRATOR]}>
          <button
            onClick={() => {
              console.log('Edit clicked for:', row);
              setEditData(row);
            }}
            className="p-1 text-gray-600 hover:text-yellow-600"
            title="Edit"
            disabled={isDeleting}
          >
            <Edit size={16} />
          </button>
          
          {/* SIMPLIFIED DELETE BUTTON - Single ConfirmationPopUp */}
          <ConfirmationPopUp
            message={`Are you sure you want to delete "${row.title}"?`}
            onConfirm={() => {
              setDeleteId(row.id);
              // Auto-trigger delete after confirmation
              setTimeout(() => handleDelete(), 100);
            }}
            confirmText="Delete"
            cancelText="Cancel"
          >
            <button 
              className="p-1 text-gray-600 hover:text-red-600 disabled:opacity-50" 
              title="Delete"
              disabled={isDeleting}
            >
              {isDeleting && deleteId === row.id ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
            </button>
          </ConfirmationPopUp>
        </RoleGuard>
        
        {/* View Details button for all items */}
        <button
          onClick={() => {
            if (!isRowPublished) {
              toast.error("Please publish the information first to view details.");
              return;
            }
            
            // Navigate to detail page for published items
            localStorage.setItem('navigation_source', '/information');
            localStorage.setItem('last_visited_list', Date.now().toString());
            window.location.href = `/national-information/${row.public_uid}`;
          }}
          className="p-1 text-gray-600 hover:text-green-600"
          title={isRowPublished ? "View Details" : "Publish first to view details"}
          disabled={isDeleting}
        >
          <Eye size={16} />
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col flex-1 p-4 md:p-5">
      {errorMessage && <AlertMessage type="error" message={errorMessage} />}

      {isMobile && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">National Information</h1>
            <p className="text-xs text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="p-2 text-gray-600 bg-white border border-gray-300 rounded-lg shadow-sm"
            disabled={isDeleting || bulkUpdateMutation.isPending}
          >
            {showMobileFilters ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      )}

      <div
        className={`flex flex-col gap-4 mb-4 ${
          isMobile && !showMobileFilters ? "hidden" : ""
        }`}
      >
        {!isMobile && (
          <header className="mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              National Information Management
            </h1>
            <p className="mt-2 text-gray-600">
              Manage announcements, news, resources, and policies
            </p>
          </header>
        )}

        {isLoadingStats ? (
          // Skeleton Loader for Stats Cards
          <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 bg-white rounded-lg shadow-sm animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="w-20 h-3 bg-gray-200 rounded"></div>
                    <div className="w-12 h-6 bg-gray-300 rounded"></div>
                  </div>
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 md:grid-cols-4">
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold">{stats.total || 0}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Published</p>
                  <p className="text-2xl font-bold">{stats.published || 0}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Drafts</p>
                  <p className="text-2xl font-bold">{stats.draft || 0}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Archived</p>
                  <p className="text-2xl font-bold">{stats.archived || 0}</p>
                </div>
                <Archive className="w-8 h-8 text-gray-500" />
              </div>
            </div>
          </div>
        ) : null}
        
        {/* Search Box */}
        <div className="flex-1">
          <SearchInput
            placeholder="Search by title, content, or author..."
            value={search}
            onChange={handleSearchChange}
            className="w-full"
            disabled={isDeleting || bulkUpdateMutation.isPending}
          />
          {search && (
            <p className="mt-1 text-xs text-gray-500">
              Search results update as you type
            </p>
          )}
        </div>

        {/* Controls Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* LEFT SIDE: Filter, Columns */}
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            {/* Filters Dropdown */}
            <FilterDropdown
              options={filterOptions}
              value={filters}
              onApply={(selected: any) => setFilters(selected)}
              onReset={handleFilterReset}
              buttonLabel="Filters"
              buttonIcon={<Filter size={16} />}
              size={isMobile ? "sm" : "md"}
              showCount={true}
              optionLabels={{
                type: (value: string) => getTypeLabel(value),
                category: (value: string) => value.charAt(0).toUpperCase() + value.slice(1),
                status: (value: string) => value.charAt(0).toUpperCase() + value.slice(1),
                author: (value: string) => value,
              }}
              disabled={isDeleting || bulkUpdateMutation.isPending}
            />

            {/* Columns Dropdown */}
            <FilterDropdown
              options={COLUMN_OPTIONS}
              defaultValue={{ columns: DEFAULT_COLUMNS }}
              value={{ columns: visibleCols }}
              onApply={(selected: any) => setVisibleCols(selected.columns)}
              onReset={() => setVisibleCols(DEFAULT_COLUMNS)}
              buttonLabel="Columns"
              buttonIcon={<Columns3 size={16} />}
              size={isMobile ? "sm" : "md"}
              disabled={isDeleting || bulkUpdateMutation.isPending}
            />
          </div>

          {/* RIGHT SIDE: Bulk Actions, Add New, Refresh */}
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            {/* Bulk Actions */}
            {selectedRows.size > 0 && (
              <>
                <button
                  onClick={() => handleBulkUpdate('published')}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white transition-colors bg-green-600 rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Publish Selected"
                  disabled={isDeleting || bulkUpdateMutation.isPending}
                >
                  {bulkUpdateMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  {bulkUpdateMutation.isPending ? 'Processing...' : `Publish (${selectedRows.size})`}
                </button>
                <button
                  onClick={() => handleBulkUpdate('archived')}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white transition-colors bg-gray-600 rounded-lg shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Archive Selected"
                  disabled={isDeleting || bulkUpdateMutation.isPending}
                >
                  {bulkUpdateMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Archive size={16} />
                  )}
                  {bulkUpdateMutation.isPending ? 'Processing...' : `Archive (${selectedRows.size})`}
                </button>
                <button
                  onClick={() => setSelectedRows(new Set())}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700 transition bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 disabled:opacity-50"
                  title="Clear Selection"
                  disabled={isDeleting || bulkUpdateMutation.isPending}
                >
                  <X size={16} />
                  Clear
                </button>
              </>
            )}

            <RoleGuard roles={[Roles.NATIONAL_ADMINISTRATOR]}>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition-colors bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 disabled:opacity-50"
                disabled={isDeleting || bulkUpdateMutation.isPending}
              >
                <Plus size={16} />
                Add New
              </button>
            </RoleGuard>

            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 transition bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 disabled:opacity-50"
              title="Refresh data"
              disabled={isDeleting || bulkUpdateMutation.isPending}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Active Filters Row */}
        {getActiveFilterCount() > 0 && (
          <div className="flex items-center justify-between w-full p-3 rounded-lg bg-blue-50">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-blue-700">
                Active Filters:
              </span>
              
              {filters.type.map((type) => (
                <div key={`type-${type}`} className="inline-flex items-center gap-1">
                  <Badge variant="primary" size="sm" className="capitalize">
                    Type: {getTypeLabel(type)}
                  </Badge>
                  <button
                    onClick={() => handleRemoveFilter('type', type)}
                    className="text-blue-400 hover:text-blue-600"
                    disabled={isDeleting || bulkUpdateMutation.isPending}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              
              {filters.category.map((category) => (
                <div key={`category-${category}`} className="inline-flex items-center gap-1">
                  <Badge variant="success" size="sm" className="capitalize">
                    Category: {category}
                  </Badge>
                  <button
                    onClick={() => handleRemoveFilter('category', category)}
                    className="text-green-400 hover:text-green-600"
                    disabled={isDeleting || bulkUpdateMutation.isPending}
                  >
                    <X size={12} />
                </button>
                </div>
              ))}
              
              {filters.status.map((status) => (
                <div key={`status-${status}`} className="inline-flex items-center gap-1">
                  <Badge variant="warning" size="sm" className="capitalize">
                    Status: {status}
                  </Badge>
                  <button
                    onClick={() => handleRemoveFilter('status', status)}
                    className="text-yellow-400 hover:text-yellow-600"
                    disabled={isDeleting || bulkUpdateMutation.isPending}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              
              {filters.author.map((author) => (
                <div key={`author-${author}`} className="inline-flex items-center gap-1">
                  <Badge variant="info" size="sm">
                    Author: {author}
                  </Badge>
                  <button
                    onClick={() => handleRemoveFilter('author', author)}
                    className="text-blue-400 hover:text-blue-600"
                    disabled={isDeleting || bulkUpdateMutation.isPending}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleFilterReset}
              className="text-sm font-medium text-red-600 hover:text-red-800 whitespace-nowrap disabled:opacity-50"
              disabled={isDeleting || bulkUpdateMutation.isPending}
            >
              Clear All Filters
            </button>
          </div>
        )}

        {!isMobile && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
              {(isDeleting || bulkUpdateMutation.isPending) && (
                <span className="ml-2 text-yellow-600">
                  • Processing...
                </span>
              )}
            </p>
            <p className="text-sm text-gray-500">
              {selectedRows.size > 0 && (
                <span className="font-semibold text-blue-600">
                  {selectedRows.size} selected • 
                </span>
              )}{' '}
              Use checkboxes to select items for bulk actions
            </p>
          </div>
        )}
      </div>

      {/* DataTable Component */}
      <div className="flex-1">
        <DataTable<NationalInformation>
          columns={columns}
          visibleColumns={visibleCols.filter(col => col !== 'selection' && col !== 'actions')}
          queryKey={queryKey}
          filterKey={filterKey}
          queryFn={fetchData}
          pagination={true}
          perPageOptions={[10, 25, 50, 100]}
          massSelection={true}
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          responsive={true}
          showRowNumbers={false}
          renderActions={renderActions}
          disabled={isDeleting || bulkUpdateMutation.isPending}
        />
      </div>

      {/* Viewer List Modal */}
      <ViewerListModal
        isOpen={!!showViewerList}
        articleId={showViewerList?.id}
        articleTitle={showViewerList?.title}
        onClose={() => setShowViewerList(null)}
      />

      {/* Create Modal */}
      <CreateModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({ 
            queryKey: ['national-information'] 
          });
          queryClient.invalidateQueries({ 
            queryKey: ['national-information-stats'] 
          });
          toast.success('Information created successfully');
        }}
        onError={(error: any) => {
          toast.error(error.message || 'Failed to create information');
        }}
      />

      {/* Update Modal - UPDATED: Remove mode prop since we fixed UpdateModal */}
      <UpdateModal
        isOpen={!!editData}
        onClose={() => setEditData(null)}
        data={editData}
        onSuccess={() => {
          queryClient.invalidateQueries({ 
            queryKey: ['national-information'] 
          });
          queryClient.invalidateQueries({ 
            queryKey: ['national-information-stats'] 
          });
          toast.success('Information updated successfully');
        }}
        onError={(error: any) => {
          toast.error(error.message || 'Failed to update information');
        }}
      />

      <PreviewModal
        data={previewData}
        isOpen={!!previewData}
        onClose={() => setPreviewData(null)}
      />
    </div>
  );
}