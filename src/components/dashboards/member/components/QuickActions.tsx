// src/components/dashboards/member/components/QuickActions.tsx
import React from 'react';

const QuickActions: React.FC = () => {
  const actions = [
    {
      icon: '📊',
      label: 'Generate Reports',
      description: 'Create system reports',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      icon: '👥',
      label: 'Manage Users',
      description: 'User administration',
      color: 'bg-green-100 text-green-800'
    },
    {
      icon: '🏢',
      label: 'Affiliate Tools',
      description: 'Affiliate management',
      color: 'bg-purple-100 text-purple-800'
    },
    {
      icon: '⚙️',
      label: 'System Settings',
      description: 'Configuration',
      color: 'bg-gray-100 text-gray-800'
    }
  ];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <button
            key={index}
            className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
          >
            <span className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${action.color}`}>
              {action.icon}
            </span>
            <div className="flex-1">
              <div className="font-medium text-gray-900">{action.label}</div>
              <div className="text-sm text-gray-500">{action.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;