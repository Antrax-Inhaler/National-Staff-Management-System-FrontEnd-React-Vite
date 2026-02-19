import { useState } from "react";
import { useDebounce } from "use-debounce";
import { Plus, Filter, Eye, Pencil, Download } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import toast from 'react-hot-toast';
import Papa from 'papaparse';

import DataTable from "./../../../ui/DataTable";
import type { Column, Paginated } from "./../../../ui/DataTable";
import SearchInput from "./../../../ui/SearchInput";
import SelectField from "./../../../ui/SelectField";
import Badge from "./../../../ui/Badge";
import Modal from "./../../../ui/Modal";

import MemberForm from "./MemberForm";
import MemberDetails from "./MemberDetails";
import { affiliatesAPI, type Member } from "../../../../api/affiliates";

export default function MemberList() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [employmentStatusFilter, setEmploymentStatusFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "details" | "create" | "edit">("list");
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const columns: Column<Member>[] = [
    { key: "member_id", header: "Member ID", accessor: "member_id" },
    {
      key: "name",
      header: "Name",
      accessor: (member) => `${member.first_name} ${member.last_name}`,
    },
    {
      key: "level",
      header: "Level",
      accessor: (member) => (
        <Badge variant={member.level === "Professional" ? "primary" : "success"}>
          {member.level}
        </Badge>
      ),
    },
    {
      key: "employment_status",
      header: "Status",
      accessor: (member) => (
        <Badge variant={member.employment_status === "Full Time" ? "warning" : "gray"}>
          {member.employment_status}
        </Badge>
      ),
    },
    { key: "work_email", header: "Work Email", accessor: "work_email" },
    {
      key: "actions",
      header: "Actions",
      accessor: (member) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedMember(member);
              setViewMode("details");
            }}
            className="p-1 text-blue-600 rounded-lg hover:text-blue-800 hover:bg-gray-100"
          >
            <Eye size={18} />
          </button>
          <button
            onClick={() => {
              setEditingMember(member);
              setViewMode("edit");
            }}
            className="p-1 text-green-600 rounded-lg hover:text-green-800 hover:bg-gray-100"
          >
            <Pencil size={18} />
          </button>
        </div>
      ),
    },
  ];

  const fetchMembers = async (
    page: number,
    perPage: number | "All"
  ): Promise<Paginated<Member>> => {
    try {
      const result = await affiliatesAPI.getMembers({
        search: debouncedSearch,
        employment_status: employmentStatusFilter,
        level: levelFilter,
        page,
        per_page: perPage === "All" ? 1000 : perPage,
      });

      return {
        items: result.data,
        current_page: result.meta.current_page,
        last_page: result.meta.last_page,
        per_page: result.meta.per_page,
        total: result.meta.total,
      };
    } catch (err: any) {
      setError(err.message || "Failed to load members");
      toast.error(err.message || "Failed to load members");
      return {
        items: [],
        current_page: 1,
        last_page: 1,
        per_page: typeof perPage === "number" ? perPage : 20,
        total: 0,
      };
    } finally {
      setLoading(false);
    }
  };

  // New function to fetch all members for export
  const fetchAllMembersForExport = async (): Promise<Member[]> => {
    try {
      const result = await affiliatesAPI.getMembers({
        search: debouncedSearch,
        employment_status: employmentStatusFilter,
        level: levelFilter,
        per_page: 10000,
      });
      return result.data;
    } catch (err: any) {
      toast.error(err.message || "Failed to export members");
      return [];
    }
  };

  const exportToCSV = async () => {
    setExportLoading(true);
    try {
      const members = await fetchAllMembersForExport();
      
      if (members.length === 0) {
        toast.error("No members to export");
        return;
      }

      const csvData = members.map(member => ({
        'Member ID': member.member_id,
        'First Name': member.first_name,
        'Last Name': member.last_name,
        'Level': member.level,
        'Employment Status': member.employment_status,
        'Work Email': member.work_email || '',
        'Work Phone': member.work_phone || '',
        'Status': member.status,
      }));

      const csv = Papa.unparse(csvData);
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `members-export-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Exported ${members.length} members successfully`);
    } catch (err: any) {
      toast.error(err.message || "Failed to export members");
    } finally {
      setExportLoading(false);
    }
  };

  const refreshTable = () => {
    queryClient.invalidateQueries({
      queryKey: ["members", debouncedSearch, employmentStatusFilter, levelFilter],
    });
  };

  const handleCreateMember = () => setViewMode("create");
  const handleBackToList = () => {
    setViewMode("list");
    setSelectedMember(null);
    setEditingMember(null);
  };
  const handleMemberCreated = () => {
    setViewMode("list");
    refreshTable();
    toast.success("Member added successfully!");
  };
  const handleMemberUpdated = () => {
    setViewMode("list");
    setEditingMember(null);
    refreshTable();
    toast.success("Member updated successfully!");
  };

  return (
    <div className="p-6">
      {viewMode === "list" && (
        <>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Members Directory</h1>
              <p className="mt-1 text-gray-600">Manage your affiliate members</p>
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 mb-6 text-red-700 border border-red-200 rounded-lg bg-red-50">
              {error}
            </div>
          )}

          {/* Card with Search, Filters & Table */}
          <div className="p-6 bg-white border border-gray-200 rounded-lg">
            {/* Top Row: Search + Filters + Add button */}
            <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <SearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Search by name or ID..."
                  className="w-full"
                />
              </div>

              <div className="flex items-center gap-3">
                {/* Export Button */}
                <button
                  disabled={exportLoading}
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed"
                >
                  <Download size={18} />
                  {exportLoading ? "Exporting..." : "Export"}
                </button>

                {/* Filters Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                  >
                    <Filter size={18} />
                    Filters
                  </button>
                  {showFilters && (
                    <div className="absolute right-0 z-10 w-64 p-4 mt-2 bg-white border rounded-lg shadow-lg">
                      <SelectField
                        label="Employment Status"
                        name="employment_status"
                        value={employmentStatusFilter}
                        onChange={(e) => setEmploymentStatusFilter(e.target.value)}
                        options={[
                          { label: "All Statuses", value: "" },
                          { label: "Full Time", value: "Full Time" },
                          { label: "Part Time", value: "Part Time" },
                        ]}
                      />

                      <SelectField
                        label="Level"
                        name="level"
                        value={levelFilter}
                        onChange={(e) => setLevelFilter(e.target.value)}
                        options={[
                          { label: "All Levels", value: "" },
                          { label: "Associate", value: "Associate" },
                          { label: "Professional", value: "Professional" },
                        ]}
                      />

                      <button
                        onClick={() => {
                          setEmploymentStatusFilter("");
                          setLevelFilter("");
                          toast("Filters cleared", { icon: "🧹" });
                        }}
                        className="w-full px-3 py-2 mt-3 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                      >
                        Clear Filters
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleCreateMember}
                  className="flex items-center gap-2 px-4 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  <Plus size={20} />
                  Add Member
                </button>
              </div>
            </div>

            {/* DataTable */}
            <DataTable
              columns={columns}
              queryFn={fetchMembers}
              queryKey={["members", debouncedSearch, employmentStatusFilter, levelFilter]}
              pagination={true}
              perPageOptions={[10, 25, 50, 100, "All"]}
            />
          </div>
        </>
      )}

      {/* Details Modal - Wider */}
      <Modal
        isOpen={viewMode === "details"}
        onClose={handleBackToList}
        title="Member Details"
        className="max-w-6xl" // Increased width
      >
        {selectedMember && (
          <MemberDetails member={selectedMember} onBack={handleBackToList} mode="view" />
        )}
      </Modal>

      {/* Create Modal - Wider */}
      <Modal
        isOpen={viewMode === "create"}
        onClose={handleBackToList}
        title="Add New Member"
        className="max-w-4xl" // Increased width
      >
        <MemberForm onCancel={handleBackToList} onSuccess={handleMemberCreated} mode="create" />
      </Modal>

      {/* Edit Modal - Wider */}
      <Modal
        isOpen={viewMode === "edit"}
        onClose={handleBackToList}
        title="Edit Member"
        className="max-w-4xl" // Increased width
      >
        {editingMember && (
          <MemberForm
            member={editingMember}
            onCancel={handleBackToList}
            onSuccess={handleMemberUpdated}
            mode="edit"
          />
        )}
      </Modal>
    </div>
  );
}