import React from "react";

type ListSkeletonProps = {
  items?: number;
};

function ListSkeleton({ items = 3 }: ListSkeletonProps) {
  return (
    <div className="p-4 bg-white rounded-lg animate-pulse">
      <div className="w-32 h-5 mb-4 bg-gray-200 rounded"></div>
      <div className="space-y-3">
        {Array.from({ length: items }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="w-full h-4 bg-gray-200 rounded"></div>
            <div className="w-3/4 h-3 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ListSkeleton;
