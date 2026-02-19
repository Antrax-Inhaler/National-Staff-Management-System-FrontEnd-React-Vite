import React from "react";

interface RowSkeletonProps {
  columns: number;
  rows?: number;
}

export default function TableRowSkeleton({
  columns,
  rows = 5,
}: RowSkeletonProps) {
  return (
    <div className="w-full space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="grid gap-3 p-3"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <div
              key={colIdx}
              className="bg-gray-200 rounded h-9"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
