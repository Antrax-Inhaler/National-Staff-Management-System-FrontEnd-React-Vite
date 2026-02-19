// components/ui/DataView.tsx
import React, { useState, type ReactNode } from "react";
import {
  LayoutGrid,
  List,
  Table as TableIcon,
  Grid as GridIcon,
} from "lucide-react";
import type { Column } from "./tables/Table";
import Table from "./tables/Table";
import Grid from "./grid/Grid";

interface DataViewProps<T> {
  viewMode?: "table" | "grid";
  columns: Column<T>[];
  data: T[];
  renderItem: (item: T) => React.ReactNode;
  renderActions?: (row: T) => React.ReactNode;
  viewHeaderItem?: ReactNode;
  fallback?: ReactNode;
  massSelection?: boolean;
  selectedRows?: Set<number>;
  onSelectionChange?: (selectedIds: Set<number>) => void;
}

export default function DataView<T extends { id: number }>({
  viewMode: initialMode = "table",
  columns,
  data,
  renderItem,
  renderActions,
  fallback,
  massSelection,
  selectedRows,
  onSelectionChange,
  viewHeaderItem,
}: DataViewProps<T>) {
  const [mode, setMode] = useState<"table" | "grid">(initialMode);

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2 mb-2">
        {viewHeaderItem}
        {/* 🔘 Toggle Buttons */}
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

      {mode === "table" ? (
        <Table
          columns={columns}
          data={data}
          renderActions={renderActions}
          fallback={fallback}
          massSelection={massSelection}
          selectedRows={selectedRows}
          onSelectionChange={onSelectionChange}
        />
      ) : (
        <Grid data={data} renderItem={renderItem} />
      )}
    </div>
  );
}
