import React, { useRef, useState } from "react";
import { History } from "lucide-react";
import Modal from "../ui/Modal";
import DataTableMutation from "../ui/tables/DataTableMutation";
import type { Column } from "../ui/DataTable";
import role from "../../api/role";
import {
  calculateTenure,
  formatDateYear,
  toSnakeCase,
} from "../../helpers/formatter";
import Badge from "../ui/Badge";
import { useQueryClient } from "@tanstack/react-query";

interface RoleHistoryProps {
  id: number;
  type: string;
  title: string;
  affiliate_id?: number | string | null;
}

type NationalHistory = {
  id: number;
  start_date: string;
  end_date: string;
  user: {
    id: number;
    name: string;
  };
};

type AffiliateHistory = {
  id: number;
  start_date: string;
  end_date: string;
  member: {
    user: {
      id: number;
      name: string;
    };
  };
};

export default function RoleHistory({
  id,
  type,
  title,
  affiliate_id,
}: RoleHistoryProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const affiliateData = queryClient.getQueryData([
    `affiliate-info-${affiliate_id}`,
  ]);
  const fetchRef = useRef<() => void>(null);

  const handleLoadHistory = () => {
    fetchRef.current?.();
    setOpen(true);
  };

  const columns: Column<NationalHistory | AffiliateHistory>[] = [
    {
      key: "name",
      header: "Name",
      accessor: (row) => {
        if ("user" in row)
          return <span className="text-xs font-bold">{row.user.name}</span>;
        if ("member" in row)
          return (
            <span className="text-xs font-bold">{row.member?.user?.name}</span>
          );
        return <span className="text-xs font-bold">-</span>;
      },
    },
    {
      key: "role",
      header: "Role",
      accessor: () => (
        <Badge>
          <span className="text-xs font-semibold">{title}</span>
        </Badge>
      ),
    },
    {
      key: "start_date",
      header: "Start Date",
      accessor: (row) => (
        <span className="text-xs font-semibold">
          {formatDateYear(row.start_date)}
        </span>
      ),
    },
    {
      key: "end_date",
      header: "End Date",
      accessor: (row) => (
        <span className="text-xs font-semibold">
          {formatDateYear(row.end_date)}
        </span>
      ),
    },
    {
      key: "tenure",
      header: "Tenure",
      accessor: (row) => (
        <span className="text-xs font-semibold">
          {calculateTenure(row.start_date, row.end_date)}
        </span>
      ),
    },
  ];

  const headerTitle =
    type == "affiliate" ? `Previous Officers` : `Previous National Officers`;

  return (
    <>
      <button
        className="flex items-center justify-center gap-2 p-2 text-center text-gray-600 transition rounded-md bg-zinc-200 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
        title={headerTitle}
        onClick={handleLoadHistory}
      >
        <History size={14} className="dark:stroke-black!" />
      </button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={`${headerTitle} (${title
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())})`}
        className="max-w-3xl min-w-2xl"
      >
        <div className="space-y-5">
          <DataTableMutation
            columns={columns}
            queryFn={(page, perPage) =>
              role.history({
                page,
                perPage,
                id,
                type,
                affiliate_id: affiliateData?.id,
              })
            }
            showFetchButton={false}
            autoFetch={open}
            enableCache={true}
            staleTime={60 * 60 * 1000}
            cacheKey={["history", type, id, affiliateData?.id]}
            pageParam={`${toSnakeCase(title)}_page`}
            perPageParam={`${toSnakeCase(title)}_per_page`}
          />
        </div>
      </Modal>
    </>
  );
}
