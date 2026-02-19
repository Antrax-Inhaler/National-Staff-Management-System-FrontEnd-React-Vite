// components/DataTable.tsx
import React from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Smartphone,
  Tablet,
  ChevronDown,
  ChevronUp,
  LoaderCircle,
} from "lucide-react";
import TableHeader from "./TableHeader";
import TableCell from "./TableCell";
import Pagination from "../Pagination";

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
  renderActions?: (row: T) => React.ReactNode;
  pagination?: boolean;
  massSelection?: boolean;
  selectedRows?: Set<number>;
  onSelectionChange?: (selectedIds: Set<number>) => void;
  perPageOptions?: Array<number | "All">;
  responsive?: boolean;
  data?: Paginated<T>;
  onFetch?: (page: number, perPage: number | "All") => void;
  // ✅ New props for custom URL params
  pageParam?: string;
  perPageParam?: string;
  // ✅ New props for external control
  autoFetch?: boolean; // Auto-fetch on mount
  showFetchButton?: boolean; // Show/hide the fetch button
  onFetchRef?: React.MutableRefObject<(() => void) | null>; // Expose fetch function via ref
  // ✅ Cache control props
  enableCache?: boolean; // Enable/disable caching
  cacheTime?: number; // How long to keep unused cache (ms)
  staleTime?: number; // How long data is considered fresh (ms)
  cacheKey?: any[]; // Custom cache key
}

export default function DataTable<T extends { id: number }>({
  columns,
  visibleColumns,
  queryFn,
  renderActions,
  pagination = true,
  massSelection = false,
  selectedRows = new Set(),
  onSelectionChange,
  perPageOptions = [10, 25, 50, 100, 500, 600, 1000, "All"],
  responsive = true,
  data: externalData,
  onFetch,
  pageParam = "page", // ✅ default to "page"
  perPageParam = "per_page", // ✅ default to "per_page"
  autoFetch = false, // ✅ Don't auto-fetch by default
  showFetchButton = true, // ✅ Show fetch button by default
  onFetchRef, // ✅ Ref to expose fetch function
  enableCache = true, // ✅ Enable caching by default
  cacheTime = 5 * 60 * 1000, // ✅ 5 minutes default
  staleTime = 0, // ✅ Consider data stale immediately
  cacheKey: customCacheKey, // ✅ Custom cache key
}: DataTableProps<T>) {
  const [searchParams] = useSearchParams();

  // ✅ Use custom param names
  const page = Number(searchParams.get(pageParam) ?? 1);
  const perRaw = searchParams.get(perPageParam) ?? "20";
  const perPage: number | "All" = perRaw === "All" ? "All" : Number(perRaw);

  const [expandedRows, setExpandedRows] = React.useState<Set<number>>(
    new Set()
  );
  const [isMobile, setIsMobile] = React.useState(false);
  const [isTablet, setIsTablet] = React.useState(false);

  // ✅ Get queryClient for caching
  const queryClient = useQueryClient();

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

  // ✅ Build cache key - use custom key or auto-generate
  const finalCacheKey = React.useMemo(() => {
    if (customCacheKey) {
      return [...customCacheKey, page, perPage];
    }
    return ["datatable", pageParam, page, perPageParam, perPage];
  }, [customCacheKey, pageParam, page, perPageParam, perPage]);

  // ✅ Check if we have cached data
  const cachedData = enableCache
    ? queryClient.getQueryData<Paginated<T>>(finalCacheKey)
    : undefined;

  // ✅ Check if cached data is stale
  const isCacheStale = React.useMemo(() => {
    if (!cachedData || !enableCache) return true;

    const cacheEntry = queryClient.getQueryState(finalCacheKey);
    if (!cacheEntry?.dataUpdatedAt) return true;

    const age = Date.now() - cacheEntry.dataUpdatedAt;
    return age > staleTime;
  }, [cachedData, enableCache, finalCacheKey, staleTime, queryClient]);

  const fetchMutation = useMutation({
    mutationFn: ({
      page,
      perPage,
    }: {
      page: number;
      perPage: number | "All";
    }) => queryFn(page, perPage),
    onSuccess: (data) => {
      // ✅ Store data in cache after successful fetch
      if (enableCache) {
        queryClient.setQueryData(finalCacheKey, data);

        // ✅ Set cache time
        queryClient.setQueryDefaults(finalCacheKey, {
          gcTime: cacheTime,
        });
      }
    },
  });

  const fetchData = React.useCallback(() => {
    // ✅ Check cache first before fetching (if not stale)
    if (enableCache && cachedData && !isCacheStale) {
      console.log("Using cached data for:", finalCacheKey);
      return; // Don't fetch if we have fresh cached data
    }

    fetchMutation.mutate({ page, perPage });
    onFetch?.(page, perPage);
  }, [
    page,
    perPage,
    onFetch,
    finalCacheKey,
    cachedData,
    isCacheStale,
    enableCache,
  ]);

  // ✅ Force fetch (ignores cache)
  const forceFetch = React.useCallback(() => {
    fetchMutation.mutate({ page, perPage });
    onFetch?.(page, perPage);
  }, [page, perPage, onFetch]);

  // ✅ Clear cache function
  const clearCache = React.useCallback(() => {
    queryClient.removeQueries({ queryKey: finalCacheKey });
  }, [queryClient, finalCacheKey]);

  // ✅ Expose fetch, forceFetch, and clearCache via ref
  React.useEffect(() => {
    if (onFetchRef) {
      onFetchRef.current = fetchData;
    }
  }, [fetchData, onFetchRef]);

  // ✅ Auto-fetch on mount if enabled
  React.useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch]); // Only run on mount

  // ✅ Use cached data, external data, or mutation data (in that order)
  const data = externalData || cachedData || fetchMutation.data;
  const rows = data?.items ?? [];
  const isLoading = fetchMutation.isPending;
  const isError = fetchMutation.isError;

  const toggleRow = (id: number) => {
    const newSet = new Set(selectedRows);
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
    const allSelected = rows.every((r) => selectedRows.has(r.id));
    const newSet = new Set(selectedRows);
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

  if (isError) return <p className="p-4 text-red-600">Something went wrong</p>;

  const colSpan =
    columns.filter((col) => visibleCols.includes(col.key)).length +
    (massSelection ? 1 : 0) +
    (renderActions ? 1 : 0);

  const MobileCardView = ({ row }: { row: T }) => {
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
                checked={selectedRows.has(row.id)}
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

      {renderActions && (
        <div className="flex justify-end gap-2 pt-3 mt-3 border-t border-gray-100">
          {renderActions(row)}
        </div>
      )}
    </div>
  );

  return (
    <div className="relative space-y-4">
      {/* Manual Fetch Button */}
      {showFetchButton && (
        <div className="flex items-center justify-between">
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <LoaderCircle size={16} className="animate-spin" />
                Loading...
              </span>
            ) : (
              "Fetch Data"
            )}
          </button>

          {/* Responsive Indicator */}
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
        </div>
      )}

      {responsive && isMobile && (
        <div className="space-y-3 md:hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No records found.
            </div>
          ) : (
            rows.map((row) => <MobileCardView key={row.id} row={row} />)
          )}
        </div>
      )}

      {responsive && isTablet && (
        <div className="hidden space-y-3 lg:hidden md:block">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No records found.
            </div>
          ) : (
            rows.map((row) => <TabletCardView key={row.id} row={row} />)
          )}
        </div>
      )}

      <div
        className={`overflow-x-auto rounded-md ${
          responsive ? "hidden lg:block" : ""
        }`}
      >
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
                <TableHeader className="px-3 py-3 text-right">
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
                <TableCell
                  colSpan={colSpan}
                  className="px-3 py-8 text-center text-gray-500"
                >
                  No records found.
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
                          : String(row[col.accessor as keyof T] || "-")}
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

      {pagination && (
        <Pagination
          lastPage={data?.last_page ?? 1}
          perPageOptions={perPageOptions}
          pageParam={pageParam} // ✅ Pass custom param names
          perPageParam={perPageParam} // ✅ Pass custom param names
          onChange={(newPage, newPerPage) => {
            fetchMutation.mutate({ page: newPage, perPage: newPerPage });
          }}
        />
      )}
    </div>
  );
}
