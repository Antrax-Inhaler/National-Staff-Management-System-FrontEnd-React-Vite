import {
  User,
  Calendar,
  Briefcase,
  UserRoundX,
  LoaderCircle,
} from "lucide-react";
import type { Position } from "../../pages/affiliate/Officers";
import RoleGuard from "../RoleGuard";
import { Positions } from "../../constants/positions";
import { Committees, Roles } from "../../constants/roles";
import AssignOfficer from "../officer/AssignOfficer";
import ConfirmationPopUp from "./ConfirmationPopUp";
import { officers } from "../../api/officer";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import type { Member } from "../members/AssignAffiliateOfficer";
import RoleHistory from "../role/RoleHistory";
import HelpButton from "@v1/components/help/HelpButton";

interface AffiliateOfficerCardProps {
  position: Position;
  officersKey: string[];
  noPositionsKey: string[];
  affiliate_id?: string | number | null;
  members?: Member[];
  fetchingMembers?: boolean;
}

export default function AffiliatePositionCard({
  position,
  officersKey,
  noPositionsKey,
  members = [],
  fetchingMembers = true,
  affiliate_id,
}: AffiliateOfficerCardProps) {
  const [vacantLoadingId, setVacantLoadingId] = useState<number | null>(null);
  const [success, setSuccess] = useState("");
  const { userRole } = useAuth();
  const queryClient = useQueryClient();

  const vacantPostionMutate = useMutation({
    mutationFn: (id: number) => officers.openPosition(id, 10),
    onSuccess: (updatedList) => {
      queryClient.invalidateQueries({ queryKey: officersKey });
      queryClient.invalidateQueries({ queryKey: ['user-search'] });
      setVacantLoadingId(null);
      setSuccess("Member Successfully Removed");
    },
  });

  const handleMarkVacant = async (position_id: number) => {
    setSuccess("");
    setVacantLoadingId(position_id);
    vacantPostionMutate.mutate(position_id);
  };

  const hasOfficers =
    position.primary_officer?.member || position.secondary_officer?.member;

  return (
    <div className="flex flex-col overflow-hidden transition-all duration-150 bg-white border border-gray-300 rounded-lg shadow-sm min-h-[22rem] hover:shadow-md hover:border-gray-400">
      {/* Position Header - Fixed Height */}
      <div className="flex items-center justify-between h-16 gap-3 px-4 border-b border-gray-200 bg-gray-50 shrink-0">
        <div className="flex items-center flex-1 min-w-0 gap-3">
          <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 bg-blue-600 rounded">
            <Briefcase className="w-3.5 h-3.5 text-white" />
          </div>
          <h3 className="text-xs font-semibold leading-tight text-gray-900">
            {position.name}
          </h3>
        </div>
        <RoleGuard
          positions={[Positions.PRESIDENT, Positions.SECRETARY]}
          roles={[
            Roles.NATIONAL_ADMINISTRATOR,
            Roles.AFFILIATE_OFFICER,
            ...Committees.EXECUTIVE_COMMITTEE,
          ]}
        >
          <AssignOfficer
            members={members}
            loadingMembers={fetchingMembers}
            positionId={position.id}
            positionName={position.name}
            queryKey={officersKey}
            membersKey={noPositionsKey}
            type={position.primary_officer?.member ? "secondary" : "primary"}
          />
        </RoleGuard>
        <RoleHistory
          id={position.id}
          type="affiliate"
          title={position.name}
          affiliate_id={affiliate_id}
        />
      </div>

      {/* Officers Content - Fixed Height */}
      <div className="flex-1 p-4 overflow-y-auto">
        {!hasOfficers ? (
          // Empty State
          <div className="flex flex-col items-center justify-center h-full">
            <div className="inline-flex items-center justify-center w-12 h-12 mb-2 bg-gray-100 rounded-full">
              <User className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-xs font-medium text-gray-500">
              No officers assigned
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {!position.primary_officer && !position.primary_officer && (
              <div className="flex flex-col p-3 border-2 border-dashed rounded-lg border-emerald-500 min-h-28 bg-emerald-50">
                <div className="flex flex-col items-center justify-center flex-1 min-h-0 gap-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 mb-2 rounded-full bg-emerald-200 dark:bg-zinc-200">
                    <User className="w-5 h-5 text-emerald-400 dark:stroke-zinc-500!" />
                  </div>
                  <p className="text-xs font-medium text-gray-500 dark:text-black!">
                    No Primary Officer Assigned
                  </p>
                </div>
              </div>
            )}

            {/* Primary Officer - Fixed Height */}
            {position.primary_officer?.member && (
              <div className="flex flex-col p-3 border-2 rounded-lg min-h-20 border-emerald-500 bg-emerald-50">
                <div className="flex items-start flex-1 min-h-0 gap-3">
                  {/* <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 text-xs font-bold text-white rounded-full bg-emerald-600">
                    {position.primary_officer.member.first_name.charAt(0)}
                    {position.primary_officer.member.last_name.charAt(0)}
                  </div> */}

                  <div className="flex flex-col flex-1 min-w-0 dark:text-black!">
                    <span className="inline-block px-2 py-0.5 mb-1.5 text-[10px] font-semibold text-emerald-700 bg-emerald-200 rounded uppercase w-fit">
                      Primary Officer
                    </span>
                    <p className="mb-1.5 text-sm font-bold text-gray-900 leading-tight">
                      {position.primary_officer.member.first_name}{" "}
                      {position.primary_officer.member.last_name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-auto">
                      <Calendar className="w-3 h-3 stroke-emerald-600! dark:stroke-black! shrink-0" />

                      <span className="text-[10px] text-gray-600 font-medium">
                        Since{" "}
                        {new Date(
                          position.primary_officer.start_date
                        ).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <RoleGuard
                    restrictedPositions={[Positions.VICE_PRESIDENT]}
                    roles={[
                      Roles.NATIONAL_ADMINISTRATOR,
                      ...Committees.EXECUTIVE_COMMITTEE,
                    ]}
                  >
                    <ConfirmationPopUp
                      message={`Are you sure you want to remove ${position.primary_officer?.member?.first_name} ${position.primary_officer?.member?.last_name} as ${position.name}?`}
                      onConfirm={() =>
                        handleMarkVacant(position.primary_officer!.id)
                      }
                    >
                      <button
                        className="flex items-center justify-center flex-shrink-0 text-red-600 transition-colors rounded dark:text-red-500 w-7 h-7 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-60"
                        disabled={
                          vacantLoadingId === position.primary_officer?.id
                        }
                      >
                        {vacantLoadingId === position.primary_officer?.id ? (
                          <LoaderCircle size={14} className="animate-spin" />
                        ) : (
                          <UserRoundX size={14} className="dark:text-red-600 stroke-red-600!" />
                        )}
                      </button>
                    </ConfirmationPopUp>
                  </RoleGuard>
                </div>
              </div>
            )}

            {/* Secondary Officer - Fixed Height */}
            {position.secondary_officer?.member && (
              <div className="flex flex-col p-3 border-2 border-blue-500 rounded-lg min-h-20 bg-blue-50">
                <div className="flex items-start flex-1 min-h-0 gap-3">
                  {/* <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 text-xs font-bold text-white bg-blue-600 rounded-full">
                    {position.secondary_officer.member.first_name.charAt(0)}
                    {position.secondary_officer.member.last_name.charAt(0)}
                  </div> */}

                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="inline-block px-2 py-0.5 mb-1.5 text-[10px] font-semibold stroke-blue-700 dark:text-black! bg-blue-200 rounded uppercase w-fit">
                      Secondary Officer
                    </span>
                    <p className="mb-1.5 text-sm font-bold text-gray-900 leading-tight">
                      {position.secondary_officer.member.first_name}{" "}
                      {position.secondary_officer.member.last_name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-auto">
                      <Calendar className="w-3 h-3 text-blue-600 shrink-0" />
                      <span className="text-[10px] text-gray-600 font-medium">
                        Since{" "}
                        {new Date(
                          position.secondary_officer.start_date
                        ).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <RoleGuard
                    restrictedPositions={[Positions.VICE_PRESIDENT]}
                    roles={[
                      Roles.NATIONAL_ADMINISTRATOR,
                      ...Committees.EXECUTIVE_COMMITTEE,
                    ]}
                  >
                    <ConfirmationPopUp
                      message={`Are you sure you want to remove ${position.secondary_officer?.member?.first_name} ${position.secondary_officer?.member?.last_name} as ${position.name} (Secondary Officer)?`}
                      onConfirm={() =>
                        handleMarkVacant(position.secondary_officer!.id)
                      }
                    >
                      <button
                        className="flex items-center justify-center flex-shrink-0 text-red-600 transition-colors rounded w-7 h-7 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-60"
                        disabled={
                          vacantLoadingId === position.secondary_officer?.id
                        }
                      >
                        {vacantLoadingId === position.secondary_officer?.id ? (
                          <LoaderCircle size={14} className="animate-spin" />
                        ) : (
                          <UserRoundX size={14} />
                        )}
                      </button>
                    </ConfirmationPopUp>
                  </RoleGuard>
                </div>
              </div>
            )}

            {position.primary_officer && !position.secondary_officer && (
              <div className="flex flex-col p-3 border-2 border-blue-500 border-dashed rounded-lg min-h-28 bg-blue-50">
                <div className="flex flex-col items-center justify-center flex-1 min-h-0 gap-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 mb-2 bg-blue-200 rounded-full">
                    <User className="w-5 h-5 text-blue-400" />
                  </div>
                  <p className="text-xs font-medium text-gray-500">
                    No Secondary Officer Assigned
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
            <HelpButton 
        category="Officers" 
        pageTitle="Officers"
      />
    </div>
  );
}
