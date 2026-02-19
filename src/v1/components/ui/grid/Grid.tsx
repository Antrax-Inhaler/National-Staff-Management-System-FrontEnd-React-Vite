// components/ui/GridView.tsx
import React from "react";

interface GridViewProps<T> {
  data?: T[];
  loading?: boolean;
  error?: Error | null;
  renderItem: (item: T) => React.ReactNode;
  emptyState?: React.ReactNode;
  loadingState?: React.ReactNode;
  errorState?: React.ReactNode;
}

export default function Grid<T extends { id: number }>({
  data = [],
  renderItem,
}: GridViewProps<T>) {
  // ✅ Render Grid
  return (
    <div className="relative space-y-4">
      <div className="grid grid-cols-1 gap-4 p-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.map((item) => (
          <React.Fragment key={item.id}>{renderItem(item)}</React.Fragment>
        ))}
      </div>
    </div>
  );
}
