import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { national, type nationalLeaderUsers } from "@v1/api/national";
import AssignUser from "@v1/components/national/AssignUser";
import Badge from "@v1/components/ui/Badge";
import Pagination from "@v1/components/ui/Pagination";
import SearchInput from "@v1/components/ui/SearchInput";
import Table, { type Column } from "@v1/components/ui/Table";
import { National_Roles } from "@v1/constants/roles";
import { useAuth } from "@v1/contexts/AuthContext";
import { readableName } from "@v1/helpers/formatter";
import type { nationaLeader } from "@v1/pages/national/NationalLeaders";
import { LoaderCircle, RefreshCcw, Shield, UserRoundX } from "lucide-react";
import { useMemo, useState } from "react";
import { useOutletContext, useParams, useSearchParams } from "react-router-dom";

function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  userName,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName: string;
  isLoading: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 bg-black/50">
      <div className="w-full max-w-md p-6 mx-4 bg-white rounded-lg shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full">
            <UserRoundX className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Remove National Leader
          </h3>
        </div>

        <p className="mb-6 text-gray-600">
          Are you sure you want to remove{" "}
          <span className="font-semibold">{userName}</span> from this role? This
          action cannot be undone.
        </p>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <UserRoundX size={16} />
            )}
            Remove Leader
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NationalLeader() {
  const { id } = useParams<{ id?: string; sub?: string }>();
  const { roles } = useOutletContext<{ roles: any[] }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { userRole } = useAuth();
  const parentRole = roles?.find((r) => r.id === Number(id));
  const role_name = parentRole.name;
  const isNational = National_Roles.some((role) =>
    userRole.roles.includes(role)
  );

  const [deleting, setDeleting] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [leaderToDelete, setLeaderToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const filters: nationalLeaderUsers = useMemo(() => {
    const main_filter: nationalLeaderUsers = {
      perPage: searchParams.get("per_page") ?? "20",
      page: Number(searchParams.get("page") ?? 1),
      search: searchParams.get("search") ?? "",
    };

    return main_filter;
  }, [searchParams]);

  const key = ["national-leaders", id, filters];

  const {
    data: leaders,
    isLoading: leaders_loading,
    isFetching: leaders_fetching,
  } = useQuery({
    queryKey: key,
    queryFn: () => national.roleUsers({ ...filters, role_id: id }),
    enabled: !!id,
  });

  const { mutate } = useMutation({
    mutationFn: (user_id: number) =>
      national.removeUser({
        user_id: user_id,
        role_id: Number(id),
      }),
    onSuccess: (updatedList) => {
      queryClient.invalidateQueries({ queryKey: key });
      setDeleting(false);
      setDeleteId(null);
      setShowDeleteDialog(false);
      setLeaderToDelete(null);
    },
    onError: (err: any) => {
      console.log(err);
      setDeleting(false);
      setDeleteId(null);
      setShowDeleteDialog(false);
      setLeaderToDelete(null);
    },
  });

  const hasCachedData = queryClient.getQueryData(key) !== undefined;
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

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: key });
  };

  const columns: Column<nationaLeader>[] = [
    {
      key: "member",
      header: "Name",
      accessor: (row) => (
        <span className="text-xs font-bold">
          {row.first_name} {row.last_name}
        </span>
      ),
    },
    {
      key: "affiliate",
      header: "Affiliate",
      accessor: (row) => (
        <span className="text-xs font-semibold ">{row.affiliate?.name}</span>
      ),
    },
    {
      key: "level",
      header: "Level",
      accessor: (row) => (
        <div>
          {row.level === "Associate" && (
            <span className="px-3 py-1 text-xs font-medium text-white bg-blue-500 rounded-full">
              {row.level}
            </span>
          )}
          {row.level === "Professional" && (
            <span className="px-3 py-1 text-xs font-medium text-white bg-indigo-500 rounded-full">
              {row.level}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "employment_status",
      header: "Employment Status",
      accessor: (row) => (
        <div>
          {row.employment_status === "Full Time" && (
            <span className="px-3 py-1 text-xs font-medium text-white bg-green-500 rounded-full">
              {row.employment_status}
            </span>
          )}
          {row.employment_status === "Part Time" && (
            <span className="px-3 py-1 text-xs font-medium text-white bg-yellow-500 rounded-full">
              {row.employment_status}
            </span>
          )}
        </div>
      ),
    },
{
  key: "work_email",
  header: "Email",
  accessor: (row) => {
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
      key: "user",
      header: "Role",
      accessor: (row) => {
        return (
          <div className="flex items-center gap-2">
            {row.user.roles.map((role) => (
              <Badge className="mb-1 text-[10px] text-center">
                <span>{readableName(role.name)}</span>
              </Badge>
            ))}
          </div>
        );
      },
    },
  ];

  const handleDeleteClick = (leader: nationaLeader) => {
    setLeaderToDelete({
      id: leader.user_id,
      name: `${leader.first_name} ${leader.last_name}`,
    });
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (leaderToDelete) {
      setDeleting(true);
      setDeleteId(leaderToDelete.id);
      mutate(leaderToDelete.id);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setLeaderToDelete(null);
  };

  return (
    <div className="flex flex-col p-0 space-y-4 lg:p-4 bg-gray-50">
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        userName={leaderToDelete?.name || ""}
        isLoading={deleting}
      />
      <div className="sticky inset-0 z-[30] flex flex-col gap-4 p-4 bg-white border-b border-gray-200 shadow-sm md:flex-row md:items-center md:justify-between">
        {/* Left side: Icon + Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg shrink-0">
            <Shield className="w-5 h-5 text-blue-500" />
          </div>

          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {readableName(role_name)}
            </h1>
            <p className="text-sm text-gray-500">Assign National Leaders</p>
          </div>
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-2">
          <AssignUser roles={roles} />
        </div>
      </div>

      <div className="flex flex-col justify-between w-full gap-2 itemask-center lg:flex-row ">
        <div className="flex items-center flex-1 order-1 gap-2 lg:order-2 lg:justify-end"></div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex gap-3 lg:justify-end">
        <div>
          <SearchInput
            value={searchParams.get("search") ?? ""}
            className="w-full"
            onChange={handleSearchChange}
          />
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className={`
                inline-flex items-center gap-2 px-3 py-2 text-xs font-medium
                border rounded-lg transition-all
                bg-white border-gray-300 text-gray-700
                hover:bg-gray-50
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 w-24
                ${
                  leaders_fetching
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }
              `}
        >
          <RefreshCcw
            size={14}
            className={leaders_fetching ? "animate-spin" : ""}
          />
          <span>Refresh</span>
        </button>
      </div>

      {/* Document List */}
      <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-xs ">
        <Table
          loading={!hasCachedData && leaders_fetching}
          columns={columns}
          data={leaders?.items ?? []}
          renderActions={(row) => (
            <div className="flex items-center gap-2 ml-2">
              {/* <EditMember member={affiliate} queryKey={queryKey} /> */}
              <button
                onClick={() => handleDeleteClick(row)}
                disabled={deleting}
                className="p-2 text-red-600 transition rounded-full hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                title="Remove Member"
              >
                {deleting && deleteId === row.user_id ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : (
                  <UserRoundX className="w-4 h-4" />
                )}
              </button>
            </div>
          )}
        />

        {/* Pagination */}
        {!leaders_loading &&
          leaders &&
          leaders?.items &&
          leaders?.items.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 ">
              <Pagination lastPage={leaders.last_page ?? 1} />
            </div>
          )}
      </div>
    </div>
  );
}
