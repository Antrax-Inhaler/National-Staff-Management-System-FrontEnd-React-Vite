import React, { useState } from "react";
import { Plus, Upload, X } from "lucide-react";
import Modal from "@v1/components/ui/Modal";
import StateSelect from "@v1/components/ui/StateCitySelect/StateSelect";
import type { State } from "@v1/components/ui/StateCitySelect/Dropdown";
import SelectField from "@/components/ui/SelectField";
import InputField from "@v1/components/ui/InputField";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { affiliate } from "@v1/api/affiliate";
import toast from "react-hot-toast";
import AlertMessage from "@v1/components/ui/AlertMessage";
import { ActionButton } from "@v1/components/ui/ActionButton";
import type { AffiliateFormData } from "@v1/types";

export default function AddAffiliate({ queryKey }: { queryKey: any[] }) {
  const [open, setOpen] = useState(false);
  const [generalError, setGeneralError] = useState<string>("");
  const [formData, setFormData] = useState<AffiliateFormData>({
    name: "",
    state: "",
    employer_name: "",
    ein: "",
    affiliation_date: "",
    affiliate_type: "",
    cbc_region: "",
    ORG_region: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isPending, setIsPending] = useState(false);
  const queryClient = useQueryClient();

  const { mutate, isPending: creating_affiliate } = useMutation({
    mutationFn: (payload: FormData) => affiliate.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey });
      setErrors({});
      setGeneralError("");
      setIsPending(false);
      setOpen(false);
      setFormData({
        name: "",
        state: "",
        employer_name: "",
        ein: "",
        affiliation_date: "",
        affiliate_type: "",
        cbc_region: "",
        ORG_region: "",
      });
      setLogoFile(null);
      setPreviewUrl(null);
      setOpen(false);
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

  const toFormData = (
    data: AffiliateFormData,
    logoFile: File | null,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const payload = toFormData(formData, logoFile);
    mutate(payload);
  };

  const handleClose = () => {
    setOpen(false);
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const getFallbackText = () => {
    return formData.name?.charAt(0).toUpperCase() || "A";
  };

  const handleStateChange = (state: State) => {
    setFormData((prev) => (prev ? { ...prev, ["state"]: state.name } : prev));

    setErrors((prev) => ({
      ...prev,
      state: [],
      state_id: [],
    }));
  };

  return (
    <>
      <ActionButton
        icon={Plus}
        onClick={() => setOpen(true)}
        iconSize={16}
        label="Create Affiliate"
        buttonClassName="bg-blue-600! hover:bg-blue-700! text-white!"
      />
      {/* <button
        
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
      >
        <Plus size={16} />
        Create Affiliate
      </button> */}

      <Modal
        title="Create Affiliate"
        isOpen={open}
        onClose={handleClose}
        size="lg"
      >
        {/* Form Content */}
        <form onSubmit={handleSubmit} className="bg-white ">
          {generalError && <AlertMessage type="error" message={generalError} />}
          {/* Logo Section */}
          <div className="pb-4 mb-5 border-b border-gray-200">
            <label className="block mb-3 text-xs font-semibold tracking-wider text-gray-700 uppercase">
              Organization Logo
            </label>

            <div className="flex items-start gap-3">
              {/* Avatar Preview */}
              <div className="flex-shrink-0">
                {previewUrl ? (
                  <div className="relative group">
                    <img
                      src={previewUrl}
                      alt="Affiliate Logo"
                      className="object-cover w-16 h-16 border border-gray-300 rounded"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-1.5 -right-1.5 bg-slate-700 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-16 h-16 border-2 border-gray-300 border-dashed rounded bg-gray-50">
                    <span className="text-xl font-semibold text-gray-400">
                      {getFallbackText()}
                    </span>
                  </div>
                )}
              </div>

              {/* Upload Button */}
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
                {logoFile && (
                  <p className="mt-1.5 text-xs text-gray-600">
                    {logoFile.name}
                  </p>
                )}
                <p className="mt-1.5 text-xs text-gray-500">
                  Square image recommended, maximum 2MB
                </p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-4">
            {/* Affiliate Name */}
            <InputField
              className="grid col-span-full"
              label="Affiliate Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              placeholder="Affiliate Name"
              required
            />

            {/* State */}
            <div>
              <label className="block mb-1 text-xs font-medium text-gray-700">
                State
              </label>
              <StateSelect
                inputClassName={`!border-none !outline-none !p-0 !text-xs`}
                containerClassName="!p-0"
                countryid={233}
                placeHolder="Select State"
                name="state"
                defaultValue={formData?.state ?? ""}
                onChange={handleStateChange}
                required
              />
              {errors.state && (
                <p className="mt-0.5 text-xs text-red-600">{errors.state[0]}</p>
              )}
            </div>
            <InputField
              label="Employer Name"
              name="employer_name"
              value={formData.employer_name}
              onChange={handleChange}
              error={errors.employer_name}
              placeholder="Employer Name"
            />
            <InputField
              label="EIN"
              name="ein"
              value={formData.ein}
              onChange={handleChange}
              error={errors.ein}
              placeholder="EIN"
            />
            <InputField
              label="Affiliation Date"
              name="affiliation_date"
              type="date"
              value={formData.affiliation_date}
              onChange={handleChange}
              error={errors.affiliation_date}
              placeholder="Affiliation Date"
            />
            <SelectField
              label="Affiliate Type"
              name="affiliate_type"
              placeholder="Select Affiliate Type"
              value={formData.affiliate_type}
              onChange={handleChange}
              options={[
                { value: "Associate", label: "Associate" },
                { value: "Professional", label: "Professional" },
                { value: "Wall-to-Wall", label: "Wall-to-Wall" },
              ]}
              error={errors.affiliate_type}
            />
            <SelectField
              label="CBC Region"
              name="cbc_region"
              placeholder="Select CBC Region"
              value={formData.cbc_region}
              onChange={handleChange}
              options={[
                { value: "Northeast", label: "Northeast" },
                { value: "Corridor", label: "Corridor" },
                { value: "South", label: "South" },
                { value: "Central", label: "Central" },
                { value: "Western", label: "Western" },
              ]}
              error={errors.cbc_region}
            />
            <SelectField
              label="ORG Region"
              name="ORG_region"
              placeholder="Select ORG Region"
              value={formData.ORG_region}
              onChange={handleChange}
              options={[
                { value: 1, label: "Region 1" },
                { value: 2, label: "Region 2" },
                { value: 3, label: "Region 3" },
                { value: 4, label: "Region 4" },
                { value: 5, label: "Region 5" },
                { value: 6, label: "Region 6" },
                { value: 7, label: "Region 7" },
              ]}
              error={errors.ORG_region}
            />
          </div>
          {/* Footer Actions */}
          <div className="mt-5 pt-3 flex justify-end gap-2.5 border-t border-gray-200">
            <ActionButton onClick={handleClose} label="Cancel" />
            <ActionButton
              as="submit"
              disabled={creating_affiliate}
              onClick={() => handleSubmit}
              label={creating_affiliate ? "Creating..." : "Create Affiliate"}
              buttonClassName="bg-blue-700! text-white! hover:bg-blue-800!"
            />
          </div>
        </form>
      </Modal>
    </>
  );
}
