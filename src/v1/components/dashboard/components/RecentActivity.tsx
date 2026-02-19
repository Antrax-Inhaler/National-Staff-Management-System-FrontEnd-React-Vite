// src/components/dashboard/RecentActivity.tsx
import { Activity, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SystemUpdate {
  description?: string;
  time_ago?: string;
  created_at?: string;
}

interface RecentActivityProps {
  updates?: SystemUpdate[];
  title?: string;
  tooltip?: string;
  loading?: boolean;
}

export function RecentActivity({ 
  updates = [], 
  title = "Recent System Activity",
  tooltip = "Recent system events including member updates, document uploads, and administrative changes. Shows activity from the last 30 days.",
  loading = false 
}: RecentActivityProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow p-6 animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (updates.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="p-4 text-center border rounded-lg">
          <Activity size={24} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-500">No recent system activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <button
          onClick={() => navigate("/audit-logs")}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          View All <ExternalLink size={12} />
        </button>
      </div>
      <div className="space-y-3">
        {updates.slice(0, 5).map((update, index) => (
          <div 
            key={index} 
            className="flex items-start gap-3 p-3 border rounded-lg hover:border-blue-300 transition-colors" 
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex-shrink-0">
              <Activity size={16} className="text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">{update.description || 'System update'}</p>
              <p className="text-xs text-gray-500 mt-1">{update.time_ago || update.created_at}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}