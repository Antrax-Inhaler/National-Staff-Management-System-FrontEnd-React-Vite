import React from "react";

interface TableSkeletonProps {
  columns: number;
  rows?: number;
}

export default function TableSkeleton({
  columns,
  rows = 5,
}: TableSkeletonProps) {
  return (
    <div className="w-full overflow-x-auto rounded-md">
      <table className="min-w-full border border-collapse border-gray-200 animate-pulse">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="p-3">
                <div className="w-1/3 h-3 mx-auto bg-gray-200 rounded" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx}>
              {Array.from({ length: columns }).map((_, colIdx) => (
                <td key={colIdx} className="p-3">
                  <div className="w-full h-3 bg-gray-200 rounded" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
