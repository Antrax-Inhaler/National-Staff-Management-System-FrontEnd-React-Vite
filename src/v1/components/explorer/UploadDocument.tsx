import ComboBox from "@/components/ui/ComboBox";
import useDebounce from "@/hooks/useDebounce";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { NationalDocument } from "@v1/api";
import { affiliate } from "@v1/api/affiliate";
import { governance } from "@v1/api/governance";
import { research } from "@v1/api/research";
import RoleGuard from "@v1/components/RoleGuard";
import AlertMessage from "@v1/components/ui/AlertMessage";
import Modal from "@v1/components/ui/Modal";
import MultiSelectField from "@v1/components/ui/MultiSelectField";
import SearchableSelectField from "@v1/components/ui/SearchableSelectField";
import { National_Roles } from "@v1/constants/roles";
import { useAuth } from "@v1/contexts/AuthContext";
import type { DocumentForm } from "@v1/types";
import { FileText, Plus, Upload, X } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";

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

export const categoryOptions = [
  { value: "Affiliation", label: "Affiliation" },
  {
    value: "Awards & Scholarships",
    label: "Awards & Scholarships",
  },
  { value: "CBC", label: "CBC" },
  { value: "Financial Reports", label: "Financial Reports" },
  { value: "Forms", label: "Forms" },
  { value: "Grievance", label: "Grievance" },
  { value: "Handbooks", label: "Handbooks" },
  { value: "HTUP", label: "HTUP" },
  { value: "RA", label: "RA" },
  { value: "Working Committees", label: "Working Committees" },
  { value: "Year", label: "Year" },
];

function UploadDocument({
  type,
  size = "md",
  queryKey,
}: {
  type: "research" | "governance" | "national";
  size?: string;
  queryKey?: any[];
}) {
  const { affiliate_uid } = useParams<{
    affiliate_uid?: string;
  }>();
  const { userRole } = useAuth();
  const [open, setOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [affiliateSearch, setAffiliateSearch] = useState("");
  const debouncedSearch = useDebounce(affiliateSearch, 500);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const queryClient = useQueryClient();

  const [form, setForm] = useState<DocumentForm>({
    affiliate_id: null,

    title: null,
    description: null,
    type: null,
    category_group: null,
    keywords: null,
    file: null,
    category: [],

    status: null,
    expiration_date: null,
    effective_date: null,

    award_date: null,
    arbitrator: null,
    outcome: null,
  });

  const isNational = National_Roles.some((role) =>
    userRole.roles.includes(role),
  );

  const buttonSizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-xs",
    lg: "px-5 py-2.5 text-xs",
  };

  const resetForm = () => {
    setForm({
      affiliate_id: null,

      title: null,
      description: null,
      type: null,
      category_group: null,
      keywords: null,
      file: null,

      status: null,
      expiration_date: null,
      effective_date: null,

      award_date: null,
      arbitrator: null,
      outcome: null,
    });
    setUploadProgress(0);
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = e.target.checked;
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else if (Array.isArray(value)) {
      // Handle array values from MultiSelect
      setForm((prev) => ({ ...prev, [name]: value }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }

    // Add new option to the cached list if it doesn't exist
    if (
      name === "arbitrator" &&
      value &&
      !arbitration_options.includes(value)
    ) {
      queryClient.setQueryData(
        [`arbitrations-options-${type}`],
        (oldData: string[] | undefined) => {
          const currentData = oldData || [];
          return [...currentData, value].sort(); // Add and sort alphabetically
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
    refetch: refreshArbitrators,
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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, file }));

    // Simulate upload progress
    if (file) {
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 100);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleUpload = (payload: DocumentForm) => {
    setErrorMessage(null);
    switch (type) {
      case "research":
        return research.upload(payload, affiliate_uid);

      case "governance":
        return governance.upload(payload, affiliate_uid);

      case "national":
        return NationalDocument.upload(payload);

      default:
        return NationalDocument.upload(payload);
    }
  };

  const { mutate, isPending } = useMutation({
    mutationFn: handleUpload,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKey,
      });
      toast.success("Document Uploaded");
      setOpen(false);
      resetForm();
    },
    onError: async (err: any) => {
      if (err?.errors) {
        setErrors(err.errors);
      } else {
        console.error(err);
        toast.error(err.message || "Failed to upload document");
      }
      setErrorMessage("Failed to upload document");
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      affiliate_uid: affiliate_uid ?? null,
    };
    try {
      mutate(payload);
    } catch (error) {
      console.error("Error uploading document:", error);
    } finally {
    }
  };

  const filteredAffiliateOptions =
    affiliate_options?.filter((m) =>
      m.name.toLowerCase().includes(affiliateSearch.toLowerCase()),
    ) ?? [];

  const showContractDetails = form.type === "contract";
  const showArbitrationDetails = form.type === "arbitration";

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

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-2 font-semibold text-white transition bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 ${buttonSizeClasses[size]}`}
      >
        <Plus size={14} />
        <span>Upload Document</span>
      </button>

      <Modal
        isOpen={open}
        onClose={() => {
          setOpen(false);
          resetForm();
        }}
        title="Upload New Document"
        className="max-w-4xl w-[95vw] md:w-full max-h-[90vh]"
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Scrollable Content */}
          <div className="flex-1 px-6 py-4 space-y-6">
            {errorMessage && (
              <AlertMessage type="error" message={errorMessage} />
            )}
            {/* File Upload Section */}
            <div className="p-6 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50">
              {!form.file ? (
                <label className="flex flex-col items-center justify-center cursor-pointer">
                  <Upload className="w-10 h-10 mb-2 text-gray-400" />
                  <span className="mb-1 text-xs font-medium text-gray-700">
                    Click to attach document
                  </span>
                  <span className="text-xs text-gray-500">PDF (Max 50MB)</span>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                  />
                </label>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {form.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(form.file.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, file: null }));
                        setUploadProgress(0);
                      }}
                      className="flex-shrink-0 text-gray-400 hover:text-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">
                        {uploadProgress < 100
                          ? "Uploading..."
                          : "Ready to upload"}
                      </span>
                      <span className="font-medium text-gray-700">
                        {uploadProgress}%
                      </span>
                    </div>
                    <div className="w-full h-2 overflow-hidden bg-gray-200 rounded-full">
                      <div
                        className="h-full transition-all duration-300 bg-blue-600 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Affiliate */}
            {type !== "national" && (
              <RoleGuard roles={National_Roles}>
                {!affiliate_uid && (
                  <div>
                    <h3 className="mb-2 text-xs font-semibold tracking-wide text-gray-900 uppercase">
                      Affiliate Information
                    </h3>
                    <SearchableSelectField
                      label="Affiliate"
                      placeholder="Select Affiliate"
                      name="affiliate_id"
                      value={form.affiliate_id}
                      onChange={handleInputChange}
                      options={[
                        ...(fetching_affiliate_options
                          ? [{ label: "Fetching Affiliates...", value: "" }]
                          : filteredAffiliateOptions.map((m) => ({
                              label: m.name,
                              value: m.id,
                            }))),
                      ]}
                      required={!affiliate_uid}
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
                    value={form.title ?? ""}
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

                {type === "national" && (
                  <MultiSelectField
                    name="category"
                    label="Category (Multiple Selection)"
                    value={form.category}
                    options={categoryOptions}
                    onChange={handleInputChange}
                    error={errors?.category?.[0]}
                    className="md:col-span-2"
                    required
                  />
                )}

                <div className="md:col-span-2">
                  <label className="block mb-1 text-xs font-medium text-gray-700">
                    Document Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type"
                    value={form.type ?? ""}
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
                    value={form.description ?? ""}
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

                <div className="md:col-span-2">
                  <label className="block mb-1 text-xs font-medium text-gray-700">
                    Keywords
                  </label>
                  <input
                    type="text"
                    name="keywords"
                    value={form.keywords ?? ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-1.5 text-xs transition border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Comma-separated keywords"
                  />
                </div>
                {errors && errors.keywords?.length > 0 && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.keywords[0]}
                  </p>
                )}
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
                      placeholder="Select or Type Arbitrator"
                      allowAddNew
                      addNewLabel="Add Arbitrator"
                      value={form.arbitrator ?? ""}
                      onChange={handleInputChange}
                      options={
                        fetching_arbitration_options
                          ? []
                          : arbitration_options?.data ||
                            arbitration_options ||
                            []
                      }
                      onRefresh={refreshArbitrators}
                      isRefreshing={fetching_arbitration_options}
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
                      required
                      name="award_date"
                      value={form.award_date ?? ""}
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
                      required
                      name="outcome"
                      value={form.outcome ?? ""}
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
                      required
                      name="status"
                      value={form.status ?? ""}
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
                      value={form.effective_date ?? ""}
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
                      Expiration_date
                    </label>
                    <input
                      required
                      type="date"
                      name="expiration_date"
                      value={form.expiration_date ?? ""}
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
                setOpen(false);
                resetForm();
              }}
              className="px-4 py-2 text-xs font-medium text-gray-700 transition bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                type !== "national" &&
                (isPending ||
                  !form.file ||
                  uploadProgress < 100 ||
                  (isNational && !form.affiliate_id && !affiliate_uid))
              }
              className="px-4 py-2 text-xs font-medium text-white transition bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Uploading..." : "Upload Document"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default UploadDocument;
