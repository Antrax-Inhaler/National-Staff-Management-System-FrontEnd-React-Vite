interface LinkCardSkeletonProps {
  className?: string;
}

export default function LinkCardSkeleton({ className }: LinkCardSkeletonProps) {
  return (
    <div
      className={`p-4 bg-white rounded-lg shadow-sm animate-pulse ${className ?? ""}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="w-3/4 h-5 bg-gray-200 rounded" />
          <div className="w-full h-4 bg-gray-200 rounded" />
          <div className="w-1/2 h-3 bg-gray-200 rounded" />
        </div>
        <div className="w-6 h-6 ml-4 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
