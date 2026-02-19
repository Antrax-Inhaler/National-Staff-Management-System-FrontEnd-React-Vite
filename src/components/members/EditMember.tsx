import React, { useState } from "react";
import { SquarePen } from "lucide-react";
import Modal from "../Modal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Member } from "../../api/members.ts/fetchMembers";
import { fetchAffiliatesOptions } from "../../api/affiliates/fetchAffiliateOptions";
import { useAuth } from "../../hooks/useAuth";
import InputField from "../ui/InputField";
import SelectField from "../ui/SelectField";

interface MemberProps {
  member: Member;
  requiredAffiliateId?: boolean;
}

export default function EditMember({
  member,
  requiredAffiliateId = false,
}: MemberProps) {
  const [open, setOpen] = useState(false);
  const { session, loading } = useAuth();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [form, setForm] = useState<Member>(member);
  const queryClient = useQueryClient();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: [] })); // clear the error for this field
  };

  const key = form.affiliate_id
    ? `members-${form.affiliate_id}`
    : "'members-all'";

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["affiliates-options"],
    queryFn: () => fetchAffiliatesOptions(session!.access_token),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (member: Member) => editMember(member, session!.access_token),
    onSuccess: () => {
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: [key] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(form); // run the mutation
  };

  const inputClass =
    "mt-1 w-full rounded border border-gray-300 px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500";

  const labelClass = "block text-xs font-medium text-gray-700";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 text-yellow-600 transition rounded-full hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        title="Edit Member Info"
      >
        <SquarePen className="w-4 h-4" />
      </button>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Add New Member"
        className="max-w-3xl min-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5 text-xs text-start">
          {/* Optional Affiliate Selector */}
          {!member.affiliate_id && (
            <section>
              <h3 className="mb-1 text-sm font-semibold text-gray-800">
                Affiliate
              </h3>
              {isLoading ? (
                <p className="text-sm text-gray-500">Loading affiliates...</p>
              ) : isError ? (
                <p className="text-sm text-red-500">
                  Failed to load affiliates.
                </p>
              ) : (
                <select
                  name="affiliate_id"
                  value={form.affiliate_id ?? ""}
                  onChange={handleChange}
                  className={inputClass}
                  required={requiredAffiliateId}
                >
                  <option value="">Select an affiliate</option>
                  {data?.map((affiliate: { id: number; name: string }) => (
                    <option key={affiliate.id} value={affiliate.id}>
                      {affiliate.name}
                    </option>
                  ))}
                </select>
              )}
            </section>
          )}

          {/* Basic Information */}
          <section>
            <h3 className="mb-1 text-sm font-semibold text-gray-800">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <InputField
                label="First Name"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                error={errors.first_name}
                required
              />
              <InputField
                label="Last Name"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                error={errors.last_name}
                required
              />
              <SelectField
                label="Level"
                name="level"
                value={form.level}
                onChange={handleChange}
                options={[
                  { label: "Select Level", value: "" },
                  { label: "Professional", value: "Professional" },
                  { label: "Associate", value: "Associate" },
                ]}
                error={errors.level}
                required
              />
              <SelectField
                label="Status"
                name="status"
                value={form.status}
                onChange={handleChange}
                options={[
                  { label: "Select an Status", value: "" },
                  { label: "Active", value: "Active" },
                  { label: "Inactive", value: "Inactive" },
                ]}
                error={errors.status}
                required
              />
              <SelectField
                label="Employment Status"
                name="employment_status"
                value={form.employment_status}
                onChange={handleChange}
                options={[
                  { label: "Select an Employment Status", value: "" },
                  { label: "Full Time", value: "Full Time" },
                  { label: "Part Time", value: "Part Time" },
                ]}
                error={errors.employment_status}
                required
              />
              <SelectField
                label="Self Identification"
                name="self_id"
                value={form.self_id}
                onChange={handleChange}
                options={[
                  { label: "Select an identification", value: "" },
                  {
                    label: "Asian Or Pacific Islander",
                    value: "Asian Or Pacific Islander",
                  },
                  {
                    label: "Biracial or Multiracial",
                    value: "Biracial or Multiracial",
                  },
                  {
                    label: "Latin (a/o/x) or Hispanic",
                    value: "Latin (a/o/x) or Hispanic",
                  },
                  {
                    label: "MENA (Middle Eastern or North African)",
                    value: "MENA (Middle Eastern or North African)",
                  },
                  {
                    label: "Native American or Alaska Native",
                    value: "Native American or Alaska Native",
                  },
                  { label: "White or Caucasian", value: "White or Caucasian" },
                  {
                    label: "None of the provided options",
                    value: "None of the provided options",
                  },
                  {
                    label: "I choose not to identify",
                    value: "I choose not to identify",
                  },
                ]}
                error={errors.self_id}
                required
              />
            </div>
          </section>

          {/* Address */}
          <section>
            <h3 className="mb-1 text-sm font-semibold text-gray-800">
              Address
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <InputField
                label="Address Line 1"
                name="address_line1"
                value={form.address_line1}
                onChange={handleChange}
                error={errors.address_line1}
                required
              />
              <InputField
                label="Address Line 2"
                name="address_line2"
                value={form.address_line2}
                onChange={handleChange}
                error={errors.address_line2}
              />
              <InputField
                label="City"
                name="city"
                value={form.city}
                onChange={handleChange}
                error={errors.city}
                required
              />
              <InputField
                label="State"
                name="state"
                value={form.state}
                onChange={handleChange}
                error={errors.state}
                required
              />
              <InputField
                label="Zip Code"
                name="zip_code"
                value={form.zip_code}
                onChange={handleChange}
                error={errors.zip_code}
                required
              />
            </div>
          </section>

          {/* Work Contact */}
          <section>
            <h3 className="mb-1 text-sm font-semibold text-gray-800">
              Work Contact
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <InputField
                label="Work Email"
                name="work_email"
                value={form.work_email}
                onChange={handleChange}
                error={errors.work_email}
                required
              />
              <InputField
                label="Work Phone"
                name="work_phone"
                value={form.work_phone}
                onChange={handleChange}
                error={errors.work_phone}
              />
              <InputField
                label="Work Fax"
                name="work_fax"
                value={form.work_fax}
                onChange={handleChange}
                error={errors.work_fax}
              />
            </div>
          </section>

          {/* Home Contact */}
          <section>
            <h3 className="mb-1 text-sm font-semibold text-gray-800">
              Home Contact
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <InputField
                label="Home Email"
                name="home_email"
                value={form.home_email}
                onChange={handleChange}
                error={errors.home_email}
              />
              <InputField
                label="Home Phone"
                name="home_phone"
                value={form.home_phone}
                onChange={handleChange}
                error={errors.home_phone}
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
              {isPending ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

const editMember = async (member: Member, token: string) => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const res = await fetch(`${apiUrl}/api/members/edit-member`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(member),
  });

  if (!res.ok) throw new Error("Failed to create affiliate");
  return res.json(); // the newly created affiliate record
};
