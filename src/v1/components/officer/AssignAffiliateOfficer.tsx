import React, { useState } from "react";
import { Plus, UserRoundPen } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import InputField from "../ui/InputField";
import SelectField from "../ui/SelectField";

import { useAuth } from "../../contexts/AuthContext";
import Modal from "../ui/Modal";
import { officers, type positionForm } from "../../api/officer";


interface AddMemberProps {
  affiliateId?: number;
  positionId?: number;
  positionName: string;
}

export type Member = {
  id: number;
  first_name: string;
  last_name: string;
  affiliate_id: number;
};

export default function AssignAffiliateOfficer({
  affiliateId,
  positionId,
  positionName,
}: AddMemberProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState<positionForm>({
    member_id: undefined,
    position_id: positionId,
    start_date: today,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "zip_code" ? Number(value) : value,
    }));

    setErrors((prev) => ({ ...prev, [name]: [] })); // clear the error for this field
  };

  const { data: members, isLoading } = useQuery<Member[]>({
    queryKey: ["no-positions"],
    queryFn: () => officers.getNoPosition(),
    keepPreviousData: true,
  });

  const key = affiliateId
    ? [`officers-${affiliateId}`, affiliateId]
    : ["officers"];

  const { mutate, isPending } = useMutation({
    mutationFn: (member: positionForm) => officers.assignPosition(member),
    onSuccess: (updatedList) => {
      queryClient.setQueryData([...key, 1, 10], updatedList);
      setErrors({});
      setOpen(false);
    },
    onError: async (err: any) => {
      if (err?.errors) {
        setErrors(err.errors);
      } else {
        console.error(err);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(form); // run the mutation
  };

  return (
    <>
      <button
        className="flex items-center justify-center gap-2 p-2 text-center text-yellow-600 transition rounded-md hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        title="Assign Officer"
        onClick={() => setOpen(true)}
      >
        <UserRoundPen size={18} />
      </button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={`Assign Position (${positionName})`}
        className="max-w-3xl min-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5 text-sm text-start">
          <section>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <SelectField
                label="Member"
                name="member_id"
                value={Number(form.member_id)}
                onChange={handleChange}
                options={[
                  ...(isLoading
                    ? [{ label: "Fetching Members...", value: "" }]
                    : [
                        { label: "Select a Member", value: "" },
                        ...(members.map((m) => ({
                          label: `${m.first_name} ${m.last_name}`,
                          value: String(m.id),
                        })) ?? []),
                      ]),
                ]}
                error={errors.employment_status}
                required
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
          </section>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded bg-gray-200 px-3 py-1.5 text-xs hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700"
            >
              {isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
