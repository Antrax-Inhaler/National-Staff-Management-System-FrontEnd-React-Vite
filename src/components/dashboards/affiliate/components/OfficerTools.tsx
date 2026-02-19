import { useParams } from "react-router-dom";
import {
  LoaderCircle,
  UserRoundX,
} from "lucide-react";
import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../../hooks/useAuth";
import { vacantPosition } from "../../../../api/officers/vacantPosition";
import type { Column } from "../../../ui/DataTable";
import Badge from "../../../ui/Badge";
import DataTable from "../../../ui/DataTable";
import AssignAffiliateOfficer from "../../../members/AssignAffiliateOfficer";

interface Officer {
  id: number;
  name: string;
  display_order: number;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  current_officer?: {
    id: number;
    affiliate_id: number;
    position_id: number;
    member_id: number | null;
    start_date: string; // ISO date string
    end_date: string | null; // ISO date string or null
    is_vacant: boolean;
    member?: {
      id: number;
      first_name: string;
      last_name: string;
    } | null;
  } | null;
}

const fetchOfficers = async (
  page: number,
  perPage: number | string,
  token: string
) => {
  console.log(token);
  const param = new URLSearchParams();
  param.set("page", String(page));
  param.set("per_page", String(perPage));
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const res = await fetch(
    `${apiUrl}/api/affiliates/officers?${param.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) throw new Error("Network response was not ok");
  const result = await res.json();
  return {
    items: result.data,
    current_page: result.meta?.current_page || 1,
    last_page: result.meta?.last_page || 1,
    per_page:
      result.meta?.per_page || (typeof perPage === "number" ? perPage : 20),
    total: result.meta?.total || result.data.length,
  };
};

export default function AffiliateOfficerPage() {
  const { id } = useParams<{ id: string }>();
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [vacantLoadingId, setVacantLoadingId] = useState<number | null>(null);
  const affiliateId = Number(id);
  const { session, loading } = useAuth();
  const queryClient = useQueryClient();

  const key = affiliateId
    ? [`officers-${affiliateId}`, affiliateId]
    : ["officers"];

  const vacantPostionMutate = useMutation({
    mutationFn: (id: number) => vacantPosition(id, session!.access_token),
    onSuccess: (updatedList) => {
      const queryKey = [...key, 1, 10];
      const cached = queryClient.getQueryData(queryKey);
      console.log("✅ Cached data for", queryKey, "→", cached);
      queryClient.setQueryData(queryKey, updatedList);
    },
  });

  const handleMarkVacant = async (position_id: number) => {
    setVacantLoadingId(position_id); // show loading
    vacantPostionMutate.mutate(position_id, {
      onSettled: () => {
        setVacantLoadingId(null);
      },
    });
  };

  const columns: Column<Officer>[] = [
    {
      key: "position",
      header: "Position",
      accessor: (row) => <span className="font-bold">{row.name}</span>,
    },
    {
      key: "officer",
      header: "Officer",
      accessor: (row) =>
        row.current_officer?.member ? (
          <Badge
            variant="primary"
            className="!font-bold !text-md"
          >{`${row.current_officer.member.first_name} ${row.current_officer.member.last_name}`}</Badge>
        ) : (
          <Badge variant="success">Vacant</Badge>
        ),
    },
    {
      key: "start_date",
      header: "Start Date",
      accessor: (row) =>
        row.current_officer ? (
          <span className="font-semibold">
            {new Date(row.current_officer.start_date).toLocaleDateString(
              undefined, // use browser locale
              {
                year: "numeric",
                month: "long", // "short" for abbreviated
                day: "numeric",
              }
            )}
          </span>
        ) : (
          "-"
        ),
    },
  ];

  return (
    <div className="relative p-5">
      <DataTable
        columns={columns}
        queryKey={key}
        queryFn={(page, perPage) =>
          fetchOfficers(page, perPage, session!.access_token)
        }
        pagination={false}
        selectedRows={selectedRows}
        onSelectionChange={setSelectedRows}
        renderActions={(officer) => (
          <div className="flex justify-center gap-2 sm:grid-cols-3 sm:w-96">
            {officer.current_officer?.member && (
              <button
                className="flex items-center justify-center gap-2 p-2 text-center text-red-600 transition rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-60"
                onClick={() => handleMarkVacant(officer.current_officer!.id)}
                disabled={vacantLoadingId === officer.current_officer?.id}
              >
                {vacantLoadingId === officer.current_officer?.id ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : (
                  <UserRoundX size={18} />
                )}
              </button>
            )}
            <AssignAffiliateOfficer
              positionId={officer.id}
              positionName={officer.name}
            />
            {/* <button
            className="flex items-center justify-center gap-2 p-2 text-center transition rounded-md bg-zinc-100 text-zinc-600 hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            title="Edit"
            onClick={() => alert(`Edit ${officer.id}`)}
          >
            <FileClock className="w-4 h-4" />
            <span>History</span>
          </button> */}
          </div>
        )}
      />
    </div>
  );
}
