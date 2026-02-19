import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { officers } from "@v1/api/officer";
import type { OfficerHistory } from "@v1/api/profile";
import AffiliatePositionCard from "@v1/components/ui/AffiliateOfficerCard";
import AlertMessage from "@v1/components/ui/AlertMessage";
import LinkCardSkeleton from "@v1/components/ui/skeletons/CardSkeleton";
import { useAuth } from "@v1/contexts/AuthContext";
import { Building, Loader2, LoaderCircle, RefreshCw } from "lucide-react";
import { useState } from "react";

export interface Officer {
  id: number;
  affiliate_id: number;
  position_id: number;
  member_id: number | null;
  start_date: string;
  end_date: string | null;
  is_vacant: boolean;
  member?: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
}

export interface Position {
  id: number;
  name: string;
  display_order: number;
  created_at: string;
  updated_at: string;
  primary_officer?: Officer;
  secondary_officer?: Officer;
  previous_officers?: OfficerHistory[];
}

export default function Officers() {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [vacantLoadingId, setVacantLoadingId] = useState<number | null>(null);
  const [success, setSuccess] = useState("");
  const { userRole } = useAuth();
  const queryClient = useQueryClient();

  const noPositionsKey = ["no-positions"];
  const affiliate_uid = userRole.affiliate_uid;
  const officersKey = [`officers-${affiliate_uid}`];

  const {
    data: positionsData,
    isLoading: fetchingPositions,
    isFetching: refetchingPositions,
  } = useQuery({
    queryKey: officersKey,
    queryFn: () => officers.affiliateOfficers(affiliate_uid!, 1, "all"),
    keepPreviousData: true,
    staleTime: 60 * 60 * 1000,
  });

  // ✅ Extract positions from items property
  const positions = positionsData?.items || [];

  const cachedData = queryClient.getQueryData(officersKey);
  const hasCachedData = queryClient.getQueryData(officersKey) !== undefined;

  const {
    data: members,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: noPositionsKey,
    queryFn: () => officers.getNoPosition(String(userRole.affiliate_id)),
    keepPreviousData: true,
  });

  const vacantPostionMutate = useMutation({
    mutationFn: (id: number) => officers.openPosition(id, 10),
    onSuccess: (updatedList) => {
      refetch();
      queryClient.invalidateQueries({ queryKey: officersKey });
      setVacantLoadingId(null);
      setSuccess("Member Successfully Removed");
    },
  });

  const handleMarkVacant = async (position_id: number) => {
    setSuccess("");
    setVacantLoadingId(position_id);
    vacantPostionMutate.mutate(position_id);
  };

  return (
    <div className="relative p-5">
      <div className="flex items-center gap-4 p-5 mb-2 bg-white border border-gray-100 rounded-xl">
        <div className="flex items-center justify-center text-blue-600 bg-blue-100 rounded-lg w-14 h-14">
          <Building size={32} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {userRole.affiliate_name}
          </h1>
          <span className="text-sm">Assigned Affiliate</span>
        </div>
      </div>

      {success && <AlertMessage type="success" message={success} />}
      <div className="flex items-center justify-end mb-2">
        {refetchingPositions && !fetchingPositions && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-500">
              Refetching Data
            </span>
            <LoaderCircle size={16} className="text-zinc-600 animate-spin" />
          </div>
        )}
      </div>
      {/* Refreshing Indicator */}
      <div className="flex items-center justify-end mb-2">
        <button
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: officersKey })
          }
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 transition bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
          title="Refresh data"
        >
          {refetchingPositions}
          <RefreshCw
            size={15}
            className={refetchingPositions ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fetchingPositions &&
          !hasCachedData &&
          Array.from({ length: 9 }).map((_, i) => (
            <LinkCardSkeleton key={i} className="min-h-[22rem]" />
          ))}

        {!fetchingPositions &&
          positions.length > 0 &&
          positions.map((position: Position) => (
            <AffiliatePositionCard
              key={position.id}
              position={position}
              affiliate_id={userRole.affiliate_id}
              members={members}
              fetchingMembers={isLoading}
              officersKey={officersKey}
              noPositionsKey={noPositionsKey}
            />
          ))}

        {!fetchingPositions && positions.length <= 0 && (
          <div className="py-8 text-center text-gray-500 col-span-full">
            No positions found
          </div>
        )}
      </div>
    </div>
  );
}
