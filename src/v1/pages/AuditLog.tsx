import useDebounce from "@/hooks/useDebounce";
import { useIsFetching, useQuery, useQueryClient } from "@tanstack/react-query";
import { affiliate } from "@v1/api/affiliate";
import { audit } from "@v1/api/audit";
import AuditDetails from "@v1/components/audit/AuditDetails";
import { ActionButton } from "@v1/components/ui/ActionButton";
import Badge from "@v1/components/ui/Badge";
import type { Column } from "@v1/components/ui/DataTable";
import DropdownFilter from "@v1/components/ui/DropdownFilter";
import SearchableFilter from "@v1/components/ui/SearchableFilter";
import DataTable from "@v1/components/ui/tables/DataTable";
import { National_Roles } from "@v1/constants/roles";
import { useAuth } from "@v1/contexts/AuthContext";
import type { AuditFilter, AuditLog } from "@v1/types";
import { RefreshCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import HelpButton from "@v1/components/help/HelpButton";

export default function AuditLog() {
  const { userRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = new URLSearchParams(searchParams);

  const [affiliateSearch, setAffiliateSearch] = useState("");
  const debouncedSearch = useDebounce(affiliateSearch, 500);
  const [affiliate_id, setAffiliateId] = useState("");
  const queryClient = useQueryClient();

  const actionOptions = [
    { label: "Created", value: "created" },
    { label: "Updated", value: "updated" },
    { label: "Deleted", value: "deleted" },
    { label: "Archived", value: "archived" },
    { label: "Restored", value: "restored" },
    { label: "Assigned", value: "assigned" },
  ];

  const typeOptions = [
    { label: "Affiliate", value: "affiliate" },
    { label: "Member", value: "member" },
    { label: "National Leader", value: "role" },
    { label: "Affiliate Officer", value: "officer" },
  ];

  const MainFilter: AuditFilter = useMemo(() => {
    const main_filter: AuditFilter = {
      sort_by: searchParams.get("sort_by") ?? "created_at",
      sort_order: searchParams.get("sort_order") ?? "desc",
      per_page: searchParams.get("per_page") ?? "20",
      page: Number(searchParams.get("page") ?? 1),
      search: searchParams.get("search") ?? "",
      audit_type: searchParams.get("type") ?? "",
      action: searchParams.get("action") ?? "",
      affiliate: affiliate_id ?? "",
    };

    return main_filter;
  }, [searchParams, affiliate_id]);

  const queryKey = ["Audit-logs", MainFilter];

  const { data: affiliate_options, isFetching: fetching_affiliate_options } =
    useQuery({
      queryKey: ["affiliates-options-overview"],
      queryFn: () => affiliate.allAffiliates(),
      enabled: National_Roles.some((role) => userRole.roles.includes(role)),
      staleTime: 30 * 60 * 1000,
    });

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);

    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true, // use 12-hour format with AM/PM
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { value } = e.target;
    setAffiliateId(value);
  };

  const isFetching = useIsFetching({ queryKey: queryKey }) > 0;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKey });
  };

  // Get color based on affiliate type
  const getActionVariant = (type?: string) => {
    switch (type) {
      case "created":
        return "success";
      case "updated":
        return "primary";
      case "deleted":
        return "danger";
      case "assigned":
        return "success";
      case "removed":
        return "danger";
      default:
        return "gray";
    }
  };

  const getTypeVariant = (type?: string) => {
    switch (type) {
      case "Affiliate":
        return "success";
      case "Member":
        return "primary";
      case "Role":
        return "warning";
      default:
        return "gray";
    }
  };

  const columns: Column<AuditLog>[] = [
    {
      key: "performed_by",
      header: "User",
      accessor: (row) => (
        <Badge variant="gray">
          <span className="text-xs">{row.performed_by.name}</span>
        </Badge>
      ),
    },
    {
      key: "action",
      header: "Action",
      accessor: (row) => (
        <Badge variant={getActionVariant(row.action)}>
          <span className="text-xs capitalize">{row.action}</span>
        </Badge>
      ),
    },
    {
      key: "type",
      header: "Type",
      accessor: (row) => (
        <Badge variant={getTypeVariant(row.entity.type)}>
          <span className="text-xs capitalize">
            {row.entity.type == "Role"
              ? "National Leader"
              : row.entity.type == "OfficerPosition"
                ? "Affiliate Officer"
                : row.entity.type}
          </span>
        </Badge>
      ),
    },
    {
      key: "record",
      header: "Record",
      accessor: (row) => (
        <span className="text-xs font-semibold">{row.entity.name}</span>
      ),
    },
    {
      key: "timestamp",
      header: "Date & Time",
      accessor: (row) => (
        <div className="flex text-xs ">
          <span>{formatDateTime(row.timestamp)}</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="p-3 bg-white rounded-lg shadow">
        <header>
          <h1 className="text-xl font-bold text-gray-900">Audit Logs</h1>
        </header>

        <div className="flex flex-wrap items-center justify-start gap-4 mt-5 mb-6">
          <SearchableFilter
            label="Affiliate"
            name="affiliate_id"
            value={affiliate_id}
            onChange={handleChange}
            options={[
              ...(fetching_affiliate_options
                ? [{ label: "Fetching Affiliates...", value: "" }]
                : [
                    { label: "Select affiliate", value: "" },
                    ...(affiliate_options
                      ?.filter((m: any) =>
                        m.name
                          .toLowerCase()
                          .includes(affiliateSearch.toLowerCase()),
                      )
                      .map((m: any) => ({
                        label: m.name,
                        value: m.id,
                      })) ?? []),
                  ]),
            ]}
            searchValue={affiliateSearch}
            onSearchChange={setAffiliateSearch}
            loading={fetching_affiliate_options}
          />
          <DropdownFilter
            label="Action"
            name="action"
            value={searchParams.get("action") ?? ""}
            onChange={(e) => {
              const value = e.target.value;

              if (value === null || value === "") {
                params.delete("action");
              } else {
                params.set("action", value);
              }

              setSearchParams(params);
            }}
            options={actionOptions}
            placeholder="All Actions"
          />
          <DropdownFilter
            label="Type"
            name="type"
            value={searchParams.get("type") ?? ""}
            onChange={(e) => {
              const value = e.target.value;

              if (value === null || value === "") {
                params.delete("type");
              } else {
                params.set("type", value);
              }

              setSearchParams(params);
            }}
            options={typeOptions}
            placeholder="All Types"
          />
          <div>
            <div className="mb-1 text-xs font-medium text-transparent select-none">
              Refresh
            </div>
            <ActionButton
              onClick={handleRefresh}
              icon={RefreshCcw}
              iconSize={14}
              label="Refresh"
              loading={isFetching}
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          queryKey={queryKey}
          queryFn={() => audit.all(MainFilter)}
          renderActions={(data) => (
            <div className="flex items-center gap-2">
              <AuditDetails
                type={data.entity.type}
                old_values={data.old_values}
                new_values={data.new_values}
              />
            </div>
          )}
        />
      </div>
      <HelpButton 
  category="Audit Logs" 
  pageTitle="Affiliates Management"
/>
    </div>
  );
}
