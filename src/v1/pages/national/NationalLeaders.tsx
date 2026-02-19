import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { memberFilter } from "@v1/api/affiliate";
import type { Member } from "@v1/api/member";
import { national } from "@v1/api/national";
import RoleHistory from "@v1/components/role/RoleHistory";
import Badge from "@v1/components/ui/Badge";
import type { Column } from "@v1/components/ui/DataTable";
import DataTable from "@v1/components/ui/DataTable";
import SearchInput from "@v1/components/ui/SearchInput";
import { Roles } from "@v1/constants/roles";
import { useAuth } from "@v1/contexts/AuthContext";
import { readableName } from "@v1/helpers/formatter";
import { LoaderCircle, UserRoundX } from "lucide-react";
import { useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";

export interface Position {
  id: number;
  name: string;
}

export interface CurrentPosition {
  id: number;
  affiliate_id: number;
  position_id: number;
  member_id: number;
  start_date: string;
  end_date: string | null;
  is_vacant: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  position: Position;
}

export interface Affiliate {
  id: number;
  name: string | null;
  created_by: string | null;
  updated_by: string | null;
}

export interface nationaLeader extends Member {
  user: {
    id: number;
    email: string;
    roles: [
      {
        id: number;
        name: string;
        description: string;
      }
    ];
  };
}

// Delete Confirmation Dialog Component
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
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

export default function NationalLeaders() {
  const { id, sub } = useParams<{ id?: string; sub?: string }>();
  const { roles } = useOutletContext<{ roles: any[] }>();
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [filters, setFilters] = useState<memberFilter>({
    position: [],
    employment_status: [],
    level: [],
  });
  const { session, loading, userRole } = useAuth();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [leaderToDelete, setLeaderToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const isNational = userRole.roles.includes(Roles.NATIONAL_ADMINISTRATOR);

  const queryKey = ["national_leaders", sub ? sub : id];
  const parentRole = roles?.find((r) => r.id === Number(id));
  const childrenRole = parentRole.children?.find((r) => r.id === Number(sub));
  const roleName = sub ? childrenRole.name : parentRole.name;

  const { mutate } = useMutation({
    mutationFn: (user_id: number) =>
      national.removeUser({
        user_id: user_id,
        role_id: sub ? Number(sub) : Number(id),
      }),
    onSuccess: (updatedList) => {
      console.log(queryKey);
      queryClient.invalidateQueries({ queryKey: queryKey });
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

  const handleSearch = () => {
    setTerm(search);
    console.log(search);
  };

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
      accessor: (row) => <span className="text-xs">{row.work_email}</span>,
    },
    {
      key: "work_phone",
      header: "Phone",
      accessor: (row) => <span className="text-xs">{row.work_phone}</span>,
    },
    // {
    //   key: "self_id",
    //   header: "Self Identification",
    //   accessor: (row) => <span className="text-xs">{row.self_id}</span>,
    // },
    {
      key: "non_nso",
      header: "Non NSO",
      accessor: (row) => {
        return <span className="text-xs">{row.non_ORG ? "Yes" : "No"}</span>;
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

  return (
    <div className="flex flex-col flex-1 p-5">
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        userName={leaderToDelete?.name || ""}
        isLoading={deleting}
      />

      <div className="flex flex-wrap items-center gap-4 mb-3 md:justify-between">
        <div className="flex gap-2">
          <SearchInput
            placeholder="Search National Leaders"
            value={search}
            onChange={setSearch}
            onEnter={handleSearch}
          />
          {/* <RoleHistory
            type="national"
            id={Number(sub) || Number(id)}
            title={roleName}
          /> */}
          {/* {sub && <NationalLeadersHistory position_name="" />} */}
        </div>

        <div className="flex gap-2"></div>
      </div>
      <div className="flex-1">
        <DataTable
          columns={columns}
          queryKey={queryKey}
          filterKey={{ term, id, sub }}
          queryFn={(page, perPage) =>
            national.roleUsers({
              page,
              perPage,
              search: term,
              role_id: sub ? Number(sub) : Number(id),
            })
          }
          pagination={true}
          massSelection={false}
          renderActions={(affiliate) => (
            <div className="flex items-center gap-2 ml-2">
              {/* <EditMember member={affiliate} queryKey={queryKey} /> */}
              <button
                onClick={() => handleDeleteClick(affiliate)}
                disabled={deleting}
                className="p-2 text-red-600 transition rounded-full hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                title="Remove Member"
              >
                {deleting && deleteId === affiliate.user_id ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : (
                  <UserRoundX className="w-4 h-4" />
                )}
              </button>
            </div>
          )}
        />
      </div>
    </div>
  );
}
