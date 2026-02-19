import React from "react";

function MetricSkeleton() {
  return (
    <div className="p-4 bg-white rounded-lg animate-pulse">
      <div className="flex items-center">
        <div className="w-8 h-8 bg-gray-200 rounded"></div>
        <div className="ml-3 space-y-2">
          <div className="w-20 h-4 bg-gray-200 rounded"></div>
          <div className="w-12 h-6 bg-gray-200 rounded"></div>
          <div className="w-24 h-3 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export default MetricSkeleton;
