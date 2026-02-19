import React, { useState } from "react";
import Modal from "../Modal";
import { Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import InputField from "../ui/InputField";
import SelectField from "../ui/SelectField";
import { fetchAffiliatesOptions } from "../../api/affiliates/fetchAffiliateOptions";
import { useAuth } from "../../hooks/useAuth";

type MemberForm = {
  first_name: string;
  last_name: string;
  level: string;
  employment_status: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  zip_code: string;
  work_email: string;
  work_phone: string;
  work_fax: string;
  home_email: string;
  home_phone: string;
  self_id: string;
  status: string;
  affiliate_id?: number | undefined;
};

interface AddMemberProps {
  affiliateId?: number; // Optional prop
  requiredAffiliateId?: boolean;
}

export default function AddMember({
  affiliateId,
  requiredAffiliateId = false,
}: AddMemberProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [suprAdmin, setSuperAdmin] = useState(false);
  const { session, loading } = useAuth();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [form, setForm] = useState<MemberForm>({
    first_name: "",
    last_name: "",
    level: "",
    employment_status: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    zip_code: "",
    work_email: "",
    work_phone: "",
    work_fax: "",
    home_email: "",
    home_phone: "",
    self_id: "",
    status: "",
    affiliate_id: affiliateId ?? undefined,
  });

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
  const key = affiliateId ? `members-${affiliateId}` : "members-all";

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["affiliates-options"],
    queryFn: () => fetchAffiliatesOptions(session!.access_token),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (member: MemberForm) =>
      createMember(member, session!.access_token, member.affiliate_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [key] });
      setErrors({});
      setForm({
        first_name: "",
        last_name: "",
        level: "",
        employment_status: "",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        zip_code: "",
        work_email: "",
        work_phone: "",
        work_fax: "",
        home_email: "",
        home_phone: "",
        self_id: "",
        status: "",
        affiliate_id: affiliateId ?? undefined,
      });
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

  const inputClass =
    "mt-1 w-full rounded border border-gray-300 px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500";

  const labelClass = "block text-xs font-medium text-gray-700";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
      >
        <Plus size={16} />
        Add Member
      </button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Add New Member"
        className="max-w-3xl min-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Optional Affiliate Selector */}
          {!affiliateId && (
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
              {isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

const createMember = async (
  member: MemberForm,
  token: string,
  affiliate_id?: number
) => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const query = new URLSearchParams();
  if (affiliate_id) query.set("affiliate", affiliate_id.toString());

  const res = await fetch(
    `${apiUrl}/api/affiliates/members/create-member?${query.toString()}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(member),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    if (data.errors) {
      throw data; // Pass errors to onError
    }
    throw new Error(data.message || "Failed to create member");
  }

  return data;
};
