// components/DataTable.tsx
import React from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Smartphone,
  Tablet,
  Monitor,
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Pagination from "./Pagination";
import TableHeader from "./TableHeader";
import TableCell from "./TableCell";
import TableSkeleton from "@v1/components/ui/skeletons/TableSkeleton";
import TableRowSkeleton from "@v1/components/ui/skeletons/TableRowSkeleton";
import MobileCardSkeleton from "@v1/components/ui/skeletons/MobileCardSkeleton";
import TabletCardSkeleton from "@v1/components/ui/skeletons/TabletCardSkeleton";

export interface Column<T> {
  key: string;
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  mobilePriority?: number;
  responsiveHide?: "sm" | "md" | "lg";
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
  selectedItems?: Set<number>;
  onSelectionChange?: (selectedIds: Set<number>) => void;
  perPageOptions?: Array<number | "All">;
  responsive?: boolean;
  showRowNumbers?: boolean;
  containerClassName?: string;
  rowClassName?: string;
}

export default function DataTable<T extends { id: number }>({
  columns,
  visibleColumns,
  queryFn,
  queryKey,
  filterKey,
  renderActions,
  pagination = true,
  massSelection = false,
  selectedItems = new Set(),
  onSelectionChange,
  perPageOptions = [10, 25, 50, 100, 500, 600, 1000, "All"],
  responsive = true,
  showRowNumbers = true,
  containerClassName = "",
  rowClassName = "",
}: DataTableProps<T>) {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const page = Number(searchParams.get("page") ?? 1);
  const perRaw = searchParams.get("per_page") ?? "20";
  const perPage: number | "All" = perRaw === "All" ? "All" : Number(perRaw);
  const [expandedRows, setExpandedRows] = React.useState<Set<number>>(
    new Set()
  );

  const [isMobile, setIsMobile] = React.useState(false);
  const [isTablet, setIsTablet] = React.useState(false);

  React.useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const memoizedFilterKey = React.useMemo(
    () => filterKey,
    [JSON.stringify(filterKey)]
  );

  const key = queryKey
    ? [
        ...queryKey,
        "page",
        page,
        "perPage",
        perPage,
        ...(memoizedFilterKey ? Object.entries(memoizedFilterKey).flat() : []),
      ]
    : [
        "table",
        "page",
        page,
        "perPage",
        perPage,
        ...(memoizedFilterKey ? Object.entries(memoizedFilterKey).flat() : []),
      ];

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: key,
    queryFn: () => queryFn(page, perPage),
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 5,
    retryDelay: 3000,
  });

  const cachedData = queryClient.getQueryData(key);
  const hasCachedData = queryClient.getQueryData(key) !== undefined;

  const rows = data?.items ?? [];

  const getRowNumber = (index: number) => {
    if (perPage === "All") {
      return index + 1;
    }
    return (page - 1) * perPage + index + 1;
  };

  const toggleRow = (id: number) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    onSelectionChange?.(newSet);
  };

  const toggleExpand = (id: number) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedRows(newSet);
  };

  const toggleAll = () => {
    if (!rows.length) return;
    const allSelected = rows.every((r) => selectedItems.has(r.id));
    const newSet = new Set(selectedItems);
    if (allSelected) rows.forEach((r) => newSet.delete(r.id));
    else rows.forEach((r) => newSet.add(r.id));
    onSelectionChange?.(newSet);
  };

  const getVisibleColumns = () => {
    const baseCols = visibleColumns ?? columns.map((c) => c.key);

    if (!responsive) return baseCols;

    if (isMobile) {
      return baseCols.filter((colKey) => {
        const column = columns.find((c) => c.key === colKey);
        return (
          column &&
          (column.mobilePriority === undefined || column.mobilePriority <= 3)
        );
      });
    } else if (isTablet) {
      return baseCols.filter((colKey) => {
        const column = columns.find((c) => c.key === colKey);
        return (
          column &&
          (column.mobilePriority === undefined || column.mobilePriority <= 5)
        );
      });
    }

    return baseCols;
  };

  const visibleCols = getVisibleColumns();

  if (isError) {
    return (
      <div className="min-h-screen p-4 text-xs bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center justify-center p-12 space-y-4 border-2 border-red-200 border-dashed rounded-lg bg-red-50">
            <AlertCircle className="w-16 h-16 text-red-500" />
            <h3 className="text-xl font-semibold text-red-900">
              Oops! Something went wrong
            </h3>
            <p className="text-red-700">
              We couldn't load the data. Please try again.
            </p>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-6 py-3 font-medium text-white transition-colors bg-red-600 rounded-lg shadow-md hover:bg-red-700 hover:shadow-lg"
            >
              <RefreshCw className="w-5 h-5" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const colSpan =
    columns.filter((col) => visibleCols.includes(col.key)).length +
    (massSelection ? 1 : 0) +
    (renderActions ? 1 : 0) +
    (showRowNumbers ? 1 : 0);

  const MobileCardView = ({ row, index }: { row: T; index: number }) => {
    const isExpanded = expandedRows.has(row.id);
    const primaryColumns = columns
      .filter((col) => visibleCols.includes(col.key))
      .filter((col) => col.mobilePriority && col.mobilePriority <= 2);

    const secondaryColumns = columns
      .filter((col) => visibleCols.includes(col.key))
      .filter((col) => !col.mobilePriority || col.mobilePriority > 2);

    return (
      <div className="p-4 mb-3 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            {showRowNumbers && (
              <div className="mb-2">
                <span className="block text-xs font-medium text-gray-500">
                  No.
                </span>
                <span className="block text-sm font-medium text-gray-900">
                  {getRowNumber(index)}
                </span>
              </div>
            )}

            {primaryColumns.map((col) => (
              <div key={col.key} className="mb-2">
                <span className="block text-xs font-medium text-gray-500">
                  {col.header}
                </span>
                <span className="block text-sm font-medium text-gray-900">
                  {typeof col.accessor === "function"
                    ? col.accessor(row)
                    : String(row[col.accessor as keyof T] || "-")}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-end gap-2 ml-3">
            {massSelection && (
              <input
                type="checkbox"
                checked={selectedItems.has(row.id)}
                onChange={() => toggleRow(row.id)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            )}
            <button
              onClick={() => toggleExpand(row.id)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {isExpanded && secondaryColumns.length > 0 && (
          <div className="pt-3 space-y-2 border-t border-gray-100">
            {secondaryColumns.map((col) => (
              <div key={col.key} className="flex items-start justify-between">
                <span className="pr-2 text-xs font-medium text-gray-500">
                  {col.header}:
                </span>
                <span className="flex-1 text-sm text-right text-gray-900 break-words">
                  {typeof col.accessor === "function"
                    ? col.accessor(row)
                    : String(row[col.accessor as keyof T] || "-")}
                </span>
              </div>
            ))}
          </div>
        )}

        {renderActions && (
          <div
            className={`flex justify-end gap-2 ${
              isExpanded ? "mt-3 pt-3 border-t border-gray-100" : "mt-2"
            }`}
          >
            {renderActions(row)}
          </div>
        )}
      </div>
    );
  };

  const TabletCardView = ({ row, index }: { row: T; index: number }) => {
    const isExpanded = expandedRows.has(row.id);
    const primaryColumns = columns
      .filter((col) => visibleCols.includes(col.key))
      .filter((col) => col.mobilePriority && col.mobilePriority <= 3);

    const secondaryColumns = columns
      .filter((col) => visibleCols.includes(col.key))
      .filter((col) => !col.mobilePriority || col.mobilePriority > 3);

    return (
      <div className="p-4 mb-3 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div className="grid flex-1 grid-cols-2 gap-4">
            {showRowNumbers && (
              <div className="col-span-2">
                <span className="text-xs font-medium text-gray-600">
                  No. {getRowNumber(index)}
                </span>
              </div>
            )}

            {primaryColumns.map((col) => (
              <div key={col.key} className="flex flex-col">
                <span className="mb-1 text-xs font-medium text-gray-600">
                  {col.header}
                </span>
                <span className="text-sm text-gray-900 break-words">
                  {typeof col.accessor === "function"
                    ? col.accessor(row)
                    : String(row[col.accessor as keyof T] || "-")}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-end gap-2 ml-3">
            {massSelection && (
              <input
                type="checkbox"
                checked={selectedItems.has(row.id)}
                onChange={() => toggleRow(row.id)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            )}
            {secondaryColumns.length > 0 && (
              <button
                onClick={() => toggleExpand(row.id)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            )}
          </div>
        </div>

        {isExpanded && secondaryColumns.length > 0 && (
          <div className="pt-3 space-y-2 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-4">
              {secondaryColumns.map((col) => (
                <div key={col.key} className="flex flex-col">
                  <span className="mb-1 text-xs font-medium text-gray-600">
                    {col.header}
                  </span>
                  <span className="text-sm text-gray-900 break-words">
                    {typeof col.accessor === "function"
                      ? col.accessor(row)
                      : String(row[col.accessor as keyof T] || "-")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {renderActions && (
          <div
            className={`flex justify-end gap-2 ${
              isExpanded ? "mt-3 pt-3 border-t border-gray-100" : "mt-2"
            }`}
          >
            {renderActions(row)}
          </div>
        )}
      </div>
    );
  };

  // Render skeleton loaders for mobile view
  const renderMobileSkeletons = () => {
    const skeletonCount = perPage === "All" ? 5 : Math.min(perPage, 5);
    return Array.from({ length: skeletonCount }).map((_, index) => (
      <MobileCardSkeleton key={index} />
    ));
  };

  // Render skeleton loaders for tablet view
  const renderTabletSkeletons = () => {
    const skeletonCount = perPage === "All" ? 4 : Math.min(perPage, 4);
    return Array.from({ length: skeletonCount }).map((_, index) => (
      <TabletCardSkeleton key={index} />
    ));
  };

  return (
    <div className={`space-y-4 ${containerClassName}`}>
      {responsive && (
        <div className="flex items-center gap-2 text-xs text-gray-500 md:hidden">
          {isMobile ? (
            <>
              <Smartphone size={14} />
              <span>Mobile View - Tap cards to expand</span>
            </>
          ) : (
            <>
              <Tablet size={14} />
              <span>Tablet View</span>
            </>
          )}
        </div>
      )}

      {/* RESULTS COUNT SECTION */}
      {!isLoading && data && (
        <div className="flex items-center justify-between px-1">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold">{rows.length}</span>
            {perPage !== "All" && data.total > rows.length ? (
              <>
                {" "}
                of <span className="font-semibold">{data.total}</span> results
              </>
            ) : data.total > 0 ? (
              <>
                {" "}
                results (Total:{" "}
                <span className="font-semibold">{data.total}</span>)
              </>
            ) : (
              <> results</>
            )}
          </div>

          {isFetching && !isLoading && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-500">
                Fetching ...
              </span>
              <LoaderCircle size={16} className="text-zinc-600 animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Mobile View */}
      {responsive && isMobile && (
        <div className="space-y-3 md:hidden">
          {isLoading ? (
            renderMobileSkeletons()
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No records found
            </div>
          ) : (
            rows.map((row, index) => (
              <MobileCardView key={row.id} row={row} index={index} />
            ))
          )}
        </div>
      )}

      {/* Tablet View */}
      {responsive && isTablet && (
        <div className="hidden space-y-3 lg:hidden md:block">
          {isLoading ? (
            renderTabletSkeletons()
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No records found
            </div>
          ) : (
            rows.map((row, index) => (
              <TabletCardView key={row.id} row={row} index={index} />
            ))
          )}
        </div>
      )}

      {/* Desktop Table View */}
      <div
        className={`w-full overflow-x-auto border border-gray-200 rounded-md ${
          responsive ? "hidden lg:block" : ""
        } ${containerClassName}`}
      >
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              {showRowNumbers && (
                <TableHeader className="sticky left-0 z-10 w-12 px-3 py-3 text-center bg-gray-50">
                  No.
                </TableHeader>
              )}

              {massSelection && (
                <TableHeader
                  className={`px-3 py-3 bg-gray-50 ${
                    showRowNumbers ? "" : "sticky left-0 z-10"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={
                      rows.length > 0 &&
                      rows.every((r) => selectedItems.has(r.id))
                    }
                    onChange={toggleAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </TableHeader>
              )}
              {columns
                .filter((col) => visibleCols.includes(col.key))
                .map((col) => (
                  <TableHeader
                    key={col.key}
                    className="px-3 py-3 text-left bg-gray-50"
                  >
                    {col.header}
                  </TableHeader>
                ))}
              {renderActions && (
                <TableHeader className="sticky right-0 z-10 px-3 py-3 text-center! bg-gray-50 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">
                  Actions
                </TableHeader>
              )}
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading || !hasCachedData ? (
              <tr>
                <TableCell colSpan={colSpan} className="px-3 py-8 text-center">
                  <TableRowSkeleton columns={colSpan} />
                </TableCell>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <TableCell
                  colSpan={colSpan}
                  className="px-3 py-8 text-center text-gray-500"
                >
                  No records found
                </TableCell>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={row.id} className={`hover:bg-gray-50 ${rowClassName} group`}>
                  {showRowNumbers && (
                    <TableCell className="sticky left-0 z-10 px-3 py-3 text-center bg-white group-hover:bg-gray-50">
                      <span className="text-gray-600">
                        {getRowNumber(index)}
                      </span>
                    </TableCell>
                  )}

                  {massSelection && (
                    <TableCell
                      className={`px-3 py-3 bg-white group-hover:bg-gray-50  ${
                        showRowNumbers ? "" : "sticky left-0 z-10"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedItems.has(row.id)}
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
                          : String(row[col.accessor as keyof T] || "-")}
                      </TableCell>
                    ))}
                  {renderActions && (
                    <TableCell className="sticky right-0 z-10 px-3 group-hover:bg-gray-50 py-3 text-right bg-white shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] whitespace-nowrap">
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