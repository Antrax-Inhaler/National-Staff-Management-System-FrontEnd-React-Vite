import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ActionButton } from "@v1/components/ui/ActionButton";
import Pagination from "@v1/components/ui/Pagination";
import Table from "@v1/components/ui/tables/Table";
import type { PaginatedData } from "@v1/types";
import { AlertCircle, Loader2, LoaderCircle, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
}

interface DataTableProps<T> {
  columns: Column<T>[];
  visibleColumns?: string[];
  queryKey?: any[];
  view?: "table" | "card";
  queryFn: () => Promise<PaginatedData<T>>;
  renderActions?: (row: T, index: number) => React.ReactNode;
  renderCard?: (row: T, index: number) => React.ReactNode;
  massSelection?: boolean;
  selectedRows?: Set<number>;
  onSelectionChange?: (selectedIds: Set<number>) => void;
  fallback?: ReactNode;
}

function DataTable<T extends { id: number }>({
  columns,
  visibleColumns,
  queryKey = [],
  view = "table",
  queryFn,
  renderActions,
  massSelection,
  selectedRows,
  onSelectionChange,
  fallback,
  renderCard,
}: DataTableProps<T>) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, isFetching, refetch } = useQuery<
    PaginatedData<T>
  >({
    queryKey: queryKey,
    queryFn: () => queryFn(),
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 5,
    retryDelay: 3000,
  });

  const cachedData = queryClient.getQueryData(queryKey);
  const hasCachedData = queryClient.getQueryData(queryKey) !== undefined;

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
            <ActionButton
              onClick={() => refetch()}
              label="Retry"
              icon={RefreshCw}
              iconSize={15}
              loading={isFetching}
              buttonClassName="flex items-center gap-2 px-6 py-3 text-xs font-bold! text-white transition-colors bg-red-600! rounded-lg shadow-md hover:bg-red-700 hover:shadow-lg"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden  rounded-lg  ${view == "card" && "bg-white rounded-lg shadow-xs"} mb-10 `}
    >
      <div className="flex justify-between px-2 pt-2 pb-1.5 mb-1">
        {data && (
          <>
            <div className="text-xs text-gray-600">
              Showing <span className="font-semibold">{data.items.length}</span>{" "}
              of <span className="font-semibold">{data.total}</span> results
            </div>
          </>
        )}

        {isFetching && !isLoading && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Refreshing...</span>
          </div>
        )}
      </div>

      {view === "table" && (
        <Table
          columns={columns}
          massSelection={massSelection}
          visibleColumns={visibleColumns}
          data={data?.items ?? []}
          selectedRows={selectedRows}
          onSelectionChange={onSelectionChange}
          loading={!hasCachedData && isFetching}
          refreshing={isFetching}
          renderActions={renderActions}
          fallback={fallback}
        />
      )}

      {view === "card" && renderCard && (
        <div className="p-2">
          {isFetching && !hasCachedData && (
            <div className="grid grid-cols-1 gap-3 space-y-4 md:grid-cols-2 ">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1 space-y-3">
                      <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
                      <div className="w-1/2 h-3 bg-gray-200 rounded"></div>
                      <div className="flex gap-2">
                        <div className="w-16 h-3 bg-gray-200 rounded"></div>
                        <div className="w-16 h-3 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {hasCachedData && data && data.items && data?.items.length > 0 && (
            <div className="space-y-3">
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                {data.items.map((item, idx) => renderCard(item, idx))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {data &&
        ((!isLoading && data?.items && data?.items.length > 0) ||
          data?.total > 0) && (
          <div className="px-4 py-2 border-t border-gray-200 ">
            <Pagination lastPage={data.last_page ?? 1} />
          </div>
        )}
    </div>
  );
}

export default DataTable;
