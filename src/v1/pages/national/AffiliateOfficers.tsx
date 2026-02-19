import { useParams } from "react-router-dom";
import { Building, LoaderCircle, UserRoundX } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AssignAffiliateOfficer, {
  type Member,
} from "../../components/members/AssignAffiliateOfficer";
import { officers } from "../../api/officer";
import AlertMessage from "../../components/ui/AlertMessage";
import type { Officer, Position } from "../affiliate/Officers";
import AffiliatePositionCard from "../../components/ui/AffiliateOfficerCard";
import LinkCardSkeleton from "@v1/components/ui/skeletons/CardSkeleton";

export default function AffiliateOfficers() {
  const { uid } = useParams<{ uid: string }>();
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState("");

  const officersKey = uid ? [`officers-${uid}`] : ["officers"];
  const noPositionsKey = uid ? [`positions-${uid}`] : ["no-positions"];

  const {
    data: positionsData,
    isLoading: fetchingPositions,
    isFetching: refetchingPositions,
  } = useQuery({
    queryKey: officersKey,
    queryFn: () => officers.affiliateOfficers(uid, 1, "All"),
    keepPreviousData: true,
    staleTime: 60 * 60 * 1000,
  });

  const cachedData = queryClient.getQueryData(officersKey);
  const hasCachedData = queryClient.getQueryData(officersKey) !== undefined;
  const positions = positionsData?.items || [];

  return (
    <div className="relative p-5">
      {success && <AlertMessage type="success" message={success} />}
      <div className="flex items-center justify-end mb-2">
        {refetchingPositions && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-500">
              Refetching Data
            </span>
            <LoaderCircle size={16} className="text-zinc-600 animate-spin" />
          </div>
        )}
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
              affiliate_id={uid}
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

  // const columns: Column<Position>[] = [
  //   {
  //     key: "position",
  //     header: "Position",
  //     accessor: (row) => <span className="font-bold">{row.name}</span>,
  //   },
  //   {
  //     key: "officer",
  //     header: "Officer",
  //     accessor: (row) =>
  //       row.primary_officer?.member ? (
  //         <div className="flex flex-col gap-2">
  //           <div className="flex gap-2">
  //             <Badge variant="primary" className="!font-bold !text-md ">
  //               {`${row.primary_officer.member.first_name} ${row.primary_officer.member.last_name}`}
  //             </Badge>
  //             <Badge variant="gray" className="!font-bold !text-xs text-zinc-500">
  //               Primary
  //             </Badge>
  //           </div>
  //           {row.secondary_officer?.member && (
  //             <div className="flex gap-2">
  //               <Badge variant="primary" className="!font-bold !text-md">
  //                 {`${row.secondary_officer.member.first_name} ${row.secondary_officer.member.last_name}`}
  //               </Badge>
  //               <Badge variant="info" className="!font-bold !text-md">
  //                 Secondary
  //               </Badge>
  //             </div>
  //           )}
  //         </div>
  //       ) : (
  //         <Badge variant="success">Vacant</Badge>
  //       ),
  //   },
  //   {
  //     key: "start_date",
  //     header: "Start Date",
  //     accessor: (row) =>
  //       row.primary_officer ? (
  //         <span className="font-semibold">
  //           {new Date(row.primary_officer.start_date).toLocaleDateString(
  //             undefined, // use browser locale
  //             {
  //               year: "numeric",
  //               month: "long", // "short" for abbreviated
  //               day: "numeric",
  //             }
  //           )}
  //         </span>
  //       ) : (
  //         "-"
  //       ),
  //   },
  // ];

  // return (
  //   <div className="relative p-5">
  //     {success && <AlertMessage type="success" message={success} />}

  //     <DataTable
  //       columns={columns}
  //       queryKey={officersKey}
  //       queryFn={(page, perPage) =>
  //         officers.affiliateOfficers(affiliateId, page, "All")
  //       }
  //       pagination={false}
  //       selectedRows={selectedRows}
  //       onSelectionChange={setSelectedRows}
  //       renderActions={(officer) => (
  //         <div className="flex justify-center gap-2 sm:grid-cols-3 sm:w-96">
  //           {officer.primary_officer?.member && (
  //             <ConfirmationPopUp
  //               message={`Are you sure you want to remove ${officer.primary_officer?.member?.first_name} ${officer.primary_officer?.member?.last_name} as ${officer.name}?`}
  //               onConfirm={() => handleMarkVacant(officer.primary_officer!.id)}
  //             >
  //               <button
  //                 className="flex items-center justify-center gap-2 p-2 text-center text-red-600 transition rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-60"
  //                 // onClick={() => handleMarkVacant(officer.primary_officer!.id)}
  //                 disabled={vacantLoadingId === officer.primary_officer?.id}
  //               >
  //                 {vacantLoadingId === officer.primary_officer?.id ? (
  //                   <LoaderCircle size={18} className="animate-spin" />
  //                 ) : (
  //                   <UserRoundX size={18} />
  //                 )}
  //               </button>
  //             </ConfirmationPopUp>
  //           )}
  //           <RoleGuard
  //             roles={[Roles.NATIONAL_ADMINISTRATOR]}
  //             positions={[Positions.VICE_PRESIDENT, Positions.PRESIDENT]}
  //           >
  //             <AssignOfficer
  //               members={members}
  //               loadingMembers={isLoading}
  //               positionId={officer.id}
  //               positionName={officer.name}
  //               queryKey={officersKey}
  //               membersKey={noPositionsKey}
  //               type={officer.primary_officer?.member ? "secondary" : "primary"}
  //             />
  //           </RoleGuard>
  //           <OfficerHistoryModal
  //             position_name={officer.name}
  //             previous_officers={officer.previous_officers}
  //           />
  //         </div>
  //       )}
  //     />
  //   </div>
  // );
}
