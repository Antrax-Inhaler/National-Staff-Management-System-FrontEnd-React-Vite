// src/components/dashboard/AnalyticsDashboard.tsx
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { ClickableChart } from "./ClickableChart";
import { ClickableChartLabel } from "./ClickableChartLabel";
import { ClickableListItem } from "./ClickableListItem";
import { InfoTooltip } from "./InfoTooltip";
import { EmptyDataMessage } from "./EmptyDataMessage";
import { MapPin, Briefcase, Award, Globe2, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AnalyticsDashboardProps {
  // Demographic Data
  demographicData?: {
    gender_diversity?: Array<{ gender: string; count: number; percentage: number; }>;
    state_distribution?: Array<{ state: string; count: number; }>;
    employment_status?: Array<{ status: string; count: number; }>;
    member_levels?: Array<{ level: string; count: number; }>;
    ethnicity_self_id?: Array<{ self_id: string; count: number; }>;
  };
  
  // Temporal Data
  temporalData?: {
    member_growth_timeline?: Array<{ month: string; new_members: number; cumulative_members: number; }>;
    age_distribution?: Array<{ age_group: string; count: number; percentage: number; }>;
    tenure_analysis?: Array<{ tenure_group: string; count: number; has_data: boolean }>;
  };
  
  // Loading States
  demoLoading?: boolean;
  temporalLoading?: boolean;
  
  // Navigation Functions
  getMembersLink: (filters?: Record<string, string>) => string;
}

export function AnalyticsDashboard({
  demographicData,
  temporalData,
  demoLoading = false,
  temporalLoading = false,
  getMembersLink
}: AnalyticsDashboardProps) {
  const navigate = useNavigate();

  // Prepare chart data
  const growthChartData = temporalData?.member_growth_timeline ? {
    labels: temporalData.member_growth_timeline.map(item => item.month),
    datasets: [
      {
        label: "Cumulative Members",
        data: temporalData.member_growth_timeline.map(item => item.cumulative_members),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
        borderWidth: 3,
      },
      {
        label: "New Members",
        data: temporalData.member_growth_timeline.map(item => item.new_members),
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        borderWidth: 2,
        borderDash: [5, 5],
      }
    ],
  } : null;

  const genderChartData = demographicData?.gender_diversity ? {
    labels: demographicData.gender_diversity.map(item => item.gender),
    datasets: [{
      data: demographicData.gender_diversity.map(item => item.count),
      backgroundColor: ['#3b82f6', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b'],
      borderWidth: 1,
      borderColor: '#ffffff',
    }]
  } : null;

  const ageChartData = temporalData?.age_distribution ? {
    labels: temporalData.age_distribution.map(item => item.age_group),
    datasets: [{
      data: temporalData.age_distribution.map(item => item.count),
      backgroundColor: '#10b981',
      borderRadius: 6,
    }]
  } : null;

  // Chart click handlers
  const handleGenderChartClick = () => {
    navigate(getMembersLink());
  };

  const handleAgeChartClick = () => {
    navigate(getMembersLink());
  };

  const handleGrowthChartClick = () => {
    navigate(getMembersLink({ sort: 'created_at:desc' }));
  };

  if (demoLoading || temporalLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="h-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="h-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gender Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Gender Diversity</h3>
            <InfoTooltip 
              content="Distribution of members by gender. Click on any category to view those members."
            />
          </div>
          <div className="space-y-4">
            <div className="h-48">
              {genderChartData ? (
                <ClickableChart onClick={handleGenderChartClick}>
                  <Doughnut
                    data={genderChartData}
                    options={{
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              const label = context.label;
                              const value = context.parsed;
                              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                              const percentage = ((value / total) * 100).toFixed(1);
                              return `${label}: ${value.toLocaleString()} (${percentage}%)`;
                            }
                          }
                        }
                      },
                    }}
                  />
                </ClickableChart>
              ) : (
                <EmptyDataMessage />
              )}
            </div>
            
            {/* Clickable gender labels */}
            {demographicData?.gender_diversity && demographicData.gender_diversity.length > 0 && (
              <div className="space-y-2">
                {demographicData.gender_diversity.map((gender, index) => (
                  <ClickableChartLabel
                    key={gender.gender}
                    label={gender.gender}
                    value={gender.count}
                    percentage={gender.percentage}
                    filterKey="gender"
                    filterValue={gender.gender}
                    color={['#3b82f6', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b'][index % 5]}
                    navigate={navigate}
                    getMembersLink={getMembersLink}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* State Distribution */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top States by Membership</h3>
            <InfoTooltip 
              content="Member concentration by state. Click on any state to view members from that state."
            />
          </div>
          <div className="space-y-4">
            {demographicData?.state_distribution && demographicData.state_distribution.length > 0 ? (
              <>
                <div className="space-y-3">
                  {demographicData.state_distribution.slice(0, 8).map((state, index) => (
                    <ClickableListItem
                      key={state.state}
                      label={state.state}
                      value={state.count}
                      filterKey="state"
                      filterValue={state.state}
                      icon={MapPin}
                      navigate={navigate}
                      getMembersLink={getMembersLink}
                      delay={index * 50}
                    />
                  ))}
                </div>
                
                <div className="pt-4 border-t">
                  <button
                    onClick={() => navigate(getMembersLink())}
                    className="w-full text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1"
                  >
                    View All Members by State <ExternalLink size={12} />
                  </button>
                </div>
              </>
            ) : (
              <EmptyDataMessage />
            )}
          </div>
        </div>
      </div>

      {/* Additional Demographics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Employment Status */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Status</h3>
          {demographicData?.employment_status ? (
            <div className="space-y-2">
              {demographicData.employment_status.slice(0, 5).map((status, index) => (
                <ClickableListItem
                  key={status.status}
                  label={status.status}
                  value={status.count}
                  filterKey="employment_status"
                  filterValue={status.status}
                  icon={Briefcase}
                  navigate={navigate}
                  getMembersLink={getMembersLink}
                  delay={index * 50}
                />
              ))}
              {demographicData.employment_status.length > 5 && (
                <button
                  onClick={() => navigate(getMembersLink())}
                  className="w-full text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1 mt-4 pt-3 border-t"
                >
                  View All Employment Statuses <ExternalLink size={12} />
                </button>
              )}
            </div>
          ) : (
            <EmptyDataMessage message="No employment data available" />
          )}
        </div>

        {/* Member Levels */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Member Levels</h3>
          {demographicData?.member_levels ? (
            <div className="space-y-2">
              {demographicData.member_levels.slice(0, 5).map((level, index) => (
                <ClickableListItem
                  key={level.level}
                  label={level.level}
                  value={level.count}
                  filterKey="level"
                  filterValue={level.level}
                  icon={Award}
                  navigate={navigate}
                  getMembersLink={getMembersLink}
                  delay={index * 50}
                />
              ))}
              {demographicData.member_levels.length > 5 && (
                <button
                  onClick={() => navigate(getMembersLink())}
                  className="w-full text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1 mt-4 pt-3 border-t"
                >
                  View All Member Levels <ExternalLink size={12} />
                </button>
              )}
            </div>
          ) : (
            <EmptyDataMessage message="No member level data available" />
          )}
        </div>

        {/* Ethnicity */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ethnicity Distribution</h3>
          {demographicData?.ethnicity_self_id ? (
            <div className="space-y-2">
              {demographicData.ethnicity_self_id.slice(0, 5).map((ethnicity, index) => (
                <ClickableListItem
                  key={ethnicity.self_id}
                  label={ethnicity.self_id}
                  value={ethnicity.count}
                  filterKey="self_id"
                  filterValue={ethnicity.self_id}
                  icon={Globe2}
                  navigate={navigate}
                  getMembersLink={getMembersLink}
                  delay={index * 50}
                />
              ))}
              {demographicData.ethnicity_self_id.length > 5 && (
                <button
                  onClick={() => navigate(getMembersLink())}
                  className="w-full text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1 mt-4 pt-3 border-t"
                >
                  View All Ethnicity Groups <ExternalLink size={12} />
                </button>
              )}
            </div>
          ) : (
            <EmptyDataMessage message="No ethnicity data available" />
          )}
        </div>
      </div>

      {/* Growth Timeline */}
      {/* <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Membership Growth Timeline</h3>
          <InfoTooltip 
            content="Shows cumulative member growth over time with new member additions per month."
          />
        </div>
        <div className="h-64">
          {growthChartData ? (
            <ClickableChart onClick={handleGrowthChartClick}>
              <Line
                data={growthChartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { 
                      position: 'top',
                      labels: { usePointStyle: true }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return value.toLocaleString();
                        }
                      }
                    }
                  }
                }}
              />
            </ClickableChart>
          ) : (
            <EmptyDataMessage />
          )}
        </div>
      </div> */}
    </div>
  );
}