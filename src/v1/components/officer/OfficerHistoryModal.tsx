import React, { useState } from "react";
import {
  Calendar,
  ChevronRight,
  Clock,
  FileClock,
  History,
  Plus,
  User,
  UserRoundPen,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import InputField from "../ui/InputField";
import SelectField from "../ui/SelectField";

import { useAuth } from "../../contexts/AuthContext";
import Modal from "../ui/Modal";
import { officers, type positionForm } from "../../api/officer";
import type { OfficerHistory } from "../../api/profile";
import { calculateTenure, formatDateYear } from "../../helpers/formatter";

interface PositionHistoryProps {
  position_name?: string;
  previous_officers?: OfficerHistory[];
}

export type Member = {
  id: number;
  first_name: string;
  last_name: string;
  affiliate_id: number;
};

export default function OfficerHistoryModal({
  position_name,
  previous_officers,
}: PositionHistoryProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="flex items-center justify-center gap-2 p-2 text-center text-gray-600 transition rounded-md bg-zinc-200 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
        title="Previous Officers"
        onClick={() => setOpen(true)}
      >
        <History size={14} />
      </button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={`Previous Officers (${position_name})`}
        className="max-w-3xl"
      >
        <div className="space-y-5">
          {previous_officers?.length ? (
            previous_officers?.map((prev, index) => (
              <div
                key={prev.id}
                className="relative p-3 transition-all border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm group"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 text-xs font-semibold text-white rounded-lg bg-gradient-to-br from-gray-500 to-gray-600">
                    {prev.member?.first_name?.[0]}
                    {prev.member?.last_name?.[0]}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Name & Badge */}
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {prev.member?.first_name} {prev.member?.last_name}
                      </h3>
                      {index === 0 && (
                        <span className="px-1 py-0.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                          Most Recent
                        </span>
                      )}
                    </div>

                    {/* Details (stacked) */}
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-green-600" />
                        <span>Start: {formatDateYear(prev.start_date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-red-600" />
                        <span>End: {formatDateYear(prev.end_date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>
                          Tenure:{" "}
                          {calculateTenure(prev.start_date, prev.end_date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Chevron */}
                  <ChevronRight className="flex-shrink-0 w-4 h-4 text-gray-300 transition-all group-hover:text-blue-500 group-hover:translate-x-1" />
                </div>
              </div>
            ))
          ) : (
            <div className="py-4 text-center text-gray-500 text-md">
              No Information Available
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
