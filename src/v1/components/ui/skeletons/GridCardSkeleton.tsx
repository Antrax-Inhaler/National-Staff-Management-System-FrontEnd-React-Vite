import React from "react";
import LinkCardSkeleton from "./CardSkeleton";

interface GridCardSkeletonProps {
  count?: number;
}

export default function GridCardSkeleton({ count = 8 }: GridCardSkeletonProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <LinkCardSkeleton key={i}/>
      ))}
    </div>
  );
}
