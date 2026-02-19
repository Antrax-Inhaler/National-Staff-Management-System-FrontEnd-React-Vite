// src/components/dashboard/DashboardMetrics.tsx
import { Line, Bar, Pie, Doughnut, Radar } from 'react-chartjs-2';

interface MetricsProps {
  data: any;
}

export default function DashboardMetrics({ data }: MetricsProps) {
  // Additional charts for different metrics views

  // Employment Status Distribution
  const employmentData = {
    labels: data.membership_analytics.employment_distribution.map((item: any) => item.employment_status),
    datasets: [
      {
        label: 'Employment Status',
        data: data.membership_analytics.employment_distribution.map((item: any) => item.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Age Distribution
  const ageData = {
    labels: data.demographic_analytics.age_distribution.map((item: any) => item.age_group),
    datasets: [
      {
        label: 'Members',
        data: data.demographic_analytics.age_distribution.map((item: any) => item.count),
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderColor: 'rgb(245, 158, 11)',
        borderWidth: 1,
      },
    ],
  };

  // Affiliate Type Distribution
  const affiliateTypeData = {
    labels: data.affiliate_analytics.type_distribution.map((item: any) => item.type),
    datasets: [
      {
        data: data.affiliate_analytics.type_distribution.map((item: any) => item.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // Radar Chart for Regional Metrics
  const regionalRadarData = {
    labels: data.regional_analytics.regional_growth.map((item: any) => item.state).slice(0, 6),
    datasets: [
      {
        label: 'Total Members',
        data: data.regional_analytics.regional_growth.map((item: any) => item.total_members).slice(0, 6),
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgb(59, 130, 246)',
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(59, 130, 246)',
      },
      {
        label: 'Engagement Rate',
        data: data.regional_analytics.regional_growth.map((item: any) => item.engagement_rate).slice(0, 6),
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: 'rgb(16, 185, 129)',
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(16, 185, 129)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  return (
    <div className="grid grid-cols-1 gap-6 mt-6 lg:grid-cols-2">
      {/* Employment Distribution */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Employment Status Distribution</h3>
        <div className="h-64">
          <Pie data={employmentData} options={chartOptions} />
        </div>
      </div>

      {/* Age Distribution */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Age Distribution</h3>
        <div className="h-64">
          <Bar data={ageData} options={chartOptions} />
        </div>
      </div>

      {/* Affiliate Type Distribution */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Affiliate Types</h3>
        <div className="h-64">
          <Doughnut data={affiliateTypeData} options={chartOptions} />
        </div>
      </div>

      {/* Regional Radar Chart */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Regional Performance</h3>
        <div className="h-64">
          <Radar data={regionalRadarData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}