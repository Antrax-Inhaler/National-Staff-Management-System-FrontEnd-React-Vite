import {
  useIsFetching,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { affiliate } from "@v1/api/affiliate";
import AddAffiliate from "@v1/components/affiliate/AddAffiliate";
import EditAffiliate from "@v1/components/affiliate/EditAffiliate"; // Import from separate file
import RoleGuard from "@v1/components/RoleGuard";
import { ActionButton } from "@v1/components/ui/ActionButton";
import AdvancedFilter, {
  clearAllFilters,
  removeFilterFromParams,
  renderActiveFilterBadges,
  type FilterConfig,
  type FilterSection,
} from "@v1/components/ui/AdvancedFilter";
import AlertMessage from "@v1/components/ui/AlertMessage";
import Avatar from "@v1/components/ui/Avatar";
import Badge from "@v1/components/ui/Badge";
import ConfirmationPopUp from "@v1/components/ui/ConfirmationPopUp";
import type { Column } from "@v1/components/ui/DataTable";
import SearchInput from "@v1/components/ui/SearchInput";
import DataTable from "@v1/components/ui/tables/DataTable";
import { Positions } from "@v1/constants/positions";
import { Committees, National_Roles, Roles } from "@v1/constants/roles";
import { useAuth } from "@v1/contexts/AuthContext";
import { formatDateWithoutTimezone } from "@v1/helpers/dateUtils";
import HelpButton from "@v1/components/help/HelpButton";
import AffiliatePage from "@v1/pages/affiliate/Affiliate";

import type { Affiliate, AffiliateFilter, DeleteAffiliate } from "@v1/types";
import {
  ArrowDownUp,
  Briefcase,
  Calendar,
  Download,
  Globe,
  Hash,
  LayoutGrid,
  ListFilter,
  LoaderCircle,
  MapPin,
  RefreshCcw,
  Rows3,
  Tag,
  Trash2,
  Users,
  ChevronRight,
  SquarePen,
} from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useSearchParams } from "react-router-dom";

const filter_options: FilterSection[] = [
  {
    title: "",
    description: "",
    icon: ListFilter,
    filters: [
      {
        key: "affiliate_type",
        label: "Affiliate Type",
        type: "checkbox",
        singleSelect: true,
        options: [
          { value: "Associate", label: "Associate" },
          { value: "Professional", label: "Professional" },
          { value: "Wall-to-Wall", label: "Wall-to-Wall" },
          { value: "not_set", label: "Not Set" },
        ],
      },
      {
        key: "cbc_region",
        label: "CBC Region",
        type: "multiselect",
        options: [
          { value: "Northeast", label: "Northeast" },
          { value: "Corridor", label: "Corridor" },
          { value: "South", label: "South" },
          { value: "Central", label: "Central" },
          { value: "Western", label: "Western" },
          { value: "not_set", label: "Not Set" },
        ],
      },
      {
        key: "ORG_region",
        label: "ORG Region",
        type: "multiselect",
        options: [
          { value: "not_set", label: "Not Set" },
          { value: "1", label: "Region 1" },
          { value: "2", label: "Region 2" },
          { value: "3", label: "Region 3" },
          { value: "4", label: "Region 4" },
          { value: "5", label: "Region 5" },
          { value: "6", label: "Region 6" },
          { value: "7", label: "Region 7" },
        ],
      },
      {
        key: "affiliation_date",
        label: "Affiliation Date",
        type: "dateRange",
      },
    ],
  },
];

const sort_filters: FilterConfig[] = [
  {
    key: "sort_by",
    label: "Sort By",
    type: "select",
    options: [
      { label: "Affiliate Name", value: "name" },
      { label: "Employer Name", value: "employer_name" },
      { label: "EIN", value: "ein" },
      { label: "Affiliate Type", value: "affiliate_type" },
      { label: "CBC Region", value: "cbc_region" },
      { label: "ORG Region", value: "ORG_region" },
      { label: "Affiliation Date", value: "affiliation_date" },
      { label: "Created At", value: "created_at" },
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

const columns: Column<Affiliate>[] = [
  {
    key: "logo",
    header: "",
    accessor: (row: Affiliate) => (
      <div className="flex items-center justify-center">
        <Avatar
          imageUrl={row.logo_signed_url}
          alt={`${row.name}`}
          fallbackText={`${row.name}`}
          size="lg"
          variant="square"
        />
      </div>
    ),
  },
  {
    key: "organization",
    header: "Organization",
    accessor: (row: Affiliate) => (
      <div>
        <Link to={`/affiliates/${row.public_uid}/members`} className="block">
          <div className="font-bold text-gray-900 transition-colors hover:text-blue-600">
            {row.name}
          </div>
        </Link>
        {row.state && (
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
            <MapPin className="w-3 h-3" />
            <span>{row.state}</span>
          </div>
        )}
      </div>
    ),
  },
  {
    key: "employer",
    header: "Employer",
    accessor: (row: Affiliate) => (
      <div className="space-y-1">
        {row.employer_name ? (
          <div className="flex items-center gap-1 text-xs">
            <Briefcase className="w-3 h-3 text-gray-400" />
            <span className="text-gray-700 truncate">{row.employer_name}</span>
          </div>
        ) : (
          <span className="text-xs text-gray-500">Not specified</span>
        )}
      </div>
    ),
  },
  {
    key: "legal",
    header: "Legal Info",
    accessor: (row: Affiliate) => (
      <div className="space-y-1">
        {row.ein ? (
          <div className="flex items-center gap-1 text-xs">
            <Hash className="w-3 h-3 text-gray-400" />
            <span className="font-mono text-gray-700">{row.ein}</span>
          </div>
        ) : (
          <span className="text-xs text-gray-500">No EIN</span>
        )}
        {row.affiliation_date && (
          <div className="flex items-center gap-1 text-xs">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span className="text-gray-700">
              {formatDateWithoutTimezone(row.affiliation_date)}
            </span>
          </div>
        )}
      </div>
    ),
  },
  {
    key: "regions",
    header: "Regions",
    accessor: (row: Affiliate) => (
      <div className="space-y-1">
        {row.cbc_region ? (
          <div className="flex items-center gap-1">
            <Globe className="w-3 h-3 text-gray-400" />
            <Badge variant="gray" size="sm" className="capitalize">
              {row.cbc_region}
            </Badge>
          </div>
        ) : (
          <span className="text-xs text-gray-500">No CBC Region</span>
        )}
        {row.ORG_region && (
          <div className="flex items-center gap-1">
            <Tag className="w-3 h-3 text-gray-400" />
            <Badge variant="primary" size="sm" className="capitalize">
              <span className="whitespace-nowrap">
                ORG Region {row.ORG_region}
              </span>
            </Badge>
          </div>
        )}
      </div>
    ),
  },
  {
    key: "type",
    header: "Type",
    accessor: (row: Affiliate) => (
      <div>
        {row.affiliate_type ? (
          <Badge
            variant={
              row.affiliate_type === "Professional"
                ? "primary"
                : row.affiliate_type === "Associate"
                  ? "success"
                  : "warning"
            }
            size="sm"
            className="font-medium capitalize"
          >
            <span className="whitespace-nowrap">{row.affiliate_type}</span>
          </Badge>
        ) : (
          <Badge variant="gray" size="sm" className="capitalize">
            Not Set
          </Badge>
        )}
      </div>
    ),
  },
  {
    key: "members",
    header: "Members",
    accessor: (row: Affiliate) => (
      <Link to={`/affiliates/${row.public_uid}/members`} className="block">
        <div className="space-y-1.5 min-w-[140px]">
          {/* Total Count - Prominent */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-gray-700">Total</span>
            </div>
            <Badge
              variant="primary"
              className="!font-bold text-base px-2.5 py-0.5"
            >
              {row.members_count}
            </Badge>
          </div>

          {/* Breakdown */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-gray-600">Assoc.</span>
            </div>
            <span className="font-semibold text-blue-600">
              {row.associate_count || 0}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span className="text-gray-600">Prof.</span>
            </div>
            <span className="font-semibold text-purple-600">
              {row.professional_count || 0}
            </span>
          </div>
        </div>
      </Link>
    ),
  },
];

// Card component for affiliate - COMPACT VERSION WITH ACTIONS
const AffiliateCard = ({
  affiliate,
  viewMode,
  onEdit,
  onDelete,
  deleteId,
  isDeleting,
}: {
  affiliate: Affiliate;
  viewMode: "card" | "table";
  onEdit: () => void;
  onDelete: () => void;
  deleteId: number | null;
  isDeleting: boolean;
}) => {
  return (
    <div className="flex flex-col h-full p-3 transition-all duration-200 bg-white border border-gray-200 rounded-lg hover:shadow-sm hover:border-blue-200">
      <div className="flex items-start gap-2.5 mb-2">
        {/* Logo - Smaller */}
        <div className="flex-shrink-0">
          <Avatar
            imageUrl={affiliate.logo_signed_url}
            alt={affiliate.name}
            fallbackText={affiliate.name}
            size="md"
            variant="square"
            className="border border-gray-300 rounded"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header with name, location, and actions */}
          <div className="mb-1.5">
            <div className="flex items-start justify-between">
              <Link
                to={`/affiliates/${affiliate.public_uid}/members`}
                className="flex-1 group"
              >
                <div>
                  <h3 className="pr-2 text-xs font-semibold text-gray-900 transition-colors line-clamp-2 group-hover:text-blue-600">
                    {affiliate.name}
                  </h3>
                </div>
              </Link>

              {/* Action buttons - same as table */}
              <div className="flex items-center">
                <RoleGuard
                  region={Number(affiliate.ORG_region)}
                  roles={[
                    Roles.NATIONAL_ADMINISTRATOR,
                    ...Committees.EXECUTIVE_COMMITTEE,
                  ]}
                >
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onEdit();
                      }}
                      className="p-1 text-gray-600 transition-colors rounded hover:bg-blue-50 hover:text-blue-600"
                      title="Edit affiliate"
                    >
                      <SquarePen className="w-3 h-3" />
                    </button>

                    <ConfirmationPopUp
                      message={`Are you sure you want to delete ${affiliate.name}?`}
                      onConfirm={onDelete}
                    >
                      <button
                        disabled={deleteId === affiliate.id || isDeleting}
                        className={`p-1 rounded transition-colors ${
                          deleteId === affiliate.id || isDeleting
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-red-600 hover:bg-red-50 hover:text-red-700"
                        }`}
                        title="Delete affiliate"
                      >
                        {deleteId === affiliate.id ? (
                          <LoaderCircle className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </button>
                    </ConfirmationPopUp>
                  </div>
                </RoleGuard>
              </div>
            </div>

            {/* Location inline with employer/ein */}
            {affiliate.state && (
              <div className="flex items-center gap-1 mt-0.5 text-[10px] text-gray-500">
                <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                <span className="line-clamp-1">{affiliate.state}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Basic Info - More compact */}
      <div className="space-y-1.5 mb-2">
        {affiliate.employer_name && (
          <div className="flex items-center gap-1">
            <Briefcase className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" />
            <span className="text-[10px] text-gray-700 line-clamp-1">
              {affiliate.employer_name}
            </span>
          </div>
        )}

        {affiliate.ein && (
          <div className="flex items-center gap-1">
            <Hash className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" />
            <span className="text-[10px] font-mono text-gray-700 truncate">
              {affiliate.ein}
            </span>
          </div>
        )}

        {affiliate.affiliation_date && (
          <div className="flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" />
            <span className="text-[10px] text-gray-700">
              {formatDateWithoutTimezone(affiliate.affiliation_date)}
            </span>
          </div>
        )}
      </div>

      {/* Badges - More compact */}
      <div className="flex flex-wrap gap-1 mb-2">
        {affiliate.affiliate_type ? (
          <Badge
            variant={
              affiliate.affiliate_type === "Professional"
                ? "primary"
                : affiliate.affiliate_type === "Associate"
                  ? "success"
                  : "warning"
            }
            className="capitalize text-[10px] px-1.5 py-0.5"
          >
            {affiliate.affiliate_type}
          </Badge>
        ) : (
          <Badge variant="gray" className="text-[10px] px-1.5 py-0.5">
            Not Set
          </Badge>
        )}

        {affiliate.cbc_region && (
          <Badge
            variant="gray"
            className="capitalize text-[10px] px-1.5 py-0.5"
          >
            <span className="line-clamp-1">{affiliate.cbc_region}</span>
          </Badge>
        )}

        {affiliate.ORG_region && (
          <Badge variant="primary" className="text-[10px] px-1.5 py-0.5">
            <span className="line-clamp-1">R{affiliate.ORG_region}</span>
          </Badge>
        )}
      </div>

      {/* Members Count - More compact */}
      <div className="pt-2 mt-auto border-t border-gray-100">
        <Link to={`/affiliates/${affiliate.public_uid}/members`}>
          <div className="flex items-center justify-between p-1.5 bg-gray-50 rounded group hover:bg-blue-50 transition-colors">
            <div className="flex items-center gap-1.5">
              <Users className="flex-shrink-0 w-3 h-3 text-blue-500" />
              <span className="text-[10px] font-medium text-gray-700">
                Members
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-blue-600">
                {affiliate.members_count || 0}
              </span>
              <ChevronRight className="w-2.5 h-2.5 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default function Affiliates() {
  const { userRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(
    null,
  );

  const isNational = National_Roles.some((role) =>
    userRole.roles.includes(role),
  );

  const isAffiliateOfficer = [
    Positions.PRESIDENT,
    Positions.SECRETARY,
    Positions.TREASURER,
  ].some((position) => userRole.position.includes(position));

  if (!isNational && isAffiliateOfficer) {
    return <AffiliatePage />;
  }

  const MainFilter: AffiliateFilter = useMemo(() => {
    const affiliate_filter: AffiliateFilter = {
      cbc_region: searchParams.getAll("cbc_region"),
      ORG_region: searchParams.getAll("ORG_region"),
      affiliate_type: searchParams.getAll("affiliate_type"),
      affiliation_date_to: searchParams.get("date_of_hire_to"),
      affiliation_date_from: searchParams.get("date_of_hire_from"),
    };
    const main_filter: AffiliateFilter = {
      sort_by: searchParams.get("sort_by") ?? "name",
      sort_order: searchParams.get("sort_order") ?? "asc",
      per_page: searchParams.get("per_page") ?? "20",
      page: Number(searchParams.get("page") ?? 1),
      search: searchParams.get("search") ?? "",

      ...affiliate_filter,
    };

    return main_filter;
  }, [searchParams]);

  const queryKey = ["affiliates-roster", MainFilter];

  const AffiliatesFetching = useIsFetching({ queryKey: queryKey }) > 0;

  const handleApplyFilters = (params: URLSearchParams) => {
    setSearchParams(params);
    queryClient.invalidateQueries({
      queryKey: queryKey,
    });
  };

  const handleClearAll = () => {
    const base_filters = filter_options.flatMap((section) => section.filters);
    const allFilters = [...base_filters, ...sort_filters];
    const clearedParams = clearAllFilters(searchParams, allFilters);
    setSearchParams(clearedParams);
  };

  const handleClear = () => {
    handleClearAll();
  };

  const handleRemoveFilter = (filterKey: string, value?: string | null) => {
    const newParams = removeFilterFromParams(
      searchParams,
      sort_filters,
      filterKey,
      value,
    );
    setSearchParams(newParams);
  };

  const ActiveSortBadges = renderActiveFilterBadges(
    searchParams,
    sort_filters,
    handleRemoveFilter,
  );

  const updateSearchParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    // Reset to page 1 when filters change
    if (key !== "page") {
      newParams.set("page", "1");
    }
    setSearchParams(newParams);
  };

  const handleSearchChange = (value: string) => {
    updateSearchParam("search", value);
  };

  const handleSelectionChange = (newSelection: Set<number>) => {
    setSelectedRows(newSelection);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKey });
  };

  const { mutate: DeleteAffiliate, isPending: DeletingAffiliate } = useMutation(
    {
      mutationKey: ["delete-affiliate"],
      mutationFn: (payload: DeleteAffiliate) => affiliate.remove(payload),
      onSuccess: () => {
        setDeleteId(null);
        handleRefresh();
        setSelectedRows(new Set());
      },
      onError: () => {
        setDeleteId(null);
        handleRefresh();
        setSelectedRows(new Set());
      },
    },
  );

  const handleDelete = (id?: number) => {
    id && setDeleteId(id);
    DeleteAffiliate({
      ids: id ? [id] : Array.from(selectedRows),
    });
  };

  const handleEdit = (affiliate: Affiliate) => {
    setEditingAffiliate(affiliate);
  };

  const { mutateAsync: ExportAffiliateData, isPending: ExportingData } =
    useMutation({
      mutationKey: ["export"],
      mutationFn: (all: boolean) =>
        affiliate.export({
          ids: all ? undefined : Array.from(selectedRows).join(","),
          ...MainFilter,
        }),
      onSuccess: (data) => {
        // Check if we got data
        const exportData = data?.items || [];

        if (!exportData.length) {
          setErrorMessage("No data available to export");
          return;
        }

        // Define CSV headers
        const headers = [
          "Name",
          "Affiliate Type",
          "CBC Region",
          "ORG Region",
          "EIN",
          "Employer Name",
          "State",
          "Affiliation Date",
          "Total Members",
          "Associate Count",
          "Professional Count",
          "Public UID",
        ];

        // Prepare CSV data
        const csvData = exportData.map((affiliateItem: Affiliate) => [
          affiliateItem.name || "",
          affiliateItem.affiliate_type || "",
          affiliateItem.cbc_region || "",
          affiliateItem.ORG_region || "",
          affiliateItem.ein || "",
          affiliateItem.employer_name || "",
          affiliateItem.state || "",
          affiliateItem.affiliation_date
            ? formatDateWithoutTimezone(affiliateItem.affiliation_date)
            : "",
          affiliateItem.members_count?.toString() || "0",
          affiliateItem.associate_count?.toString() || "0",
          affiliateItem.professional_count?.toString() || "0",
          affiliateItem.public_uid || "",
        ]);

        // Create CSV content with proper escaping
        const csvContent = [
          headers.join(","),
          ...csvData.map((row: any[]) =>
            row
              .map((field: any) => {
                // Convert to string and escape quotes
                const fieldStr = String(field || "");
                // Escape quotes by doubling them and wrap in quotes
                return `"${fieldStr.replace(/"/g, '""')}"`;
              })
              .join(","),
          ),
        ].join("\n");

        // Create and trigger download
        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        // Generate filename with current date
        const fileName = `affiliates_export_${
          new Date().toISOString().split("T")[0]
        }_${Date.now()}.csv`;

        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 100);
      },
      onError: () => {
        toast.error("Failed to Export. Please try again");
      },
    });

  return (
    <div className="flex flex-col flex-1 p-3 bg-white rounded-lg shadow md:p-4">
      {errorMessage && <AlertMessage type="error" message={errorMessage} />}
      <div className={`flex flex-col gap-3 mb-3`}>
        {/* HEADER SECTION - Fixed alignment, not centered */}
        <div
          className={`flex flex-col md:flex-row md:items-start justify-between gap-3`}
        >
          <header className="md:flex-1">
            <h1 className="text-xl font-bold text-gray-900">
              Affiliate Management
            </h1>
            <p className="mt-1 text-xs text-gray-600">
              Manage affiliate details and information
            </p>
          </header>

          <div className="flex flex-wrap items-start gap-1.5 md:gap-2 md:justify-end">
            <ActionButton
              label="Export CSV"
              icon={ExportingData ? LoaderCircle : Download}
              iconSize={12}
              loading={ExportingData}
              onClick={() => ExportAffiliateData(true)}
              buttonClassName="bg-green-600! hover:bg-green-700 text-white font-semibold! text-xs px-2.5 py-1.5"
            />

            <RoleGuard
              roles={[
                Roles.NATIONAL_ADMINISTRATOR,
                ...Committees.EXECUTIVE_COMMITTEE,
              ]}
              positions={[Positions.SECRETARY, Positions.PRESIDENT]}
            >
              <AddAffiliate queryKey={queryKey} />
            </RoleGuard>
          </div>
        </div>

        {/* CONTROLS SECTION - Fixed layout, not centered */}
        <div className="flex flex-col gap-3 lg:flex-row">
          {/* LEFT SIDE: Filter, Sort, View Toggle, Refresh */}
          <div className="flex flex-wrap items-center gap-2 lg:flex-1">
            <AdvancedFilter
              label="Filters"
              title="Filters"
              onApply={handleApplyFilters}
              sections={filter_options}
              searchParams={searchParams}
              onClear={() => handleClear()}
              activeFilter={ActiveSortBadges.length > 0}
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
                    onApply={handleApplyFilters}
                    filters={sort_filters}
                    title="Sort Filter"
                    searchParams={searchParams}
                  />

                  {/* View Mode Toggle - Normal size */}
                  <div className="inline-flex items-center gap-0 px-1 py-1 bg-white border border-gray-300 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setViewMode("card")}
                      disabled={AffiliatesFetching}
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
                        ${AffiliatesFetching ? "opacity-50 cursor-not-allowed" : ""}
                      `}
                    >
                      <LayoutGrid size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("table")}
                      disabled={AffiliatesFetching}
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
                        ${AffiliatesFetching ? "opacity-50 cursor-not-allowed" : ""}
                      `}
                    >
                      <Rows3 size={14} />
                    </button>
                  </div>

                  <ActionButton
                    onClick={handleRefresh}
                    label="Refresh"
                    icon={RefreshCcw}
                    iconSize={14}
                    loading={AffiliatesFetching}
                    buttonClassName="px-3 py-1.5 text-xs"
                  />
                </>
              }
            />
          </div>

          {/* RIGHT SIDE: Search - aligned to right on larger screens */}
          <div className="lg:w-64">
            <SearchInput
              placeholder="Search by Name, EIN ..."
              value={searchParams.get("search") ?? ""}
              onChange={handleSearchChange}
              showClear
            />
          </div>
        </div>
      </div>

      {/* DataTable Component */}
      <div className="flex-1">
        {selectedRows.size > 0 && (
          <div className="p-2 mb-3 border border-blue-200 rounded-lg bg-blue-50">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-blue-800">
                {selectedRows.size} Affiliate
                {selectedRows.size !== 1 ? "s" : ""} selected
              </p>
              <div className="flex gap-1.5">
                <ActionButton
                  label="Export Selected"
                  onClick={() => ExportAffiliateData(false)}
                  icon={ExportingData ? LoaderCircle : Download}
                  iconSize={12}
                  buttonClassName="bg-green-700! hover:bg-green-800! text-white font-semibold! text-xs px-2.5 py-1.5"
                  loading={ExportingData}
                />
                <ActionButton
                  label="Clear"
                  onClick={() => setSelectedRows(new Set())}
                  iconSize={12}
                  buttonClassName="px-2.5 py-1.5 text-xs"
                />
              </div>
            </div>
          </div>
        )}

        <DataTable<Affiliate>
          columns={columns}
          view={viewMode}
          massSelection={viewMode === "table"} // Only enable mass selection in table view
          queryKey={queryKey}
          queryFn={() => affiliate.index(MainFilter)}
          selectedRows={selectedRows}
          onSelectionChange={handleSelectionChange}
          renderActions={(affiliate: Affiliate) => (
            <div className="flex items-center">
              <RoleGuard
                region={Number(affiliate.ORG_region)}
                roles={[
                  Roles.NATIONAL_ADMINISTRATOR,
                  ...Committees.EXECUTIVE_COMMITTEE,
                ]}
              >
                <div className="flex items-center">
                  <button
                    onClick={() => handleEdit(affiliate)}
                    className="p-1 text-gray-600 transition-colors rounded hover:bg-blue-50 hover:text-blue-600"
                    title="Edit affiliate"
                  >
                    <SquarePen className="w-4 h-4" />
                  </button>
                  <ActionButton
                    icon={deleteId == affiliate.id ? LoaderCircle : Trash2}
                    iconSize={16}
                    onClick={() => handleDelete(affiliate.id)}
                    loading={deleteId == affiliate.id}
                    disabled={DeletingAffiliate}
                    iconClassName="text-red-600"
                    buttonClassName="border-none bg-transparent! hover:bg-red-50! p-1"
                  />
                </div>
              </RoleGuard>
            </div>
          )}
          renderCard={(affiliate: Affiliate, idx: number) => (
            <div
              key={affiliate.id}
              className="h-full transition-all duration-200 animate-fadeIn"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <AffiliateCard
                affiliate={affiliate}
                viewMode={viewMode}
                onEdit={() => handleEdit(affiliate)}
                onDelete={() => handleDelete(affiliate.id)}
                deleteId={deleteId}
                isDeleting={DeletingAffiliate}
              />
            </div>
          )}
        />
      </div>

      {/* Edit Modal - IMPORTANT: This is the imported component, not the duplicate one */}
      {editingAffiliate && (
        <EditAffiliate
          affiliate={editingAffiliate}
          queryKey={queryKey}
          onClose={() => setEditingAffiliate(null)}
        />
      )}
      <HelpButton category="Affiliates" pageTitle="Affiliates Management" />
    </div>
  );
}
