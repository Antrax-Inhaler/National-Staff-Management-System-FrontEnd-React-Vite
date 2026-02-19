import React from 'react'

function ChartSkeleton() {
  return (
  <div className="p-4 bg-white rounded-lg animate-pulse">
    <div className="w-32 h-5 mb-4 bg-gray-200 rounded"></div>
    <div className="h-40 bg-gray-100 rounded"></div>
  </div>
  )
}

export default ChartSkeleton