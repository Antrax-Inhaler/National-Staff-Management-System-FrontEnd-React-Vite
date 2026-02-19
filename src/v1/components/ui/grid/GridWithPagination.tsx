// components/ui/GridView.tsx
import React, { type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, FileText, Loader2 } from "lucide-react";
import type { Paginated } from "../DataTable";
import Pagination from "../Pagination";
import GridCardSkeleton from "../skeletons/GridCardSkeleton";


interface GridViewProps<T> {
  queryFn: (page: number, perPage: number | "All") => Promise<Paginated<T>>;
  queryKey?: any[];
  filterKey?: {};
  renderItem: (item: T) => React.ReactNode;
  emptyState?: React.ReactNode;
  loadingState?: React.ReactNode;
  errorState?: React.ReactNode;
  pagination?: boolean;
}

export default function GridView<T extends { id: number }>({
  queryFn,
  queryKey,
  filterKey,
  renderItem,
  emptyState,
  loadingState,
  errorState,
  pagination = true,
}: GridViewProps<T>) {
  const [searchParams] = useSearchParams();
  const page = Number(searchParams.get("page") ?? 1);
  const perRaw = searchParams.get("per_page") ?? "10";
  const perPage: number | "All" = perRaw === "All" ? "All" : Number(perRaw);

  const key = queryKey
    ? [...queryKey, { page, perPage, ...(filterKey ?? {}) }]
    : ["grid", { page, perPage, ...(filterKey ?? {}) }];

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: key,
    queryFn: () => queryFn(page, perPage),
    placeholderData: (previousData) => previousData,
  });

  const items = data?.items ?? [];

  // 🌀 Loading state
  if (isLoading) {
    return loadingState ?? <GridCardSkeleton count={4} />;
  }

  // ❌ Error state
  if (isError) {
    return (
      errorState ?? (
        <div className="py-12 text-center">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            Error Loading Data
          </h3>
          <p className="text-gray-600">
            {(error as Error).message || "Failed to load data"}
          </p>
        </div>
      )
    );
  }

  // 🗃️ Empty state
  if (!items.length) {
    return (
      emptyState ?? (
        <div className="py-12 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            No Records Found
          </h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </div>
      )
    );
  }

  // ✅ Render Grid
  return (
    <div className="relative space-y-4">
      {isFetching && (
        <div className="absolute right-0 flex items-center gap-2 text-sm text-gray-500 -top-8">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Refreshing...</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 p-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <React.Fragment key={item.id}>{renderItem(item)}</React.Fragment>
        ))}
      </div>

      <div className="p-2 mb-2">
        {pagination && <Pagination lastPage={data?.last_page ?? 1} />}
      </div>
    </div>
  );
}
