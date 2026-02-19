import React, { useState, useEffect } from "react";
import { UserRoundPen } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useAuth } from "@v1/contexts/AuthContext";
import { officers, type positionForm } from "@v1/api/officer";
import useDebounce from "@/hooks/useDebounce";
import Modal from "@v1/components/ui/Modal";
import SearchableSelectField from "@v1/components/ui/SearchableSelectField";
import InputField from "@v1/components/ui/InputField";
import RadioField from "@v1/components/ui/RadioFiled";

interface AddMemberProps {
  positionId?: number;
  positionName: string;
  queryKey: string[];
  type: string;
}

export type Member = {
  id: number;
  first_name: string;
  last_name: string;
  affiliate_id: number;
  member_id?: string;
};

export default function AssignOfficer({
  positionId,
  positionName,
  queryKey,
  type,
}: AddMemberProps) {
  const { uid } = useParams<{ uid?: string }>();
  const [open, setOpen] = useState(false);
  const { userRole } = useAuth();
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const today = new Date().toISOString().split("T")[0];
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState<positionForm>({
    member_id: undefined,
    position_id: positionId,
    start_date: today,
    type: type,
  });
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const affiliate_id = userRole?.affiliate_id ?? undefined;
  const hasAffiliateId = !!(uid || affiliate_id);
  
  const {
    data: usersOptions,
    isLoading: userLoading,
    isFetching: userFetching,
  } = useQuery({
    queryKey: ["user-search", { debouncedSearch, uid, affiliate_id }],
    queryFn: () =>
      officers.userSearch({
        search: debouncedSearch,
        uid: uid,
        id: affiliate_id,
      }),
    enabled: open && hasAffiliateId,
    staleTime: 20 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({ ...prev, [name]: [] }));
  };

  const { mutate, isPending } = useMutation({
    mutationFn: (member: positionForm) => officers.assignPosition(member),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["user-search"],
      });
      queryClient.invalidateQueries({
        queryKey: queryKey,
      });
      setSending(false);
      setForm({
        member_id: undefined,
        position_id: positionId,
        start_date: today,
        type: type,
      });
      setSearch("");
      setErrors({});
      setOpen(false);
    },
    onError: async (err: any) => {
      if (err?.errors) {
        setErrors(err.errors);
      } else {
        console.error(err);
      }
      setSending(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    mutate(form);
  };

  const users =
    usersOptions?.map((user: any) => ({
      label: user.member_id
        ? `${user.member_id} - ${user.first_name} ${user.last_name}`
        : `${user.first_name} ${user.last_name}`,
      value: user.id,
    })) ?? [];

  return (
    <>
      <button
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-green-600 transition-all rounded-md bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-400"
        title="Assign Officer"
        onClick={() => {
          setOpen(true);
        }}
      >
        <UserRoundPen size={18} />
        <span className="hidden sm:inline">Assign</span>
      </button>

      <Modal
        isOpen={open}
        onClose={() => {
          setOpen(false);
          setSearch("");
          setForm({
            member_id: undefined,
            position_id: positionId,
            start_date: today,
            type: type,
          });
        }}
        title={`Assign Position (${positionName})`}
        className="max-w-3xl min-w-2xl"
        disableClose={sending}
      >
        <form onSubmit={handleSubmit} className="space-y-5 text-sm text-start">
          <section>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <SearchableSelectField
                label="Member"
                name="member_id"
                value={form.member_id}
                onChange={handleChange}
                options={users}
                error={errors.member_id}
                required
                searchValue={search}
                onSearchChange={setSearch}
                loading={userFetching}
                placeholder={
                  userFetching ? "Fetching Members" : "Search Members"
                }
                disabled={!hasAffiliateId}
              />
              <InputField
                label="Start Date"
                name="start_date"
                type="date"
                value={form.start_date}
                onChange={handleChange}
                error={errors.start_date}
              />
            </div>
            <div className="p-3 mt-3 border border-gray-200 rounded-lg bg-gray-50">
              <div>
                <label className="block text-xs font-medium text-gray-700">
                  Officer Type
                </label>
              </div>
              <div className="grid gap-3 mt-2 md:grid-cols-2">
                <RadioField
                  label="Primary"
                  name="type"
                  value="primary"
                  checked={form.type === "primary"}
                  onChange={handleChange}
                  error={errors.type}
                />
                <RadioField
                  label="Secondary"
                  name="type"
                  value="secondary"
                  checked={form.type === "secondary"}
                  onChange={handleChange}
                  error={errors.type}
                />
              </div>
            </div>

            {/* Show count of available members */}
            {users.length > 0 && (
              <div className="mt-2 text-xs text-gray-600">
                {users.length} member{users.length !== 1 ? "s" : ""} available
              </div>
            )}
          </section>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              disabled={sending}
              type="button"
              onClick={() => {
                setOpen(false);
                setSearch("");
              }}
              className="rounded bg-gray-200 px-3 py-1.5 text-xs hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !form.member_id || !hasAffiliateId}
              className="rounded bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
