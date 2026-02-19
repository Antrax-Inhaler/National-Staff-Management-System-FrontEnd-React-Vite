import React, { type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import TableHeader from "./TableHeader";
import TableCell from "./TableCell";
import TableSkeleton from "./skeletons/TableSkeleton";

export interface Column<T> {
  key: string;
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
}

interface TableProps<T> {
  columns: Column<T>[];
  data?: T[];
  total?: string | number;
  visibleColumns?: string[];
  renderActions?: (row: T) => React.ReactNode;
  massSelection?: boolean;
  selectedRows?: Set<number>;
  onSelectionChange?: (selectedIds: Set<number>) => void;
  loading?: boolean;
  refreshing?: boolean;
  fallback?: ReactNode;
}

export default function Table<T extends { id: number }>({
  columns,
  data = [],
  total,
  visibleColumns,
  renderActions,
  massSelection = false,
  selectedRows = new Set(),
  onSelectionChange,
  loading = false,
  refreshing = false,
  fallback,
}: TableProps<T>) {
  const rows = data ?? [];

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

  const colSpan =
    columns.filter((col) => visibleCols.includes(col.key)).length +
    (massSelection ? 1 : 0) +
    (renderActions ? 1 : 0);

  return (
    <div className="relative space-y-4">
      {loading ? (
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
          <div className="flex justify-between mb-1">
            {total && (
              <>
                <div className="text-xs text-gray-600">
                  Showing <span className="font-semibold">{rows.length}</span>{" "}
                  of <span className="font-semibold">{total}</span> results
                </div>
              </>
            )}

            {refreshing && !loading && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Refreshing...</span>
              </div>
            )}
          </div>

          <table className="min-w-full text-xs border border-collapse border-gray-200">
            <thead className="text-xs bg-gray-50">
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
                    <TableHeader className="text-xs" key={col.key}>
                      {col.header}
                    </TableHeader>
                  ))}
                {renderActions && (
                  <TableHeader className="sticky right-0 z-10 bg-white shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.1)]">
                    <div className="flex justify-center">Actions</div>
                  </TableHeader>
                )}
              </tr>
            </thead>

            <tbody className="text-xs bg-white divide-y divide-gray-200 ">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 group">
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
                    <TableCell className="sticky bg-white group-hover:bg-gray-50 right-0 z-10 shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.1)] ">
                      <div className="flex justify-center">
                        {renderActions(row)}
                      </div>
                    </TableCell>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
