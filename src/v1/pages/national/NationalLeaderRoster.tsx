import useDebounce from "@/hooks/useDebounce";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { affiliate } from "@v1/api/affiliate";
import { national } from "@v1/api/national";
import AssignUser from "@v1/components/national/AssignUser";
import RoleGuard from "@v1/components/RoleGuard";
import { National_Roles } from "@v1/constants/roles";
import { useAuth } from "@v1/contexts/AuthContext";
import { readableName } from "@v1/helpers/formatter";
import SubSidebar from "@v1/layout/Sidebar/NewSubSidebar";
import {
  ChevronRight,
  FileText,
  Folder,
  LayoutGrid,
  Loader2,
  Search,
  ShieldCheck,
  ShieldUser,
  UserCog,
} from "lucide-react";
import { useState } from "react";
import { Outlet, useOutlet } from "react-router-dom";

export interface role {
  id: number;
  name: string;
  description: string;
  children?: role[];
}

// Skeleton Components
const SidebarSkeleton = () => (
  <div className="p-4">
    {/* Header Skeleton */}
    <div className="flex items-center gap-3 mb-6">
      <div className="w-5 h-5 bg-gray-200 rounded-lg animate-pulse" />
      <div className="space-y-2">
        <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
        <div className="h-4 bg-gray-100 rounded w-24 animate-pulse" />
      </div>
    </div>

    {/* Search Bar Skeleton */}
    <div className="mb-6">
      <div className="h-9 bg-gray-200 rounded-lg animate-pulse" />
    </div>

    {/* Section Header Skeleton */}
    <div className="mb-4">
      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
    </div>

    {/* Menu Items Skeleton */}
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 animate-pulse"
        >
          <div className="w-4 h-4 bg-gray-200 rounded" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
          </div>
          <div className="w-3 h-3 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  </div>
);

const MainContentSkeleton = () => (
  <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
    {/* Icon Skeleton */}
    <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse lg:w-24 lg:h-24" />
    
    {/* Title Skeleton */}
    <div className="space-y-3">
      <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
      <div className="h-6 bg-gray-100 rounded w-36 animate-pulse" />
    </div>

    {/* Assign User Button Skeleton */}
    <div className="w-48 h-10 bg-gray-200 rounded-lg animate-pulse" />
  </div>
);

export default function NationalLeaderRoster() {
  const outlet = useOutlet();
  const queryClient = useQueryClient();

  const [roleSearch, setRoleSearch] = useState("");
  const debouncedSearch = useDebounce(roleSearch, 300);

  const { userRole } = useAuth();
  const isNational = National_Roles.some((role) =>
    userRole.roles.includes(role)
  );

  const { 
    data: roles, 
    isFetching: rolesFetching,
    isLoading: rolesLoading,
    isError: rolesError
  } = useQuery({
    queryKey: ["national-leaders-roles"],
    queryFn: () => national.roles(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Determine if we should show skeleton
  const shouldShowSkeleton = rolesLoading && !queryClient.getQueryData(["national-leaders-roles"]);

  const search = debouncedSearch.toLowerCase();

  const menuItems =
    roles
      ?.filter((role) => role.name.toLowerCase().includes(search))
      .map((item) => ({
        id: item.id.toString(),
        label: readableName(item.name),
        path: `/leader-roster/${item.id}/users`,
        icon: ShieldCheck,
        description: item.description,
        rightIcon: <ChevronRight className="w-4 h-4 text-gray-400" />
      })) ?? [];

  const hasCachedData = queryClient.getQueryData(["national-leaders-roles"]) !== undefined;

  const sidebarItems = [
    {
      id: "national-section",
      type: "section",
      label: "National Roles",
      searchPlaceholder: "Search roles...",
      searchable: true,
      searchValue: roleSearch,
      onSearchChange: (value: string) => setRoleSearch(value),
      items: shouldShowSkeleton 
        ? [{
            id: "loading-1",
            path: "/loading",
            label: <div className="flex items-center gap-2 text-xs text-gray-400">
              <Loader2 size={14} className="animate-spin" />
              <span>Loading roles...</span>
            </div>,
            disabled: true,
          }]
        : menuItems,
      noResultsMessage: search && menuItems.length === 0 
        ? <div className="text-sm text-gray-500 text-center py-3">
            No roles found for "{search}"
          </div>
        : null
    },
  ];

  // If loading with no cache, show full page skeleton
  if (shouldShowSkeleton) {
    return (
      <div className="flex flex-col h-full rounded-lg shadow shadow-neutral-50">
        <main className="flex flex-1 w-full min-h-0 overflow-hidden">
          {/* Skeleton Sidebar */}
          <div className="hidden lg:block w-[20%] border-r border-gray-200 bg-white">
            <SidebarSkeleton />
          </div>
          
          {/* Skeleton Main Content */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <MainContentSkeleton />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full rounded-lg shadow shadow-neutral-50">
      {/* MAIN CONTENT - Scrollable */}
      <main className="flex flex-1 w-full min-h-0 overflow-hidden">
        <RoleGuard roles={National_Roles}>
          <SubSidebar
            sidebarClassName="lg:w-[20%] truncate lg:!flex-none"
            icon={ShieldUser}
            title={
              <div className="flex flex-col items-start p-4">
                <div className="flex items-center gap-3">
                  <ShieldUser className="w-5 h-5 text-blue-600" />
                  <h1 className="text-lg font-bold leading-snug text-gray-900">
                    National Leaders
                  </h1>
                </div>
                {rolesFetching && (
                  <div className="flex items-center gap-2 mt-1 text-xs text-blue-600">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Refreshing...</span>
                  </div>
                )}
              </div>
            }
            items={sidebarItems}
            searchLoading={rolesFetching}
          />
        </RoleGuard>

        <div className="flex-1 overflow-y-auto bg-gray-50">
          {outlet ? (
            <Outlet context={{ roles }} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-6 bg-gray-50">
              {/* Icon */}
              <div className="relative">
                <ShieldUser className="w-16 h-16 text-gray-400 lg:w-24 lg:h-24 transition-all duration-300 hover:scale-105" />
                {rolesFetching && (
                  <div className="absolute -top-2 -right-2">
                    <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full">
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Title */}
              <div className="text-center">
                <h2 className="mb-1 text-2xl font-bold text-gray-800 lg:text-3xl">
                  National Leaders
                </h2>
                {rolesError ? (
                  <p className="text-sm text-red-500">
                    Failed to load roles. Please try again.
                  </p>
                ) : rolesFetching ? (
                  <p className="text-sm text-gray-500 flex items-center gap-2 justify-center">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Loading current data...
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">
                    {roles?.length || 0} roles available
                  </p>
                )}
              </div>

              {/* Assign User Button */}
              {roles && roles.length > 0 ? (
                <div className="mt-4">
                  <AssignUser roles={roles} />
                </div>
              ) : rolesError ? (
                <button
                  onClick={() => queryClient.refetchQueries({ queryKey: ["national-leaders-roles"] })}
                  className="px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                >
                  <Loader2 className="w-4 h-4" />
                  Retry Loading Roles
                </button>
              ) : (
                <div className="text-center text-gray-500">
                  No roles available to assign
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}