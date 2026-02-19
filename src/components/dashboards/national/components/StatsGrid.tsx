// src/components/dashboards/national/components/StatsGrid.tsx
export default function StatsGrid() {
  const stats = [
    { label: 'Total Affiliates', value: '80', change: '+2%' },
    { label: 'Total Members', value: '4,200', change: '+5%' },
    { label: 'Pending Contracts', value: '12', change: '-3%' },
    { label: 'Active Arbitrations', value: '5', change: '+1%' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              stat.change.startsWith('+') 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {stat.change}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}