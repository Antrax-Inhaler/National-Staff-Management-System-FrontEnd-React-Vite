// components/DataTable.tsx
import React from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Smartphone, Tablet, Monitor } from "lucide-react"; // icons for responsive indicators
import Pagination from "./Pagination";
import TableHeader from "./TableHeader";
import TableCell from "./TableCell";

export interface Column<T> {
  key: string;
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  mobilePriority?: number; // 1 = highest priority, lower numbers show first on mobile
  responsiveHide?: "sm" | "md" | "lg"; // breakpoints to hide column
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
  renderActions?: (row: T) => React.ReactNode;
  pagination?: boolean;
  massSelection?: boolean;
  selectedRows?: Set<number>;
  onSelectionChange?: (selectedIds: Set<number>) => void;
  perPageOptions?: Array<number | "All">;
  responsive?: boolean;
}

export default function DataTable<T extends { id: number }>({
  columns,
  visibleColumns,
  queryFn,
  queryKey,
  renderActions,
  pagination = true,
  massSelection = false,
  selectedRows = new Set(),
  onSelectionChange,
  perPageOptions = [10, 25, 50, 100, 500, 600, 1000, "All"],
  responsive = true,
}: DataTableProps<T>) {
  const [searchParams] = useSearchParams();
  const page = Number(searchParams.get("page") ?? 1);
  const perRaw = searchParams.get("per_page") ?? "10";
  const perPage: number | "All" = perRaw === "All" ? "All" : Number(perRaw);

  const [isMobile, setIsMobile] = React.useState(false);
  const [isTablet, setIsTablet] = React.useState(false);

  // Detect screen size
  React.useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const key = queryKey
    ? [...queryKey, page, perPage]
    : ["table", page, perPage];

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: key,
    queryFn: () => queryFn(page, perPage),
    placeholderData: (previousData) => previousData,
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

  // Responsive column filtering
  const getVisibleColumns = () => {
    let baseCols = visibleColumns ?? columns.map((c) => c.key);
    
    if (!responsive) return baseCols;

    if (isMobile) {
      // On mobile, show only high priority columns (priority 1-3)
      return baseCols.filter(colKey => {
        const column = columns.find(c => c.key === colKey);
        return column && (column.mobilePriority === undefined || column.mobilePriority <= 3);
      });
    } else if (isTablet) {
      // On tablet, show medium priority columns
      return baseCols.filter(colKey => {
        const column = columns.find(c => c.key === colKey);
        return column && (column.mobilePriority === undefined || column.mobilePriority <= 5);
      });
    }
    
    return baseCols;
  };

  const visibleCols = getVisibleColumns();

  if (isError) return <p className="p-4 text-red-600">Something went wrong</p>;

  // Calculate colspan safely
  const colSpan =
    columns.filter((col) => visibleCols.includes(col.key)).length +
    (massSelection ? 1 : 0) +
    (renderActions ? 1 : 0);

  // Mobile Card View
  const MobileCardView = ({ row }: { row: T }) => (
    <div className="p-4 mb-3 bg-white border border-gray-200 rounded-lg shadow-sm">
      {massSelection && (
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
          <span className="text-sm font-medium text-gray-600">Select</span>
          <input
            type="checkbox"
            checked={selectedRows.has(row.id)}
            onChange={() => toggleRow(row.id)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
      )}
      
      <div className="space-y-2">
        {columns
          .filter((col) => visibleCols.includes(col.key))
          .map((col) => (
            <div key={col.key} className="flex justify-between items-start">
              <span className="text-sm font-medium text-gray-600 pr-2">
                {col.header}:
              </span>
              <span className="text-sm text-gray-900 text-right flex-1">
                {typeof col.accessor === "function"
                  ? col.accessor(row)
                  : String(row[col.accessor as keyof T])}
              </span>
            </div>
          ))}
      </div>

      {renderActions && (
        <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
          {renderActions(row)}
        </div>
      )}
    </div>
  );

  // Tablet Card View
  const TabletCardView = ({ row }: { row: T }) => (
    <div className="p-4 mb-3 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="grid grid-cols-2 gap-4">
        {massSelection && (
          <div className="flex items-center justify-between col-span-2 pb-3 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-600">Select</span>
            <input
              type="checkbox"
              checked={selectedRows.has(row.id)}
              onChange={() => toggleRow(row.id)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>
        )}
        
        {columns
          .filter((col) => visibleCols.includes(col.key))
          .map((col) => (
            <div key={col.key} className="flex flex-col">
              <span className="text-xs font-medium text-gray-600 mb-1">
                {col.header}
              </span>
              <span className="text-sm text-gray-900">
                {typeof col.accessor === "function"
                  ? col.accessor(row)
                  : String(row[col.accessor as keyof T])}
              </span>
            </div>
          ))}
      </div>

      {renderActions && (
        <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
          {renderActions(row)}
        </div>
      )}
    </div>
  );

  return (
    <div className="relative space-y-4">
      {/* Responsive Indicator */}
      {responsive && (
        <div className="flex items-center gap-2 text-xs text-gray-500 md:hidden">
          {isMobile ? (
            <>
              <Smartphone size={14} />
              <span>Mobile View</span>
            </>
          ) : (
            <>
              <Tablet size={14} />
              <span>Tablet View</span>
            </>
          )}
        </div>
      )}

      {/* 🔥 maliit na loading indicator sa top-right */}
      {isFetching && !isLoading && (
        <div className="absolute right-0 flex items-center gap-2 text-sm text-gray-500 -top-8">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading...</span>
        </div>
      )}

      {/* Mobile View */}
      {responsive && isMobile && (
        <div className="space-y-3 md:hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No records found</div>
          ) : (
            rows.map((row) => <MobileCardView key={row.id} row={row} />)
          )}
        </div>
      )}

      {/* Tablet View */}
      {responsive && isTablet && (
        <div className="space-y-3 lg:hidden md:block hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No records found</div>
          ) : (
            rows.map((row) => <TabletCardView key={row.id} row={row} />)
          )}
        </div>
      )}

      {/* Desktop Table View */}
      <div className={`overflow-x-auto rounded-md ${
        responsive ? 'hidden lg:block' : ''
      }`}>
        <table className="min-w-full border border-collapse border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {massSelection && (
                <TableHeader className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={
                      rows.length > 0 &&
                      rows.every((r) => selectedRows.has(r.id))
                    }
                    onChange={toggleAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </TableHeader>
              )}
              {columns
                .filter((col) => visibleCols.includes(col.key))
                .map((col) => (
                  <TableHeader key={col.key} className="px-3 py-3 text-left">
                    {col.header}
                  </TableHeader>
                ))}
              {renderActions && (
                <TableHeader className="px-3 py-3 text-center">
                  Actions
                </TableHeader>
              )}
            </tr>
          </thead>

          <tbody className="overflow-auto bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <TableCell colSpan={colSpan} className="px-3 py-8 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Loading…</span>
                  </div>
                </TableCell>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <TableCell colSpan={colSpan} className="px-3 py-8 text-center text-gray-500">
                  No records found
                </TableCell>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {massSelection && (
                    <TableCell className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(row.id)}
                        onChange={() => toggleRow(row.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </TableCell>
                  )}
                  {columns
                    .filter((col) => visibleCols.includes(col.key))
                    .map((col) => (
                      <TableCell key={col.key} className="px-3 py-3">
                        {typeof col.accessor === "function"
                          ? col.accessor(row)
                          : String(row[col.accessor as keyof T])}
                      </TableCell>
                    ))}
                  {renderActions && (
                    <TableCell className="px-3 py-3 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1">
                        {renderActions(row)}
                      </div>
                    </TableCell>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && <Pagination lastPage={data?.last_page ?? 1} />}
    </div>
  );
}