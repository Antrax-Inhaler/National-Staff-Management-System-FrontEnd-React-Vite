import { useState, useEffect } from "react";
import {
  LoaderCircle,
  Plus,
  Search,
  SquarePen,
  Trash2,
  UserRoundPen,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import PortalLayout from "../../../components/layout/PortalLayout";
import { Link, useSearchParams } from "react-router-dom";
import Pagination from "../../../components/ui/Pagination";
import TableHeader from "../../../components/ui/TableHeader";
import EditAffiliate from "../../../components/affiliates/EditAffiliate";
import InputField from "../../../components/ui/InputField";
import { fetchAffiliates } from "../../../api/affiliates/fetchAffiliates";
import { addAffiliate } from "../../../api/affiliates/addAffiliate";
import { deleteAffiliate } from "../../../api/affiliates/deleteAffiliate";
import type { Column } from "../../../components/ui/DataTable";
import Badge from "../../../components/ui/Badge";
import DataTable from "../../../components/ui/DataTable";
import AddAffiliate from "../../../components/affiliates/AddAffiliate";
import { useAuth } from "../../../contexts/AuthContext";

interface Affiliate {
  id: number;
  name: string;
  created_by: string | null;
  updated_by: string | null;
  members_count: number;
}

function AffiliateListPage() {
  const [selected, setSelected] = useState<unknown[]>([]);
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [url, setUrl] = useState("");
  const [open, setOpen] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { session, loading } = useAuth();

  const currentPage = Number(searchParams.get("page") ?? 1);
  const perPage = searchParams.get("per_page") ?? 10;

  const { mutate: deleteMutate, isPending: isDeleting } = useMutation({
    mutationFn: (id: number) => deleteAffiliate(id, session!.access_token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliates", term] });
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const handleDelete = (affiliate: any) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${affiliate?.name}"`
    );
    if (confirmed) {
      setDeletingId(affiliate?.id);
      deleteMutate(affiliate?.id);
    }
  };

  const columns: Column<Affiliate>[] = [
    {
      key: "organization",
      header: "Organization",
      accessor: (row) => (
        <Link to={`/national/affiliate/${row.id}/members`}>
          <span className="font-bold">{row.name}</span>
        </Link>
      ),
    },
    {
      key: "members",
      header: "Members",
      accessor: (row) => (
        <Badge
          variant="primary"
          className="!font-bold !text-md"
        >{`${row.members_count}`}</Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">
          Affiliate Management
        </h1>
        <p className="mt-2 text-gray-600">Manage affiliate organizations</p>
      </header>

      <div className="p-6 bg-white rounded-lg shadow">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          {/* Search Box */}
          <div className="flex items-center w-full max-w-sm px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-blue-500">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="search"
              placeholder="Search Organization"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setTerm(search);
                  setUrl("");
                }
              }}
              className="flex-1 ml-2 text-sm text-gray-700 placeholder-gray-400 bg-transparent focus:outline-none"
            />
          </div>
          <AddAffiliate />
        </div>
        <DataTable
          columns={columns}
          queryKey={["affiliates", term]}
          queryFn={(page, perPage) =>
            fetchAffiliates(perPage, currentPage, term, session!.access_token)
          }
          pagination={true}
          massSelection={false}
          renderActions={(affiliate) => (
            <div className="flex items-center gap-2 ml-2">
              <EditAffiliate affiliate={affiliate} />
              <button
                className="p-2 text-center text-red-600 transition bg-red-100 rounded-full hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                title="Edit"
                onClick={() => handleDelete(affiliate)}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        />
      </div>
    </div>
  );
}

export default AffiliateListPage;
