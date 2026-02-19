import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { fetchUserRoles } from "../lib/api";
import DashboardLayout from "../components/DashboardLayout";
import AdminDashboard from "./AdminDashboard";
import AffiliateDashboard from "./AffiliateDashboard";
import MemberDashboard from "./MemberDashboard";

export default function Dashboard() {
  const { session } = useAuth();
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (session) {
      fetchUserRoles(session.access_token)
        .then(setUserData)
        .catch((err) => console.error(err));
    }
  }, [session]);

  if (!session) return <p>Loading session...</p>;
  if (!userData) return <p>Loading roles...</p>;

  const roles = userData.roles || [];

  let content;
  if (roles.includes("National Administrator")) {
    content = <AdminDashboard />;
  } else if (roles.includes("Affiliate Officer")) {
    content = <AffiliateDashboard />;
  } else {
    content = <MemberDashboard />;
  }

  return <DashboardLayout>{content}</DashboardLayout>;
}
