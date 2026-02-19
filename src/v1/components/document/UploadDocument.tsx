import React, { useState } from "react";
import toast from "react-hot-toast";
import { LoaderCircle } from "lucide-react";
import Modal from "../ui/Modal";
import InputField from "../ui/InputField";
import SelectField from "../ui/SelectField";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import TextAreaInput from "../ui/TextAreaInput";
import StateSelect from "../ui/StateCitySelect/StateSelect";
import type { State } from "../ui/StateCitySelect/types";
import FileUpload from "../ui/FileUpload";
import CheckboxField from "../ui/CheckboxField";
import { useAuth } from "../../contexts/AuthContext";
import { Roles, Committees } from "../../constants/roles";
import useDebounce from "../../../hooks/useDebounce";
import { affiliate } from "../../api/affiliate";
import { research } from "@v1/api/research";
import SearchableSelectField from "@v1/components/ui/SearchableSelectField";

interface UploadDocumentParam {
  onSuccess?: () => void;
  onCancel?: () => void;
  affiliate?: number;
  categoryGroup?: "research" | "governance";
  isOpen?: boolean;
}

export interface DocumentForm {
  public_uid?: string;
  title?: string;
  type?: string;
  category?: string;
  description?: string;
  database_source?: string;
  folder_id?: string;
  category_group?: string;
  contract_expiration_date?: string;
  employer?: string;
  cbc?: string;
  state?: string;
  effective_date?: string;
  status?: string;
  keywords?: string;
  sub_type?: string;
  year?: string;
  is_public?: boolean;
  is_archived?: boolean;
  file?: File | null;
  affiliate_id?: number;
}

function UploadDocument({
  onSuccess,
  onCancel,
  affiliate: affiliate_id,
  categoryGroup = "research",
  isOpen: externalIsOpen = true,
}: UploadDocumentParam) {
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [affiliateSearch, setAffiliateSearch] = useState("");
  const debouncedSearch = useDebounce(affiliateSearch, 500);
  const { userRole } = useAuth();

  const [formData, setFormData] = useState<DocumentForm>({
    title: "",
    type: "",
    category: "",
    description: "",
    database_source: "",
    folder_id: "",
    category_group: categoryGroup,
    contract_expiration_date: "",
    employer: "",
    cbc: "",
    state: "",
    effective_date: "",
    status: "",
    keywords: "",
    sub_type: "",
    year: "",
    file: null,
    is_archived: false,
    is_public: false,
    affiliate_id: affiliate_id || undefined,
  });

  const queryClient = useQueryClient();

  // Fetch affiliates for searchable dropdown (only for national roles)
  const {
    data: affiliates,
    isLoading: affiliateLoading,
    isFetching: fetchingAffiliates,
  } = useQuery({
    queryKey: ["affiliates-options-select", { debouncedSearch }],
    queryFn: () => affiliate.options(debouncedSearch),
    enabled: userRole.roles.some((r) =>
      [
        Roles.NATIONAL_ADMINISTRATOR,
        Roles.ORG_EXECUTIVE_COMMITEE,
        ...Committees.EXECUTIVE_COMMITTEE,
        ...Committees.REGIONAL_DIRECTORS,
      ].includes(r)
    ),
  });

  const handleCancel = () => {
    setFormData({
      title: "",
      type: "",
      category: "",
      description: "",
      database_source: "",
      folder_id: "",
      category_group: categoryGroup,
      contract_expiration_date: "",
      employer: "",
      cbc: "",
      state: "",
      effective_date: "",
      status: "",
      keywords: "",
      sub_type: "",
      year: "",
      file: null,
      is_archived: false,
      is_public: false,
      affiliate_id: affiliate_id || undefined,
    });
    setUploading(false);
    onCancel?.();
  };

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: DocumentForm) => research.upload(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research-documents"] });
      toast.success("Document Uploaded");
      setUploading(false);
      onSuccess?.();
      handleCancel();
    },
    onError: async (err: any) => {
      if (err?.errors) {
        setErrors(err.errors);
      } else {
        console.error(err);
        toast.error(err.message || "Failed to upload document");
      }
      setUploading(false);
    },
  });

  const typeOptions = [
    { value: "contract", label: "Contract" },
    { value: "arbitration", label: "Arbitration" },
    { value: "mou", label: "MOU" },
    { value: "bylaws", label: "Bylaws" },
    { value: "research", label: "Research" },
    { value: "general", label: "General" },
  ];

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "expired", label: "Expired" },
    { value: "negotiation", label: "Negotiation" },
    { value: "draft", label: "Draft" },
  ];

  const categoryOptions = [
    { value: "contracts", label: "Contracts" },
    { value: "arbitrations", label: "Arbitrations" },
    { value: "mous", label: "MOUs" },
    { value: "research_collection", label: "Research" },
    { value: "general", label: "General" },
    { value: "401k_SPD", label: "401k Summary/Plan Document (SPD)" },
    { value: "pension_SPD", label: "Pension Summary Plan Document" },
  ];

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    let fieldValue: string | boolean = value;

    if (type === "checkbox" && "checked" in e.target) {
      fieldValue = e.target.checked;
    }

    if (name === "category") {
      setFormData((prev) => ({
        ...prev,
        database_source: value,
      }));
    }

    setFormData((prev) => ({
      ...prev,
      [name]: fieldValue,
    }));

    setErrors((prev) => ({ ...prev, [name]: [] }));
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.file) {
      toast.error("Please select a file");
      return;
    }

    setUploading(true);
    mutate(formData);
  };

  const handleStateChange = (state: State) => {
    setFormData((prev) =>
      prev ? { ...prev, ["state"]: state.state_code } : prev
    );
  };

  const handleFileSelect = (file: File | null) => {
    setFormData((prev) => (prev ? { ...prev, ["file"]: file } : prev));
  };

  return (
    <Modal
      isOpen={externalIsOpen}
      onClose={handleCancel}
      title="Upload Research Document"
      className="max-w-4xl w-[95vw] md:w-full max-h-[90vh] overflow-hidden"
      size="xl"
    >
      <form onSubmit={handleUpload} className="space-y-6">
        <div className="space-y-6">
          {/* Affiliate Selection Section */}
          {userRole.roles.some((r) =>
            [
              Roles.NATIONAL_ADMINISTRATOR,
              Roles.ORG_EXECUTIVE_COMMITEE,
              ...Committees.EXECUTIVE_COMMITTEE,
              ...Committees.REGIONAL_DIRECTORS,
            ].includes(r)
          ) && (
            <div className="space-y-4">
              <h3 className="pb-2 text-lg font-medium text-gray-900 border-b">
                Affiliate Information
              </h3>
              <SearchableSelectField
                label="Affiliate"
                name="affiliate_id"
                value={formData.affiliate_id}
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
                loading={fetchingAffiliates}
              />
            </div>
          )}

          <div className="space-y-4">
            <h3 className="pb-2 text-lg font-medium text-gray-900 border-b">
              Document Information
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InputField
                label="Title"
                name="title"
                value={formData.title ?? ""}
                onChange={handleChange}
                error={errors.title?.[0] ?? ""}
                required
              />
              <SelectField
                label="Type"
                name="type"
                options={typeOptions}
                value={formData.type ?? ""}
                onChange={handleChange}
                error={errors.type?.[0]}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <SelectField
                label="Category"
                name="category"
                options={categoryOptions}
                value={formData.category ?? ""}
                onChange={handleChange}
                error={errors.category?.[0]}
                required
              />
              <SelectField
                label="Status"
                name="status"
                options={statusOptions}
                value={formData.status ?? ""}
                onChange={handleChange}
                error={errors.status?.[0]}
              />
            </div>

            <TextAreaInput
              label="Description"
              name="description"
              value={formData.description ?? ""}
              onChange={handleChange}
              error={errors.description?.[0] ?? ""}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Document description and notes"
              required
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <CheckboxField
                label="Public Document"
                name="is_public"
                checked={formData.is_public || false}
                onChange={handleChange}
                error={errors.is_public?.[0]}
              />
              <CheckboxField
                label="Archived"
                name="is_archived"
                checked={formData.is_archived || false}
                onChange={handleChange}
                error={errors.is_archived?.[0]}
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                PDF File *
              </label>
              <FileUpload
                onFileSelect={handleFileSelect}
                label="Click to upload PDF"
              />
              {errors.file?.[0] && (
                <p className="mt-1 text-sm text-red-600">{errors.file[0]}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="pb-2 text-lg font-medium text-gray-900 border-b">
              Contract Details
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InputField
                label="Employer"
                name="employer"
                value={formData.employer ?? ""}
                onChange={handleChange}
                error={errors.employer?.[0] ?? ""}
              />
              <InputField
                label="CBC"
                name="cbc"
                value={formData.cbc ?? ""}
                onChange={handleChange}
                error={errors.cbc?.[0] ?? ""}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="w-full text-xs rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                <label className="block mb-1 text-xs font-medium text-gray-700">
                  State
                </label>
                <div
                  onMouseDown={(e) => e.stopPropagation()}
                  className="relative"
                >
                  <StateSelect
                    inputClassName="!border-none !outline-none !text-xs !p-0"
                    containerClassName="!p-0"
                    countryid={233}
                    placeHolder="Select State"
                    name="state"
                    defaultValue={formData?.state ?? ""}
                    onChange={(state) => handleStateChange(state)}
                  />
                </div>
                {errors.state?.[0] && (
                  <p className="mt-1 text-xs text-red-600">{errors.state[0]}</p>
                )}
              </div>

              <InputField
                label="Year"
                name="year"
                type="number"
                min={1900}
                max={2030}
                value={formData.year ?? ""}
                onChange={handleChange}
                error={errors.year?.[0] ?? ""}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InputField
                label="Effective Date"
                name="effective_date"
                type="date"
                value={formData.effective_date ?? ""}
                onChange={handleChange}
                error={errors.effective_date?.[0] ?? ""}
              />
              <InputField
                label="Expiration Date"
                name="contract_expiration_date"
                type="date"
                value={formData.contract_expiration_date ?? ""}
                onChange={handleChange}
                error={errors.contract_expiration_date?.[0] ?? ""}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InputField
                label="Keywords"
                name="keywords"
                placeholder="comma-separated keywords"
                value={formData.keywords ?? ""}
                onChange={handleChange}
                error={errors.keywords?.[0] ?? ""}
              />
              <InputField
                label="Sub Type"
                name="sub_type"
                value={formData.sub_type ?? ""}
                onChange={handleChange}
                error={errors.sub_type?.[0] ?? ""}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={handleCancel}
            type="button"
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
            disabled={uploading}
          >
            {uploading && <LoaderCircle size={18} className="animate-spin" />}
            {uploading ? "Uploading" : "Upload Document"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default UploadDocument;
