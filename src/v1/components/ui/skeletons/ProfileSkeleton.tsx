import React from "react";

type ProfileSkeletonProps = {
  items?: number;
};


function ProfileSkeleton({items = 8}: ProfileSkeletonProps) {
  return (
    <div className="p-6 mx-auto bg-white rounded-lg max-w-7xl animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="w-48 h-8 bg-gray-200 rounded"></div>
        <div className="w-32 h-10 bg-gray-200 rounded"></div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {[...Array(items)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="w-1/3 h-4 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="w-2/3 h-4 bg-gray-200 rounded"></div>
              <div className="h-6 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProfileSkeleton;
