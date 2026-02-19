import ComboBox from "@/components/ui/ComboBox";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { NationalDocument } from "@v1/api";
import { affiliate } from "@v1/api/affiliate";
import { research } from "@v1/api/research";
import { categoryOptions } from "@v1/components/explorer/UploadDocument";
import RoleGuard from "@v1/components/RoleGuard";
import AlertMessage from "@v1/components/ui/AlertMessage";
import Modal from "@v1/components/ui/Modal";
import MultiSelectField from "@v1/components/ui/MultiSelectField";
import SearchableSelectField from "@v1/components/ui/SearchableSelectField";
import { National_Roles } from "@v1/constants/roles";
import { useAuth } from "@v1/contexts/AuthContext";
import type { UpdateDocumentForm } from "@v1/types";
import { useState, type ChangeEvent } from "react";

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
];

const outcomeOptions = [
  { value: "denied", label: "Denied" },
  { value: "sustained", label: "Sustained" },
  { value: "partial", label: "Partial" },
  { value: "dismissed", label: "Dismissed" },
  { value: "settlement", label: "Settlement" },
  { value: "supplemental_award", label: "Supplemental Award" },
  { value: "voluntary_settlement", label: "Voluntary Settlement" },
];

export type DocumentEditFormData = {
  id: number | null;
  affiliate_id: number | null;
  title: string;
  type: string;
  description: string;
  contract_expiration_date: string;
  effective_date: string;
  status: string;
  is_archived: boolean;
  keywords: string;

  award_date: string;
  arbitrator: string;
  outcome: string;

  is_public: boolean;
};

function EditDocument({
  type,
  doc,
  loading = false,
  isOpen = false,
  size = "md",
  folder_uid,
  affiliate_uid,
  queryKey,
  onClose,
  onSubmit,
  errors,
}: {
  type: "research" | "governance" | "national";
  doc: any;
  loading: boolean;
  isOpen: boolean;
  size?: string;
  folder_uid?: string | null;
  affiliate_uid?: string | null;
  queryKey?: any[];
  onClose: () => void;
  onSubmit: (doc: UpdateDocumentForm) => void;
  errors?: Record<string, string[]>;
}) {
  const { userRole } = useAuth();
  const [affiliateSearch, setAffiliateSearch] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const [form, setForm] = useState<UpdateDocumentForm>({});

  const hasChanges = Object.values(form).some(
    (value) => value !== null && value !== undefined,
  );

  const resetForm = () => {
    setForm({});
  };

  const handleInputChange = (e) => {
    const { name, value, type: inputType } = e.target;

    setForm((prev) => {
      let newForm = { ...prev };

      if (name === "type") {
        const typeFields = {
          contract: ["status", "expiration_date", "effective_date"],
          arbitration: ["award_date", "arbitrator", "outcome"],
        };

        Object.keys(typeFields).forEach((t) => {
          typeFields[t].forEach((field) => {
            if (t === value) {
              delete newForm[field];
            } else {
              if (doc[field] !== undefined && doc[field] !== null) {
                newForm[field] = null;
              } else {
                delete newForm[field];
              }
            }
          });
        });
      }
      const actualValue = inputType === "checkbox" ? e.target.checked : value;

      if (doc[name] !== undefined && actualValue === doc[name]) {
        delete newForm[name];
      } else {
        newForm[name] = actualValue;
      }

      return newForm;
    });

    if (
      name === "arbitrator" &&
      value &&
      !arbitration_options.includes(value)
    ) {
      queryClient.setQueryData(
        [`arbitrations-options-${inputType}`],
        (oldData: string[] | undefined) => {
          const currentData = oldData || [];
          return [...currentData, value].sort();
        },
      );
    }
  };

  const handleMultiSelectChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const {
    data: arbitration_options,
    isFetching: fetching_arbitration_options,
  } = useQuery({
    queryKey: [`arbitrations-options-${type}`],
    queryFn: () =>
      type === "national"
        ? NationalDocument.arbitrators()
        : research.arbitrators(),
    enabled:
      National_Roles.some((role) => userRole.roles.includes(role)) &&
      !affiliate_uid,
    staleTime: 40 * 60 * 1000,
    placeholderData: [],
  });

  const { data: affiliate_options, isFetching: fetching_affiliate_options } =
    useQuery({
      queryKey: ["affiliates-options-overview"],
      queryFn: () => affiliate.allAffiliates(),
      enabled:
        National_Roles.some((role) => userRole.roles.includes(role)) &&
        !affiliate_uid &&
        type !== "national",
      staleTime: 30 * 60 * 1000,
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  const currentType = form.type ?? doc.type;

  const showContractDetails = currentType === "contract";
  const showArbitrationDetails = currentType === "arbitration";

  let document_type_options: any[];
  switch (type) {
    case "governance":
      document_type_options = [
        { value: "bylaws", label: "Bylaws" },
        { value: "general", label: "General" },
      ];
      break;
    case "research":
      document_type_options = [
        { value: "contract", label: "Contract" },
        { value: "arbitration", label: "Arbitration" },
        { value: "mou", label: "MOU" },
        { value: "research", label: "Research" },
      ];
      break;
    case "national":
      document_type_options = [
        { value: "bylaws", label: "Bylaws" },
        { value: "general", label: "General" },
        { value: "contract", label: "Contract" },
        { value: "arbitration", label: "Arbitration" },
        { value: "mou", label: "MOU" },
        { value: "research", label: "Research" },
      ];
      break;
    default:
      document_type_options = [];
      break;
  }

  const filteredAffiliateOptions =
    affiliate_options?.filter((m) =>
      m.name.toLowerCase().includes(affiliateSearch.toLowerCase()),
    ) ?? [];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => {
          onClose();
          resetForm();
        }}
        title="Edit Document"
        className="max-w-4xl w-[95vw] md:w-full max-h-[90vh]"
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Scrollable Content */}
          <div className="flex-1 px-6 py-4 space-y-6">
            {errorMessage && (
              <AlertMessage type="error" message={errorMessage} />
            )}

            {/* Affiliate */}
            {type !== "national" && (
              <RoleGuard roles={National_Roles}>
                {!affiliate_uid && !folder_uid && (
                  <div>
                    <h3 className="mb-2 text-xs font-semibold tracking-wide text-gray-900 uppercase">
                      Affiliate Information
                    </h3>
                    <SearchableSelectField
                      label="Affiliate"
                      placeholder="Select Affiliate"
                      name="affiliate_id"
                      value={form.affiliate_id ?? doc.affiliate_id ?? ""}
                      onChange={handleInputChange}
                      options={[
                        ...(fetching_affiliate_options
                          ? [{ label: "Fetching Affiliates...", value: "" }]
                          : filteredAffiliateOptions.map((m) => ({
                              label: m.name,
                              value: m.id,
                            }))),
                      ]}
                      required={!affiliate_uid && !folder_uid}
                      searchValue={affiliateSearch}
                      onSearchChange={setAffiliateSearch}
                      loading={fetching_affiliate_options}
                    />
                  </div>
                )}
              </RoleGuard>
            )}

            {/* Basic Information */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold tracking-wide text-gray-900 uppercase">
                Basic Information
              </h3>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="block mb-1 text-xs font-medium text-gray-700">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={form.title ?? doc.title ?? ""}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-1.5 text-xs transition border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Document title"
                  />
                  {errors && errors.title?.length > 0 && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.title[0]}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block mb-1 text-xs font-medium text-gray-700">
                    Document Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type"
                    value={form.type ?? doc.type ?? ""}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-1.5 text-xs transition border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select type</option>
                    {document_type_options.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors && errors.type?.length > 0 && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.type[0]}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block mb-1 text-xs font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={form.description ?? doc.description ?? ""}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-1.5 text-xs transition border border-gray-300 rounded-lg outline-none resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief description of the document"
                  />
                  {errors && errors.description?.length > 0 && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.description[0]}
                    </p>
                  )}
                </div>

                {type === "national" && (
                  <MultiSelectField
                    name="category"
                    label="Category (Multiple Selection)"
                    value={form.category ?? doc.category ?? []}
                    options={categoryOptions}
                    onChange={handleInputChange}
                    error={errors?.category?.[0]}
                    className="md:col-span-2"
                    required
                  />
                )}

                <div className="md:col-span-2">
                  <label className="block mb-1 text-xs font-medium text-gray-700">
                    Keywords
                  </label>
                  <input
                    type="text"
                    name="keywords"
                    value={form.keywords ?? doc.keywords ?? ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 text-xs transition border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Comma-separated keywords"
                  />
                  {errors && errors.keywords?.length > 0 && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.keywords[0]}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {showArbitrationDetails && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold tracking-wide text-gray-900 uppercase">
                  Arbitration Details
                </h3>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-700">
                      Arbitrator
                    </label>
                    <ComboBox
                      required
                      name="arbitrator"
                      allowAddNew
                      placeholder="Select or Type Arbitrator"
                      value={form.arbitrator ?? doc.arbitrator ?? ""}
                      onChange={handleInputChange}
                      options={
                        fetching_arbitration_options
                          ? []
                          : arbitration_options?.data ||
                            arbitration_options ||
                            []
                      }
                      error={errors?.arbitrator?.[0]}
                    />
                    {errors && errors.arbitrator?.length > 0 && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.arbitrator[0]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-700">
                      Award Date
                    </label>
                    <input
                      type="date"
                      name="award_date"
                      value={form.award_date ?? doc.award_date ?? ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-1.5 text-xs transition border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors && errors.award_date?.length > 0 && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.award_date[0]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-700">
                      Outcome
                    </label>
                    <select
                      name="outcome"
                      value={form.outcome ?? doc.outcome ?? ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-1.5 text-xs transition border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Outcome</option>
                      {outcomeOptions.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                    {errors && errors.outcome?.length > 0 && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.outcome[0]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Contract Details - Only show when type is "contract" */}
            {showContractDetails && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold tracking-wide text-gray-900 uppercase">
                  Contract Details
                </h3>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      name="status"
                      required
                      value={form.status ?? doc.status ?? ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-1.5 text-xs transition border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select status</option>
                      {statusOptions.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                    {errors && errors.status?.length > 0 && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.status[0]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-700">
                      Effective Date
                    </label>
                    <input
                      required
                      type="date"
                      name="effective_date"
                      value={form.effective_date ?? doc.effective_date ?? ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-1.5 text-xs transition border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors && errors.effective_date?.length > 0 && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.effective_date[0]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-700">
                      Contract Expiration Date
                    </label>
                    <input
                      type="date"
                      required
                      name="expiration_date"
                      value={form.expiration_date ?? doc.expiration_date ?? ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-1.5 text-xs transition border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors && errors.expiration_date?.length > 0 && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.expiration_date[0]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                onClose();
                resetForm();
              }}
              className="px-4 py-2 text-xs font-medium text-gray-700 transition bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !hasChanges}
              className="px-4 py-2 text-xs font-medium text-white transition bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Updating..." : "Update Document"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default EditDocument;
