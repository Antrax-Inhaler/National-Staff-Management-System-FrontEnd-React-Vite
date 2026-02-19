import React, { useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { List, Grid as GridIcon, Loader2 } from "lucide-react";
import Pagination from "./Pagination";
import Table, { type Column } from "./tables/Table";
import Grid from "./grid/Grid";
import type { Paginated } from "./tables/TableWithPagination";
import TableSkeleton from "./skeletons/TableSkeleton";

interface DataViewProps<T> {
  columns: Column<T>[];
  queryFn: (page: number, perPage: number | "All") => Promise<Paginated<T>>;
  queryKey?: any[];
  filterKey?: {};
  renderItem: (item: T) => React.ReactNode;
  renderActions?: (row: T) => React.ReactNode;
  pagination?: boolean;
  massSelection?: boolean;
  selectedRows?: Set<number>;
  onSelectionChange?: (selectedIds: Set<number>) => void;
  perPageOptions?: Array<number | "All">;
  fallback?: ReactNode;
  viewHeaderItem?: ReactNode;
  viewMode?: "table" | "grid";
}

export default function DataViewWithPagination<T extends { id: number }>({
  columns,
  queryFn,
  queryKey,
  filterKey,
  renderItem,
  renderActions,
  pagination = true,
  massSelection = false,
  selectedRows = new Set(),
  onSelectionChange,
  perPageOptions = [10, 25, 50, 100, "All"],
  fallback,
  viewHeaderItem,
  viewMode: initialMode = "table",
}: DataViewProps<T>) {
  const [searchParams] = useSearchParams();
  const page = Number(searchParams.get("page") ?? 1);
  const perRaw = searchParams.get("per_page") ?? "10";
  const perPage: number | "All" = perRaw === "All" ? "All" : Number(perRaw);

  const key = queryKey
    ? [...queryKey, ...(filterKey ? Object.entries(filterKey).flat() : [])]
    : ["table", ...(filterKey ? Object.entries(filterKey).flat() : [])];

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: key,
    queryFn: () => queryFn(page, perPage),
    placeholderData: (previousData) => previousData,
    keepPreviousData: true,
    staleTime: 1000 * 60,
  });

  const [mode, setMode] = useState<"table" | "grid">(initialMode);
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

  if (isError) return <p>Something went wrong.</p>;

  return (
    <div className="space-y-2">
      {/* 🔘 Header with toggle and extra items */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">{viewHeaderItem}</div>

        <div className="flex p-1 text-sm bg-gray-100 rounded-lg">
          <button
            onClick={() => setMode("table")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
              mode === "table"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <List size={14} />
            <span className="text-sm">Table</span>
          </button>
          <button
            onClick={() => setMode("grid")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
              mode === "grid"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <GridIcon size={16} />
            <span className="text-sm">Grid</span>
          </button>
        </div>
      </div>

      {/* 🔄 Subtle top indicator */}
      {isFetching && !isLoading && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
          <span>Refreshing data...</span>
        </div>
      )}

      {/* ✅ Main view */}
      {isLoading ? (
        <TableSkeleton columns={columns.length} rows={6} />
      ) : rows.length === 0 ? (
        fallback ? (
          <>{fallback}</>
        ) : (
          <div className="py-10 text-center text-gray-500">No records found</div>
        )
      ) : mode === "table" ? (
        <Table
          columns={columns}
          data={rows}
          renderActions={renderActions}
          massSelection={massSelection}
          selectedRows={selectedRows}
          onSelectionChange={onSelectionChange}
          fallback={fallback}
        />
      ) : (
        <Grid data={rows} renderItem={renderItem} />
      )}

      {/* 🔘 Pagination */}
      {pagination && rows.length > 0 && <Pagination lastPage={data?.last_page ?? 1} />}
    </div>
  );
}
