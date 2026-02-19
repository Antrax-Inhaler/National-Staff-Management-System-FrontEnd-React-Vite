// src/components/members/CreateMember.tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Camera, Plus } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom"; // Import useParams
import toast from "react-hot-toast";
import useDebounce from "../../../hooks/useDebounce";
import { affiliate } from "../../api/affiliate";
import { members, type memberForm } from "../../api/member";
import { Committees, Roles } from "../../constants/roles";
import { useAuth } from "../../contexts/AuthContext";
import RoleGuard from "../RoleGuard";
import InputField from "../ui/InputField";
import Modal from "../ui/Modal";
import SearchableSelectField from "../ui/SearchableSelectField";
import SelectField from "../ui/SelectField";
import StateSelect from "../ui/StateCitySelect/StateSelect";
import type { City, State } from "../ui/StateCitySelect/types";
import { ActionButton } from "@v1/components/ui/ActionButton";

interface CreateMemberProps {
  size?: "sm" | "md" | "lg";
  queryKey?: any[];
}

export default function CreateMember({
  size = "md",
  queryKey,
}: CreateMemberProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { userRole } = useAuth();
  
  // Get the affiliate ID from the URL params
  const { uid: affiliate_uid } = useParams<{ uid?: string }>();
  const { id: affiliate_id } = useParams<{ id?: string }>(); // For the old route format
  
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string>("");
  const [activeSection, setActiveSection] = useState<string>("basic");
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [affiliateSearch, setAffiliateSearch] = useState("");
  const debouncedSearch = useDebounce(affiliateSearch, 500);
  
  // Initialize form with affiliate_id if we're on an affiliate page
  const [form, setForm] = useState<memberForm>({
    first_name: "",
    last_name: "",
    level: "",
    employment_status: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    zip_code: "",
    home_email: "",
    state_id: null,
    home_phone: "",
    mobile_phone: "",
    date_of_birth: "",
    date_of_hire: "",
    gender: "",
    self_id: "",
    status: "",
    member_id: "",
    affiliate_id: affiliate_uid ? affiliate_uid : (affiliate_id ? affiliate_id : undefined),
  });

  const buttonSizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2",
  };

  const {
    data: affiliates,
    isLoading,
    isError,
    isFetching: fetchingAffiliates,
  } = useQuery({
    queryKey: ["affiliates-options", debouncedSearch],
    queryFn: () => affiliate.options(debouncedSearch),
    enabled: userRole.roles.some((r) =>
      [
        Roles.NATIONAL_ADMINISTRATOR,
        Roles.ORG_EXECUTIVE_COMMITEE,
        Roles.ORG_RESEARCH_COMMITEE,
        ...Committees.REGIONAL_DIRECTORS,
      ].includes(r),
    ),
  });

  // Get the current affiliate name for display
  const currentAffiliateName = useMemo(() => {
    if (affiliate_uid || affiliate_id) {
      // If we're on an affiliate page, get the affiliate name from the affiliates list
      const currentAffiliate = affiliates?.find(
        (aff: any) => aff.public_uid === affiliate_uid || aff.id.toString() === affiliate_id
      );
      return currentAffiliate?.name || "Current Affiliate";
    }
    return null;
  }, [affiliates, affiliate_uid, affiliate_id]);

  const getUserInitials = () => {
    const firstInitial = form.first_name?.charAt(0) || "";
    const lastInitial = form.last_name?.charAt(0) || "";
    return `${firstInitial}${lastInitial}`.toUpperCase() || "U";
  };
  
  // Check if we're on an affiliate page
  const isOnAffiliatePage = affiliate_uid || affiliate_id;

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

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: memberForm & { profile_photo?: File }) =>
      members.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey });
      setErrors({});
      setGeneralError("");
      setOpen(false);
      setActiveSection("basic");
      setProfilePhoto(null);
      setPhotoPreview("");
      
      // Reset form with the same affiliate_id
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
        home_email: "",
        state_id: null,
        home_phone: "",
        mobile_phone: "",
        date_of_birth: "",
        date_of_hire: "",
        gender: "",
        self_id: "",
        status: "",
        member_id: "",
        affiliate_id: affiliate_uid ? affiliate_uid : (affiliate_id ? affiliate_id : undefined),
      });
      
      toast.success("Member created successfully");
    },
    onError: async (err: any) => {
      console.error("Mutation error:", err);

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
  };

  const handleCityChange = (city: City) => {
    setForm((prev) => (prev ? { ...prev, ["city"]: city.name } : prev));

    setErrors((prev) => ({
      ...prev,
      city: [],
    }));
  };

  const resetForm = () => {
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
      home_email: "",
      state_id: null,
      home_phone: "",
      mobile_phone: "",
      date_of_birth: "",
      date_of_hire: "",
      gender: "",
      self_id: "",
      status: "",
      member_id: "",
      affiliate_id: affiliate_uid ? affiliate_uid : (affiliate_id ? affiliate_id : undefined),
    });
    setErrors({});
    setGeneralError("");
    setActiveSection("basic");
    setProfilePhoto(null);
    setPhotoPreview("");

    if (photoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }
  };

  const sections = [
    { id: "basic", title: "Basic Info" },
    { id: "address", title: "Address" },
    { id: "contact", title: "Contact Info" },
  ];

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

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

  // UPDATED: Gender options with new choices
  const genderOptions = [
    { label: "Male", value: "male" },
    { label: "Female", value: "female" },
    { label: "Non-binary", value: "non-binary" },
    { label: "None of these choices", value: "none_of_these_choices" },
    { label: "Prefer not to disclose", value: "prefer_not_to_disclose" },
  ];

  return (
    <>
      <ActionButton
        label="Add Member"
        icon={Plus}
        iconSize={14}
        onClick={() => setOpen(true)}
        buttonClassName="bg-blue-600! hover:bg-blue-700 text-white font-semibold!"
      />

      <Modal
        isOpen={open}
        onClose={() => {
          setOpen(false);
          resetForm();
        }}
        title={`Add New Member${currentAffiliateName ? ` to ${currentAffiliateName}` : ''}`}
        className="max-w-3xl min-w-2xl w-[95vw] md:w-full max-h-[90vh] overflow-hidden"
      >
        {generalError && (
          <div className="p-4 mx-4 mt-4 border border-red-200 rounded-lg bg-red-50">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800">
                  Unable to save member
                </h4>
                <p className="mt-1 text-sm text-red-700">{generalError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Display current affiliate information if on affiliate page */}
        {isOnAffiliatePage && currentAffiliateName && (
          <div className="p-3 mx-4 mt-4 border border-blue-200 rounded-lg bg-blue-50">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p className="text-sm text-blue-700">
                Member will be added to <span className="font-semibold">{currentAffiliateName}</span>
              </p>
            </div>
          </div>
        )}

        {isMobile && (
          <div className="mb-4 md:hidden">
            <div className="flex pb-2 space-x-1 overflow-x-auto">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap ${
                    activeSection === section.id
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto">
            <div className="p-1 space-y-5 text-xs">
              <section>
                <h3 className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-800">
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
                      ) : (
                        <div className="flex items-center justify-center w-16 h-16 font-medium text-white bg-indigo-500 rounded-full">
                          {getUserInitials()}
                        </div>
                      )}
                    </div>
                    {photoPreview && (
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

              {/* Only show affiliate selection if NOT on an affiliate page */}
              <RoleGuard
                roles={[
                  Roles.NATIONAL_ADMINISTRATOR,
                  Roles.ORG_EXECUTIVE_COMMITEE,
                  ...Committees.EXECUTIVE_COMMITTEE,
                  ...Committees.REGIONAL_DIRECTORS,
                ]}
              >
                {!isOnAffiliatePage && (
                  <section
                    className={`${
                      isMobile && activeSection !== "basic" ? "hidden" : ""
                    }`}
                  >
                    <h3 className="mb-3 text-sm font-semibold text-gray-800">
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
              </RoleGuard>

              <section
                className={`${
                  isMobile && activeSection !== "basic" ? "hidden" : ""
                }`}
              >
                <h3 className="mb-3 text-sm font-semibold text-gray-800">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <InputField
                    className="grid col-span-full"
                    label="Member ID"
                    name="member_id"
                    value={form.member_id}
                    onChange={handleChange}
                    error={errors.member_id}
                    placeholder="Auto-generated if left empty"
                  />
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
                    value={form.date_of_birth}
                    onChange={handleChange}
                    error={errors.date_of_birth}
                    type="date"
                  />
                  {/* TEMPORARILY NON-REQUIRED */}
                  <InputField
                    label="Date of Hire"
                    name="date_of_hire"
                    value={form.date_of_hire}
                    onChange={handleChange}
                    error={errors.date_of_hire}
                    type="date"
                  />
                  {/* UPDATED: New gender options - TEMPORARILY NON-REQUIRED */}
                  <SelectField
                    label="Gender"
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    options={genderOptions}
                    error={errors.gender}
                    // TEMPORARILY NON-REQUIRED: removed required prop
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
                    // TEMPORARILY NON-REQUIRED: removed required prop
                  />
                </div>
              </section>

              <section
                className={`${
                  isMobile && activeSection !== "address" ? "hidden" : ""
                }`}
              >
                <h3 className="mb-3 text-sm font-semibold text-gray-800">
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
                            isMobile ? "!text-xs" : "!text-xs"
                          } ${
                            errors.state || errors.state_id
                              ? "!border-red-300 !ring-red-300"
                              : ""
                          }`}
                          containerClassName="!p-0"
                          countryid={233}
                          placeHolder="Select State"
                          name="state"
                          defaultValue={form?.state ?? ""}
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

              <section
                className={`${
                  isMobile && activeSection !== "contact" ? "hidden" : ""
                }`}
              >
                <h3 className="mb-3 text-sm font-semibold text-gray-800">
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <InputField
                    label="Personal Email"
                    name="home_email"
                    value={form.home_email}
                    onChange={handleChange}
                    error={errors.home_email}
                    type="email"
                    placeholder="No work email addresses"
                    required
                  />
                  <InputField
                    label="Mobile Phone"
                    name="mobile_phone"
                    value={form.mobile_phone}
                    onChange={handleChange}
                    error={errors.mobile_phone}
                    type="tel"
                    required
                  />
                  <InputField
                    label="Home Phone"
                    name="home_phone"
                    value={form.home_phone}
                    onChange={handleChange}
                    error={errors.home_phone}
                    type="tel"
                  />
                </div>
              </section>
            </div>
          </div>

          {isMobile && (
            <div className="flex justify-between pt-4 mt-4 border-t border-gray-200">
              {sections.findIndex((s) => s.id === activeSection) > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = sections.findIndex(
                      (s) => s.id === activeSection,
                    );
                    setActiveSection(sections[currentIndex - 1].id);
                  }}
                  className="px-4 py-2 text-xs font-medium text-blue-600 rounded-md bg-blue-50 hover:bg-blue-100"
                >
                  Previous
                </button>
              )}

              {sections.findIndex((s) => s.id === activeSection) <
              sections.length - 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = sections.findIndex(
                      (s) => s.id === activeSection,
                    );
                    setActiveSection(sections[currentIndex + 1].id);
                  }}
                  className="px-4 py-2 ml-auto text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Next
                </button>
              ) : (
                <div className="flex gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isPending ? "Saving..." : "Save Member"}
                  </button>
                </div>
              )}
            </div>
          )}

          {!isMobile && (
            <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isPending ? "Saving..." : "Save Member"}
              </button>
            </div>
          )}
        </form>
      </Modal>
    </>
  );
}