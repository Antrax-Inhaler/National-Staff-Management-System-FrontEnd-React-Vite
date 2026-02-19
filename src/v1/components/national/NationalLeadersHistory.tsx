import React, { useRef, useState } from "react";
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
import DataTableMutation from "../ui/tables/DataTableMutation";
import type { Column } from "../ui/DataTable";
import { national } from "../../api/national";
import { useParams } from "react-router-dom";

interface PositionHistoryProps {
  position_name?: string;
  previous_officers?: OfficerHistory[];
}

interface nationalLeaderHistory {
  id: number;
  entity_id: number;
  level: string;
  start_date: string;
  end_date: string;
  user_id: number;
  entity: {
    id: number;
    name: string;
    description: string;
    default: boolean;
    parent_role_id: number;
  };
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export type Member = {
  id: number;
  first_name: string;
  last_name: string;
  affiliate_id: number;
};

export default function NationalLeadersHistory({
  position_name,
  previous_officers,
}: PositionHistoryProps) {
  const { id, sub } = useParams<{ id?: string; sub?: string }>();
  const [open, setOpen] = useState(false);
  const fetchRef = useRef<() => void>(null);

  const handleLoadHistory = () => {
    fetchRef.current?.();
    console.log(sub);
    setOpen(true);
  };

  const columns: Column<nationalLeaderHistory>[] = [
    {
      key: "name",
      header: "Name",
      accessor: (row) => (
        <span className="text-xs font-bold">{row.user.name}</span>
      ),
    },
    {
      key: "role",
      header: "Role",
      accessor: (row) => (
        <span className="text-xs font-semibold ">{row.entity.name}</span>
      ),
    },
    {
      key: "start_date",
      header: "Start Date",
      accessor: (row) => (
        <span className="text-xs font-semibold ">{row.start_date}</span>
      ),
    },
    {
      key: "end_date",
      header: "End Date",
      accessor: (row) => (
        <span className="text-xs font-semibold ">{row.end_date}</span>
      ),
    },
  ];

  return (
    <>
      <button
        className="flex items-center justify-center gap-2 p-2 text-center text-gray-600 transition rounded-md bg-zinc-200 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
        title="Previous Officers"
        onClick={handleLoadHistory}
      >
        <History size={14} />
      </button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={`Previous Officers (${position_name})`}
        className="max-w-3xl min-w-2xl"
      >
        <div className="space-y-5">
          <DataTableMutation
            columns={columns}
            queryFn={(page, perPage) =>
              national.history({ page, perPage, role_id: sub! })
            }
            showFetchButton={false}
            autoFetch={open}
            enableCache={true}
            staleTime={60 * 60 * 1000}
            cacheKey={['history', sub]}
            pageParam="history_page"
            perPageParam="history_per_page"
          />
        </div>
      </Modal>
    </>
  );
}
