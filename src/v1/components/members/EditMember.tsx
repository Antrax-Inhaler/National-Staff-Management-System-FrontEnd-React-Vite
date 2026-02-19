import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { officers, type positionForm } from "@v1/api/officer";
import ConfirmationPopUp from "@v1/components/ui/ConfirmationPopUp";
import ObjectSelectField from "@v1/components/ui/ObjectSelectField";
import {
  Briefcase,
  Camera,
  LoaderCircle,
  RefreshCw,
  Shield,
  SquarePen,
  User,
  UserCheck,
  UserRoundPen,
  UserRoundX,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import useDebounce from "../../../hooks/useDebounce";
import { affiliate } from "../../api/affiliate";
import { members } from "../../api/member";
import { Committees, Roles } from "../../constants/roles";
import { useAuth } from "../../contexts/AuthContext";
import type { Member } from "../../pages/Members";
import AlertMessage from "../ui/AlertMessage";
import InputField from "../ui/InputField";
import Modal from "../ui/Modal";
import SearchableSelectField from "../ui/SearchableSelectField";
import SelectField from "../ui/SelectField";
import StateSelect from "../ui/StateCitySelect/StateSelect";
import type { City, State } from "../ui/StateCitySelect/types";

interface MemberProps {
  member: Member;
  queryKey: any[];
  requiredAffiliateId?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  mode?: "button" | "modal";
}

type OfficerOption = {
  id: number;
  label: string;
  primary: boolean;
};

export default function EditMember({
  member,
  queryKey,
  requiredAffiliateId = false,
  isOpen: externalIsOpen = false,
  onClose: externalOnClose,
  mode = "button",
}: MemberProps) {
  const [open, setOpen] = useState(false);
  const { session, loading, userRole } = useAuth();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [succes, setSuccessMessage] = useState<string>("");
  const [generalError, setGeneralError] = useState<string>("");
  const [form, setForm] = useState<Member>(member);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [affiliateSearch, setAffiliateSearch] = useState("");
  const debouncedSearch = useDebounce(affiliateSearch, 500);
  const [selectedTab, setSelectedTab] = useState("info");
  const [selectedPosition, setSelectedPosition] = useState(undefined);
  const [removeId, setRemoveId] = useState<number | null>();
  const [roleSuccess, setRoleSuccess] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Handle external open/close state
  useEffect(() => {
    if (mode === "modal") {
      setOpen(externalIsOpen);
      if (externalIsOpen) {
        setForm(member);
        resetForm();
      }
    }
  }, [externalIsOpen, member, mode]);

  const getUserInitials = () => {
    const firstInitial = form.first_name?.charAt(0) || "";
    const lastInitial = form.last_name?.charAt(0) || "";
    return `${firstInitial}${lastInitial}`.toUpperCase() || "U";
  };

  const id = member?.affiliate?.public_uid;

  const privilegedRoles = [
    ...Committees.NSO,
    ...Committees.REGIONAL_DIRECTORS,
    ...Committees.EXECUTIVE_COMMITTEE,
  ];

  const affiliateKey = userRole.roles.some((role) =>
    privilegedRoles.includes(role),
  )
    ? "privileged"
    : "normal";

  const { data: affiliate_roles, isLoading: affiliate_roles_loading } =
    useQuery({
      queryKey: [`officers-${id}`],
      queryFn: () => officers.affiliateOfficers(id, 1, "All"),
      enabled: open && member.affiliate_id !== null,
      staleTime: 40 * 60 * 1000,
    });

  const { mutate: AssignOfficer, isPending: assigning_officer } = useMutation({
    mutationFn: (member: positionForm) => officers.assignPosition(member),
    onSuccess: (updatedList) => {
      queryClient.invalidateQueries({ queryKey: [`officers-${id}`] });
      queryClient.invalidateQueries({ queryKey: [`officers`] });
      queryClient.invalidateQueries({ queryKey: queryKey });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      setSelectedPosition(undefined);
      setRoleSuccess("Position successfully assigned");
    },
    onError: async (err: any) => {
      setRoleError("Something went wrong. Please try again later");
      if (err?.errors) {
        setErrors(err.errors);
      } else {
        console.error(err);
      }
    },
  });

  const { mutate: removePosition, isPending: removing_position } = useMutation({
    mutationFn: (id: number) => officers.openPosition(id, 10),
    onSuccess: (updatedList) => {
      setRoleSuccess("Successfully removed the position");
      queryClient.invalidateQueries({ queryKey: [`officers-${id}`] });
      queryClient.invalidateQueries({ queryKey: [`officers`] });
      queryClient.invalidateQueries({ queryKey: queryKey });
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
    onError: async (err: any) => {
      setRoleError("Something went wrong. Please try again later");
      if (err?.errors) {
        setErrors(err.errors);
      } else {
        console.error(err);
      }
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: [`officers-${id}`] });
  };

  const {
    data: affiliates,
    isLoading,
    isError,
    isFetching: fetchingAffiliates,
  } = useQuery({
    queryKey: ["affiliates-options", debouncedSearch],
    queryFn: () => affiliate.options(debouncedSearch),
    enabled: [
      Roles.NATIONAL_ADMINISTRATOR,
      ...Committees.EXECUTIVE_COMMITTEE,
    ].some((role) => userRole.roles.includes(role)),
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
    setGeneralError("");
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast.error("Please select a valid image file (JPEG, PNG, GIF, WEBP)");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      setProfilePhoto(file);
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
    }
  };

  const handleRemovePhoto = () => {
    setProfilePhoto(null);
    setPhotoPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (photoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }
  };

  const key = form.affiliate_id ? `members-${form.affiliate_id}` : "members";

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: Member & { profile_photo?: File }) =>
      members.update(payload),
    onSuccess: () => {
      setSuccessMessage("Member Updated");
      queryClient.invalidateQueries({ queryKey: queryKey });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      setErrors({});
      setGeneralError("");
      setProfilePhoto(null);
      setPhotoPreview("");
      toast.success("Member updated successfully");
      
      // Close modal after successful update
      setTimeout(() => {
        handleClose();
      }, 1000);
    },
    onError: async (err: any) => {
      console.error("Edit member error:", err);

      if (err?.errors) {
        setErrors(err.errors);
        const errorMessages = Object.values(err.errors).flat() as string[];
        if (errorMessages.length > 0) {
          setGeneralError(`${errorMessages.join(", ")}`);
        }
      } else if (err?.message) {
        setGeneralError(err.message);
      } else {
        setGeneralError("An unexpected error occurred. Please try again.");
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError("");

    try {
      const payload = {
        ...form,
        profile_photo: profilePhoto || undefined,
      };

      mutate(payload);
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  const handleStateChange = (state: State) => {
    setForm((prev) => (prev ? { ...prev, ["state"]: state.name } : prev));
    setForm((prev) => (prev ? { ...prev, ["state_id"]: state.id } : prev));

    setErrors((prev) => ({
      ...prev,
      state: [],
      state_id: [],
    }));
    setGeneralError("");
  };

  const handleCityChange = (city: City) => {
    setForm((prev) => (prev ? { ...prev, ["city"]: city.name } : prev));

    setErrors((prev) => ({
      ...prev,
      city: [],
    }));
    setGeneralError("");
  };

  const resetForm = () => {
    setForm(member);
    setErrors({});
    setGeneralError("");
    setProfilePhoto(null);
    setPhotoPreview("");
    setSelectedTab("info");
    setRoleSuccess(null);
    setRoleError(null);

    if (photoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }
  };

  const handleClose = () => {
    if (mode === "button") {
      setOpen(false);
    }
    resetForm();
    
    if (externalOnClose) {
      externalOnClose();
    }
  };

  const handleOpen = () => {
    if (mode === "button") {
      setOpen(true);
    }
  };

  // UPDATED: Changed label to "Ethnicity" and updated options
  const selfIdOptions = [
    { label: "Asian Or Pacific Islander", value: "Asian Or Pacific Islander" },
    { label: "Biracial or Multiracial", value: "Biracial or Multiracial" },
    { label: "Latin (a/o/x) or Hispanic", value: "Latin (a/o/x) or Hispanic" },
    {
      label: "MENA (Middle Eastern or North African)",
      value: "MENA (Middle Eastern or North African)",
    },
    {
      label: "Native American or Alaska Native",
      value: "Native American or Alaska Native",
    },
    { label: "White or Caucasian", value: "White or Caucasian" },
    { label: "Black or African American", value: "Black or African American" },
    {
      label: "None of the provided options",
      value: "None of the provided options",
    },
    { label: "I choose not to identify", value: "I choose not to identify" },
  ];

  const PRIORITY_SECOND = "I choose not to identify";
  const PRIORITY_LAST = "None of the provided options";

  const sortedSelfIdOptions = useMemo(() => {
    const [defaultOption, ...rest] = selfIdOptions;

    let second = null;
    let last = null;
    const middle = [];

    for (const opt of rest) {
      if (opt.value === PRIORITY_SECOND) second = opt;
      else if (opt.value === PRIORITY_LAST) last = opt;
      else middle.push(opt);
    }

    middle.sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
    );

    return [defaultOption, second, ...middle, last].filter(Boolean);
  }, []);

  const genderOptions = [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
    { label: "Non-binary", value: "non-binary" },
    { label: "None of these choices", value: "none_of_these_choices" },
    { label: "Prefer not to disclose", value: "prefer_not_to_disclose" },
  ];

  const tabs = member.affiliate_id
    ? [
        { id: "info", label: "Member Information", icon: User },
        { id: "roles", label: "Roles & Permissions", icon: Briefcase },
      ]
    : [{ id: "info", label: "Member Information", icon: User }];

  const positionIds =
    member?.current_positions?.map((pos) => pos.position_id) ?? [];

  const availablePositions = (affiliate_roles?.items ?? []).flatMap(
    (position) => {
      if (positionIds.includes(position.id)) return [];

      const options: {
        label: string;
        value: { position_id: number; type: string; member_id: number };
      }[] = [];

      // Add primary if vacant
      if (!position.primary_officer) {
        options.push({
          label: `${position.name} (Primary)`,
          value: {
            position_id: position.id,
            type: "primary",
            member_id: member.id,
          },
        });
      }

      // Add secondary if vacant
      if (!position.secondary_officer) {
        options.push({
          label: `${position.name} (Secondary)`,
          value: {
            position_id: position.id,
            type: "secondary",
            member_id: member.id,
          },
        });
      }

      return options;
    },
  );

  // Render button if in button mode, otherwise just render modal
  return (
    <>
      {mode === "button" && (
        <button
          onClick={handleOpen}
          className="p-1 text-gray-600 transition-colors rounded hover:bg-blue-50 hover:text-blue-600"
          title="Edit Member Info"
        >
          <SquarePen className="w-3 h-3" />
        </button>
      )}
      
      <Modal
        disableClose={assigning_officer || removing_position || isPending}
        isOpen={open}
        onClose={handleClose}
        title="Edit Member"
        className="max-w-3xl min-w-2xl"
      >
        <div className="sticky flex mb-2 bg-white border-b -top-4 border-slate-200 z-[99999]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all ${
                  selectedTab === tab.id
                    ? "text-blue-700"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {selectedTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            );
          })}
        </div>

        {generalError && <AlertMessage type="error" message={generalError} />}
        {succes && <AlertMessage type="success" message={succes} />}
        {selectedTab === "info" && (
          <form
            onSubmit={handleSubmit}
            className="mt-5 space-y-5 text-xs text-start"
          >
            <section>
              <h3 className="flex items-center gap-2 mb-1 text-sm font-semibold text-gray-800">
                <Camera className="w-4 h-4 text-gray-600" />
                Profile Photo (Optional)
              </h3>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50">
                <div className="relative">
                  <div className="flex items-center justify-center w-16 h-16 overflow-hidden bg-gray-200 rounded-full">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Profile preview"
                        className="object-cover w-16 h-16 rounded-full"
                      />
                    ) : member.photo_signed_url ? (
                      <img
                        src={member.photo_signed_url}
                        alt="Profile"
                        className="object-cover w-16 h-16 rounded-full"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : null}

                    <div
                      className={`flex items-center justify-center w-16 h-16 font-medium text-white bg-indigo-500 rounded-full ${
                        photoPreview || member.photo_signed_url ? "hidden" : ""
                      }`}
                    >
                      {getUserInitials()}
                    </div>
                  </div>
                  {(photoPreview || member.profile_photo_url) && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute p-1 text-white bg-red-500 rounded-full -top-1 -right-1 hover:bg-red-600"
                      title="Remove photo"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    JPG, PNG or GIF (Max 5MB)
                  </p>
                </div>
              </div>
            </section>

            {!member.affiliate_id && (
              <section>
                <h3 className="mb-1 text-sm font-semibold text-gray-800">
                  Affiliate Information
                </h3>
                <SearchableSelectField
                  label="Affiliate"
                  name="affiliate_id"
                  value={form.affiliate_id}
                  onChange={handleChange}
                  options={[
                    ...(fetchingAffiliates
                      ? [{ label: "Fetching Affiliates...", value: "" }]
                      : [
                          { label: "Select affiliate", value: "" },
                          ...(affiliates?.map((m) => ({
                            label: `${m.name}`,
                            value: m.id,
                          })) ?? []),
                        ]),
                  ]}
                  error={errors.affiliate_id}
                  required
                  searchValue={affiliateSearch}
                  onSearchChange={setAffiliateSearch}
                  loading={isLoading || fetchingAffiliates}
                />
              </section>
            )}
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
                {/* TEMPORARILY NON-REQUIRED */}
                <InputField
                  label="Date of Birth"
                  name="date_of_birth"
                  value={form.date_of_birth ?? ""}
                  onChange={handleChange}
                  error={errors.date_of_birth}
                  type="date"
                />
                {/* TEMPORARILY NON-REQUIRED */}
                <InputField
                  label="Date of Hire"
                  name="date_of_hire"
                  value={form.date_of_hire ?? ""}
                  onChange={handleChange}
                  error={errors.date_of_hire}
                  type="date"
                />
                {/* UPDATED: New gender options - TEMPORARILY NON-REQUIRED */}
                <SelectField
                  label="Gender"
                  name="gender"
                  value={form.gender ?? ""}
                  onChange={handleChange}
                  options={genderOptions}
                  error={errors.gender}
                />
                <SelectField
                  label="Level"
                  name="level"
                  value={form.level}
                  onChange={handleChange}
                  options={[
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
                    { label: "Full Time", value: "Full Time" },
                    { label: "Part Time", value: "Part Time" },
                  ]}
                  error={errors.employment_status}
                  required
                />
                {/* UPDATED: Changed label to "Ethnicity" - TEMPORARILY NON-REQUIRED */}
                <SelectField
                  label="Ethnicity"
                  name="self_id"
                  value={form.self_id}
                  onChange={handleChange}
                  options={sortedSelfIdOptions}
                  error={errors.self_id}
                />
              </div>
            </section>

            <section>
              <h3 className="mb-1 text-sm font-semibold text-gray-800">
                Address
              </h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <InputField
                  label="Address Line 1"
                  name="address_line1"
                  value={form.address_line1 ?? ""}
                  onChange={handleChange}
                  error={errors.address_line1}
                  required
                />
                <InputField
                  label="Address Line 2"
                  name="address_line2"
                  value={form.address_line2 ?? ""}
                  onChange={handleChange}
                  error={errors.address_line2}
                />
                <div className="w-full">
                  <div className="w-full text-xs rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                    <label className="block mb-1 text-xs font-medium text-gray-700">
                      State
                      <span className="text-red-700">*</span>
                    </label>
                    <div
                      onMouseDown={(e) => e.stopPropagation()}
                      className="relative"
                    >
                      <StateSelect
                        inputClassName={`!border-none !outline-none !p-0 ${
                          errors.state || errors.state_id
                            ? "!border-red-300 !ring-red-300"
                            : ""
                        }`}
                        containerClassName="!p-0"
                        countryid={233}
                        placeHolder="Select State"
                        name="state"
                        defaultValue={form?.state ?? ""}
                        defaultStateId={form?.state_id ?? undefined}
                        onChange={handleStateChange}
                        required
                      />
                    </div>
                    {errors.state && errors.state.length > 0 && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.state[0]}
                      </p>
                    )}
                    {errors.state_id && errors.state_id.length > 0 && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.state_id[0]}
                      </p>
                    )}
                  </div>
                </div>
                <InputField
                  label="City"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  error={errors.city}
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

            <section>
              <h3 className="mb-1 text-sm font-semibold text-gray-800">
                Contact Information
              </h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <InputField
                  label="Personal Email"
                  name="home_email"
                  value={form.home_email || form.work_email || ""}
                  onChange={handleChange}
                  error={errors.home_email}
                  type="email"
                  placeholder="No work email addresses"
                  required
                />
                <InputField
                  label="Mobile Phone"
                  name="mobile_phone"
                  value={form.mobile_phone ?? ""}
                  onChange={handleChange}
                  error={errors.mobile_phone}
                  type="tel"
                  required
                />
                <InputField
                  label="Home Phone"
                  name="home_phone"
                  value={form.home_phone ?? ""}
                  onChange={handleChange}
                  error={errors.home_phone}
                  type="tel"
                />
              </div>
            </section>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isPending ? "Updating..." : "Update Member"}
              </button>
            </div>
          </form>
        )}
        {selectedTab == "roles" && (
          <div className="flex flex-col items-center justify-center gap-2 p-4 text-slate-400">
            <section className="space-y-4"></section>
            {roleSuccess && (
              <AlertMessage type="success" message={roleSuccess} />
            )}
            {roleError && <AlertMessage type="error" message={roleError} />}
            <section className="w-full space-y-3">
              {/* Section Header */}
              <div className="pb-2 border-b border-gray-200">
                <h3 className="text-sm font-semibold tracking-wide text-gray-900 uppercase">
                  Affiliate Positions
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Currently assigned organizational roles and responsibilities
                </p>
              </div>

              {/* Positions List */}
              {(member?.current_positions?.length ?? 0) > 0 ? (
                <div className="space-y-2">
                  {member.current_positions?.map((position) => {
                    const isPrimary = position.is_primary;

                    return (
                      <div
                        key={position.id}
                        className="flex items-center justify-between px-4 py-3 transition-colors border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-3">
                          {/* Position Icon */}
                          <div
                            className={`flex items-center justify-center w-9 h-9 rounded-lg ${
                              isPrimary
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {isPrimary ? (
                              <Shield size={18} />
                            ) : (
                              <UserCheck size={18} />
                            )}
                          </div>

                          {/* Position Details */}
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {position.position.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {isPrimary
                                ? "Primary Officer"
                                : "Secondary Officer"}
                            </p>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <ConfirmationPopUp
                          message={`Are you sure you want to remove ${
                            member.first_name
                          } ${member.last_name} as ${position.position.name} (${
                            isPrimary ? "Primary" : "Secondary"
                          } Officer)? This action will immediately revoke their position and associated privileges.`}
                          onConfirm={() => {
                            setRemoveId(position.id);
                            setRoleError("");
                            setRoleSuccess("");
                            removePosition(position.id);
                          }}
                        >
                          <button
                            disabled={removing_position}
                            className="flex items-center justify-center w-8 h-8 text-gray-400 transition-all rounded-md hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            aria-label={`Remove ${position.position.name} position`}
                          >
                            {removeId == position.id && removing_position ? (
                              <LoaderCircle
                                className="animate-spin"
                                size={16}
                              />
                            ) : (
                              <UserRoundX size={16} />
                            )}
                          </button>
                        </ConfirmationPopUp>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-4 py-8 text-center border border-gray-200 border-dashed rounded-lg bg-gray-50">
                  <div className="mb-5">
                    <UserCheck
                      size={25}
                      className="mx-auto mb-2 text-gray-300"
                    />
                    <p className="mt-1 text-xs text-gray-400">
                      This member currently holds no organizational positions.
                      You may assign a position.
                    </p>
                  </div>
                </div>
              )}

              <div className="px-4 py-8 text-center border border-gray-200 border-dashed rounded-lg bg-gray-50">
                <div className="flex items-end gap-3">
                  {/* SHOW OFFICER AVAILABLE ROLES */}
                  <div className="flex-1">
                    <ObjectSelectField
                      label="Assign a position"
                      className="w-full text-black bg-white text-start dark:text-white"
                      disabled={affiliate_roles_loading}
                      placeholder={
                        affiliate_roles_loading
                          ? "Fetching..."
                          : "Select a position"
                      }
                      name="position"
                      value={selectedPosition}
                      onChange={(position) => setSelectedPosition(position)}
                      options={availablePositions}
                    />
                  </div>
                  <button
                    title="Refresh List"
                    className="flex gap-2 py-1.5 shadow-sm px-2 rounded-md bg-white border border-gray-300"
                  >
                    <RefreshCw
                      size={14}
                      onClick={handleRefresh}
                      className={`${
                        affiliate_roles_loading ? "animate-spin" : ""
                      }`}
                    />
                  </button>

                  {/* Action Button - Only show when position selected */}
                  {selectedPosition && (
                    <div>
                      <button
                        onClick={() => {
                          setRoleError("");
                          setRoleSuccess("");
                          AssignOfficer(selectedPosition);
                        }}
                        disabled={assigning_officer}
                        className="px-4 flex gap-2 py-1.5 text-xs font-medium text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {assigning_officer ? (
                          <LoaderCircle size={14} className="animate-spin" />
                        ) : (
                          <UserRoundPen size={14} />
                        )}

                        <span className="hidden sm:inline">
                          {" "}
                          {assigning_officer ? "Assigning..." : "Assign"}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </Modal>
    </>
  );
}