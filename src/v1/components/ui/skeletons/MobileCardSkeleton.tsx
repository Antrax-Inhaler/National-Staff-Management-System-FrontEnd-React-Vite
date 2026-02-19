// components/ui/skeletons/MobileCardSkeleton.tsx
export default function MobileCardSkeleton() {
  return (
    <div className="p-4 mb-3 bg-white border border-gray-200 rounded-lg shadow-sm animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 space-y-3">
          {/* Row number */}
          <div className="space-y-1">
            <div className="h-3 w-8 bg-gray-200 rounded"></div>
            <div className="h-4 w-4 bg-gray-300 rounded"></div>
          </div>
          
          {/* Primary columns (2 items) */}
          {[1, 2].map((i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 w-16 bg-gray-200 rounded"></div>
              <div className="h-4 w-full bg-gray-300 rounded"></div>
            </div>
          ))}
        </div>
        
        <div className="flex flex-col items-end gap-2 ml-3">
          {/* Checkbox skeleton */}
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
          {/* Expand button skeleton */}
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
      
      {/* Secondary content skeleton */}
      <div className="pt-3 space-y-2 border-t border-gray-100">
        {[1, 2].map((i) => (
          <div key={i} className="flex items-start justify-between">
            <div className="h-3 w-12 bg-gray-200 rounded"></div>
            <div className="h-3 w-24 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
      
      {/* Actions skeleton */}
      <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-8 h-8 bg-gray-200 rounded-full"></div>
        ))}
      </div>
    </div>
  );
}