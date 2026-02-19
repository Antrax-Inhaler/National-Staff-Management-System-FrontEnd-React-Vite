import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { National_Roles, Roles } from "@v1/constants/roles";
import { useAuth } from "@v1/contexts/AuthContext";

interface AccessWrapperProps {
  roles?: string[];
  permissions?: string[];
  positions?: string[];
  restrictedRoles?: string[];
  restrictedPositions?: string[];
  region?: number;
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

export default function AccessGuard({
  roles,
  permissions,
  positions,
  restrictedRoles,
  restrictedPositions,
  region,
  children,
  fallback = null,
  redirectTo,
}: AccessWrapperProps) {
  const { session, loading, userRole } = useAuth();

  if (loading) return <div>syncing roles...</div>;

  // Not authenticated → route protection
  if (!session && redirectTo) return <Navigate to={redirectTo} replace />;

  if (!userRole) {
    if (redirectTo) return <Navigate to={redirectTo} replace />;
    return <>{fallback}</>;
  }

  /** ------------------------------
   *  Check if user has a national role
   * ------------------------------ */
  const hasNationalRole = National_Roles.some((nationalRole) =>
    userRole.roles.includes(nationalRole),
  );

  /** ------------------------------
   *  1. Allow checks (OR logic)
   *  - National roles bypass AFFILIATE_OFFICER and position requirements
   * ------------------------------ */
  const allowChecks: boolean[] = [];

  if (roles?.length) {
    // Filter out AFFILIATE_OFFICER if user has national role
    const rolesToCheck = hasNationalRole
      ? roles.filter((r) => r !== Roles.AFFILIATE_OFFICER)
      : roles;

    if (rolesToCheck.length > 0) {
      allowChecks.push(rolesToCheck.some((r) => userRole.roles.includes(r)));
    }
  }

  if (permissions?.length) {
    allowChecks.push(permissions.some((p) => userRole.permissions.includes(p)));
  }

  if (positions?.length) {
    // Skip position check entirely if user has national role
    if (!hasNationalRole) {
      allowChecks.push(positions.some((p) => userRole.position.includes(p)));
    }
  }

  if (region !== undefined) {
    const regionRole = `region_${region}_director`;
    allowChecks.push(userRole.roles.includes(regionRole));
  }

  // If nothing is passed, allow by default
  const meetsAllowRule = allowChecks.length === 0 || allowChecks.some(Boolean);

  /** ------------------------------
   *  2. Deny checks (AND NOT)
   *  - Ignore AFFILIATE_OFFICER role if user has national role
   *  - Ignore ALL restricted positions if user has national role
   * ------------------------------ */
  const hasRestrictedRole =
    restrictedRoles?.some((r) => {
      // Skip AFFILIATE_OFFICER restriction if user has national role
      if (r === Roles.AFFILIATE_OFFICER && hasNationalRole) {
        return false;
      }
      return userRole.roles.includes(r);
    }) ?? false;

  // Bypass ALL position restrictions if user has national role
  const hasRestrictedPosition = hasNationalRole
    ? false
    : (userRole.position?.some((pos) => restrictedPositions?.includes(pos)) ??
      false);

  const hasAccess =
    meetsAllowRule && !hasRestrictedRole && !hasRestrictedPosition;

  // Unauthorized → either fallback or redirect
  if (!hasAccess) {
    if (redirectTo) return <Navigate to={redirectTo} replace />;
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
