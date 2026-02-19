import {
  useIsFetching,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import RoleGuard from "@v1/components/RoleGuard";
import AlertMessage from "@v1/components/ui/AlertMessage";
import Badge from "@v1/components/ui/Badge";
import ConfirmationPopUp from "@v1/components/ui/ConfirmationPopUp";
import type { Column } from "@v1/components/ui/DataTable";
import SearchInput from "@v1/components/ui/SearchInput";
import { Positions } from "@v1/constants/positions";
import { Committees, National_Roles, Roles } from "@v1/constants/roles";
import { useAuth } from "@v1/contexts/AuthContext";
import {
  ArchiveRestore,
  ArrowDownUp,
  ArrowLeft,
  Building2,
  Calendar,
  Columns3,
  ListFilter,
  LoaderCircle,
  MapPin,
  RefreshCcw,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { members } from "../api/member";

// Import the new date utility functions
import Avatar from "@/components/ui/Avater";
import { affiliate } from "@v1/api/affiliate";
import { ActionButton } from "@v1/components/ui/ActionButton";
import AdvancedFilter, {
  clearAllFilters,
  removeFilterFromParams,
  renderActiveFilterBadges,
  type FilterConfig,
  type FilterSection,
} from "@v1/components/ui/AdvancedFilter";
import FilterDropdown from "@v1/components/ui/FilterDropdown";
import type { FilterOption } from "@v1/components/ui/SearchableMultiSelectFilter";
import SearchableMultiSelectFilter from "@v1/components/ui/SearchableMultiSelectFilter";
import DataTable from "@v1/components/ui/tables/DataTable";
import {
  extractAndFormatDate,
  simpleFormatDate,
} from "@v1/helpers/simpleDateUtils";
import type {
  AffiliateFilter,
  AffiliatePositionFilter,
  DeleteMembers,
  Member,
  MemberFilter,
  RestoreMembers,
} from "@v1/types";

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

export default function ArchivedMembers() {
  const { uid: affiliate_uid } = useParams<{ uid?: string }>();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [selectedAffiliates, setSelectedAffiliates] = useState<FilterOption[]>(
    [],
  );
  const [viewMode, setViewMode] = useState<string>("card");
  const [affiliateSearch, setAffiliateSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [visibleCols, setVisibleCols] = useState<string[]>(DEFAULT_COLUMNS);
  const [restoreID, setRestoreID] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const MainFilter: MemberFilter = useMemo(() => {
    const affiliate_filter: AffiliateFilter = {
      affiliate_id: selectedAffiliates.map((item) => String(item.value)),
      cbc_region: searchParams.getAll("cbc_region"),
      ORG_region: searchParams.getAll("ORG_region"),
      affiliate_type: searchParams.getAll("affiliate_type"),
    };

    const affiliate_position_filter: AffiliatePositionFilter = {
      position_name: searchParams.getAll("position"),
    };

    const main_filter: MemberFilter = {
      sort_by: searchParams.get("sort_by") ?? "last_name",
      sort_order: searchParams.get("sort_order") ?? "asc",
      per_page: searchParams.get("per_page") ?? "20",
      page: Number(searchParams.get("page") ?? 1),
      search: searchParams.get("search") ?? "",

      phone: searchParams.get("phone"),
      email: searchParams.get("email"),
      state: searchParams.get("state"),
      employment_status: searchParams.getAll("employment_status"),
      self_id: searchParams.getAll("ethnicity"),
      level: searchParams.getAll("level"),
      gender: searchParams.getAll("gender"),
      date_of_hire_to: searchParams.get("date_of_hire_to"),
      date_of_hire_from: searchParams.get("date_of_hire_from"),
      date_of_birth_to: searchParams.get("date_of_birth_to"),
      date_of_birth_from: searchParams.get("date_of_birth_from"),

      ...affiliate_position_filter,
      ...affiliate_filter,
    };

    return main_filter;
  }, [searchParams, selectedAffiliates]);

  const newQueryKey = affiliate_uid
    ? [`member-roster-archived-${affiliate_uid}`, MainFilter]
    : ["member-roster-archived", MainFilter];

  const MembersFetching = useIsFetching({ queryKey: newQueryKey }) > 0;

  const { data: affiliate_options, isFetching: fetching_affiliate_options } =
    useQuery({
      queryKey: ["affiliates-options-overview"],
      queryFn: () => affiliate.allAffiliates(),
      enabled: National_Roles.some((role) => userRole.roles.includes(role)),
      staleTime: 30 * 60 * 1000,
    });

  const { mutate: DeleteMember, isPending: DeletingMember } = useMutation({
    mutationKey: ["delete-member"],
    mutationFn: (payload: DeleteMembers) => members.delete(payload),
    onSuccess: () => {
      setDeleteId(null);
      handleRefresh();
      setSelectedRows(new Set());
      queryClient.invalidateQueries({ queryKey: newQueryKey });
    },
    onError: () => {
      console.log("error");
      setDeleteId(null);
    },
  });

  const { mutate: RestoreMember, isPending: RestoringMember } = useMutation({
    mutationFn: (payload: RestoreMembers) => members.restore(payload),
    onSuccess: () => {
      setRestoreID(null);
      handleRefresh();
      setSelectedRows(new Set());
      queryClient.invalidateQueries({ queryKey: newQueryKey });
    },
    onError: () => {
      setRestoreID(null);
    },
  });

  const handleApplyFilters = (params: URLSearchParams) => {
    setSearchParams(params);
    queryClient.invalidateQueries({
      queryKey: newQueryKey,
    });
  };

  const filter_options: FilterSection[] = [
    {
      title: "",
      description: "",
      icon: ListFilter,
      filters: [
        {
          key: "phone",
          label: "Phone",
          type: "checkbox",
          singleSelect: true,
          options: [
            { value: "with", label: "With Phone" },
            { value: "without", label: "Without Phone" },
          ],
        },
        {
          key: "email",
          label: "Email",
          type: "checkbox",
          singleSelect: true,
          options: [
            { value: "with", label: "With Email" },
            { value: "without", label: "Without Email" },
          ],
        },
        {
          key: "employment_status",
          label: "Employment Status",
          type: "checkbox",
          options: [
            { label: "Full Time", value: "Full Time" },
            { label: "Part Time", value: "Part Time" },
            { label: "Not Set", value: "Not Set" },
          ],
        },
        {
          key: "level",
          label: "Level",
          type: "checkbox",
          options: [
            { label: "Professional", value: "Professional" },
            { label: "Associate", value: "Associate" },
            { label: "Not Set", value: "Not Set" },
          ],
        },
        {
          key: "ethnicity",
          label: "Ethnicity",
          type: "multiselect",
          options: [
            {
              label: "Asian Or Pacific Islander",
              value: "Asian Or Pacific Islander",
            },
            {
              label: "Biracial or Multiracial",
              value: "Biracial or Multiracial",
            },
            {
              label: "Latin (a/o/x) or Hispanic",
              value: "Latin (a/o/x) or Hispanic",
            },
            {
              label: "MENA (Middle Eastern or North African)",
              value: "MENA (Middle Eastern or North African)",
            },
            {
              label: "Native American or Alaska Native",
              value: "Native American or Alaska Native",
            },
            { label: "White or Caucasian", value: "White or Caucasian" },
            {
              label: "Black or African American",
              value: "Black or African American",
            },
            {
              label: "I choose not to identify",
              value: "I choose not to identify",
            },
          ],
        },
        {
          key: "date_of_hire",
          label: "Date of Hire",
          type: "dateRange",
        },
        {
          key: "date_of_birth",
          label: "Date of Birth",
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
        { label: "Last Name", value: "last_name" },
        { label: "First Name", value: "first_name" },
        { label: "Member ID", value: "member_id" },
        { label: "Level", value: "level" },
        { label: "Status", value: "status" },
        { label: "Employment Status", value: "employment_status" },
        { label: "Date of Birth", value: "date_of_birth" },
        { label: "Date Of Hire", value: "date_of_hire" },
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

  const handleClearAll = () => {
    const base_filters = filter_options.flatMap((section) => section.filters);
    const allFilters = [...base_filters, ...sort_filters];
    const clearedParams = clearAllFilters(searchParams, allFilters);
    setSearchParams(clearedParams);
  };

  const handleClear = () => {
    handleClearAll();
    setSelectedAffiliates([]);
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

  const removeFilteredAffiliate = (id: string | number) => {
    setSelectedAffiliates((prev) =>
      prev.filter((affiliate) => affiliate.value !== id),
    );
  };

  const handleSelectionChange = (newSelection: Set<number>) => {
    setSelectedRows(newSelection);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: newQueryKey });
  };

  const isNational = userRole.roles.includes(Roles.NATIONAL_ADMINISTRATOR);

  const handleDelete = (force: boolean, id?: number) => {
    id && force && setDeleteId(id);
    DeleteMember({
      ids: id ? [id] : Array.from(selectedRows),
      force,
    });
  };

  const handleRestore = (id?: number) => {
    RestoreMember({
      ids: id ? [id] : Array.from(selectedRows),
    });
  };

  const getGoogleMapsUrl = (member: Member) => {
    const parts = [
      member.address_line1,
      member.address_line2,
      member.city,
      member.state,
      member.zip_code,
    ].filter((part) => part && part.trim() !== "");

    if (parts.length === 0) {
      // Fallback to just city if no detailed address
      if (member.city && member.city.trim() !== "") {
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(member.city + (member.state ? `, ${member.state}` : ""))}`;
      }
      return null;
    }

    const query = parts.join(", ").replace(/\s+/g, "+");
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  const columns: Column<Member>[] = [
    {
      key: "member_id",
      header: "Member ID",
      accessor: (row: Member) => (
        <span className="text-xs font-bold">{row.member_id || "N/A"}</span>
      ),
    },
    {
      key: "member",
      header: "Member",
      accessor: (row: Member) => (
        <div className="flex items-center gap-2">
          <Avatar
            imageUrl={row.photo_signed_url}
            alt={`${row.first_name} ${row.last_name}`}
            fallbackText={`${row.first_name} ${row.last_name}`}
            size="md"
            variant="circle"
          />
          <div className="min-w-0">
            <div className="text-xs font-bold text-gray-900 truncate">
              {row.last_name || "Unknown"}, {row.first_name || "Unknown"}
            </div>
            {row.date_of_birth && (
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
                <Calendar className="flex-shrink-0 w-3 h-3" />
                <span className="truncate">
                  {extractAndFormatDate(row.date_of_birth)}
                </span>
              </div>
            )}
          </div>
        </div>
      ),
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
              <div className="flex items-center gap-1">
                <div className="flex items-center justify-center flex-shrink-0 w-4 h-4 text-gray-400">
                  <Building2 size={14} />
                </div>
                <span className="flex-1 text-xs text-gray-700 truncate hover:text-blue-600">
                  {row.affiliate.name}
                </span>
              </div>
            </Link>
          ) : (
            <span className="text-sm text-gray-500">No affiliate</span>
          )}
        </div>
      ),
    },
    {
      key: "position",
      header: "Position(s)",
      accessor: (row: Member) => {
        // Check if member has multiple positions
        const hasPositions =
          row.current_positions && row.current_positions.length > 0;

        if (!hasPositions) {
          return (
            <Badge variant="gray" size="sm" className="capitalize ">
              Member
            </Badge>
          );
        }

        // Handle multiple positions
        const positions = row.current_positions;

        return (
          <div className="flex flex-wrap gap-1">
            {positions?.map((pos, index) => (
              <Badge
                key={pos.id || index}
                variant="primary"
                size="sm"
                className="font-medium capitalize transition-transform hover:scale-105 cursor-help"
              >
                {pos.position.name}
              </Badge>
            ))}
          </div>
        );
      },
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
    },
    {
      key: "gender",
      header: "Gender",
      accessor: (row: Member) => (
        <span className="text-xs capitalize">
          {row.gender || "Not specified"}
        </span>
      ),
    },
    {
      key: "date_of_birth",
      header: "Date of Birth",
      accessor: (row: Member) => (
        <span className="text-xs text-gray-600">
          {simpleFormatDate(row.date_of_birth)}
        </span>
      ),
    },
    {
      key: "date_of_hire",
      header: "Date of Hire",
      accessor: (row: Member) => (
        <span className="text-xs text-gray-600">
          {simpleFormatDate(row.date_of_hire)}
        </span>
      ),
    },
    {
      key: "city",
      header: "City",
      accessor: (row: Member) => {
        const googleMapsUrl = getGoogleMapsUrl(row);

        if (!googleMapsUrl) {
          return (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-400">Not specified</span>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1">
              <div className="flex items-center justify-center flex-shrink-0 w-4 h-4 text-gray-400">
                <MapPin size={14} />
              </div>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 transition-colors hover:text-blue-800 hover:underline"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering row click
                }}
                title={`View ${row.city}, ${row.state} on Google Maps`}
              >
                <span className="flex-1 text-xs text-gray-700 truncate hover:text-blue-600">
                  {row.city || "Not specified"}
                  {row.state && `, ${row.state}`}
                </span>
              </a>
            </div>
          </div>
        );
      },
    },
    {
      key: "state",
      header: "State",
      accessor: (row: Member) => (
        <span className="text-xs"> {row.state || "Not specified"}</span>
      ),
      mobilePriority: 8,
    },
    {
      key: "zip_code",
      header: "Zip Code",
      accessor: (row: Member) => (
        <span className="text-xs">{row.zip_code || "Not specified"}</span>
      ),
      mobilePriority: 8,
    },
    {
      key: "email",
      header: "Email",
      accessor: (row: Member) =>
        row.work_email ? (
          <a
            href={`mailto:${row.work_email}`}
            className="text-xs text-blue-600 hover:text-blue-800"
            onClick={(e) => e.stopPropagation()}
          >
            {row.work_email}
          </a>
        ) : (
          <span className="text-xs text-gray-500">No email</span>
        ),
    },
    {
      key: "mobile_phone",
      header: "Mobile Phone",
      accessor: (row: Member) =>
        row.mobile_phone ? (
          <a
            href={`tel:${row.mobile_phone}`}
            className="text-xs text-blue-600 hover:text-blue-800 whitespace-nowrap"
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
            className="text-xs text-blue-600 hover:text-blue-800"
            onClick={(e) => e.stopPropagation()}
          >
            {row.work_phone}
          </a>
        ) : (
          <span className="text-gray-500">No work phone</span>
        ),
    },
    {
      key: "home_phone",
      header: "Home Phone",
      accessor: (row: Member) => (
        <span className="text-xs">{row.home_phone || "Not specified "}</span>
      ),
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
    },
  ];

  return (
    <div className="flex flex-col flex-1 p-4 md:p-5">
      {errorMessage && <AlertMessage type="error" message={errorMessage} />}
      <div className={`flex flex-col gap-4 mb-4`}>
        <div
          className={`flex flex-col items-center md:flex-row justify-between"`}
        >
          <header className="flex gap-5 mb-2">
            <ActionButton
              icon={ArrowLeft}
              label="Back"
              onClick={() => navigate(-1)}
            />
            <h1 className="text-2xl font-bold text-gray-900">
              Member Archives
            </h1>
          </header>
        </div>

        {/* Controls Row */}
        <div className="flex flex-col-reverse items-center justify-center gap-3 lg:justify-between lg:flex-row ">
          {/* LEFT SIDE: Filter, Positions, Sort, Columns */}
          <AdvancedFilter
            label="Filters"
            title="Filters"
            onApply={handleApplyFilters}
            sections={filter_options}
            searchParams={searchParams}
            onClear={() => handleClear()}
            activeFilter={
              ActiveSortBadges.length > 0 || selectedAffiliates.length > 0
            }
            customActiveBadges={
              <>
                {ActiveSortBadges.length > 0 ? <>{ActiveSortBadges}</> : null}
                {selectedAffiliates.length > 0 ? (
                  <>
                    {selectedAffiliates.map((affiliate) => (
                      <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-700 transition-all duration-200 bg-blue-100 rounded-full hover:bg-blue-200">
                        {affiliate.label}
                        <button
                          onClick={() =>
                            removeFilteredAffiliate(affiliate.value)
                          }
                          className="transition-all duration-200 rounded-full hover:bg-blue-300 p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </>
                ) : null}
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
                  activeFilter={selectedAffiliates.length > 0}
                />
                {!affiliate_uid && (
                  <RoleGuard roles={National_Roles}>
                    <SearchableMultiSelectFilter
                      placeholder="Select Affiliate"
                      name="affiliate_id"
                      value={selectedAffiliates}
                      onApply={setSelectedAffiliates}
                      options={[
                        ...(fetching_affiliate_options
                          ? [{ label: "Fetching Affiliates...", value: "" }]
                          : [
                              { label: "Select affiliate", value: "" },
                              { label: "No affiliate", value: "none" },
                              ...(affiliate_options
                                ?.filter((m: any) =>
                                  m.name
                                    .toLowerCase()
                                    .includes(affiliateSearch.toLowerCase()),
                                )
                                .map((m: any) => ({
                                  label: m.name,
                                  value: m.id,
                                })) ?? []),
                            ]),
                      ]}
                      searchValue={affiliateSearch}
                      onSearchChange={setAffiliateSearch}
                      loading={fetching_affiliate_options || MembersFetching}
                    />
                  </RoleGuard>
                )}
                <FilterDropdown
                  options={COLUMN_OPTIONS}
                  defaultValue={{ columns: DEFAULT_COLUMNS }}
                  value={{ columns: visibleCols }}
                  onApply={(selected: any) => setVisibleCols(selected.columns)}
                  onReset={() => setVisibleCols(DEFAULT_COLUMNS)}
                  buttonLabel="Columns"
                  icon={Columns3}
                />
                <ActionButton
                  onClick={handleRefresh}
                  label="Refresh"
                  icon={RefreshCcw}
                  iconSize={14}
                  loading={MembersFetching}
                />
              </>
            }
          />

          <SearchInput
            className="self-start"
            placeholder="Search by First Name, Last Name, Member ID ..."
            value={searchParams.get("search") ?? ""}
            onChange={handleSearchChange}
            showClear
          />
        </div>
      </div>

      {/* DataTable Component */}
      <div className="flex-1">
        {selectedRows.size > 0 && (
          <div className="p-3 mb-4 border border-green-200 rounded-lg bg-green-50">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-green-800">
                {selectedRows.size} member
                {selectedRows.size !== 1 ? "s" : ""} selected
              </p>
              <div className="flex gap-2">
                <ConfirmationPopUp
                  message={`Are you sure you want to restore selected Members?`}
                  onConfirm={() => handleRestore()}
                >
                  <ActionButton
                    label="Restore Selected"
                    icon={RestoringMember ? LoaderCircle : ArchiveRestore}
                    iconSize={14}
                    buttonClassName="bg-green-400! hover:bg-green-500! text-white font-semibold!"
                    loading={RestoringMember}
                  />
                </ConfirmationPopUp>
                <ActionButton
                  label="Clear"
                  onClick={() => setSelectedRows(new Set())}
                  iconSize={14}
                />
              </div>
            </div>
          </div>
        )}

        <DataTable<Member>
          columns={columns}
          massSelection
          queryKey={newQueryKey}
          queryFn={() =>
            members.archived({
              affiliate_uid: affiliate_uid,
              ...MainFilter,
            })
          }
          selectedRows={selectedRows}
          onSelectionChange={handleSelectionChange}
          visibleColumns={visibleCols}
          renderActions={(member: Member) => (
            <div className="flex items-center">
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
                <ConfirmationPopUp
                  message={`Are you sure you want to restore ${member.first_name} ${member.last_name}?`}
                  onConfirm={() => handleRestore(member.id)}
                >
                  <button
                    disabled={RestoringMember}
                    className="p-1 text-green-600 transition rounded-full md:p-2 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-400"
                    title="Archived Member"
                  >
                    {RestoringMember && restoreID === member.id ? (
                      <LoaderCircle size={16} className="animate-spin" />
                    ) : (
                      <ArchiveRestore className="w-4 h-4" />
                    )}
                  </button>
                </ConfirmationPopUp>

                <ConfirmationPopUp
                  message={`Are you sure you want to permanently delete ${member.first_name} ${member.last_name}?`}
                  onConfirm={() => handleDelete(true, member.id)}
                >
                  <button
                    disabled={DeletingMember}
                    className="p-1 text-red-600 transition rounded-full md:p-2 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                    title="Delete Member"
                  >
                    {DeletingMember && deleteId === member.id ? (
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
    </div>
  );
}
