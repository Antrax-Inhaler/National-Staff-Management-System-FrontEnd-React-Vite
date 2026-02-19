import { useParams } from "react-router-dom";
import DataTable, { type Column } from "../../../components/ui/DataTable";
import Badge from "../../../components/ui/Badge";
import {
  BadgeCheck,
  FileClock,
  FolderClock,
  LoaderCircle,
  UserRoundPen,
  UserRoundX,
  MoreVertical,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { vacantPosition } from "../../../api/officers/vacantPosition";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import AssignAffiliateOfficer from "../../../components/members/AssignAffiliateOfficer";

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
  affiliate_id: number,
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
    `${apiUrl}/api/affiliates/officers/${affiliate_id}?${param.toString()}`,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState<number | null>(null);
  const affiliateId = Number(id);
  const { session, loading } = useAuth();
  const queryClient = useQueryClient();

  const vacantPostionMutate = useMutation({
    mutationFn: (id: number) => vacantPosition(id, session!.access_token),
    onSuccess: (updatedList) => {
      const queryKey = [`officers-${affiliateId}`, affiliateId];
      const cached = queryClient.getQueryData(queryKey);

      console.log("✅ Cached data for", queryKey, "→", cached);

      queryClient.setQueryData(
        [`officers-${affiliateId}`, affiliateId, 1, 10],
        updatedList
      );
      setMobileMenuOpen(null);
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

  const toggleMobileMenu = (officerId: number) => {
    setMobileMenuOpen(mobileMenuOpen === officerId ? null : officerId);
  };

  const columns: Column<Officer>[] = [
    {
      key: "position",
      header: "Position",
      accessor: (row) => <span className="font-bold">{row.name}</span>,
      mobilePriority: 1,
    },
    {
      key: "officer",
      header: "Officer",
      accessor: (row) =>
        row.current_officer?.member ? (
          <div className="flex flex-col gap-1">
            <Badge
              variant="primary"
              className="!font-bold !text-sm md:!text-md"
            >{`${row.current_officer.member.first_name} ${row.current_officer.member.last_name}`}</Badge>
            <span className="text-xs text-gray-500 md:hidden">
              Assigned
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <Badge variant="success" className="text-sm md:text-base">Vacant</Badge>
            <span className="text-xs text-gray-500 md:hidden">
              Available
            </span>
          </div>
        ),
      mobilePriority: 1,
    },
    {
      key: "start_date",
      header: "Start Date",
      accessor: (row) =>
        row.current_officer ? (
          <div className="flex flex-col">
            <span className="font-semibold text-sm md:text-base">
              {new Date(row.current_officer.start_date).toLocaleDateString(
                undefined, // use browser locale
                {
                  year: "numeric",
                  month: "long", // "short" for abbreviated
                  day: "numeric",
                }
              )}
            </span>
            <span className="text-xs text-gray-500 md:hidden">
              Since
            </span>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        ),
      mobilePriority: 2,
    },
  ];

  // Mobile Action Menu Component
  const MobileActionMenu = ({ officer }: { officer: Officer }) => (
    <div className="absolute right-0 z-10 mt-2 bg-white rounded-lg shadow-lg top-6 w-44 ring-1 ring-black ring-opacity-5">
      <div className="py-1">
        {officer.current_officer?.member && (
          <button
            className="flex items-center w-full gap-2 px-4 py-2 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            onClick={() => handleMarkVacant(officer.current_officer!.id)}
            disabled={vacantLoadingId === officer.current_officer?.id}
          >
            {vacantLoadingId === officer.current_officer?.id ? (
              <LoaderCircle className="w-4 h-4 animate-spin" />
            ) : (
              <UserRoundX size={16} />
            )}
            Mark Vacant
          </button>
        )}
        <div className="px-4 py-2">
          <AssignAffiliateOfficer
            affiliateId={affiliateId}
            positionId={officer.id}
            positionName={officer.name}
            variant="mobile"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative p-4 md:p-5">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
          Affiliate Officers
        </h1>
        <p className="text-sm text-gray-600 md:text-base">
          Manage officer positions and assignments
        </p>
      </div>

      <DataTable
        columns={columns}
        queryKey={[`officers-${affiliateId}`, affiliateId]}
        queryFn={(page, perPage) =>
          fetchOfficers(affiliateId, page, perPage, session!.access_token)
        }
        pagination={false}
        selectedRows={selectedRows}
        onSelectionChange={setSelectedRows}
        responsive={true}
        renderActions={(officer) => (
          <>
            {/* Desktop Actions */}
            <div className="hidden md:flex justify-center gap-2 w-40 lg:gap-3 lg:w-96">
              {officer.current_officer?.member && (
                <button
                  className="flex items-center justify-center gap-2 p-2 text-center text-red-600 transition rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-60"
                  title="Vacant Position"
                  onClick={() => handleMarkVacant(officer.current_officer!.id)}
                  disabled={vacantLoadingId === officer.current_officer?.id}
                >
                  {vacantLoadingId === officer.current_officer?.id ? (
                    <LoaderCircle className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserRoundX size={18} />
                  )}
                  <span className="hidden lg:inline">Mark Vacant</span>
                </button>
              )}
              <AssignAffiliateOfficer
                affiliateId={affiliateId}
                positionId={officer.id}
                positionName={officer.name}
                variant="desktop"
              />
            </div>

            {/* Mobile Actions */}
            <div className="relative md:hidden">
              <button
                className="flex items-center justify-center p-2 text-gray-600 transition rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400"
                onClick={() => toggleMobileMenu(officer.id)}
              >
                <MoreVertical size={18} />
              </button>
              
              {mobileMenuOpen === officer.id && (
                <MobileActionMenu officer={officer} />
              )}
            </div>
          </>
        )}
      />

      {/* Mobile Status Legend */}
      <div className="mt-6 md:hidden">
        <div className="p-3 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Status Legend</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Assigned Officer</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Vacant Position</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}