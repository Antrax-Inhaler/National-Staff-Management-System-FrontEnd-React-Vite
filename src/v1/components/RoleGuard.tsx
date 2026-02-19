import { useAuth } from "@v1/contexts/AuthContext";
import type { ReactNode } from "react";

interface RoleGuardProps {
  roles?: string[];
  permissions?: string[];
  positions?: string[];
  restrictedRoles?: string[];
  restrictedPositions?: string[];
  region?: number;
  children: ReactNode;
  fallback?: ReactNode;
}

export default function RoleGuard({
  roles,
  permissions,
  positions,
  restrictedRoles,
  restrictedPositions,
  region,
  children,
  fallback = null,
}: RoleGuardProps) {
  const { loading, userRole } = useAuth();

  if (loading || !userRole) return null;

  /** ------------------------------
   *  1. Allow checks (OR logic)
   * ------------------------------ */
  const allowChecks: boolean[] = [];

  if (roles?.length) {
    allowChecks.push(roles.some((r) => userRole.roles.includes(r)));
  }

  if (permissions?.length) {
    allowChecks.push(permissions.some((p) => userRole.permissions.includes(p)));
  }

  if (positions?.length) {
    allowChecks.push(positions.some((p) => userRole.position.includes(p)));
  }

  if (region !== undefined) {
    const regionRole = `region_${region}_director`;
    allowChecks.push(userRole.roles.includes(regionRole));
  }

  // If nothing is passed, allow by default
  const meetsAllowRule = allowChecks.length === 0 || allowChecks.some(Boolean);

  /** ------------------------------
   *  2. Deny checks (AND NOT)
   * ------------------------------ */
  const hasRestrictedRole =
    restrictedRoles?.some((r) => userRole.roles.includes(r)) ?? false;

  const hasRestrictedPosition =
    restrictedPositions?.some((r) => userRole.position.includes(r)) ?? false;

  const hasAccess =
    meetsAllowRule && !hasRestrictedRole && !hasRestrictedPosition;

  return <>{hasAccess ? children : fallback}</>;
}
