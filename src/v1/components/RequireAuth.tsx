import { Navigate } from "react-router-dom";
import type { JSX } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useUser } from "../contexts/UserContext";

interface RequireAuthProps {
  children: JSX.Element;
  requiredRoles?: string[];
  requiredPermissions?: string[];
}

export default function RequireAuth({
  children,
  requiredRoles,
  requiredPermissions,
}: RequireAuthProps) {
  const { session, loading } = useAuth();
  const { roles, permissions, loading: userLoading } = useUser();

  if (userLoading) return <div>Loading...</div>;
  if (!session) return <Navigate to="/login" replace />;

  // 🔹 Role-based restriction
  if (requiredRoles && !requiredRoles.some((r) => roles.includes(r))) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 🔹 Permission-based restriction
  if (
    requiredPermissions &&
    !requiredPermissions.some((p) => permissions.includes(p))
  ) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
