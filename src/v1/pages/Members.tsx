import {
  useIsFetching,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import CreateMember from "@v1/components/members/CreateMember";
import EditMember from "@v1/components/members/EditMember";
import HelpButton from "@v1/components/help/HelpButton";
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
  ArchiveX,
  ArrowDownUp,
  Building2,
  Calendar,
  Columns3,
  Download,
  Eye,
  ListFilter,
  LoaderCircle,
  MapPin,
  RefreshCcw,
  Tag,
  Trash2,
  X,
  Rows3,
  LayoutGrid,
  Phone,
  Mail,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { members } from "../api/member";
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
import { safeFormatDate } from "@v1/helpers/dateUtils";
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
  PaginatedData,
} from "@v1/types";
import { getGoogleMapsUrl } from "@v1/helpers/helper";
import toast from "react-hot-toast";

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

// Card component for Member (compact version)
const MemberCard = ({
  member,
  onView,
  onArchive,
  onDelete,
  onEdit,
  isArchiving,
  isDeleting,
  archiveId,
  deleteId,
}: {
  member: Member;
  onView: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onEdit: () => void;
  isArchiving: boolean;
  isDeleting: boolean;
  archiveId: number | null;
  deleteId: number | null;
}) => {
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

  const getLevelVariant = (level: string) => {
    switch (level) {
      case "Professional":
        return "primary";
      case "Associate":
        return "success";
      default:
        return "gray";
    }
  };

  const getEmploymentVariant = (status: string) => {
    switch (status) {
      case "Full Time":
        return "success";
      case "Part Time":
        return "warning";
      default:
        return "gray";
    }
  };

  return (
    <div className="flex flex-col h-full p-3 transition-all duration-200 bg-white border border-gray-200 rounded-lg hover:shadow-sm hover:border-blue-200">
      {/* Header with Avatar and Basic Info */}
      <div className="flex items-start gap-2.5 mb-2">
        {/* Avatar - Smaller */}
        <div className="flex-shrink-0">
          <Avatar
            imageUrl={member.photo_signed_url}
            alt={`${member.first_name} ${member.last_name}`}
            fallbackText={`${member.first_name} ${member.last_name}`}
            size="md"
            variant="circle"
            className="border border-gray-300"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header with name, ID, and actions */}
          <div className="mb-1.5">
            <div className="flex items-start justify-between">
              <div className="flex-1 group">
                <h3 className="pr-2 text-xs font-semibold text-gray-900 transition-colors line-clamp-2 group-hover:text-blue-600">
                  {member.last_name || "Unknown"},{" "}
                  {member.first_name || "Unknown"}
                </h3>
                <div className="mt-0.5">
                  <span className="text-[10px] font-mono text-gray-600">
                    ID: {member.member_id || "N/A"}
                  </span>
                </div>
              </div>

              {/* Action buttons - All in one row */}
              <div className="flex items-center gap-0.5">
                <button
                  onClick={onView}
                  className="p-1 text-gray-600 transition-colors rounded hover:bg-blue-50 hover:text-blue-600"
                  title="View member"
                >
                  <Eye className="w-3 h-3" />
                </button>

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
                  <button
                    onClick={onEdit}
                    className="p-1 text-gray-600 transition-colors rounded hover:bg-blue-50 hover:text-blue-600"
                    title="Edit member"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      ></path>
                    </svg>
                  </button>
                </RoleGuard>

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
                    message={`Are you sure you want to archive ${member.first_name} ${member.last_name}?`}
                    onConfirm={onArchive}
                  >
                    <button
                      disabled={isArchiving}
                      className="p-1 text-orange-600 transition-colors rounded hover:bg-orange-50 hover:text-orange-700"
                      title="Archive Member"
                    >
                      {isArchiving && archiveId === member.id ? (
                        <LoaderCircle className="w-3 h-3 animate-spin" />
                      ) : (
                        <ArchiveX className="w-3 h-3" />
                      )}
                    </button>
                  </ConfirmationPopUp>
                </RoleGuard>

                {/* Only National Administrators can see delete button */}
                <RoleGuard roles={[Roles.NATIONAL_ADMINISTRATOR]}>
                  <ConfirmationPopUp
                    message={`Are you sure you want to permanently delete ${member.first_name} ${member.last_name}?`}
                    onConfirm={onDelete}
                  >
                    <button
                      disabled={isDeleting}
                      className="p-1 text-red-600 transition-colors rounded hover:bg-red-50 hover:text-red-700"
                      title="Delete Member"
                    >
                      {isDeleting && deleteId === member.id ? (
                        <LoaderCircle className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  </ConfirmationPopUp>
                </RoleGuard>
              </div>
            </div>

            {/* Affiliate info */}
            {member.affiliate?.name && (
              <div className="flex items-center gap-1 mt-0.5 text-[10px] text-gray-500">
                <Building2 className="w-2.5 h-2.5 flex-shrink-0" />
                <span className="line-clamp-1">{member.affiliate.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact Info - More compact */}
      <div className="mb-2 space-y-1">
        {member.work_email && (
          <div className="flex items-center gap-1">
            <Mail className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" />
            <a
              href={`mailto:${member.work_email}`}
              className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline truncate"
              onClick={(e) => e.stopPropagation()}
            >
              {member.work_email}
            </a>
          </div>
        )}

        {member.mobile_phone && (
          <div className="flex items-center gap-1">
            <Phone className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" />
            <a
              href={`tel:${member.mobile_phone}`}
              className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {member.mobile_phone}
            </a>
          </div>
        )}

        {member.date_of_birth && (
          <div className="flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" />
            <span className="text-[10px] text-gray-700">
              DOB: {simpleFormatDate(member.date_of_birth)}
            </span>
          </div>
        )}

        {member.city && (
          <div className="flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" />
            <span className="text-[10px] text-gray-700 truncate">
              {member.city}
              {member.state && `, ${member.state}`}
            </span>
          </div>
        )}
      </div>

      {/* Badges - More compact */}
      <div className="flex flex-wrap gap-1 mb-2">
        {member.level && (
          <Badge
            variant={getLevelVariant(member.level)}
            className="text-[10px] px-1.5 py-0.5"
          >
            {member.level}
          </Badge>
        )}

        {member.employment_status && (
          <Badge
            variant={getEmploymentVariant(member.employment_status)}
            className="text-[10px] px-1.5 py-0.5 capitalize"
          >
            {member.employment_status}
          </Badge>
        )}

        {member.status && (
          <Badge
            variant={getStatusVariant(member.status)}
            className="text-[10px] px-1.5 py-0.5 capitalize"
          >
            {member.status}
          </Badge>
        )}
      </div>

      {/* Positions - More compact */}
      {member.current_positions && member.current_positions.length > 0 && (
        <div className="pt-2 mt-auto border-t border-gray-100">
          <div className="flex flex-wrap gap-1">
            {member.current_positions.slice(0, 2).map((pos, index) => (
              <Badge
                key={pos.id || index}
                variant="primary"
                className="text-[10px] px-1.5 py-0.5 truncate max-w-[100px]"
                title={pos.position.name}
              >
                {pos.position.name}
              </Badge>
            ))}
            {member.current_positions.length > 2 && (
              <Badge variant="gray" className="text-[10px] px-1.5 py-0.5">
                +{member.current_positions.length - 2} more
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
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
              <span className="truncate max-w-[25ch]">{pos.position.name}</span>
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
    accessor: (row: Member) => {
      const displayEmail = row.official_email || row.work_email;

      return displayEmail ? (
        <a
          href={`mailto:${displayEmail}`}
          className="text-xs text-blue-600 hover:text-blue-800"
          onClick={(e) => e.stopPropagation()}
        >
          {displayEmail}
        </a>
      ) : (
        <span className="text-xs text-gray-500">No email</span>
      );
    },
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

export default function Members() {
  const { uid: affiliate_uid } = useParams<{ uid?: string }>();

  const { userRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [selectedAffiliates, setSelectedAffiliates] = useState<FilterOption[]>(
    [],
  );
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  const [affiliateSearch, setAffiliateSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [visibleCols, setVisibleCols] = useState<string[]>(DEFAULT_COLUMNS);
  const [archivedId, setArchivedId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [errorMessage] = useState("");

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
    ? [`member-roster-${affiliate_uid}`, MainFilter]
    : ["member-roster", MainFilter];

  const fetchMembers = (): Promise<PaginatedData<Member>> => {
    return affiliate_uid
      ? members.affiliate(affiliate_uid, MainFilter)
      : members.index(MainFilter);
  };

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
      setArchivedId(null);
      handleRefresh();
      setSelectedRows(new Set());
    },
    onError: (err) => {
      if (err.message) {
        toast.error(err.message);
      }
      setDeleteId(null);
      setArchivedId(null);
    },
  });

  const handleApplyFilters = (params: URLSearchParams) => {
    setSearchParams(params);
    queryClient.invalidateQueries({
      queryKey: newQueryKey,
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

  // const isNational = userRole.roles.includes(Roles.NATIONAL_ADMINISTRATOR);

  const { mutateAsync: ExportMemberData, isPending: ExportingData } =
    useMutation({
      mutationKey: ["export"],
      mutationFn: (all: boolean) =>
        members.export({
          affiliate_uid: affiliate_uid,
          ids: all ? undefined : Array.from(selectedRows).join(","),
          ...MainFilter,
        }),
      onSuccess: (data) => {
        const exportData = Array.isArray(data) ? data : data.items;
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
        const csvData = exportData.map((member: Member) => [
          member.member_id || "",
          member.first_name || "",
          member.last_name || "",
          member.affiliate?.name || "",
          // Handle multiple positions in export
          member.current_positions && member.current_positions.length > 0
            ? member.current_positions
                .map((pos) => pos.position.name)
                .join("; ")
            : "Member",
          member.level || "",
          member.employment_status || "",
          member.gender
            ? member.gender.charAt(0).toUpperCase() + member.gender.slice(1)
            : "",
          safeFormatDate(member.date_of_birth)
            .replace("Invalid date", "")
            .replace("Not set", ""),
          safeFormatDate(member.date_of_hire)
            .replace("Invalid date", "")
            .replace("Not set", ""),
          member.city || "",
          member.state || "",
          member.zip_code || "",
          member.work_email || "",
          member.mobile_phone || "",
          member.home_phone || "",
          member.self_id || "",
          member.non_ORG ? "Yes" : "No",
          member.status || "",
        ]);
        const csvContent = [
          headers.join(","),
          ...csvData.map((row: any) =>
            row.map((field: any) => `"${field || ""}"`).join(","),
          ),
        ].join("\n");
        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
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
        setSelectedRows(new Set());
      },
    });

  const handleDelete = (force: boolean, id?: number) => {
    id && force && setDeleteId(id);
    id && !force && setArchivedId(id);
    DeleteMember({
      ids: id ? [id] : Array.from(selectedRows),
      force,
    });
  };

  // View handler
  const handleView = (member: Member) => {
    window.open(`/members/${member.public_uid}`, "_blank");
  };

  // Edit handler
  const handleEdit = (member: Member) => {
    // You'll need to implement EditMember modal or component
    console.log("Edit member:", member);
  };

  return (
    <div className="flex flex-col flex-1 p-3 bg-white rounded-lg shadow md:p-4">
      {errorMessage && <AlertMessage type="error" message={errorMessage} />}

      <div className="flex flex-col gap-3 mb-3">
        {/* HEADER SECTION - Same as Affiliates and Information */}
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
          <header className="md:flex-1">
            <h1 className="text-xl font-bold text-gray-900">
              {affiliate_uid ? "Affiliate Members" : "Member Management"}
            </h1>
            <p className="mt-1 text-xs text-gray-600">
              Manage member details and information
            </p>
          </header>

          <div className="flex flex-wrap items-start gap-1.5 md:gap-2 md:justify-end">
            <ActionButton
              as="link"
              to="archives"
              label="Archives"
              icon={ArchiveX}
              iconSize={12}
              buttonClassName="bg-zinc-600! hover:bg-zinc-700! text-white! font-semibold! text-xs px-2.5 py-1.5"
            />

            <ActionButton
              label="Export CSV"
              icon={ExportingData ? LoaderCircle : Download}
              iconSize={12}
              loading={ExportingData}
              onClick={() => ExportMemberData(true)}
              buttonClassName="bg-green-600! hover:bg-green-700! text-white! font-semibold! text-xs px-2.5 py-1.5"
            />

            <RoleGuard
              roles={[...National_Roles]}
              positions={[
                Positions.SECRETARY,
                Positions.PRESIDENT,
                Positions.TREASURER,
              ]}
            >
              <CreateMember queryKey={newQueryKey} />
            </RoleGuard>
          </div>
        </div>

        {/* CONTROLS SECTION - Same as Affiliates and Information */}
        <div className="flex flex-col gap-3 lg:flex-row">
          {/* LEFT SIDE: Filter, Sort, View Toggle, Refresh */}
          <div className="flex flex-wrap items-center gap-2 lg:flex-1">
            <AdvancedFilter
              label="Filters"
              title="Filters"
              onApply={handleApplyFilters}
              sections={filter_options}
              searchParams={searchParams}
              onClear={handleClear}
              activeFilter={
                ActiveSortBadges.length > 0 || selectedAffiliates.length > 0
              }
              customActiveBadges={
                <>
                  {ActiveSortBadges.length > 0 ? <>{ActiveSortBadges}</> : null}
                  {selectedAffiliates.length > 0 ? (
                    <>
                      {selectedAffiliates.map((affiliate) => (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-700 rounded-lg bg-blue-50">
                          <span className="font-medium">Affiliate:</span>
                          <span>{affiliate.label}</span>
                          <button
                            onClick={() =>
                              removeFilteredAffiliate(affiliate.value)
                            }
                            className="ml-1 text-blue-500 hover:text-blue-700"
                          >
                            <X size={12} />
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

                  {/* View Mode Toggle - Same as Affiliates and Information */}
                  <div className="inline-flex items-center gap-0 px-1 py-1 bg-white border border-gray-300 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setViewMode("card")}
                      disabled={MembersFetching}
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
                        ${MembersFetching ? "opacity-50 cursor-not-allowed" : ""}
                      `}
                    >
                      <LayoutGrid size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("table")}
                      disabled={MembersFetching}
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
                        ${MembersFetching ? "opacity-50 cursor-not-allowed" : ""}
                      `}
                    >
                      <Rows3 size={14} />
                    </button>
                  </div>

                  {viewMode == "table" && (
                    <FilterDropdown
                      options={COLUMN_OPTIONS}
                      defaultValue={{ columns: DEFAULT_COLUMNS }}
                      value={{ columns: visibleCols }}
                      onApply={(selected: any) =>
                        setVisibleCols(selected.columns)
                      }
                      onReset={() => setVisibleCols(DEFAULT_COLUMNS)}
                      buttonLabel="Columns"
                      icon={Columns3}
                    />
                  )}

                  <ActionButton
                    onClick={handleRefresh}
                    label="Refresh"
                    icon={RefreshCcw}
                    iconSize={14}
                    loading={MembersFetching}
                    buttonClassName="px-3 py-1.5 text-xs"
                  />
                </>
              }
            />
          </div>

          {/* RIGHT SIDE: Search - Same as Affiliates and Information */}
          <div className="lg:w-64">
            <SearchInput
              placeholder="Search by First Name, Last Name, Member ID ..."
              value={searchParams.get("search") ?? ""}
              onChange={handleSearchChange}
              showClear
            />
          </div>
        </div>
      </div>

      {/* Selected Items Bar */}
      {selectedRows.size > 0 && (
        <div className="p-2 mb-3 border border-blue-200 rounded-lg bg-blue-50">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-blue-800">
              {selectedRows.size} Member{selectedRows.size !== 1 ? "s" : ""}{" "}
              selected
            </p>
            <div className="flex gap-1.5">
              <ConfirmationPopUp
                message={`Are you sure you want to archive selected Members?`}
                onConfirm={() => handleDelete(false)}
              >
                <ActionButton
                  label="Archive Selected"
                  icon={DeletingMember ? LoaderCircle : ArchiveX}
                  iconSize={12}
                  buttonClassName="bg-orange-400! hover:bg-orange-500! text-white! font-semibold! text-xs px-2.5 py-1.5"
                  loading={DeletingMember}
                />
              </ConfirmationPopUp>

              {/* Only show Delete Selected for National Administrators */}
              <RoleGuard roles={[Roles.NATIONAL_ADMINISTRATOR]}>
                <ConfirmationPopUp
                  message={`Are you sure you want to permanently delete selected Members?`}
                  onConfirm={() => handleDelete(true)}
                >
                  <ActionButton
                    label="Delete Selected"
                    icon={DeletingMember ? LoaderCircle : Trash2}
                    iconSize={12}
                    buttonClassName="bg-red-600! hover:bg-red-700! text-white! font-semibold! text-xs px-2.5 py-1.5"
                    loading={DeletingMember}
                  />
                </ConfirmationPopUp>
              </RoleGuard>

              <ActionButton
                label="Export Selected"
                onClick={() => ExportMemberData(false)}
                icon={ExportingData ? LoaderCircle : Download}
                iconSize={12}
                buttonClassName="bg-green-700! hover:bg-green-800! text-white! font-semibold! text-xs px-2.5 py-1.5"
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

      {/* DataTable */}
      <div className="flex-1">
        <DataTable<Member>
          columns={columns}
          view={viewMode}
          massSelection={viewMode === "table"}
          queryKey={newQueryKey}
          queryFn={fetchMembers}
          selectedRows={selectedRows}
          onSelectionChange={handleSelectionChange}
          visibleColumns={visibleCols}
          renderActions={(member: Member) => (
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => handleView(member)}
                className="p-1 text-gray-600 transition-colors rounded hover:bg-blue-50 hover:text-blue-600"
                title="View member"
              >
                <Eye className="w-3 h-3" />
              </button>

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
                <EditMember member={member} queryKey={newQueryKey} />
                <ConfirmationPopUp
                  message={`Are you sure you want to archive ${member.first_name} ${member.last_name}?`}
                  onConfirm={() => handleDelete(false, member.id)}
                >
                  <button
                    disabled={DeletingMember}
                    className="p-1 text-orange-600 transition-colors rounded hover:bg-orange-50 hover:text-orange-700"
                    title="Archive Member"
                  >
                    {DeletingMember && archivedId === member.user_id ? (
                      <LoaderCircle className="w-3 h-3 animate-spin" />
                    ) : (
                      <ArchiveX className="w-3 h-3" />
                    )}
                  </button>
                </ConfirmationPopUp>

                {/* Only National Administrators can see delete button in table view */}
                <RoleGuard roles={[Roles.NATIONAL_ADMINISTRATOR]}>
                  <ConfirmationPopUp
                    message={`Are you sure you want to permanently delete ${member.first_name} ${member.last_name}?`}
                    onConfirm={() => handleDelete(true, member.id)}
                  >
                    <button
                      disabled={DeletingMember}
                      className="p-1 text-red-600 transition-colors rounded hover:bg-red-50 hover:text-red-700"
                      title="Delete Member"
                    >
                      {DeletingMember && deleteId === member.user_id ? (
                        <LoaderCircle className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  </ConfirmationPopUp>
                </RoleGuard>
              </RoleGuard>
            </div>
          )}
          renderCard={(member: Member, idx: number) => (
            <div
              key={member.id}
              className="h-full transition-all duration-200 animate-fadeIn"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <MemberCard
                member={member}
                onView={() => handleView(member)}
                onArchive={() => handleDelete(false, member.id)}
                onDelete={() => handleDelete(true, member.id)}
                onEdit={() => handleEdit(member)}
                isArchiving={DeletingMember}
                isDeleting={DeletingMember}
                archiveId={archivedId}
                deleteId={deleteId}
              />
            </div>
          )}
        />
      </div>
      <HelpButton
        category="Members"
        pageTitle="Members Management"
        buttonClassName="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
      />
    </div>
  );
}
