// src/components/ui/skeletons/DashboardSkeleton.tsx
export default function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-6 bg-white rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <div className="w-24 h-4 mb-2 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
            <div className="mt-4">
              <div className="flex items-center">
                <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-6 bg-white rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-80 bg-gray-100 rounded animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Table Skeletons */}
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="w-40 h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-4 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="space-y-2">
                  <div className="w-32 h-3 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-24 h-2 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-12 h-2 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}