import React, { useState } from "react";
import { Trash2, Filter as FilterIcon, Columns3 } from "lucide-react";

import AddMember from "../../../components/members/AddMember";
import { useParams } from "react-router-dom";
import EditMember from "../../../components/members/EditMember";
import SearchInput from "../../../components/ui/SearchInput";
import FilterDropdown, {
  type FilterOptions,
} from "../../../components/ui/FilterDropdown";
import DataTable, { type Column } from "../../../components/ui/DataTable";
import {
  fetchMembers,
  type Member,
} from "../../../api/members.ts/fetchMembers";
import { useAuth } from "../../../hooks/useAuth";

const FILTER_OPTIONS: FilterOptions = {
  position: ["Member", "Officer"],
  employment_status: ["Full Time", "Part Time"],
  level: ["Associate", "Senior"],
};

type MemberFilters = {
  position: string[];
  employment_status: string[];
  level: string[];
};

const DEFAULT_COLUMNS = [
  "member",
  "affiliate",
  "position",
  "level",
  "employment_status",
  "city",
  "email",
  "work_email",
  "work_phone",
  "updated_at",
];

const COLUMN_OPTIONS = {
  columns: [
    "member",
    "affiliate",
    "position",
    "level",
    "employment_status",
    "city",
    "email",
    "work_phone",
    "work_email",
    "home_email",
    "home_phone",
    "self_identity",
    "non_nso",
    "updated_at",
  ],
};

export default function MemeberManagement() {
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [filters, setFilters] = useState<MemberFilters>({
    position: [],
    employment_status: [],
    level: [],
  });
  const [visibleCols, setVisibleCols] = useState<string[]>(DEFAULT_COLUMNS);
  const { session, loading } = useAuth();

  const columns: Column<Member>[] = [
    {
      key: "member",
      header: "Member",
      accessor: (row) => (
        <span className="font-bold">
          {row.first_name} {row.last_name}
        </span>
      ),
    },
    {
      key: "affiliate",
      header: "Affiliate",
      accessor: (row) => row.affiliate?.name,
    },
    {
      key: "position",
      header: "Position",
      accessor: (row) => row.current_position?.position.name,
    },
    {
      key: "level",
      header: "Level",
      accessor: (row) => row.level,
    },
    {
      key: "employment_status",
      header: "Employment Status",
      accessor: (row) => row.employment_status,
    },
    {
      key: "city",
      header: "City",
      accessor: (row) => row.city,
    },
    {
      key: "work_email",
      header: "Work Email",
      accessor: (row) => row.work_email,
    },
    {
      key: "work_phone",
      header: "Work Phone",
      accessor: (row) => row.work_phone,
    },
    {
      key: "home_email",
      header: "Home Email",
      accessor: (row) => row.home_email,
    },
    {
      key: "home_phone",
      header: "Home Phone",
      accessor: (row) => row.home_phone,
    },
    {
      key: "self_id",
      header: "Ethnicity",
      accessor: (row) => row.self_id,
    },
    {
      key: "non_nso",
      header: "Non NSO",
      accessor: (row) => {
        return <span>{row.non_ORG ? "Yes" : "No"}</span>;
      },
    },
  ];

  return (
    <div className="relative p-5">
      <div className="relative flex flex-wrap items-center gap-4 mb-3">
        <SearchInput
          placeholder="Search Member"
          value={search}
          onChange={setSearch}
          onEnter={setTerm}
        />
        <FilterDropdown
          options={FILTER_OPTIONS}
          value={filters}
          onApply={(selected) => {
            setFilters(selected);
          }}
          onReset={() =>
            setFilters({ position: [], employment_status: [], level: [] })
          }
          buttonLabel="Filters"
        />
        <FilterDropdown
          options={COLUMN_OPTIONS}
          defaultValue={{ columns: DEFAULT_COLUMNS }}
          value={{ columns: visibleCols }}
          onApply={(selected) => setVisibleCols(selected.columns)}
          onReset={() => setVisibleCols(DEFAULT_COLUMNS)}
          buttonLabel="Columns"
          buttonIcon={<Columns3 size={16} />}
        />
        <AddMember requiredAffiliateId={true} />
      </div>
      <DataTable
        columns={columns}
        visibleColumns={visibleCols}
        queryKey={[`members-all`, term, filters]}
        queryFn={(page, perPage) =>
          fetchMembers({
            perPage,
            page,
            search: term,
            filters,
            token: session!.access_token,
          })
        }
        pagination={true}
        massSelection={false}
        renderActions={(affiliate) => (
          <div className="flex items-center gap-2 ml-2">
            <EditMember member={affiliate} />
            <button
              className="p-2 text-red-600 transition bg-red-100 rounded-full hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-400"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      />
    </div>
  );
}
