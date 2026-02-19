import { useQuery, useQueryClient } from "@tanstack/react-query";
import { affiliate } from "@v1/api/affiliate";
import RoleGuard from "@v1/components/RoleGuard";
import { Positions } from "@v1/constants/positions";
import { National_Roles } from "@v1/constants/roles";
import { useAuth } from "@v1/contexts/AuthContext";
import SubSidebar from "@v1/layout/Sidebar/NewSubSidebar";
import NewOverview from "@v1/pages/research/NewOverview";
import { FileText, Folder, LayoutGrid, Loader2 } from "lucide-react";
import { Outlet, useOutlet } from "react-router-dom";

export interface role {
  id: number;
  name: string;
  description: string;
  children?: role[];
}

export default function GovernanceDocuments() {
  const outlet = useOutlet();
  const queryClient = useQueryClient();

  const { userRole } = useAuth();

  const affiliate_list_view =
    National_Roles.some((role) => userRole.roles.includes(role)) ||
    [
      Positions.PRESIDENT,
      Positions.BARGAINING_CHAIR,
      Positions.GRIEVANCE_CHAIR,
    ].some((position) => userRole.position.includes(position));

  const { data: affiliates, isFetching: fetchingAffiliates } = useQuery({
    queryKey: ["affiliates-options-overview"],
    queryFn: () => affiliate.allAffiliates(),
    enabled: affiliate_list_view,
    staleTime: 30 * 60 * 1000,
  });

  const hasCachedData =
    queryClient.getQueryData(["affiliates-options-overview"]) !== undefined;

  const affiliateItems =
    affiliates?.map((affiliate) => ({
      id: `affiliate-${affiliate.id}`,
      label: (
        <div className="flex items-center min-w-0 gap-2">
          <span className="flex items-center min-w-0 gap-2">
            {affiliate.name}
          </span>
        </div>
      ),
      icon: Folder,
      searchableText: affiliate.name,
      path: `affiliate-explorer/${affiliate.public_uid ?? affiliate.id}`,
    })) ?? [];

  const items = [
    {
      id: "overview",
      label: "Overview",
      type: "section",
      searchable: false,
      items: [
        {
          id: "Document-Overview",
          label: "Governance Document Overview",
          icon: LayoutGrid,
          path: "/governance-documents",
        },
      ],
    },
    {
      id: "national-section",
      type: "section",
      searchPlaceholder: "Search affiliates...",
      searchable: true,
      label: "Affiliate Folders",
      items:
        fetchingAffiliates && !hasCachedData
          ? [
              {
                id: "loading",
                path: "/loading",
                label: (
                  <div className="flex items-center gap-2 text-xs">
                    <Loader2 size={14} className="animate-spin" />
                    <span>loading...</span>
                  </div>
                ),
                disabled: true,
              },
            ]
          : affiliateItems,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow shadow-neutral-50">
      {/* MAIN CONTENT - Scrollable */}
      <main className="flex flex-1 w-full min-h-0 overflow-hidden">
        <RoleGuard
          roles={National_Roles}
          positions={[
            Positions.PRESIDENT,
            Positions.BARGAINING_CHAIR,
            Positions.GRIEVANCE_CHAIR,
          ]}
        >
          <SubSidebar
            sidebarClassName="lg:w-[25%] truncate lg:!flex-none"
            title={
              <div className="flex flex-col items-start p-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h1 className="text-lg font-bold leading-snug text-gray-900">
                    Governance Documents
                  </h1>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Manage documents and materials
                </p>
              </div>
            }
            items={items}
          />
        </RoleGuard>

        <div className="flex-1 overflow-y-auto bg-gray-50">
          {outlet ? <Outlet /> : <NewOverview type="governance" />}
        </div>
      </main>
    </div>
  );
}
