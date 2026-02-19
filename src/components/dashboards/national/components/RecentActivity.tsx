// src/components/dashboards/national/components/RecentActivity.tsx
import React from 'react';

const RecentActivity: React.FC = () => {
  // Static recent activity data
  const activities = [
    {
      id: 1,
      type: 'user',
      action: 'New member registration',
      user: 'John Smith',
      time: '2 minutes ago',
      icon: '👤'
    },
    {
      id: 2,
      type: 'affiliate',
      action: 'Affiliate profile updated',
      user: 'California Chapter',
      time: '15 minutes ago',
      icon: '🏢'
    },
    {
      id: 3,
      type: 'document',
      action: 'New contract uploaded',
      user: 'Sarah Johnson',
      time: '1 hour ago',
      icon: '📄'
    },
    {
      id: 4,
      type: 'system',
      action: 'System maintenance completed',
      user: 'System Administrator',
      time: '2 hours ago',
      icon: '⚙️'
    },
    {
      id: 5,
      type: 'user',
      action: 'Member profile updated',
      user: 'Michael Chen',
      time: '3 hours ago',
      icon: '👤'
    }
  ];

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'user':
        return 'bg-blue-100 text-blue-800';
      case 'affiliate':
        return 'bg-green-100 text-green-800';
      case 'document':
        return 'bg-purple-100 text-purple-800';
      case 'system':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
          View All
        </button>
      </div>
      
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${getActivityColor(activity.type)}`}>
              {activity.icon}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {activity.action}
              </p>
              <p className="text-sm text-gray-500 truncate">
                by {activity.user}
              </p>
            </div>
            
            <div className="flex-shrink-0">
              <p className="text-xs text-gray-400">
                {activity.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {activities.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">📊</div>
          <p className="text-gray-500 text-sm">No recent activity</p>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;