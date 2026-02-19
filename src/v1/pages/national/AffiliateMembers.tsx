import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArchiveX,
  Columns3,
  Download,
  Eye,
  LoaderCircle,
  Menu,
  RefreshCw,
  Calendar,
  Trash2,
  MapPin,
  X,
  Users,
  Tag,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Link,
  useOutletContext,
  useParams,
  useSearchParams,
} from "react-router-dom";
import ClickableAvatar from "../../../components/ui/ClickableAvatar";
import ImageModal from "../../../components/ui/ImageModal";
import {
  members,
  type memberFilter as ApiMemberFilter,
  type Member,
} from "../../api/member";
import CreateMember from "../../components/members/CreateMember";
import EditMember from "../../components/members/EditMember";
import RoleGuard from "../../components/RoleGuard";
import AlertMessage from "../../components/ui/AlertMessage";
import Badge from "../../components/ui/Badge";
import ConfirmationPopUp from "../../components/ui/ConfirmationPopUp";
import type { Column } from "../../components/ui/DataTable";
import DataTable from "../../components/ui/DataTable";
import FilterDropdown from "../../components/ui/FilterDropdown";
import SearchInput from "../../components/ui/SearchInput";
import { Committees, Roles } from "../../constants/roles";
import { SORT_OPTIONS } from "../../constants/sortOptions";
import { useAuth } from "../../contexts/AuthContext";
import MemberFilters, { type MemberFiltersState } from "@v1/components/members/MemberFilters";
import SortDropdown from "@v1/components/ui/SortDropdown";
import { Positions } from "@v1/constants/positions";
import { format, parseISO, isValid } from 'date-fns';
import {
  simpleFormatDate, extractAndFormatDate
} from "@v1/helpers/simpleDateUtils";

// Define local FilterOptions type
interface FilterOptions {
  [key: string]: string[];
}

// Define local memberFilter interface that matches your usage
interface MemberFilter {
  positions: string[]; // For specific positions
  employment_status: string[];
  level: string[];
  gender: string[];
  status: string[];
  has_position: string[];
  has_email: string[];
  has_phone: string[];
  affiliate?: string[]; // For "With Affiliate"/"Without Affiliate" filter
  position?: string[]; // Legacy position filter
}

const DEFAULT_COLUMNS = [
  "member_id",
  "member",
  "affiliate",
  "position",
  "level",
  "employment_status",
  "city",
  "email",
  "mobile_phone",
  "updated_at",
];

const COLUMN_OPTIONS = {
  columns: [
    "member_id",
    "member",
    "affiliate",
    "position",
    "level",
    "employment_status",
    "gender",
    "date_of_birth",
    "date_of_hire",
    "city",
    "state",
    "zip_code",
    "email",
    "mobile_phone",
    "work_phone",
    "home_phone",
    "self_id",
    "non_nso",
    "status",
    "updated_at",
  ],
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return "Not set";
  
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) {
      return "Invalid date";
    }
    return format(date, 'MM/dd/yyyy');
  } catch (error) {
    // Try alternative parsing for different date formats
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

const formatExportDate = (dateString: string | null): string => {
  if (!dateString) return "";
  
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) {
      return "";
    }
    return format(date, 'MM/dd/yyyy');
  } catch (error) {
    try {
      const date = new Date(dateString);
      if (!isValid(date)) {
        return "";
      }
      return format(date, 'MM/dd/yyyy');
    } catch {
      return "";
    }
  }
};

export default function AffiliateMembers() {
  const { id: affiliateId } = useParams<{ id?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { region } = useOutletContext();

  // Initialize state from URL params
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [filters, setFilters] = useState<MemberFilter>({
    positions: searchParams.get("positions")?.split(",").filter(Boolean) || [],
    employment_status:
      searchParams.get("employment_status")?.split(",").filter(Boolean) || [],
    level: searchParams.get("level")?.split(",").filter(Boolean) || [],
    gender: searchParams.get("gender")?.split(",").filter(Boolean) || [],
    status: searchParams.get("status")?.split(",").filter(Boolean) || [],
    has_position:
      searchParams.get("has_position")?.split(",").filter(Boolean) || [],
    has_email: searchParams.get("has_email")?.split(",").filter(Boolean) || [],
    has_phone: searchParams.get("has_phone")?.split(",").filter(Boolean) || [],
    // Legacy position filter for backward compatibility
    position: searchParams.get("position")?.split(",").filter(Boolean) || [],
  });

  const [sortBy, setSortBy] = useState(
    searchParams.get("sort") || "last_name:asc"
  );
  const [term, setTerm] = useState(searchParams.get("search") || "");
  const [visibleCols, setVisibleCols] = useState<string[]>(DEFAULT_COLUMNS);
  const { userRole } = useAuth();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [archiving, setArchiving] = useState<boolean>(false);
  const [archivedId, setArchivedId] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    alt: string;
  } | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  const updateURLParams = useCallback(
    (params: {
      search?: string;
      filters?: MemberFilter;
      sort?: string;
      page?: number;
    }) => {
      const newParams = new URLSearchParams();

      if (params.search !== undefined) {
        if (params.search) newParams.set("search", params.search);
      }

      if (params.page !== undefined && params.page > 1) {
        newParams.set("page", params.page.toString());
      }

      if (params.sort !== undefined) {
        if (params.sort) newParams.set("sort", params.sort);
      }

      if (params.filters) {
        const {
          positions,
          employment_status,
          level,
          gender,
          status,
          has_position,
          has_email,
          has_phone,
          position, // Legacy
        } = params.filters;

        // Handle positions filter
        if (positions.length) newParams.set("positions", positions.join(","));
        if (position?.length) newParams.set("position", position.join(","));
        if (employment_status.length) newParams.set("employment_status", employment_status.join(","));
        if (level.length) newParams.set("level", level.join(","));
        if (gender.length) newParams.set("gender", gender.join(","));
        if (status.length) newParams.set("status", status.join(","));
        if (has_position.length) newParams.set("has_position", has_position.join(","));
        if (has_email.length) newParams.set("has_email", has_email.join(","));
        if (has_phone.length) newParams.set("has_phone", has_phone.join(","));
      }

      setSearchParams(newParams, { replace: true });
      setLastUpdated(new Date());
    },
    [setSearchParams]
  );

  // Build query parameters for API call
  const buildQueryParams = useCallback(
    (page: number, perPage: number | string) => {
      const [sort_by, sort_order] = sortBy.split(":");

      // Transform filters for API - handle "Not Set" and boolean filters
      const apiFilters: Partial<ApiMemberFilter> = {
        employment_status: filters.employment_status.filter(
          (status) => status !== "Not Set"
        ),
        level: filters.level.filter((lvl) => lvl !== "Not Set"),
        gender: filters.gender.filter((g) => g !== "Not Set"),
        status: filters.status.filter((s) => s !== "Not Set"),
      };

      // Handle specific positions filter for affiliate members
      if (filters.positions.length > 0) {
        apiFilters.positions = filters.positions;
        apiFilters.specific_positions = filters.positions;
      }

      // Handle legacy position filter
      if (filters.position && filters.position.length > 0) {
        apiFilters.position = filters.position.filter(pos => pos !== "Not Set");
      }

      // Handle boolean filters - only add them if they have values
      if (filters.has_position.includes("Has Position")) {
        apiFilters.has_position = true;
      } else if (filters.has_position.includes("No Position")) {
        apiFilters.has_position = false;
      }

      if (filters.has_email.includes("Has Email")) {
        apiFilters.has_email = true;
      } else if (filters.has_email.includes("No Email")) {
        apiFilters.has_email = false;
      }

      if (filters.has_phone.includes("Has Phone")) {
        apiFilters.has_phone = true;
      } else if (filters.has_phone.includes("No Phone")) {
        apiFilters.has_phone = false;
      }

      return {
        page,
        perPage,
        search: term,
        filters: apiFilters as ApiMemberFilter,
        sort_by,
        sort_order,
      };
    },
    [term, filters, sortBy]
  );

  const filterKey = useMemo(
    () => ({ term, filters, sortBy }),
    [term, filters, sortBy]
  );

  const queryKey = [
    `members-${affiliateId}`,
    affiliateId,
    filterKey,
    searchParams.toString(),
  ];

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const { mutate: removeUser } = useMutation({
    mutationFn: ({ id, force }: { id: number; force: boolean }) =>
      members.remove(id, force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`members-${affiliateId}`] });
      setDeleting(false);
      setDeleteId(null);
      setLastUpdated(new Date());
    },
    onError: async (err: any) => {
      if (err?.message) setErrorMessage(err.message);
      setDeleting(false);
      setDeleteId(null);
    },
  });

  // Search function with immediate update when input changes
  const handleSearchChange = (value: string) => {
    setSearch(value);

    // Update URL immediately as user types
    const newTerm = value.trim();
    setTerm(newTerm);

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (value === "") {
      // Immediately clear the search when input is empty
      updateURLParams({ search: "", filters, sort: sortBy });
      return;
    }

    // Update URL params immediately for better UX
    updateURLParams({ search: newTerm, filters, sort: sortBy });

    // Also set a timeout to trigger the actual search if needed
    const timeout = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey });
    }, 300);

    setSearchTimeout(timeout as unknown as NodeJS.Timeout);
  };

  const handleFilterChange = (newFilters: MemberFiltersState) => {
    const updatedFilters: MemberFilter = {
      positions: newFilters.positions,
      employment_status: newFilters.employment_status,
      level: newFilters.level,
      gender: newFilters.gender,
      status: newFilters.status,
      has_position: newFilters.has_position,
      has_email: newFilters.has_email,
      has_phone: newFilters.has_phone,
      position: filters.position, // Keep legacy position filter
    };
    setFilters(updatedFilters);
    updateURLParams({ search: term, filters: updatedFilters, sort: sortBy });
  };

  const handleFilterReset = () => {
    const resetFilters: MemberFilter = {
      positions: [],
      employment_status: [],
      level: [],
      gender: [],
      status: [],
      has_position: [],
      has_email: [],
      has_phone: [],
      position: [],
    };
    setFilters(resetFilters);
    updateURLParams({ search: term, filters: resetFilters, sort: sortBy });
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    updateURLParams({ search: term, filters, sort: value });
  };

  const handleDelete = (id: number) => {
    setDeleting(true);
    setDeleteId(id);
    setErrorMessage("");
    removeUser({
      id,
      force: true,
    });
  };

  const handleArchived = (id: number) => {
    setArchiving(true);
    setArchivedId(id);
    removeUser({
      id,
      force: false,
    });
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);
      setErrorMessage("");

      // Build query params with perPage set to "all" to get all results
      const [sort_by, sort_order] = sortBy.split(":");

      // Transform filters for API - handle "Not Set" and boolean filters
      const apiFilters: Partial<ApiMemberFilter> = {
        employment_status: filters.employment_status.filter(
          (status) => status !== "Not Set"
        ),
        level: filters.level.filter((lvl) => lvl !== "Not Set"),
        gender: filters.gender.filter((g) => g !== "Not Set"),
        status: filters.status.filter((s) => s !== "Not Set"),
      };

      // Handle specific positions filter for affiliate members
      if (filters.positions.length > 0) {
        apiFilters.positions = filters.positions;
        apiFilters.specific_positions = filters.positions;
      }

      // Handle legacy position filter
      if (filters.position && filters.position.length > 0) {
        apiFilters.position = filters.position.filter(pos => pos !== "Not Set");
      }

      // Handle boolean filters - only add them if they have values
      if (filters.has_position.includes("Has Position")) {
        apiFilters.has_position = true;
      } else if (filters.has_position.includes("No Position")) {
        apiFilters.has_position = false;
      }

      if (filters.has_email.includes("Has Email")) {
        apiFilters.has_email = true;
      } else if (filters.has_email.includes("No Email")) {
        apiFilters.has_email = false;
      }

      if (filters.has_phone.includes("Has Phone")) {
        apiFilters.has_phone = true;
      } else if (filters.has_phone.includes("No Phone")) {
        apiFilters.has_phone = false;
      }

      // Fetch ALL data with perPage set to a very large number or "all"
      const response = await members.affiliate({
        id: affiliateId,
        page: 1, // Start from page 1
        perPage: 10000, // Set a very high number to get all results
        search: term,
        filters: apiFilters as ApiMemberFilter,
        sort_by,
        sort_order,
      });

      if (!response?.items?.length) {
        setErrorMessage("No data available to export");
        return;
      }

      const headers = [
        "Member ID",
        "First Name",
        "Last Name",
        "Affiliate",
        "Position(s)",
        "Level",
        "Employment Status",
        "Gender",
        "Date of Birth",
        "Date of Hire",
        "City",
        "State",
        "Zip Code",
        "Personal Email",
        "Mobile Phone",
        "Home Phone",
        "Ethnicity",
        "Non NSO",
        "Status",
        "Updated At",
        "Created At",
      ];

      const csvData = response.items.map((member: Member) => [
        member.member_id || "",
        member.first_name || "",
        member.last_name || "",
        member.affiliate?.name || "",
        // Handle multiple positions in export
        member.current_positions && member.current_positions.length > 0
          ? member.current_positions.map(pos => pos.position.name).join("; ")
          : "Member",
        member.level || "",
        member.employment_status || "",
        member.gender
          ? member.gender.charAt(0).toUpperCase() + member.gender.slice(1)
          : "",
        formatExportDate(member.date_of_birth),
        formatExportDate(member.date_of_hire),
        member.city || "",
        member.state || "",
        member.zip_code || "",
        member.work_email || "",
        member.mobile_phone || "",
        member.home_phone || "",
        member.self_id || "",
        member.non_ORG ? "Yes" : "No",
        member.status || "",
        formatExportDate(member.updated_at),
        formatExportDate(member.created_at),
      ]);

      const csvContent = [
        headers.join(","),
        ...csvData.map((row: any[]) =>
          row.map((field: any) => `"${String(field || '').replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      const fileName = `ORG_members_export_${
        new Date().toISOString().split("T")[0]
      }.csv`;

      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error: any) {
      console.error("Export error:", error);
      setErrorMessage(error?.message || "Failed to export data. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: [`members-${affiliateId}`] });
    setLastUpdated(new Date());
  };

  const handleClearSearch = () => {
    setSearch("");
    setTerm("");
    updateURLParams({ search: "", filters, sort: sortBy });
  };

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    Object.values(filters).forEach((filterArray) => {
      if (Array.isArray(filterArray)) {
        count += filterArray.length;
      }
    });
    return count;
  };

  // Handle removing individual filter
  const handleRemoveFilter = (filterType: keyof MemberFilter, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: Array.isArray(prev[filterType]) 
        ? prev[filterType].filter(item => item !== value)
        : []
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

  // Get initials for member
  const getMemberInitials = (firstName: string, lastName: string) => {
    if (!firstName && !lastName) return "M";
    return `${firstName?.charAt(0) || ""}${
      lastName?.charAt(0) || ""
    }`.toUpperCase();
  };

  // Get color based on level
  const getMemberLevelColor = (level?: string) => {
    switch (level) {
      case "Associate":
        return "blue";
      case "Professional":
        return "purple";
      default:
        return "gray";
    }
  };

  const columns: Column<Member>[] = [
    {
      key: "member_id",
      header: "Member ID",
      accessor: (row: Member) => (
        <span className="font-bold">{row.member_id || "N/A"}</span>
      ),
      mobilePriority: 1,
    },
    {
      key: "member",
      header: "Member",
      accessor: (row: Member) => (
        <div className="flex items-center gap-2">
          <ClickableAvatar
            imageUrl={row.profile_photo_url}
            alt={`${row.first_name || ""} ${row.last_name || ""}`}
            fallbackText={getMemberInitials(row.first_name, row.last_name)}
            size="md"
            variant="circle"
            bgColor={getMemberLevelColor(row.level)}
            fallbackIcon={<Users className="w-5 h-5 text-white" />}
            onClick={() => {
              if (row.profile_photo_url) {
                setSelectedImage({
                  url: row.profile_photo_url,
                  alt: `${row.first_name} ${row.last_name}`,
                });
              }
            }}
            className="flex-shrink-0 border border-gray-200 shadow-sm hover:shadow-md"
          />
          <div className="min-w-0">
            <div className="font-bold text-gray-900 truncate">
              {row.last_name || "Unknown"}, {row.first_name || "Unknown"}
            </div>
            {row.date_of_birth && (
              <div className="flex items-center gap-1 mt-1 text-sm text-gray-600">
                <Calendar className="flex-shrink-0 w-3 h-3" />
                <span className="truncate">
                  {extractAndFormatDate(row.date_of_birth)}
                </span>
              </div>
            )}
          </div>
        </div>
      ),
      mobilePriority: 1,
    },
    {
      key: "affiliate",
      header: "Affiliate",
      accessor: (row: Member) => (
        <div className="space-y-1">
          {row.affiliate?.name ? (
            <Link
              to={`/affiliates/${row.affiliate.public_uid}/members`}
              className="flex items-center gap-1 transition-colors hover:text-blue-600"
            >
              <span className="text-gray-700 truncate hover:text-blue-600">
                {row.affiliate.name}
              </span>
            </Link>
          ) : (
            <span className="text-sm text-gray-500">No affiliate</span>
          )}
        </div>
      ),
      mobilePriority: 4,
    },
{
  key: "position",
  header: "Position(s)",
  accessor: (row: Member) => {
    // Debug logging
    console.log('Member positions:', {
      id: row.id,
      name: `${row.first_name} ${row.last_name}`,
      hasCurrentPositions: !!row.current_positions,
      currentPositionsLength: row.current_positions?.length || 0,
      currentPositions: row.current_positions,
      hasCurrentPosition: !!row.current_position,
      currentPosition: row.current_position
    });
    
    // Check if member has positions from either field
    const positions = row.current_positions || (row.current_position ? [row.current_position] : []);
    const hasPositions = positions.length > 0;
    
    if (!hasPositions) {
      return (
        <Badge variant="gray" size="sm" className="capitalize">
          Member
        </Badge>
      );
    }
    
    return (
      <div className="flex flex-wrap gap-1">
        {positions.map((pos, index) => (
          <Badge
            key={pos.id || index}
            variant="primary"
            size="sm"
            className="font-medium capitalize hover:scale-105 transition-transform cursor-help"
            title={`${pos.position?.name || 'Unknown'} - Since ${formatDate(pos.start_date)}${positions.length > 1 ? `\n(${positions.length} positions total)` : ''}`}
          >
            {pos.position?.name || 'Unknown'}
          </Badge>
        ))}
      </div>
    );
  },
  mobilePriority: 2,
},
    {
      key: "level",
      header: "Level",
      accessor: (row: Member) => (
        <div>
          {row.level ? (
            <Badge
              variant={
                row.level === "Professional"
                  ? "primary"
                  : row.level === "Associate"
                  ? "success"
                  : "gray"
              }
              size="sm"
              className="font-medium capitalize"
            >
              {row.level}
            </Badge>
          ) : (
            <Badge variant="gray" size="sm" className="capitalize">
              Not Set
            </Badge>
          )}
        </div>
      ),
      mobilePriority: 3,
    },
    {
      key: "employment_status",
      header: "Employment Status",
      accessor: (row: Member) => (
        <div>
          {row.employment_status ? (
            <Badge
              variant={
                row.employment_status === "Full Time"
                  ? "success"
                  : row.employment_status === "Part Time"
                  ? "warning"
                  : "gray"
              }
              size="sm"
              className="font-medium capitalize"
            >
              {row.employment_status}
            </Badge>
          ) : (
            <Badge variant="gray" size="sm" className="capitalize">
              Not Set
            </Badge>
          )}
        </div>
      ),
      mobilePriority: 3,
    },
    {
      key: "gender",
      header: "Gender",
      accessor: (row: Member) => (
        <span className="capitalize">{row.gender || "Not specified"}</span>
      ),
      mobilePriority: 6,
    },
    {
      key: "date_of_birth",
      header: "Date of Birth",
      accessor: (row: Member) => (
        <span className="text-sm text-gray-600">
          {formatDate(row.date_of_birth)}
        </span>
      ),
      mobilePriority: 7,
    },
    {
      key: "date_of_hire",
      header: "Date of Hire",
      accessor: (row: Member) => (
        <span className="text-sm text-gray-600">
          {formatDate(row.date_of_hire)}
        </span>
      ),
      mobilePriority: 7,
    },
    {
      key: "city",
      header: "City",
      accessor: (row: Member) => (
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3 text-gray-400" />
          <span>{row.city || "Not specified"}</span>
        </div>
      ),
      mobilePriority: 5,
    },
    {
      key: "state",
      header: "State",
      accessor: (row: Member) => row.state || "Not specified",
      mobilePriority: 8,
    },
    {
      key: "zip_code",
      header: "Zip Code",
      accessor: (row: Member) => row.zip_code || "Not specified",
      mobilePriority: 8,
    },
    {
      key: "email",
      header: "Email",
      accessor: (row: Member) =>
        row.work_email ? (
          <a
            href={`mailto:${row.work_email}`}
            className="text-blue-600 hover:text-blue-800"
            onClick={(e) => e.stopPropagation()}
          >
            {row.work_email}
          </a>
        ) : (
          <span className="text-gray-500">No email</span>
        ),
      mobilePriority: 6,
    },
    {
      key: "mobile_phone",
      header: "Mobile Phone",
      accessor: (row: Member) =>
        row.mobile_phone ? (
          <a
            href={`tel:${row.mobile_phone}`}
            className="text-blue-600 hover:text-blue-800 whitespace-nowrap"
            onClick={(e) => e.stopPropagation()}
          >
            {row.mobile_phone}
          </a>
        ) : (
          <span className="text-gray-500">No phone</span>
        ),
      mobilePriority: 6,
    },
    {
      key: "work_phone",
      header: "Work Phone",
      accessor: (row: Member) =>
        row.work_phone ? (
          <a
            href={`tel:${row.work_phone}`}
            className="text-blue-600 hover:text-blue-800"
            onClick={(e) => e.stopPropagation()}
          >
            {row.work_phone}
          </a>
        ) : (
          <span className="text-gray-500">No work phone</span>
        ),
      mobilePriority: 9,
    },
    {
      key: "home_phone",
      header: "Home Phone",
      accessor: (row: Member) => row.home_phone || "Not specified",
      mobilePriority: 9,
    },
    {
      key: "self_id",
      header: "Ethnicity",
      accessor: (row: Member) => (
        <div className="flex items-center gap-1">
          <Tag className="w-3 h-3 text-gray-400" />
          <Badge variant="gray" size="sm" className="capitalize">
            {row.self_id || "Not Set"}
          </Badge>
        </div>
      ),
      mobilePriority: 8,
    },
    {
      key: "non_nso",
      header: "Non NSO",
      accessor: (row: Member) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            row.non_nso
              ? "bg-red-100 text-red-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {row.non_ORG ? "Yes" : "No"}
        </span>
      ),
      mobilePriority: 8,
    },
    {
      key: "status",
      header: "Status",
      accessor: (row: Member) => {
        const getStatusVariant = (status: string) => {
          switch (status?.toLowerCase()) {
            case "active":
              return "success";
            case "inactive":
              return "danger";
            case "retired":
              return "warning";
            default:
              return "gray";
          }
        };

        return (
          <Badge
            variant={getStatusVariant(row.status || "")}
            size="sm"
            className="capitalize"
          >
            {row.status || "Unknown"}
          </Badge>
        );
      },
      mobilePriority: 4,
    },
    {
      key: "updated_at",
      header: "Last Updated",
      accessor: (row: Member) => (
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-gray-400" />
          <span className="text-sm text-gray-500">
            {formatDate(row.updated_at)}
          </span>
        </div>
      ),
      mobilePriority: 9,
    },
  ];

  return (
    <div className="flex flex-col flex-1 p-4 md:p-5">
      {errorMessage && <AlertMessage type="error" message={errorMessage} />}

      {isMobile && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Members</h1>
            <p className="text-xs text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="p-2 text-gray-600 bg-white border border-gray-300 rounded-lg shadow-sm"
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
        {/* Search Box */}
        <div className="flex-1">
          <SearchInput
            placeholder="Search by name, ID, email, or phone..."
            value={search}
            onChange={handleSearchChange}
            className="w-full"
            onClear={handleClearSearch}
          />
          {search && (
            <p className="mt-1 text-xs text-gray-500">
              Search results update as you type
            </p>
          )}
        </div>

        {/* Controls Row */}
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          {/* LEFT SIDE: Filter, Positions, Sort, Columns */}
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            {/* Reusable MemberFilters Component */}
            <MemberFilters
              filters={filters as MemberFiltersState}
              onFiltersChange={handleFilterChange}
              onReset={handleFilterReset}
              onRefresh={handleRefresh}
              showAffiliateFilter={false} // No affiliate filter needed for affiliate-specific view
              isMobile={isMobile}
            />

            {/* Sort Dropdown */}
            <SortDropdown
              value={sortBy}
              onChange={handleSortChange}
              size={isMobile ? "sm" : "md"}
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
            />
          </div>

          {/* RIGHT SIDE: Archives, Export, Add Member, Refresh */}
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <Link
              to={`archives`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition-colors rounded-lg shadow-sm bg-zinc-600 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Go to Archives"
            >
              <ArchiveX className="w-4 h-4" /> Archives
            </Link>

            <button
              onClick={handleExport}
              disabled={exportLoading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition bg-green-600 rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export to CSV"
            >
              {exportLoading ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              {exportLoading ? "Exporting..." : "Export"}
            </button>

            <RoleGuard
              roles={[Roles.NATIONAL_ADMINISTRATOR]}
              positions={[Positions.SECRETARY, Positions.PRESIDENT]}
            >
              <CreateMember affiliate_id={affiliateId} />
            </RoleGuard>

            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 transition bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
              title="Refresh data"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Active Filters Row - at the bottom, full width */}
        {getActiveFilterCount() > 0 && (
          <div className="flex items-center justify-between w-full p-3 rounded-lg bg-blue-50">
            {/* Active filters display on the left */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-blue-700">
                Active Filters:
              </span>
              
              {/* Display all active filters */}
              {filters.positions.map((pos) => (
                <div key={`positions-${pos}`} className="inline-flex items-center gap-1">
                  <Badge variant="primary" size="sm">
                    Position: {pos}
                  </Badge>
                  <button
                    onClick={() => handleRemoveFilter('positions', pos)}
                    className="text-blue-400 hover:text-blue-600"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              
              {filters.employment_status.map((status) => (
                <div key={`employment-${status}`} className="inline-flex items-center gap-1">
                  <Badge variant="success" size="sm" className="capitalize">
                    Employment: {status}
                  </Badge>
                  <button
                    onClick={() => handleRemoveFilter('employment_status', status)}
                    className="text-green-400 hover:text-green-600"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              
              {filters.level.map((level) => (
                <div key={`level-${level}`} className="inline-flex items-center gap-1">
                  <Badge variant="warning" size="sm" className="capitalize">
                    Level: {level}
                  </Badge>
                  <button
                    onClick={() => handleRemoveFilter('level', level)}
                    className="text-yellow-400 hover:text-yellow-600"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              
              {filters.gender.map((gender) => (
                <div key={`gender-${gender}`} className="inline-flex items-center gap-1">
                  <Badge variant="info" size="sm" className="capitalize">
                    Gender: {gender}
                  </Badge>
                  <button
                    onClick={() => handleRemoveFilter('gender', gender)}
                    className="text-blue-400 hover:text-blue-600"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              
              {filters.status.map((status) => (
                <div key={`status-${status}`} className="inline-flex items-center gap-1">
                  <Badge variant="danger" size="sm" className="capitalize">
                    Status: {status}
                  </Badge>
                  <button
                    onClick={() => handleRemoveFilter('status', status)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              
              {filters.has_position.map((has) => (
                <div key={`has_position-${has}`} className="inline-flex items-center gap-1">
                  <Badge variant="gray" size="sm">
                    {has}
                  </Badge>
                  <button
                    onClick={() => handleRemoveFilter('has_position', has)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              
              {filters.has_email.map((has) => (
                <div key={`has_email-${has}`} className="inline-flex items-center gap-1">
                  <Badge variant="gray" size="sm">
                    {has}
                  </Badge>
                  <button
                    onClick={() => handleRemoveFilter('has_email', has)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              
              {filters.has_phone.map((has) => (
                <div key={`has_phone-${has}`} className="inline-flex items-center gap-1">
                  <Badge variant="gray" size="sm">
                    {has}
                  </Badge>
                  <button
                    onClick={() => handleRemoveFilter('has_phone', has)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>

            {/* Clear All button on the right */}
            <button
              onClick={handleFilterReset}
              className="text-sm font-medium text-red-600 hover:text-red-800 whitespace-nowrap"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {!isMobile && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
            <p className="text-sm text-gray-500">
              Sorted by:{" "}
              {SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label}
            </p>
          </div>
        )}
      </div>

      {/* DataTable Component */}
      <div className="flex-1">
        <DataTable<Member>
          columns={columns}
          visibleColumns={visibleCols}
          queryKey={queryKey}
          filterKey={filterKey}
          queryFn={(page, perPage) => {
            const params = buildQueryParams(page, perPage);
            return members.affiliate({
              id: affiliateId,
              page: params.page,
              perPage: params.perPage,
              search: params.search,
              filters: params.filters,
              sort_by: params.sort_by,
              sort_order: params.sort_order,
            });
          }}
          pagination={true}
          perPageOptions={[10, 25, 50, 100]}
          massSelection={false}
          responsive={true}
          renderActions={(member: Member) => (
            <div className="flex items-center">
              <Link
                to={`/members/${member.public_uid}`}
                className="p-1 text-gray-600 transition rounded-full md:p-2 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                title="View Member"
              >
                <Eye className="w-4 h-4" />
              </Link>

              <RoleGuard
                roles={[
                  Roles.NATIONAL_ADMINISTRATOR,
                  ...Committees.EXECUTIVE_COMMITTEE,
                ]}
                positions={[
                  Positions.PRESIDENT,
                  Positions.SECRETARY,
                  Positions.TREASURER,
                ]}
              >
                <EditMember
                  member={member}
                  queryKey={queryKey}
                />
                <ConfirmationPopUp
                  message={`Are you sure you want to archive ${member.first_name} ${member.last_name}?`}
                  onConfirm={() => handleArchived(member.user_id)}
                >
                  <button
                    disabled={archiving}
                    className="p-1 text-orange-600 transition rounded-full md:p-2 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    title="Archived Member"
                  >
                    {archiving && archivedId === member.user_id ? (
                      <LoaderCircle size={16} className="animate-spin" />
                    ) : (
                      <ArchiveX className="w-4 h-4" />
                    )}
                  </button>
                </ConfirmationPopUp>

                <ConfirmationPopUp
                  message={`Are you sure you want to permanently delete ${member.first_name} ${member.last_name}?`}
                  onConfirm={() => handleDelete(member.user_id)}
                >
                  <button
                    disabled={deleting}
                    className="p-1 text-red-600 transition rounded-full md:p-2 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                    title="Delete Member"
                  >
                    {deleting && deleteId === member.user_id ? (
                      <LoaderCircle size={16} className="animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </ConfirmationPopUp>
              </RoleGuard>
            </div>
          )}
        />
      </div>

      <ImageModal
        imageUrl={selectedImage?.url || ""}
        alt={selectedImage?.alt || ""}
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </div>
  );
}