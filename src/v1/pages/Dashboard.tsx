// Dashboard.tsx
import AffiliateDashboard from "@v1/components/dashboard/AffiliateDashboard";
import MemberDashboard from "@v1/components/dashboard/MemberDashboard";
import NationalDashboard from "@v1/components/dashboard/NationalDashboard";
import { National_Roles, Roles } from "@v1/constants/roles";
import { useAuth } from "@v1/contexts/AuthContext";
import { Link2Off, Loader2 } from "lucide-react";
import { useEffect } from "react";

function Dashboard() {
  const { userRole, loading } = useAuth();
  
  // Show loading state while userRole is being fetched
  if (loading || !userRole) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 h-full text-center">
        <div className="flex items-center justify-center w-12 h-12 mb-3 bg-gray-100 rounded-full">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
        <span className="text-sm font-medium text-gray-700">
          Loading dashboard...
        </span>
      </div>
    );
  }

  // Show error state if userRole exists but has no roles
  if (!userRole.roles || userRole.roles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 h-full text-center">
        <div className="flex items-center justify-center w-12 h-12 mb-3 bg-gray-100 rounded-full">
          <Link2Off className="w-6 h-6 text-gray-400" />
        </div>
        <span className="text-sm font-medium text-gray-700">
          No Roles Assigned
        </span>
        <span className="mt-1 text-xs text-gray-500">
          This account has no assigned roles. Please contact your administrator.
        </span>
      </div>
    );
  }

  // Check for National roles
  if (National_Roles.some((role) => userRole.roles?.includes(role))) {
    return <NationalDashboard />;
  }

  // Check for Affiliate Officer role
  if (userRole.roles?.includes(Roles.AFFILIATE_OFFICER)) {
    return <AffiliateDashboard />;
  }

  // Check for Affiliate Member role
  if (userRole.roles?.includes(Roles.AFFILIATE_MEMBER)) {
    // FIX: Check for 'affiliate' property instead of 'affiliate_id'
    const affiliateId = userRole.affiliate_id; // This is what the API returns
    
    if (!affiliateId) {
      return (
        <div className="flex flex-col items-center justify-center flex-1 h-full text-center">
          <div className="flex items-center justify-center w-12 h-12 mb-3 bg-gray-100 rounded-full">
            <Link2Off className="w-6 h-6 text-gray-400" />
          </div>
          <span className="text-sm font-medium text-gray-700">
            No Assigned Affiliate
          </span>
          <span className="mt-1 text-xs text-gray-500">
            This member is not linked to any affiliate
          </span>
        </div>
      );
    }
    return <MemberDashboard />;
  }

  // Default fallback for users with roles but none matching the expected patterns
  return (
    <div className="flex flex-col items-center justify-center flex-1 h-full text-center">
      <div className="flex items-center justify-center w-12 h-12 mb-3 bg-gray-100 rounded-full">
        <Link2Off className="w-6 h-6 text-gray-400" />
      </div>
      <span className="text-sm font-medium text-gray-700">
        Access Restricted
      </span>
      <span className="mt-1 text-xs text-gray-500">
        You don't have permission to access this dashboard
      </span>
    </div>
  );
}

export default Dashboard;