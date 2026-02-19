import React, { type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import TableHeader from "./TableHeader";
import TableCell from "./TableCell";
import TableSkeleton from "../skeletons/TableSkeleton";
import Pagination from "../Pagination";

export interface Column<T> {
  key: string;
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
}

export interface Paginated<T> {
  items: T[];
  last_page: number;
  current_page: number;
  total: number;
  per_page: number;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  visibleColumns?: string[];
  queryFn: (page: number, perPage: number | "All") => Promise<Paginated<T>>;
  queryKey?: any[];
  filterKey?: {};
  renderActions?: (row: T) => React.ReactNode;
  pagination?: boolean;
  massSelection?: boolean;
  selectedRows?: Set<number>;
  onSelectionChange?: (selectedIds: Set<number>) => void;
  perPageOptions?: Array<number | "All">;
  fallback?: ReactNode;
  limitParam?: string;
  pageParam?: string;
  overlayRefresh?: boolean;
}

export default function TableWithPagination<T extends { id: number }>({
  columns,
  visibleColumns,
  queryFn,
  queryKey,
  filterKey,
  renderActions,
  pagination = true,
  massSelection = false,
  selectedRows = new Set(),
  onSelectionChange,
  perPageOptions = [10, 25, 50, 100, 500, 600, 1000, "All"],
  fallback,
  limitParam,
  pageParam,
  overlayRefresh = false
}: DataTableProps<T>) {
  const [searchParams] = useSearchParams();
  const page = Number(searchParams.get("page") ?? 1);
  const perRaw = searchParams.get("per_page") ?? "20";
  const perPage: number | "All" = perRaw === "All" ? "All" : Number(perRaw);

  const key = queryKey
    ? [...queryKey, { page, perPage, ...(filterKey ?? {}) }]
    : ["table", { page, perPage, ...(filterKey ?? {}) }];

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: key,
    queryFn: () => queryFn(page, perPage),
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 60 * 1000,
  });

  const rows = data?.items ?? [];

  const toggleRow = (id: number) => {
    const newSet = new Set(selectedRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    onSelectionChange?.(newSet);
  };

  const toggleAll = () => {
    if (!rows.length) return;
    const allSelected = rows.every((r) => selectedRows.has(r.id));
    const newSet = new Set(selectedRows);
    if (allSelected) rows.forEach((r) => newSet.delete(r.id));
    else rows.forEach((r) => newSet.add(r.id));
    onSelectionChange?.(newSet);
  };

  const visibleCols = visibleColumns ?? columns.map((c) => c.key);

  if (isError) return <p>Something went wrong</p>;

  const colSpan =
    columns.filter((col) => visibleCols.includes(col.key)).length +
    (massSelection ? 1 : 0) +
    (renderActions ? 1 : 0);

  return (
    <div className="relative space-y-4">
      {/* 🔥 global small indicator (top-right corner) */}
      {isFetching && !isLoading && (
        <div className="absolute right-0 flex items-center gap-2 text-sm text-gray-500 -top-8">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Refreshing...</span>
        </div>
      )}

      {/* ✅ Main content area */}
      {isLoading ? (
        <TableSkeleton columns={colSpan} rows={6} />
      ) : rows.length === 0 ? (
        fallback ? (
          <>{fallback}</>
        ) : (
          <div className="py-10 text-center text-gray-500">
            No records found
          </div>
        )
      ) : (
        <div className="relative w-full overflow-x-auto rounded-md">
          {/* 🌀 Overlay during background refetch */}
          {overlayRefresh && isFetching && !isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <span>Refreshing data...</span>
              </div>
            </div>
          )}

          <table className="min-w-full border border-collapse border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {massSelection && (
                  <TableHeader>
                    <input
                      type="checkbox"
                      checked={
                        rows.length > 0 &&
                        rows.every((r) => selectedRows.has(r.id))
                      }
                      onChange={toggleAll}
                    />
                  </TableHeader>
                )}
                {columns
                  .filter((col) => visibleCols.includes(col.key))
                  .map((col) => (
                    <TableHeader key={col.key}>{col.header}</TableHeader>
                  ))}
                {renderActions && (
                  <TableHeader className="px-2">
                    <div className="flex justify-center">Actions</div>
                  </TableHeader>
                )}
              </tr>
            </thead>

            <tbody className="overflow-auto bg-white divide-y divide-gray-200">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {massSelection && (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(row.id)}
                        onChange={() => toggleRow(row.id)}
                      />
                    </TableCell>
                  )}
                  {columns
                    .filter((col) => visibleCols.includes(col.key))
                    .map((col) => (
                      <TableCell key={col.key}>
                        {typeof col.accessor === "function"
                          ? col.accessor(row)
                          : String(row[col.accessor as keyof T])}
                      </TableCell>
                    ))}
                  {renderActions && (
                    <TableCell className="w-0 text-right whitespace-nowrap">
                      {renderActions(row)}
                    </TableCell>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && rows.length > 0 && (
        <Pagination
          lastPage={data?.last_page ?? 1}
          perPageParam={limitParam}
          pageParam={pageParam}
        />
      )}
    </div>
  );
}
