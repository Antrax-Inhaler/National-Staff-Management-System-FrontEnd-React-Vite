// src/pages/national/Information.tsx
import { useState, useEffect, useMemo, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import type { Column } from "@v1/components/ui/DataTable";
import SearchInput from "@v1/components/ui/SearchInput";
import DataTable from "@v1/components/ui/tables/DataTable";
import Badge from "@v1/components/ui/Badge";
import AlertMessage from "@v1/components/ui/AlertMessage";
import ConfirmationPopUp from "@v1/components/ui/ConfirmationPopUp";
import Modal from "@v1/components/ui/Modal";
import ViewerListModal from "@v1/components/ViewerListModal";
import { ActionButton } from "@v1/components/ui/ActionButton";
import AdvancedFilter, {
  clearAllFilters,
  removeFilterFromParams,
  renderActiveFilterBadges,
  type FilterConfig,
  type FilterSection,
} from "@v1/components/ui/AdvancedFilter";
import FilterDropdown from "@v1/components/ui/FilterDropdown";
import toast from "react-hot-toast";
import {
  Download,
  LoaderCircle,
  Trash2,
  Eye,
  FileText,
  Calendar,
  User,
  Archive,
  Globe,
  RefreshCw,
  ExternalLink,
  ArrowDownUp,
  Users,
  ListFilter,
  Rows3,
  LayoutGrid,
  Columns3,
  X,
} from "lucide-react";
import { nationalInformation } from "@v1/api/nationalInformation/index.ts";
import CreateInformation from "@v1/components/information/CreateInformation";
import EditInformation from "@v1/components/information/EditInformation";
import ViewInformation from "@v1/components/information/ViewInformation";
import { simpleFormatDate, formatDateTime } from "@v1/helpers/simpleDateUtils";

const DEFAULT_COLUMNS = [
  "title",
  "type",
  "category",
  "author",
  "status",
  "published_at",
  "view_count",
];

const COLUMN_OPTIONS = {
  columns: [
    "title",
    "type",
    "category",
    "author",
    "status",
    "content",
    "published_at",
    "created_at",
    "view_count",
    "reader_count",
  ],
};

// Filter Sections (similar to Affiliates structure)
const filter_options: FilterSection[] = [
  {
    title: "",
    description: "",
    icon: ListFilter,
    filters: [
      {
        key: "type",
        label: "Type",
        type: "checkbox",
        singleSelect: true,
        options: [
          { value: "announcement", label: "Announcement" },
          { value: "news", label: "News" },
          { value: "resource", label: "Resource" },
          { value: "event", label: "Event" },
          { value: "policy", label: "Policy" },
        ],
      },
      {
        key: "category",
        label: "Category",
        type: "checkbox",
        singleSelect: true,
        options: [
          { value: "general", label: "General" },
          { value: "membership", label: "Membership" },
          { value: "events", label: "Events" },
          { value: "resources", label: "Resources" },
          { value: "policies", label: "Policies" },
          { value: "updates", label: "Updates" },
        ],
      },
      {
        key: "status",
        label: "Status",
        type: "checkbox",
        singleSelect: true,
        options: [
          { value: "draft", label: "Draft" },
          { value: "published", label: "Published" },
          { value: "archived", label: "Archived" },
        ],
      },
    ],
  },
];

// Sort Filters
const sort_filters: FilterConfig[] = [
  {
    key: "sort_by",
    label: "Sort By",
    type: "select",
    options: [
      { label: "Title", value: "title" },
      { label: "Type", value: "type" },
      { label: "Category", value: "category" },
      { label: "Author", value: "author" },
      { label: "Published Date", value: "published_at" },
      { label: "Created Date", value: "created_at" },
      { label: "Views", value: "view_count" },
      { label: "Readers", value: "reader_count" },
    ],
  },
  {
    key: "sort_order",
    label: "Order",
    type: "select",
    options: [
      { label: "Ascending", value: "asc" },
      { label: "Descending", value: "desc" },
    ],
  },
];

// Interfaces
export interface NationalInformation {
  id: number;
  public_uid: string;
  type: 'announcement' | 'news' | 'resource' | 'event' | 'policy';
  title: string;
  content: string;
  category: string;
  author: string;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  created_at: string;
  updated_at: string;
  view_count?: number;
  reader_count?: number;
  total_views?: number;
  total_viewers?: number;
  is_unread?: boolean;
  attachments?: NationalInformationAttachment[];
  share_url?: string;
}

export interface NationalInformationAttachment {
  id: number;
  national_info_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  file_url?: string;
  created_at: string;
  updated_at: string;
}

export interface InformationFilters {
  type: string;
  category: string;
  status: string;
  author: string;
}

interface Statistics {
  total: number;
  published: number;
  draft: number;
  archived: number;
  unread: number;
  total_views: number;
  most_viewed: Array<{ title: string; unique_viewers: number }>;
  recent_views: any[];
  by_type: Record<string, number>;
  unread_by_type: Record<string, number>;
  by_category: Record<string, number>;
}

type BadgeVariantType = "success" | "warning" | "primary" | "danger" | "gray" | "info";

// Card component for Information (similar to Members card view)
const InformationCard = ({ 
  info, 
  onView,
  onEdit,
  onDelete,
  onShowViewers,
  isDeleting,
  isPublished
}: { 
  info: NationalInformation, 
  onView: () => void,
  onEdit: () => void,
  onDelete: () => void,
  onShowViewers: () => void,
  isDeleting: boolean,
  isPublished: boolean
}) => {
  const getTypeColor = (type: string): BadgeVariantType => {
    switch (type) {
      case "announcement": return "primary";
      case "news": return "success";
      case "resource": return "info";
      case "event": return "warning";
      case "policy": return "danger";
      default: return "gray";
    }
  };

  const getStatusColor = (status: string): BadgeVariantType => {
    switch (status) {
      case "published": return "success";
      case "draft": return "warning";
      case "archived": return "danger";
      default: return "gray";
    }
  };

  return (
    <div className="flex flex-col h-full p-3 transition-all duration-200 border border-gray-200 rounded-lg hover:shadow-sm hover:border-blue-200 bg-white">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="mb-1.5">
            <div className="flex items-start justify-between">
              <div className="group flex-1">
                <h3 className="text-xs font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors pr-2">
                  {info.title}
                </h3>
              </div>
              
              <div className="flex items-center gap-0.5">
                <button
                  onClick={onView}
                  className="p-1 text-gray-600 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  title="View details"
                >
                  <Eye className="w-3 h-3" />
                </button>
                
                <button
                  onClick={onEdit}
                  className="p-1 text-gray-600 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  title="Edit information"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            {info.content && (
              <div className="mt-0.5 text-[10px] text-gray-500 line-clamp-2">
                {info.content.replace(/<[^>]*>/g, "").substring(0, 120)}...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Basic Info - More compact */}
      <div className="space-y-1.5 mb-2">
        <div className="flex items-center gap-1">
          <User className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" />
          <span className="text-[10px] text-gray-700 line-clamp-1">{info.author}</span>
        </div>
        
        {info.published_at && (
          <div className="flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" />
            <span className="text-[10px] text-gray-700">
              {simpleFormatDate(info.published_at)}
            </span>
          </div>
        )}
      </div>

      {/* Badges - More compact */}
      <div className="flex flex-wrap gap-1 mb-2">
        <Badge
          variant={getTypeColor(info.type)}
          className="capitalize text-[10px] px-1.5 py-0.5"
        >
          {info.type}
        </Badge>
        
        <Badge
          variant={getStatusColor(info.status)}
          className="capitalize text-[10px] px-1.5 py-0.5"
        >
          {info.status}
        </Badge>
        
        <Badge variant="gray" className="text-[10px] px-1.5 py-0.5">
          {info.category}
        </Badge>
      </div>

      {/* View Count - More compact */}
      <div className="mt-auto pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Eye className="w-3 h-3 text-blue-500 flex-shrink-0" />
            <span className="text-[10px] font-medium text-gray-700">Views:</span>
            <span className="text-xs font-bold text-blue-600">
              {info.view_count || 0}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            {(info.view_count || 0) > 0 && (
              <button
                onClick={onShowViewers}
                className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline px-1.5 py-0.5 hover:bg-blue-50 rounded"
              >
                View list
              </button>
            )}
            
            <ConfirmationPopUp
              message={`Are you sure you want to delete "${info.title}"?`}
              onConfirm={onDelete}
            >
              <button
                disabled={isDeleting}
                className="p-0.5 text-red-600 rounded hover:bg-red-50 hover:text-red-700 transition-colors"
                title="Delete Information"
              >
                {isDeleting ? (
                  <LoaderCircle className="w-2.5 h-2.5 animate-spin" />
                ) : (
                  <Trash2 className="w-2.5 h-2.5" />
                )}
              </button>
            </ConfirmationPopUp>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Information() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [term, setTerm] = useState(searchParams.get("search") || "");
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [bulkAction, setBulkAction] = useState<string>("");
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState<NationalInformation | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [publishBulkModalOpen, setPublishBulkModalOpen] = useState(false);
  const [publishDate, setPublishDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [publishTime, setPublishTime] = useState<string>("09:00");
  const [viewerModalOpen, setViewerModalOpen] = useState(false);
  const [selectedArticleForViewers, setSelectedArticleForViewers] = useState<{
    id: number;
    title: string;
  } | null>(null);
  const [bulkLoading, setBulkLoading] = useState({
    status: false,
    publish: false,
    delete: false,
  });
  const [visibleCols, setVisibleCols] = useState<string[]>(DEFAULT_COLUMNS);

  const queryClient = useQueryClient();

  // Initialize state from URL params
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    const urlType = searchParams.get("type") || "";
    const urlCategory = searchParams.get("category") || "";
    const urlStatus = searchParams.get("status") || "";
    const urlAuthor = searchParams.get("author") || "";
    const urlSort = searchParams.get("sort") || "published_at:desc";

    setSearch(urlSearch);
    setTerm(urlSearch);

    // Update URL params to match our filter structure
    const newParams = new URLSearchParams();
    if (urlSearch) newParams.set("search", urlSearch);
    if (urlType) newParams.set("type", urlType);
    if (urlCategory) newParams.set("category", urlCategory);
    if (urlStatus) newParams.set("status", urlStatus);
    if (urlAuthor) newParams.set("author", urlAuthor);
    newParams.set("sort", urlSort);
    
    setSearchParams(newParams, { replace: true });
  }, []);

  // Update URL params when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      const newParams = new URLSearchParams();
      
      if (term) newParams.set("search", term);
      
      // Get current sort from URL or use default
      const currentSort = searchParams.get("sort") || "published_at:desc";
      if (currentSort) newParams.set("sort", currentSort);
      
      // Get filters from URL
      const type = searchParams.get("type");
      const category = searchParams.get("category");
      const status = searchParams.get("status");
      const author = searchParams.get("author");
      
      if (type) newParams.set("type", type);
      if (category) newParams.set("category", category);
      if (status) newParams.set("status", status);
      if (author) newParams.set("author", author);
      
      setSearchParams(newParams, { replace: true });
      setLastUpdated(new Date());
    }, 300);

    return () => clearTimeout(timer);
  }, [term, searchParams, setSearchParams]);

  // Build query parameters for API
  const buildQueryParams = useCallback(
    (page: number, perPage: number | string) => {
      const sort = searchParams.get("sort") || "published_at:desc";
      const [sort_by, sort_order] = sort.split(":");

      return {
        page,
        perPage,
        search: term,
        type: searchParams.get("type") || undefined,
        category: searchParams.get("category") || undefined,
        status: searchParams.get("status") || undefined,
        author: searchParams.get("author") || undefined,
        sort_by,
        sort_order,
      };
    },
    [term, searchParams]
  );

  const filterKey = useMemo(
    () => ({ 
      term, 
      type: searchParams.get("type"),
      category: searchParams.get("category"),
      status: searchParams.get("status"),
      author: searchParams.get("author"),
      sort: searchParams.get("sort")
    }),
    [term, searchParams]
  );

  const queryKey = [
    "national-information",
    filterKey,
    searchParams.toString(),
  ];

  // Fetch statistics
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["information-statistics"],
    queryFn: () => nationalInformation.statistics(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (statsData?.success) {
      setStatistics(statsData.data);
    }
  }, [statsData]);

  // Get active filters for AdvancedFilter
  const getActiveFilters = () => {
    const filters: Record<string, string> = {};
    const type = searchParams.get("type");
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const author = searchParams.get("author");
    
    if (type) filters.type = type;
    if (category) filters.category = category;
    if (status) filters.status = status;
    if (author) filters.author = author;
    
    return filters;
  };

  // Handle filter apply from AdvancedFilter
  const handleFilterApply = (params: URLSearchParams) => {
    setSearchParams(params);
    queryClient.invalidateQueries({ queryKey });
  };

  // Handle filter clear
  const handleClear = () => {
    const base_filters = filter_options.flatMap((section) => section.filters);
    const allFilters = [...base_filters, ...sort_filters];
    const clearedParams = clearAllFilters(searchParams, allFilters);
    setSearchParams(clearedParams);
    queryClient.invalidateQueries({ queryKey });
  };

  // Handle individual filter removal
  const handleRemoveFilter = (filterKey: string, value?: string | null) => {
    const newParams = removeFilterFromParams(
      searchParams,
      sort_filters,
      filterKey,
      value,
    );
    setSearchParams(newParams);
  };

  // Get active filter badges
  const ActiveSortBadges = renderActiveFilterBadges(
    searchParams,
    sort_filters,
    handleRemoveFilter,
  );

  // Search handler
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setTerm(value);
  };

  // Show viewer list
  const handleShowViewers = (info: NationalInformation) => {
    setSelectedArticleForViewers({
      id: info.id,
      title: info.title
    });
    setViewerModalOpen(true);
  };

  // View handler
  const handleView = (info: NationalInformation) => {
    setSelectedInfo(info);
    setViewModalOpen(true);
  };

  // Edit handler
  const handleEdit = (info: NationalInformation) => {
    // This will be handled by the EditInformation component
  };

  // Single delete handler
  const { mutate: deleteInfo, isPending: isDeleting } = useMutation({
    mutationFn: (id: number) => nationalInformation.destroy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Information deleted successfully");
      setLastUpdated(new Date());
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete information");
    },
  });

  const handleDelete = (info: NationalInformation) => {
    deleteInfo(info.id);
  };

  // Bulk operations
  const handleBulkStatusUpdate = async () => {
    if (selectedItems.size === 0 || !bulkStatus) return;

    setBulkLoading(prev => ({ ...prev, status: true }));
    const toastId = toast.loading(`Updating ${selectedItems.size} item(s)...`);

    try {
      const result = await nationalInformation.bulkUpdate({
        ids: Array.from(selectedItems),
        status: bulkStatus,
      });

      if (result.success) {
        toast.success(result.message, { id: toastId });
        setSelectedItems(new Set());
        setShowBulkModal(false);
        setBulkStatus("");
        queryClient.invalidateQueries({ queryKey });
        setLastUpdated(new Date());
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to perform bulk update", { id: toastId });
    } finally {
      setBulkLoading(prev => ({ ...prev, status: false }));
    }
  };

  // Bulk publish with date/time
  const handleBulkPublish = async () => {
    if (selectedItems.size === 0) return;

    setBulkLoading(prev => ({ ...prev, publish: true }));
    const toastId = toast.loading(`Scheduling ${selectedItems.size} item(s) for publish...`);

    const publishDateTime = new Date(`${publishDate}T${publishTime}`).toISOString();
    
    try {
      const result = await nationalInformation.bulkUpdate({
        ids: Array.from(selectedItems),
        status: 'published',
        publish_date: publishDate,
        publish_time: publishTime,
      });

      if (result.success) {
        toast.success(result.message, { id: toastId });
        setSelectedItems(new Set());
        setPublishBulkModalOpen(false);
        setPublishDate(new Date().toISOString().split('T')[0]);
        setPublishTime("09:00");
        queryClient.invalidateQueries({ queryKey });
        setLastUpdated(new Date());
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to perform bulk publish", { id: toastId });
    } finally {
      setBulkLoading(prev => ({ ...prev, publish: false }));
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;

    setBulkLoading(prev => ({ ...prev, delete: true }));
    const toastId = toast.loading(`Deleting ${selectedItems.size} item(s)...`);

    try {
      // Delete each item individually
      const promises = Array.from(selectedItems).map(id => 
        nationalInformation.destroy(id)
      );
      
      await Promise.all(promises);
      
      toast.success(`Successfully deleted ${selectedItems.size} item(s)`, { id: toastId });
      setSelectedItems(new Set());
      setShowBulkDeleteModal(false);
      queryClient.invalidateQueries({ queryKey });
      setLastUpdated(new Date());
      
    } catch (error: any) {
      toast.error(error?.message || "Failed to perform bulk delete", { id: toastId });
    } finally {
      setBulkLoading(prev => ({ ...prev, delete: false }));
    }
  };

  // Export handler
  const { mutateAsync: handleExport, isPending: exportLoading } = useMutation({
    mutationFn: async () => {
      const queryParams = buildQueryParams(1, "all");
      const response = await nationalInformation.list(queryParams);

      if (!response?.items?.length) {
        throw new Error("No data available to export");
      }

      const exportData = response.items;

      const headers = [
        "Title",
        "Type",
        "Category",
        "Author",
        "Status",
        "Content (First 100 chars)",
        "Published Date",
        "Created Date",
        "Updated Date",
        "Views",
        "Readers",
        "Public URL",
      ];

      const csvData = exportData.map((info: NationalInformation) => [
        info.title || "",
        info.type || "",
        info.category || "",
        info.author || "",
        info.status || "",
        (info.content || "").substring(0, 100).replace(/[,\n]/g, " "),
        info.published_at ? formatDateTime(info.published_at) : "",
        formatDateTime(info.created_at),
        formatDateTime(info.updated_at),
        (info.view_count || 0).toString(),
        (info.reader_count || 0).toString(),
        info.status === "published" ? `${window.location.origin}/national-information/${info.public_uid}` : "Not Published",
      ]);

      const csvContent = [
        headers.join(","),
        ...csvData.map((row: any) => row.map((field: any) => `"${field || ''}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      const fileName = `national_information_export_${
        new Date().toISOString().split("T")[0]
      }.csv`;

      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    },
    onSuccess: () => {
      toast.success("Export completed successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to export data");
    }
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ["information-statistics"] });
    setSelectedItems(new Set());
    setLastUpdated(new Date());
    toast.success("Data refreshed");
  };

  // Get type badge color
  const getTypeColor = (type: string): BadgeVariantType => {
    switch (type) {
      case "announcement": return "primary";
      case "news": return "success";
      case "resource": return "info";
      case "event": return "warning";
      case "policy": return "danger";
      default: return "gray";
    }
  };

  // Get status badge color
  const getStatusColor = (status: string): BadgeVariantType => {
    switch (status) {
      case "published": return "success";
      case "draft": return "warning";
      case "archived": return "danger";
      default: return "gray";
    }
  };

  // Check if item is published and viewable
  const isPublishedAndViewable = (info: NationalInformation): boolean => {
    return info.status === "published" && !!info.public_uid;
  };

  // Get active filter count for badge
  const getActiveFilterCount = () => {
    let count = 0;
    const filters = getActiveFilters();
    Object.values(filters).forEach((filter) => {
      if (filter) count++;
    });
    return count;
  };

  const columns: Column<NationalInformation>[] = [
    {
      key: "title",
      header: "Title",
      accessor: (row: NationalInformation) => (
        <div className="flex items-center gap-2">
          {row.is_unread && (
            <span className="w-2 h-2 bg-blue-500 rounded-full" title="Unread" />
          )}
          <div className="min-w-0">
            <div className="text-xs font-bold text-gray-900 truncate">
              {row.title}
            </div>
            {row.content && (
              <div className="text-xs text-gray-600 truncate">
                {row.content.replace(/<[^>]*>/g, "").substring(0, 80)}...
              </div>
            )}
          </div>
        </div>
      ),
      mobilePriority: 1,
    },
    {
      key: "type",
      header: "Type",
      accessor: (row: NationalInformation) => (
        <Badge
          variant={getTypeColor(row.type)}
          size="sm"
          className="capitalize"
        >
          {row.type}
        </Badge>
      ),
      mobilePriority: 2,
    },
    {
      key: "category",
      header: "Category",
      accessor: (row: NationalInformation) => (
        <span className="text-xs capitalize">{row.category}</span>
      ),
      mobilePriority: 3,
    },
    {
      key: "author",
      header: "Author",
      accessor: (row: NationalInformation) => (
        <div className="flex items-center gap-1">
          <User className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-700">{row.author}</span>
        </div>
      ),
      mobilePriority: 4,
    },
    {
      key: "status",
      header: "Status",
      accessor: (row: NationalInformation) => (
        <Badge
          variant={getStatusColor(row.status)}
          size="sm"
          className="capitalize"
        >
          {row.status}
        </Badge>
      ),
      mobilePriority: 2,
    },
    {
      key: "published_at",
      header: "Published",
      accessor: (row: NationalInformation) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">
              {row.published_at ? simpleFormatDate(row.published_at) : "Not published"}
            </span>
          </div>
          {row.published_at && (
            <div className="text-xs text-gray-400 pl-4">
              {formatDateTime(row.published_at).split(' ')[1] || ''}
            </div>
          )}
        </div>
      ),
      mobilePriority: 5,
    },
    {
      key: "view_count",
      header: "Views",
      accessor: (row: NationalInformation) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3 text-gray-400" />
            <span className="text-xs font-medium">{row.view_count || 0}</span>
            <span className="text-xs text-gray-400">/</span>
            <Users className="w-3 h-3 text-gray-400" />
            <span className="text-xs">{row.reader_count || 0}</span>
          </div>
          {(row.view_count || 0) > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleShowViewers(row);
              }}
              className="mt-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
            >
              View list
            </button>
          )}
        </div>
      ),
      mobilePriority: 6,
    },
  ];

  // Handle selection change from DataTable
  const handleSelectionChange = useCallback((selectedIds: Set<number>) => {
    setSelectedItems(selectedIds);
  }, []);

  // Render actions with public view link for published items
  const renderTableActions = (info: NationalInformation) => {
    const isPublished = isPublishedAndViewable(info);

    return (
      <div className="flex items-center gap-0.5">
        {/* View Details Button */}
        <button
          onClick={() => handleView(info)}
          className="p-1 text-gray-600 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors"
          title="View Details"
        >
          <Eye className="w-3 h-3" />
        </button>

        {/* Edit Button */}
        <EditInformation
          information={info}
          queryKey={queryKey}
        />

        {/* Public View Link (only for published items) */}
        {isPublished && (
          <Link
            to={`/national-information/${info.public_uid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 text-blue-600 rounded hover:bg-blue-50 hover:text-blue-700 transition-colors"
            title="Open in public view"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-3 h-3" />
          </Link>
        )}

        {/* Delete Button */}
        <ConfirmationPopUp
          message={`Are you sure you want to delete "${info.title}"?`}
          onConfirm={() => handleDelete(info)}
        >
          <button
            className="p-1 text-red-600 rounded hover:bg-red-50 hover:text-red-700 transition-colors"
            title="Delete Information"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <LoaderCircle className="w-3 h-3 animate-spin" />
            ) : (
              <Trash2 className="w-3 h-3" />
            )}
          </button>
        </ConfirmationPopUp>
      </div>
    );
  };

  const isFetching = queryClient.isFetching({ queryKey }) > 0;

  return (
    <div className="flex flex-col flex-1 p-3 bg-white rounded-lg shadow md:p-4">
      <div className="flex flex-col gap-3 mb-3">
        {/* HEADER SECTION - Same as Affiliates */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
          <header className="md:flex-1">
            <h1 className="text-xl font-bold text-gray-900">
              Information Management
            </h1>
            <p className="mt-1 text-xs text-gray-600">
              Manage announcements, news, resources, events, and policies
            </p>
          </header>

          <div className="flex flex-wrap items-start gap-1.5 md:gap-2 md:justify-end">
            <ActionButton
              label="Export CSV"
              icon={exportLoading ? LoaderCircle : Download}
              iconSize={12}
              loading={exportLoading}
              onClick={() => handleExport()}
              buttonClassName="bg-green-600! hover:bg-green-700 text-white font-semibold! text-xs px-2.5 py-1.5"
            />

            <CreateInformation />
          </div>
        </div>

        {/* Statistics Bar - Similar to Affiliates */}
        {statistics && (
          <div className="grid grid-cols-2 gap-2 mb-4 md:grid-cols-6">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="w-3 h-3 text-blue-500" />
                <span className="text-xs font-medium text-gray-600">Total</span>
              </div>
              <div className="mt-1 text-sm font-bold">{statistics.total}</div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Eye className="w-3 h-3 text-orange-500" />
                <span className="text-xs font-medium text-gray-600">Unread</span>
              </div>
              <div className="mt-1 text-sm font-bold">{statistics.unread}</div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Globe className="w-3 h-3 text-green-500" />
                <span className="text-xs font-medium text-gray-600">Views</span>
              </div>
              <div className="mt-1 text-sm font-bold">{statistics.total_views}</div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Archive className="w-3 h-3 text-purple-500" />
                <span className="text-xs font-medium text-gray-600">Archived</span>
              </div>
              <div className="mt-1 text-sm font-bold">{statistics.archived}</div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="w-3 h-3 text-green-500" />
                <span className="text-xs font-medium text-gray-600">Published</span>
              </div>
              <div className="mt-1 text-sm font-bold">{statistics.published}</div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="w-3 h-3 text-yellow-500" />
                <span className="text-xs font-medium text-gray-600">Draft</span>
              </div>
              <div className="mt-1 text-sm font-bold">{statistics.draft}</div>
            </div>
          </div>
        )}

        {/* CONTROLS SECTION - Same as Affiliates */}
        <div className="flex flex-col lg:flex-row gap-3">
          {/* LEFT SIDE: Filter, Sort, View Toggle, Refresh */}
          <div className="flex flex-wrap items-center gap-2 lg:flex-1">
            <AdvancedFilter
              label="Filters"
              title="Filters"
              onApply={handleFilterApply}
              sections={filter_options}
              searchParams={searchParams}
              onClear={handleClear}
              activeFilter={getActiveFilterCount() > 0 || ActiveSortBadges.length > 0}
              customActiveBadges={
                <>
                  {ActiveSortBadges.length > 0 ? <>{ActiveSortBadges}</> : null}
                </>
              }
              customRender={
                <>
                  <AdvancedFilter
                    label="Sort"
                    showActiveFilters={false}
                    showClearButton={false}
                    icon={ArrowDownUp}
                    onApply={handleFilterApply}
                    filters={sort_filters}
                    title="Sort Filter"
                    searchParams={searchParams}
                  />
                  
                  <FilterDropdown
                    options={COLUMN_OPTIONS}
                    defaultValue={{ columns: DEFAULT_COLUMNS }}
                    value={{ columns: visibleCols }}
                    onApply={(selected: any) => setVisibleCols(selected.columns)}
                    onReset={() => setVisibleCols(DEFAULT_COLUMNS)}
                    buttonLabel="Columns"
                    icon={Columns3}
                  />
                  
                  {/* View Mode Toggle - Same as Affiliates */}
                  <div className="inline-flex items-center gap-0 px-1 py-1 bg-white border border-gray-300 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setViewMode("card")}
                      disabled={isFetching}
                      title="Card view"
                      className={`
                        inline-flex items-center justify-center
                        px-3 py-1.5 text-xs
                        rounded-md transition-all
                        ${
                          viewMode === "card"
                            ? "bg-gray-900 text-white shadow-sm"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }
                        ${isFetching ? "opacity-50 cursor-not-allowed" : ""}
                      `}
                    >
                      <LayoutGrid size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("table")}
                      disabled={isFetching}
                      title="Table view"
                      className={`
                        inline-flex items-center justify-center
                        px-3 py-1.5 text-xs
                        rounded-md transition-all
                        ${
                          viewMode === "table"
                            ? "bg-gray-900 text-white shadow-sm"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }
                        ${isFetching ? "opacity-50 cursor-not-allowed" : ""}
                      `}
                    >
                      <Rows3 size={14} />
                    </button>
                  </div>
                  
                  <ActionButton
                    onClick={handleRefresh}
                    label="Refresh"
                    icon={RefreshCw}
                    iconSize={14}
                    loading={isFetching}
                    buttonClassName="px-3 py-1.5 text-xs"
                  />
                </>
              }
            />
          </div>

          {/* RIGHT SIDE: Search - Same as Affiliates */}
          <div className="lg:w-64">
            <SearchInput
              placeholder="Search by title, content, or author..."
              value={search}
              onChange={handleSearchChange}
              showClear
            />
          </div>
        </div>

        {/* Active Filters Display - Similar to Affiliates */}
        {getActiveFilterCount() > 0 && (
          <div className="py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-700">Active Filters:</span>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(getActiveFilters()).map(([key, value]) => (
                    value && (
                      <span
                        key={key}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-lg"
                      >
                        <span className="font-medium">
                          {key === 'type' ? 'Type' : 
                           key === 'category' ? 'Category' : 
                           key === 'status' ? 'Status' : 
                           key === 'author' ? 'Author' : key}:
                        </span>
                        <span>{value}</span>
                        <button
                          onClick={() => handleRemoveFilter(key)}
                          className="ml-1 text-blue-500 hover:text-blue-700"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    )
                  ))}
                </div>
              </div>
              <button
                onClick={handleClear}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 hover:bg-gray-100 rounded"
              >
                Clear all
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Items Bar */}
      {selectedItems.size > 0 && (
        <div className="p-2 mb-3 border border-blue-200 rounded-lg bg-blue-50">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-blue-800">
              {selectedItems.size} Item{selectedItems.size !== 1 ? "s" : ""} selected
            </p>
            <div className="flex gap-1.5">
              <select
                value={bulkAction}
                onChange={(e) => {
                  const value = e.target.value;
                  setBulkAction(value);
                  if (value === "status") {
                    setShowBulkModal(true);
                  } else if (value === "publish") {
                    setPublishBulkModalOpen(true);
                  } else if (value === "delete") {
                    setShowBulkDeleteModal(true);
                  }
                }}
                className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Bulk Actions</option>
                <option value="status">Change Status</option>
                <option value="publish">Schedule Publish</option>
                <option value="delete">Delete Selected</option>
              </select>
              <ActionButton
                label="Clear"
                onClick={() => setSelectedItems(new Set())}
                iconSize={12}
                buttonClassName="px-2.5 py-1.5 text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* DataTable */}
      <div className="flex-1">
        <DataTable<NationalInformation>
          columns={columns}
          view={viewMode}
          massSelection={viewMode === "table"}
          queryKey={queryKey}
          queryFn={() => {
            const params = buildQueryParams(1, 20);
            return nationalInformation.list(params);
          }}
          selectedRows={selectedItems}
          onSelectionChange={handleSelectionChange}
          visibleColumns={visibleCols}
          renderActions={renderTableActions}
          renderCard={(info: NationalInformation, idx: number) => (
            <div
              key={info.id}
              className="h-full transition-all duration-200 animate-fadeIn"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <InformationCard 
                info={info} 
                onView={() => handleView(info)}
                onEdit={() => handleEdit(info)}
                onDelete={() => handleDelete(info)}
                onShowViewers={() => handleShowViewers(info)}
                isDeleting={isDeleting}
                isPublished={isPublishedAndViewable(info)}
              />
            </div>
          )}
        />
      </div>

      {/* Last Updated */}
      <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
        <p>Last updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        <p>Data as of: {new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</p>
      </div>

      {/* Modals */}
      {/* Bulk Status Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => {
          setShowBulkModal(false);
          setBulkStatus("");
        }}
        title="Bulk Status Update"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Update status for {selectedItems.size} selected item(s)
          </p>
          
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-700">
              New Status
            </label>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <ActionButton
              onClick={() => {
                setShowBulkModal(false);
                setBulkStatus("");
              }}
              label="Cancel"
              buttonClassName="px-3 py-1.5"
            />
            <ActionButton
              onClick={handleBulkStatusUpdate}
              disabled={!bulkStatus || bulkLoading.status}
              label={bulkLoading.status ? "Updating..." : "Update Status"}
              loading={bulkLoading.status}
              buttonClassName="bg-blue-700! text-white! hover:bg-blue-800! px-3 py-1.5"
            />
          </div>
        </div>
      </Modal>

      {/* Bulk Publish Modal */}
      <Modal
        isOpen={publishBulkModalOpen}
        onClose={() => {
          setPublishBulkModalOpen(false);
          setPublishDate(new Date().toISOString().split('T')[0]);
          setPublishTime("09:00");
        }}
        title="Schedule Bulk Publish"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Schedule publish for {selectedItems.size} selected item(s)
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">
                Publish Date
              </label>
              <input
                type="date"
                value={publishDate}
                onChange={(e) => setPublishDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">
                Publish Time
              </label>
              <input
                type="time"
                value={publishTime}
                onChange={(e) => setPublishTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="p-3 text-xs text-gray-600 bg-yellow-50 rounded-md">
            <p className="font-medium">Note:</p>
            <p>Items will be published on {publishDate} at {publishTime}</p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <ActionButton
              onClick={() => {
                setPublishBulkModalOpen(false);
                setPublishDate(new Date().toISOString().split('T')[0]);
                setPublishTime("09:00");
              }}
              label="Cancel"
              buttonClassName="px-3 py-1.5"
            />
            <ActionButton
              onClick={handleBulkPublish}
              disabled={bulkLoading.publish}
              label={bulkLoading.publish ? "Scheduling..." : "Schedule Publish"}
              loading={bulkLoading.publish}
              buttonClassName="bg-green-600! text-white! hover:bg-green-700! px-3 py-1.5"
            />
          </div>
        </div>
      </Modal>

      {/* Bulk Delete Modal */}
      <Modal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        title="Confirm Bulk Delete"
      >
        <div className="space-y-4">
          <div className="p-4 text-xs text-red-600 bg-red-50 rounded-md">
            <p className="font-medium">Warning!</p>
            <p>You are about to delete {selectedItems.size} item(s). This action cannot be undone.</p>
          </div>
          
          <p className="text-sm text-gray-600">
            Are you sure you want to permanently delete {selectedItems.size} selected item(s)?
          </p>

          <div className="flex justify-end gap-2 pt-4">
            <ActionButton
              onClick={() => setShowBulkDeleteModal(false)}
              label="Cancel"
              buttonClassName="px-3 py-1.5"
            />
            <ActionButton
              onClick={handleBulkDelete}
              disabled={bulkLoading.delete}
              label={bulkLoading.delete ? "Deleting..." : `Delete ${selectedItems.size} Items`}
              loading={bulkLoading.delete}
              buttonClassName="bg-red-600! text-white! hover:bg-red-700! px-3 py-1.5"
            />
          </div>
        </div>
      </Modal>

      {/* View Information Modal */}
      {selectedInfo && (
        <ViewInformation
          info={selectedInfo}
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedInfo(null);
          }}
        />
      )}

      {/* Viewer List Modal */}
      {selectedArticleForViewers && (
        <ViewerListModal
          isOpen={viewerModalOpen}
          articleId={selectedArticleForViewers.id}
          articleTitle={selectedArticleForViewers.title}
          onClose={() => {
            setViewerModalOpen(false);
            setSelectedArticleForViewers(null);
          }}
        />
      )}
    </div>
  );
}