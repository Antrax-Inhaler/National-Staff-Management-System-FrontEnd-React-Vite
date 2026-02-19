// import { useEffect, useState } from "react";
// import { useAuth } from "../../hooks/useAuth";
// import { fetchUserRoles } from "../../lib/api";

// import MemberDashboard from "../../components/MemberDashboard";
// import AffiliateDashboard from "../../components/AffiliateDashboard";
// import AdminDashboard from "../../components/AdminDashboard";

// export default function DashboardPage() {
//   const session = useAuth();
//   const [userData, setUserData] = useState<any>(null);

//   useEffect(() => {
//     if (session) {
//       fetchUserRoles(session.access_token)
//         .then(setUserData)
//         .catch((err) => coOrganizationle.error(err));
//     }
//   }, [session]);

//   if (!session) return <p>Loading session...</p>;
//   if (!userData) return <p>Loading user data...</p>;

//   const roles: string[] = userData.roles || [];

//   return (
//     <div className="p-4 space-y-6">
//       <h1 className="text-2xl font-bold mb-4">Welcome, {userData.email}</h1>

//       {/* Default: every user is a member */}
//       <MemberDashboard />

//       {/* Officer roles */}
//       {roles.some((r) =>
//         ["President", "Vice President", "Secretary", "Treasurer", "Grievance Chair", "Bargaining Chair"].includes(r)
//       ) && <AffiliateDashboard />}

//       {/* National roles */}
//       {roles.some((r) =>
//         ["National Administrator", "Organization Executive Committee", "Organization Research Committee"].includes(r)
//       ) && <AdminDashboard />}
//     </div>
//   );
// }
