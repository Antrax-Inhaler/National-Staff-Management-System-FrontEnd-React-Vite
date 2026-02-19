import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  Clock,
  X,
  AlertTriangle,
  Loader2,
  User,
} from "lucide-react";
import NavItem from "./NavItem";
import { useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { formatDate } from "../../helpers/formatter";
import RoleGuard from "../../components/RoleGuard";
import {
  getSidebarMenus,
  getUserTitle,
  getPortalTitle,
  formatFieldName,
} from "./SidebarMenu";
import { National_Roles } from "@v1/constants/roles";
import { Positions } from "@v1/constants/positions";

interface ProfileData {
  info: {
    display_name?: string;
    roles?: Array<{ id: number; type: string; name: string }>;
    photo_url?: string | null;
    affiliate_name?: string | null;
  };
  missing_data: {
    missing_count: number;
    completion_percentage: number;
    missing_fields: string[];
    recommended_missing: number;
  };
}

// Clean up any leftover localStorage data from previous versions
const cleanupLegacyLocalStorage = () => {
  // Remove all profile data entries
  const keysToRemove = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (
      key &&
      (key.startsWith("profile_data_") ||
        key.includes("sidebar_") ||
        key.includes("profile_cache"))
    ) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => {
    localStorage.removeItem(key);
    console.log(`Cleaned up legacy localStorage key: ${key}`);
  });

  return keysToRemove.length;
};

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { userRole, session, isLoading: authLoading } = useAuth();
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(true);
  const [tooltipPosition, setTooltipPosition] = useState<number>(0);
  const [tooltipContent, setTooltipContent] = useState<{
    text: string;
    isProfile?: boolean;
  } | null>(null);

  const [profileData, setProfileData] = useState<ProfileData>({
    info: {},
    missing_data: {
      missing_count: 0,
      completion_percentage: 100,
      missing_fields: [],
      recommended_missing: 0,
    },
  });
  const [apiError, setApiError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const location = useLocation();

  const currentUserId = useRef<string | null>(null);
  const abortController = useRef<AbortController | null>(null);

  const missingCount = profileData.missing_data.missing_count || 0;

  const isNational = National_Roles.some((role) =>
    userRole.roles.includes(role),
  );

  const isAffiliateOfficer = [
    Positions.PRESIDENT,
    Positions.SECRETARY,
    Positions.TREASURER,
  ].some((position) => userRole.position.includes(position));

  const national = !isNational && isAffiliateOfficer;

  const sidebarMenus = getSidebarMenus({
    missingDataCount: missingCount,
    national: national,
  });

  // Clean up legacy localStorage on component mount
  useEffect(() => {
    const cleanedCount = cleanupLegacyLocalStorage();
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} legacy localStorage items`);
    }
  }, []);

  // Reset state for new user
  const resetForNewUser = (userId: string) => {
    // NO LOCALSTORAGE USAGE - Just reset state
    currentUserId.current = userId;
    setProfileData({
      info: {},
      missing_data: {
        missing_count: 0,
        completion_percentage: 100,
        missing_fields: [],
        recommended_missing: 0,
      },
    });
    setProfilePhotoUrl(null);
    setPhotoLoading(true);
    setApiError(false);
    setLoading(true);
  };

  // Abort ongoing fetch
  const abortOngoingFetch = () => {
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }
  };

  // Fetch profile data - NO LOCALSTORAGE CACHING
  const fetchProfileData = async () => {
    if (!session?.user?.id) {
      setLoading(false);
      setPhotoLoading(false);
      return;
    }

    const userId = session.user.id;

    // Don't fetch if already loading for same user
    if (currentUserId.current === userId && !isRefreshing && loading) {
      return;
    }

    // Reset for new user
    if (currentUserId.current !== userId) {
      resetForNewUser(userId);
    }

    // Abort previous request
    abortOngoingFetch();

    // Create new abort controller
    abortController.current = new AbortController();
    const signal = abortController.current.signal;

    try {
      setLoading(true);
      setIsRefreshing(true);
      setApiError(false);

      // SIMPLIFIED: Use auth context data directly - NO LOCALSTORAGE CACHE
      const displayName =
        userRole?.display_name || session.user.email?.split("@")[0] || "User";
      const roles = userRole?.roles || [];
      const affiliateName = userRole?.affiliate_name || "";

      const fallbackData: ProfileData = {
        info: {
          display_name: displayName,
          roles: Array.isArray(roles)
            ? roles.map((role, index) => ({
                id: index + 1,
                type: typeof role === "string" ? role.toLowerCase() : "member",
                name: typeof role === "string" ? role : "MEMBER",
              }))
            : [],
          photo_url: null,
          affiliate_name: affiliateName,
        },
        missing_data: {
          missing_count: 0,
          completion_percentage: 100,
          missing_fields: [],
          recommended_missing: 0,
        },
      };

      setProfileData(fallbackData);

      // NO LOCALSTORAGE CACHING
    } catch (error: any) {
      if (error.name === "AbortError") {
        return;
      }

      console.warn("Profile data fetch failed, using fallback:", error);
      setApiError(true);

      // Use basic fallback data
      const fallbackData: ProfileData = {
        info: {
          display_name: userRole?.display_name || "User",
          roles: [],
          photo_url: null,
          affiliate_name: userRole?.affiliate_name || "",
        },
        missing_data: {
          missing_count: 0,
          completion_percentage: 100,
          missing_fields: [],
          recommended_missing: 0,
        },
      };

      setProfileData(fallbackData);
    } finally {
      if (!signal.aborted) {
        setLoading(false);
        setPhotoLoading(false);
        setIsRefreshing(false);
      }
      abortController.current = null;
    }
  };

  // Main useEffect
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!session?.user?.id) {
      setLoading(false);
      setPhotoLoading(false);
      return;
    }

    const userId = session.user.id;

    // Abort previous fetches if user changed
    if (currentUserId.current !== userId) {
      abortOngoingFetch();
    }

    fetchProfileData();

    return () => {
      abortOngoingFetch();
    };
  }, [session?.user?.id, authLoading]);

  // Auth state listener
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (event === "SIGNED_OUT") {
          // Clean up user state but NO localStorage
          currentUserId.current = null;
          setProfileData({
            info: {},
            missing_data: {
              missing_count: 0,
              completion_percentage: 100,
              missing_fields: [],
              recommended_missing: 0,
            },
          });
        } else if (event === "SIGNED_IN" || event === "USER_UPDATED") {
          setTimeout(() => {
            if (newSession?.user?.id) {
              fetchProfileData();
            }
          }, 100);
        }
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    // NO localStorage cleanup needed since we don't store anything
    await supabase.auth.signOut();
    setShowLogoutModal(false);
  };

  const closeLogoutModal = () => {
    setShowLogoutModal(false);
  };

  // Get user initials
  const getUserInitials = () => {
    const displayName =
      profileData.info?.display_name || userRole?.display_name || "User";
    return displayName.charAt(0).toUpperCase() || "U";
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const toggleMobileSidebar = () => {
    setMobileOpen(!mobileOpen);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Helper function to extract role names
  const getRoleNames = (
    roles: Array<{ id: number; type: string; name: string }> | string[],
  ): string[] => {
    if (!roles || roles.length === 0) return [];

    if (typeof roles[0] === "string") {
      return roles as string[];
    }

    return (roles as Array<{ id: number; type: string; name: string }>)
      .map((role) => {
        switch (role.name) {
          case "NATIONAL_ADMINISTRATOR":
            return "Administrator";
          case "EXECUTIVE_COMMITTEE_MEMBER":
            return "Executive Member";
          case "GOVERNING_BOARD_MEMBER":
            return "Board Member";
          default:
            return role.type
              ? role.type.charAt(0).toUpperCase() +
                  role.type.slice(1).toLowerCase()
              : "Member";
        }
      })
      .filter((name) => name);
  };

  // Tooltip handlers
  const handleMouseEnter = (label: string, event: React.MouseEvent) => {
    setTooltipContent({ text: label });
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition(rect.top);
  };

  const handleProfileMouseEnter = (event: React.MouseEvent) => {
    const affiliateName = profileData.info?.affiliate_name || "";
    const displayName =
      profileData.info?.display_name || userRole?.display_name || "User";

    const profileRoles = profileData.info?.roles || [];
    const authRoles = userRole?.roles || [];

    const roleNames = getRoleNames(
      profileRoles.length > 0 ? profileRoles : authRoles,
    );

    let tooltipText = `${displayName}\n${getUserTitle(roleNames, affiliateName)}`;

    if (apiError) {
      tooltipText += `\n\n⚠️ Using basic profile data`;
    } else if (profileData.missing_data.missing_count > 0) {
      const missingCount = profileData.missing_data.missing_count;
      tooltipText += `\n\nProfile: ${profileData.missing_data.completion_percentage}% complete`;
    } else {
      tooltipText += `\n\n✅ Profile complete`;
    }

    setTooltipContent({
      text: tooltipText,
      isProfile: true,
    });

    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition(rect.top);
  };

  const handleOmpMouseEnter = (event: React.MouseEvent) => {
    setTooltipContent({ text: "Powered by Organize My People" });
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition(rect.top);
  };

  const handleMouseLeave = () => {
    setTooltipContent(null);
  };

  const portalTitle = getPortalTitle(userRole?.roles || []);

  const getDisplayRoleNames = (): string[] => {
    const profileRoles = profileData.info?.roles || [];
    const authRoles = userRole?.roles || [];
    return getRoleNames(profileRoles.length > 0 ? profileRoles : authRoles);
  };

  const userTitle = getUserTitle(
    getDisplayRoleNames(),
    profileData.info?.affiliate_name || userRole?.affiliate_name || "",
  );

  const displayName =
    profileData.info?.display_name || userRole?.display_name || "User";

  // Show loading state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center w-64 h-screen bg-white border-r border-gray-200">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg">
            <div className="flex items-center mb-4">
              <AlertTriangle className="mr-2 text-yellow-500" size={24} />
              <h3 className="text-lg font-semibold">Confirm Logout</h3>
            </div>
            <p className="mb-6 text-gray-600">
              Are you sure you want to logout? You'll need to sign in again to
              access your account.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeLogoutModal}
                className="px-4 py-2 font-medium text-gray-600 transition-colors rounded-md hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 font-medium text-white transition-colors bg-red-600 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-opacity-30 backdrop-blur-sm lg:hidden"
          onClick={toggleMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:relative inset-y-0 left-0 z-50
          transform transition-all duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${collapsed ? "w-16" : "w-64"}
          flex flex-col bg-white border-r border-gray-200 h-screen
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-300">
          {!collapsed && (
            <div className="flex items-center transition-opacity duration-300">
              <h2 className="text-lg font-semibold text-gray-900 truncate">
                {portalTitle}
              </h2>
            </div>
          )}
          {collapsed ? (
            <button
              onClick={toggleSidebar}
              className="hidden p-1 transition-colors duration-200 rounded hover:bg-gray-100 lg:block"
              title="Expand sidebar"
            >
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={toggleSidebar}
              className="hidden p-1 transition-colors duration-200 rounded hover:bg-gray-100 lg:block"
              title="Collapse sidebar"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <button
            onClick={toggleMobileSidebar}
            className="p-1 transition-colors duration-200 rounded hover:bg-gray-100 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* User info */}
        <div className="flex items-center p-4 space-x-3 border-b border-gray-300">
          <div className="relative">
            <div className="flex items-center justify-center w-10 h-10 overflow-hidden font-medium text-white bg-indigo-500 rounded-full">
              {profilePhotoUrl && !photoLoading ? (
                <>
                  <img
                    src={profilePhotoUrl}
                    alt="Profile"
                    className="object-cover w-10 h-10 rounded-full"
                    onError={() => setProfilePhotoUrl(null)}
                  />
                  <div className="absolute inset-0 flex items-center justify-center w-10 h-10 font-medium text-white transition-opacity bg-indigo-500 rounded-full opacity-0 hover:opacity-100">
                    {getUserInitials()}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center w-10 h-10 font-medium text-white bg-indigo-500 rounded-full">
                  {getUserInitials()}
                </div>
              )}
            </div>
            {apiError && (
              <div className="absolute top-0 right-0 w-3 h-3 bg-yellow-500 border-2 border-white rounded-full"></div>
            )}
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0 transition-opacity duration-300">
              <div className="font-medium text-gray-900 truncate">
                {displayName}
              </div>
              <div className="text-xs text-gray-500 capitalize truncate">
                {userTitle}
              </div>
              {apiError && (
                <div className="mt-1 text-xs text-yellow-600">
                  Using basic profile data
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 space-y-6 overflow-x-hidden overflow-y-auto">
          <div className="px-2">
            {sidebarMenus.map((menu, index) => (
              <RoleGuard key={index} roles={menu.roles}>
                {!collapsed && menu.title && (
                  <div className="px-2 py-2 text-xs font-semibold tracking-wider text-gray-500 uppercase truncate transition-opacity duration-300">
                    {menu.title}
                  </div>
                )}
                {menu.items && menu.items.length > 0 && (
                  <div className="space-y-1">
                    {menu.items.map((item) => (
                      <RoleGuard
                        key={item.href}
                        roles={item.roles}
                        positions={item?.positions}
                      >
                        <NavItem
                          href={item.href}
                          icon={item.icon}
                          label={item.label}
                          badge={item.badge}
                          active={location.pathname.startsWith(item.href)}
                          collapsed={collapsed}
                          onClick={item.onClick || toggleMobileSidebar}
                        />
                      </RoleGuard>
                    ))}
                  </div>
                )}
              </RoleGuard>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 space-y-2 text-xs text-gray-500 transition-opacity duration-300 border-t border-gray-200">
          {!collapsed && session?.user?.last_sign_in_at && (
            <div className="flex items-center space-x-2">
              <Clock size={14} className="text-gray-400" />
              <span>
                Last login: {formatDate(session.user.last_sign_in_at)}
              </span>
            </div>
          )}

          <div
            className={`flex items-center ${
              collapsed ? "justify-center" : "justify-center gap-2"
            }`}
          >
            {!collapsed ? (
              <>
                <span className="text-xs">Powered by</span>
                <a
                  href="https://organizemypeople.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 transition-opacity hover:opacity-80"
                >
                  <img
                    src="https://organizemypeople.com/wp-content/uploads/2024/07/omp-logo2-1.png"
                    alt="Organize My People"
                    className="w-auto h-3"
                  />
                  <span className="text-xs font-medium text-gray-700">OMP</span>
                </a>
              </>
            ) : (
              <a
                href="https://organizemypeople.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full transition-opacity hover:opacity-80"
              >
                <img
                  src="https://organizemypeople.com/wp-content/uploads/2024/07/omp-logo2-1.png"
                  alt="OMP"
                  className="w-auto h-3"
                />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu button */}
      <button
        onClick={toggleMobileSidebar}
        className="fixed z-40 p-2 transition-colors duration-200 bg-white rounded-md shadow-md top-4 left-4 lg:hidden"
      >
        <Menu size={20} />
      </button>
    </>
  );
}
