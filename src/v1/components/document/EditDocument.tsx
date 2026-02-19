import React, { useState } from "react";
import { type Document } from "./../../../api/affiliates/documents";
import toast from "react-hot-toast";
import { LoaderCircle } from "lucide-react";
import Modal from "../ui/Modal";
import InputField from "../ui/InputField";
import SelectField from "../ui/SelectField";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { document } from "../../api/document";
import TextAreaInput from "../ui/TextAreaInput";
import StateSelect from "../ui/StateCitySelect/StateSelect";
import type { State } from "../ui/StateCitySelect/types";
import { research } from "@v1/api/research";
import SearchableSelectField from "@v1/components/ui/SearchableSelectField";
import useDebounce from "@/hooks/useDebounce";
import { affiliate } from "@v1/api/affiliate";
import { Committees, Roles } from "@v1/constants/roles";
import { useAuth } from "@v1/contexts/AuthContext";

interface EditDocumentParam {
  doc: Document;
  onSuccess?: () => void;
  onCancel?: () => void;
  isOpen?: boolean;
}

export interface UpdateDocumentForm {
  id: number;
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
  affiliate_id?: number;
}

function EditDocument({
  doc,
  onSuccess,
  onCancel,
  isOpen: externalIsOpen = true,
}: EditDocumentParam) {
  const [updating, setUpdating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [affiliateSearch, setAffiliateSearch] = useState("");
  const debouncedSearch = useDebounce(affiliateSearch, 500);
  const { userRole } = useAuth();

  // Safely access properties with optional chaining
  const [formData, setFormData] = useState<UpdateDocumentForm>({
    id: doc?.id || 0,
    title: doc?.title || "",
    type: doc?.type || "",
    category: doc?.category || "",
    description: doc?.description || "",
    database_source: doc?.database_source || "",
    folder_id: doc?.folder?.id ? String(doc.folder.id) : "",
    contract_expiration_date: doc?.expiration_date || "",
    employer: doc?.employer || "",
    cbc: doc?.cbc || "",
    state: doc?.state || "",
    effective_date: doc?.effective_date || "",
    status: doc?.status || "active",
    keywords: doc?.keywords || "",
    sub_type: doc?.sub_type || "",
    year: doc?.year ? String(doc.year) : "",
    is_public: doc?.is_public || false,
    is_archived: doc?.is_archived || false,
    affiliate_id: doc.affiliate?.id ?? undefined,
  });

  const queryClient = useQueryClient();

  const handleCancel = () => {
    onCancel?.();
  };

  const default_affiliate_id = doc.affiliate?.id;
  const cachedData = queryClient.getQueryData([
    "affiliates-options-select",
    { debouncedSearch },
  ]);
  const isDefaultInCache =
    cachedData?.some((a: any) => a.id === default_affiliate_id) ?? false;

  const {
    data: affiliates,
    isFetching: fetchingAffiliates,
    isLoading: loadingAffiliates,
  } = useQuery({
    queryKey: ["affiliates-options-select", { debouncedSearch }],
    queryFn: () => affiliate.options(debouncedSearch, default_affiliate_id),
    refetchInterval(query) {
      if (isDefaultInCache) {
        return false;
      }
      return 1000;
    },
    enabled:
      !isDefaultInCache &&
      userRole.roles.some((r) =>
        [
          Roles.NATIONAL_ADMINISTRATOR,
          Roles.ORG_EXECUTIVE_COMMITEE,
          ...Committees.EXECUTIVE_COMMITTEE,
          ...Committees.REGIONAL_DIRECTORS,
        ].includes(r)
      ),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: UpdateDocumentForm) => research.update(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research-documents"] });
      toast.success("Document Updated");
      onSuccess?.();
    },
    onError: async (err: any) => {
      if (err?.errors) {
        setErrors(err.errors);
      } else {
        console.error(err);
        toast.error(err.message || "Failed to update document");
      }
      setUpdating(false);
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
  ];

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "category") {
      setFormData((prev) => ({
        ...prev,
        database_source: value,
      }));
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({ ...prev, [name]: [] }));
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    mutate(formData);
  };

  const handleStateChange = (state: State) => {
    setFormData((prev) => (prev ? { ...prev, ["state"]: state.name } : prev));
  };

  return (
    <Modal
      isOpen={externalIsOpen}
      onClose={handleCancel}
      title="Edit Document"
      className="max-w-4xl w-[95vw] md:w-full max-h-[90vh] overflow-hidden"
      size="xl"
    >
      <form onSubmit={handleUpdate} className="space-y-6">
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="pb-2 text-lg font-medium text-gray-900 border-b">
              Affiliate Information
            </h3>
            <SearchableSelectField
              label="Affiliate"
              name="affiliate_id"
              placeholder={
                fetchingAffiliates || loadingAffiliates
                  ? "fetching affiliates..."
                  : "Select an Affiliate"
              }
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
            />
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
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_public"
                    name="is_public"
                    checked={formData.is_public ?? false}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        is_public: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor="is_public"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Make Public
                  </label>
                </div>
                {formData.database_source === "contracts" &&
                  formData.type === "contract" && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_archived"
                        name="is_archived"
                        checked={formData.is_archived ?? false}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            is_archived: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label
                        htmlFor="is_archived"
                        className="ml-2 text-sm text-gray-700"
                      >
                        Archive
                      </label>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={handleCancel}
            type="button"
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            disabled={isPending || updating}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
            disabled={isPending || updating}
          >
            {(isPending || updating) && (
              <LoaderCircle size={18} className="animate-spin" />
            )}
            {updating ? "Updating..." : "Update Document"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default EditDocument;
