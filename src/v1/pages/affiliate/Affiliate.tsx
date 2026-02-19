import { Outlet, useOutlet, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Building,
  Building2,
  Calendar,
  Info,
  Loader2,
  LoaderCircle,
  MapPin,
  Pencil,
  Settings,
  Shield,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { affiliate } from "@v1/api/affiliate";
import { useAuth } from "@v1/contexts/AuthContext";
import Tabs from "@v1/layout/Tabs";
import StateSelect from "@v1/components/ui/StateCitySelect/StateSelect";
import type { State } from "@v1/components/ui/StateCitySelect/Dropdown";
import SelectField from "@/components/ui/SelectField";
import toast from "react-hot-toast";
import AlertMessage from "@v1/components/ui/AlertMessage";
import SearchableSelectField from "@v1/components/ui/SearchableSelectField";
import { GetState } from "@v1/components/ui/StateCitySelect/utils";
import type { AffiliateFormData } from "@v1/types";
import Avatar from "@/components/ui/Avater";
import { ActionButton } from "@v1/components/ui/ActionButton";

// Skeleton Loader Components
const SkeletonAvatar = () => (
  <div className="flex items-center gap-4">
    <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
    <div>
      <div className="w-48 mb-2 bg-gray-200 rounded h-7 animate-pulse"></div>
      <div className="flex items-center gap-3">
        <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-3 h-3 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  </div>
);

const SkeletonInputField = () => (
  <div>
    <div className="w-32 h-4 mb-2 bg-gray-200 rounded animate-pulse"></div>
    <div className="w-full bg-gray-200 rounded-lg h-9 animate-pulse"></div>
  </div>
);

const SkeletonButton = ({ width = "w-40" }: { width?: string }) => (
  <div className={`h-10 ${width} bg-gray-200 rounded-lg animate-pulse`}></div>
);

const SkeletonSectionHeader = () => (
  <div className="flex items-center gap-2 mb-5">
    <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
    <div className="w-48 h-6 bg-gray-200 rounded animate-pulse"></div>
  </div>
);

const SkeletonTabs = () => (
  <div className="flex mt-4 space-x-4">
    <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
  </div>
);

export default function Affiliate() {
  const outlet = useOutlet();
  const { userRole } = useAuth();
  const [stateSearch, setStateSearch] = useState("");
  const [states, setStates] = useState<any[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string>("");
  const [formData, setFormData] = useState<AffiliateFormData>({
    affiliate_id: 0,
    name: "",
    state: "",
    employer_name: "",
    ein: "",
    affiliation_date: "",
    affiliate_type: "",
    cbc_region: "",
    ORG_region: "",
  });

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: [`affiliate-info-${userRole.affiliate_uid}`],
    queryFn: () => affiliate.info(String(userRole.affiliate_uid)),
    enabled: !!userRole.affiliate_uid,
    staleTime: Infinity,
  });

  const { mutate, isPending: updating_affiliate } = useMutation({
    mutationFn: (payload: FormData) => affiliate.update(payload),
    onSuccess: () => {
      refetch();
      setErrors({});
      toast.success("Affiliate Information Updated");
      setIsEditing(false);
    },
    onError: async (err: any) => {
      if (err?.errors) {
        console.log(err);
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

  const handleStateChange = (state: State) => {
    console.log(state);
    setFormData((prev) => (prev ? { ...prev, ["state"]: state.name } : prev));
  };

  useEffect(() => {
    if (data) {
      setFormData({
        affiliate_id: data.id,
        name: data.name,
        state: data.state ?? "",
        employer_name: data.employer_name ?? "",
        ein: data.ein ?? "",
        affiliation_date: data.affiliation_date ?? "",
        affiliate_type: data.affiliate_type ?? "",
        cbc_region: data.cbc_region ?? "",
        ORG_region: data.ORG_region ?? "",
      });
    }
  }, [data]);

  useEffect(() => {
    setLoadingStates(true);
    GetState(233).then((data) => {
      setStates(data);
      setLoadingStates(false);
    });
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col flex-1 px-6 pt-5 animate-pulse">
        {/* Header Skeleton */}
        <div className="px-6 pt-6 bg-white border-b border-gray-200 shadow-2xs rounded-t-2xl">
          <div className="flex items-center justify-between mb-6">
            <SkeletonAvatar />
            <div className="flex self-end justify-end gap-2 px-8 py-4">
              <SkeletonButton width="w-32" />
            </div>
          </div>
          <SkeletonTabs />
        </div>

        {/* Main Content Skeleton */}
        <main className="flex-1 min-h-0 overflow-y-auto bg-gray-50">
          <div className="mx-auto">
            <div className="bg-white">
              <div className="px-8 py-6">
                {/* Organization Details Section Skeleton */}
                <div className="mb-8">
                  <SkeletonSectionHeader />
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {[...Array(4)].map((_, i) => (
                      <SkeletonInputField key={i} />
                    ))}
                  </div>
                </div>

                {/* Classification Section Skeleton */}
                <div className="pt-4 mb-4 border-t border-gray-200">
                  <SkeletonSectionHeader />
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                      <SkeletonInputField key={i} />
                    ))}
                  </div>
                </div>

                {/* Location Section Skeleton */}
                <div className="pt-4 mb-4 border-t border-gray-200">
                  <SkeletonSectionHeader />
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <SkeletonInputField />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const tabs = [{ label: "Info", to: `/affiliates`, icon: <Info size={16} /> }];

  const toFormData = (
    data: AffiliateFormData,
    logoFile?: File | null,
  ): FormData => {
    const fd = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        fd.append(key, value);
      }
    });

    if (logoFile) {
      fd.append("logo", logoFile);
    }

    return fd;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdate = () => {
    setErrors({});
    const payload = toFormData(formData, logoFile);
    mutate(payload);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset to original data if needed
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const removeLogo = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setLogoFile(null);
    setPreviewUrl(null);
  };

  return (
    <div className="flex flex-col flex-1 px-6 pt-5 rounded-md shadow shadow-neutral-50">
      {/* Clean Header Design */}
      <div className="px-6 pt-6 bg-white border-b border-gray-200 shadow-2xs rounded-t-2xl">
        {/* Removed the back button from header */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {/* Optional: Add timestamp or other info here */}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              imageUrl={
                !isEditing
                  ? data?.logo_signed_url
                  : previewUrl
                    ? previewUrl
                    : data?.logo_signed_url
              }
              alt={`${data?.name}`}
              fallbackText={`${data?.name}`}
              size="xxxl"
              variant="square"
            />

            {isEditing && (
              <div className="flex-1">
                <input
                  type="file"
                  id="logo-upload"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <label
                  htmlFor="logo-upload"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <Upload size={12} />
                  {logoFile ? "Change Image" : "Upload Image"}
                </label>
                {(logoFile || data?.logo_signed_url) && (
                  <p className="mt-1.5 text-xs text-gray-600">
                    {logoFile?.name}
                  </p>
                )}
                <p className="mt-1.5 text-xs text-gray-500">
                  Square image recommended, maximum 2MB
                </p>
              </div>
            )}
            {!isEditing && (
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {data?.name}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-600">
                    Affiliate Organization
                  </span>
                  {data?.ORG_region && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs text-gray-500">
                        Region: {data.ORG_region}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          {!outlet && (
            <div className="flex self-end justify-end gap-2 px-8 py-4">
              {!isEditing ? (
                <ActionButton
                  icon={Pencil}
                  label="Edit Information"
                  onClick={() => setIsEditing(true)}
                />
              ) : (
                <>
                  <ActionButton
                    label="Cancel"
                    disabled={updating_affiliate}
                    onClick={handleCancel}
                  />
                  <ActionButton
                    icon={updating_affiliate ? LoaderCircle : undefined}
                    label={
                      updating_affiliate
                        ? "Updating Information"
                        : "Update Information"
                    }
                    disabled={updating_affiliate}
                    loading={updating_affiliate}
                    onClick={handleUpdate}
                    buttonClassName="bg-blue-500! hover:bg-blue-600! text-white! font-semibold!"
                  />
                </>
              )}
            </div>
          )}
        </div>
        <div className="px-2 mt-4">
          <Tabs tabs={tabs} showBackButton={false} />
        </div>
      </div>

      <main className="flex-1 min-h-0 overflow-y-auto">
        {outlet ? (
          <Outlet context={{ region: data?.ORG_region }} />
        ) : (
          <div className=" bg-gray-50">
            <div className="mx-auto ">
              {/* Main Content */}
              <div className="bg-white">
                <div className="px-8 py-6">
                  {generalError && (
                    <div className="mb-3">
                      <AlertMessage type="error" message={generalError} />
                    </div>
                  )}
                  {/* Organization Details Section */}
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-5">
                      <Building2 className="w-5 h-5 text-gray-700" />
                      <h2 className="text-lg font-semibold text-gray-900">
                        Organization Details
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <label className="block mb-2 text-xs font-medium text-gray-700">
                          Affiliate Name <span className="text-red-500">*</span>
                        </label>
                        {isEditing ? (
                          <input
                            disabled={updating_affiliate}
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                          />
                        ) : (
                          <p className="px-2 py-1.5 text-sm bg-gray-50 rounded-lg text-gray-900 border border-gray-200">
                            {formData.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block mb-2 text-xs font-medium text-gray-700">
                          Employer Name <span className="text-red-500">*</span>
                        </label>
                        {isEditing ? (
                          <input
                            disabled={updating_affiliate}
                            type="text"
                            name="employer_name"
                            value={formData.employer_name}
                            onChange={handleInputChange}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                          />
                        ) : (
                          <p className="px-2 py-1.5 text-sm bg-gray-50 rounded-lg text-gray-900 border border-gray-200">
                            {formData.employer_name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block mb-2 text-xs font-medium text-gray-700">
                          Employer Identification Number (EIN){" "}
                          <span className="text-red-500">*</span>
                        </label>
                        {isEditing ? (
                          <input
                            disabled={updating_affiliate}
                            type="text"
                            name="ein"
                            value={formData.ein}
                            onChange={handleInputChange}
                            placeholder="XX-XXXXXXX"
                            className="w-full px-2 text-sm py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                          />
                        ) : (
                          <p className="px-2 py-1.5 text-sm bg-gray-50 rounded-lg text-gray-900 border border-gray-200 font-mono">
                            {formData.ein}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block mb-2 text-xs font-medium text-gray-700">
                          Affiliation Date{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        {isEditing ? (
                          <input
                            disabled={updating_affiliate}
                            type="date"
                            name="affiliation_date"
                            value={
                              formData.affiliation_date
                                ? formData.affiliation_date.slice(0, 10)
                                : ""
                            }
                            onChange={handleInputChange}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
                          />
                        ) : (
                          <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <p className="text-sm text-gray-900">
                              {new Date(
                                formData.affiliation_date,
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Classification Section */}
                  <div className="pt-4 mb-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-5">
                      <Shield className="w-5 h-5 text-gray-700" />
                      <h2 className="text-lg font-semibold text-gray-900">
                        Classification & Regions
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                      <div>
                        {isEditing ? (
                          <SelectField
                            disabled={updating_affiliate}
                            label="Affiliate Type"
                            name="affiliate_type"
                            placeholder="Select Affiliate Type"
                            value={formData.affiliate_type}
                            optionClassName="text-xs!"
                            selectClassName="p-2! text-sm!"
                            labelClassName="text-xs! mb-2"
                            onChange={handleInputChange}
                            options={[
                              { value: "", label: "Select" },
                              { value: "Associate", label: "Associate" },
                              { value: "Professional", label: "Professional" },
                              { value: "Wall-to-Wall", label: "Wall-to-Wall" },
                            ]}
                            required
                          />
                        ) : (
                          <>
                            <label className="block mb-2 text-xs font-medium text-gray-700">
                              Affiliate Type{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <p className="px-2 py-1.5 text-sm bg-blue-50 rounded-lg text-blue-900 border border-blue-200 font-medium">
                              {formData.affiliate_type}
                            </p>
                          </>
                        )}
                      </div>

                      <div>
                        {isEditing ? (
                          <SelectField
                            disabled={updating_affiliate}
                            label="CBC Region"
                            name="cbc_region"
                            placeholder="Select CBC"
                            value={formData.cbc_region}
                            optionClassName="text-xs!"
                            selectClassName="p-2! text-sm!"
                            labelClassName="text-xs! mb-2"
                            onChange={handleInputChange}
                            options={[
                              { value: "", label: "Select" },
                              { value: "Northeast", label: "Northeast" },
                              { value: "Corridor", label: "Corridor" },
                              { value: "South", label: "South" },
                              { value: "Central", label: "Central" },
                              { value: "Western", label: "Western" },
                            ]}
                            required
                          />
                        ) : (
                          <>
                            <label className="block mb-2 text-xs font-medium text-gray-700">
                              CBC Region <span className="text-red-500">*</span>
                            </label>
                            <p className="px-2 py-1.5 text-sm bg-gray-50 rounded-lg text-gray-900 border border-gray-200">
                              {formData.cbc_region}
                            </p>
                          </>
                        )}
                      </div>

                      <div>
                        {isEditing ? (
                          <SelectField
                            disabled={updating_affiliate}
                            label="ORG Region"
                            name="ORG_region"
                            placeholder="Select Region"
                            value={formData.ORG_region}
                            optionClassName="text-xs!"
                            selectClassName="p-2! text-sm!"
                            labelClassName="text-xs! mb-2"
                            onChange={handleInputChange}
                            options={[
                              { value: "", label: "Select" },
                              { value: 1, label: "Region 1" },
                              { value: 2, label: "Region 2" },
                              { value: 3, label: "Region 3" },
                              { value: 4, label: "Region 4" },
                              { value: 5, label: "Region 5" },
                              { value: 6, label: "Region 6" },
                              { value: 7, label: "Region 7" },
                            ]}
                            required
                          />
                        ) : (
                          <>
                            <label className="block mb-2 text-xs font-medium text-gray-700">
                              ORG Region <span className="text-red-500">*</span>
                            </label>
                            <p className="px-2 py-1.5 text-sm bg-gray-50 rounded-lg text-gray-900 border border-gray-200">
                              Region {formData.ORG_region}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Location Section */}
                  <div className="pt-4 mb-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-5">
                      <MapPin className="w-5 h-5 text-gray-700" />
                      <h2 className="text-lg font-semibold text-gray-900">
                        Location Information
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        {isEditing ? (
                          <SearchableSelectField
                            name="state"
                            label="State"
                            value={formData.state}
                            onChange={handleInputChange}
                            options={states
                              .filter((s) =>
                                s.name
                                  .toLowerCase()
                                  .includes(stateSearch.toLowerCase()),
                              )
                              .map((s) => ({
                                label: s.name,
                                value: s.name,
                              }))}
                            searchValue={stateSearch}
                            onSearchChange={setStateSearch}
                            loading={loadingStates}
                            error={errors.state}
                            required
                            disabled={updating_affiliate}
                            placeholder="Select State"
                            inputClass="text-sm p-2!"
                          />
                        ) : (
                          <>
                            <label className="block mb-2 text-xs font-medium text-gray-700">
                              State
                              <span className="text-red-500">*</span>
                            </label>
                            <p className="px-2 py-1.5 text-sm bg-gray-50 rounded-lg text-gray-900 border border-gray-200">
                              {formData.state}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
