import useDebounce from "@/hooks/useDebounce";
import {
  useIsFetching,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { NationalDocument } from "@v1/api";
import { affiliate } from "@v1/api/affiliate";
import { document } from "@v1/api/document";
import { governance } from "@v1/api/governance";
import { research } from "@v1/api/research";
import PdfViewer from "@v1/components/PdfViewer";
import RoleGuard from "@v1/components/RoleGuard";
import DocumentCard from "@v1/components/document/DocumentCard";
import EditDocument, {
  type DocumentEditFormData,
} from "@v1/components/explorer/EditDocument";
import UploadDocument from "@v1/components/explorer/UploadDocument";
import AdvancedFilter, {
  type FilterSection,
} from "@v1/components/ui/AdvancedFilter";
import Badge from "@v1/components/ui/Badge";
import ConfirmationPopUp from "@v1/components/ui/ConfirmationPopUp";
import SearchInput from "@v1/components/ui/SearchInput";
import SearchableMultiSelectFilter, {
  type FilterOption,
} from "@v1/components/ui/SearchableMultiSelectFilter";
import { GetState } from "@v1/components/ui/StateCitySelect/utils";
import { type Column } from "@v1/components/ui/Table";
import DataTable from "@v1/components/ui/tables/DataTable";
import { National_Roles } from "@v1/constants/roles";
import { useAuth } from "@v1/contexts/AuthContext";
import { getFileExtension, toSnakeCaseFileName } from "@v1/helpers/formatter";
import { fileTypeFormat } from "@v1/helpers/helper";
import HelpButton from "@v1/components/help/HelpButton";
import type {
  AffiliateFilter,
  ArbitrationFilter,
  ContractFilter,
  Document,
  DocumentOverviewProp,
  OverviewFilter,
  PaginatedData,
  UpdateDocumentForm,
} from "@v1/types";
import {
  ArrowDownUp,
  Building2,
  Download,
  FileText,
  FileUser,
  FolderOpen,
  LayoutGrid,
  LoaderCircle,
  RefreshCcw,
  Rows3,
  ScrollText,
  SquarePen,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useParams, useSearchParams } from "react-router-dom";
import { Positions } from "@v1/constants/positions";
import { extractAndFormatDate } from "@v1/helpers/simpleDateUtils";

export default function NewOverview({ type }: DocumentOverviewProp) {
  const { affiliate_uid } = useParams<{
    affiliate_uid?: string;
  }>();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewingPdfDocument, setViewingPdfDocument] = useState<any | null>(
    null,
  );

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [downloadId, setDownloadId] = useState<number | null>(null);

  const { userRole } = useAuth();

  const [affiliateSearch, setAffiliateSearch] = useState("");
  const debouncedSearch = useDebounce(affiliateSearch, 500);
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedAffiliates, setSelectedAffiliates] = useState<FilterOption[]>(
    [],
  );
  const [selectedType, setSelectedType] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "table">("table");

  const NationalRole = National_Roles.some((role) =>
    userRole.roles.includes(role),
  );

  const OverviewRoles =
    National_Roles.some((role) => userRole.roles.includes(role)) ||
    [
      Positions.PRESIDENT,
      Positions.BARGAINING_CHAIR,
      Positions.GRIEVANCE_CHAIR,
    ].some((position) => userRole.position.includes(position));

  const { data: affiliate_options, isFetching: fetching_affiliate_options } =
    useQuery({
      queryKey: ["affiliates-options-overview"],
      queryFn: () => affiliate.allAffiliates(),
      enabled: OverviewRoles && !affiliate_uid,
      staleTime: 30 * 60 * 1000,
    });

  const selectedAffiliate = useMemo(() => {
    if (!affiliate_options || !affiliate_uid) return null;

    return affiliate_options.find(
      (affiliate) => affiliate.public_uid === affiliate_uid,
    );
  }, [affiliate_options, affiliate_uid]);

  const { data: states, isFetching: stateFetching } = useQuery({
    queryKey: ["US-STATES"],
    queryFn: () => GetState(233),
    staleTime: Infinity,
  });

  const {
    data: affiliate_employer_options,
    isFetching: affiliate_contract_employer_options,
    refetch,
  } = useQuery({
    queryKey: ["affiliate-employers-options"],
    queryFn: () => affiliate.employers(),
    enabled: OverviewRoles,
    staleTime: 1000 * 60 * 60,
  });

  const filters: OverviewFilter = useMemo(() => {
    const affiliate_filter: AffiliateFilter = {
      affiliate_id: selectedAffiliates.map((item) => String(item.value)),
      cbc_region: searchParams.getAll("cbc_region"),
      ORG_region: searchParams.getAll("ORG_region"),
      affiliate_type: searchParams.getAll("affiliate_type"),
      employer: searchParams.getAll("employer"),
      state: searchParams.getAll("state"),
    };

    const contract_filter: ContractFilter = {
      status: searchParams.getAll("status"),
      expire_from: searchParams.get("expire_from") ?? "",
      expire_to: searchParams.get("expire_to") ?? "",
      effective_from: searchParams.get("effective_from") ?? "",
      effective_to: searchParams.get("effective_to") ?? "",
    };

    const arbitration_filter: ArbitrationFilter = {
      outcome: searchParams.getAll("outcome"),
      award_date_to: searchParams.get("award_date_to") ?? "",
      award_date_from: searchParams.get("award_date_from") ?? "",
      arbitrator: searchParams.get("arbitrator") ?? "",
    };

    const URLQueryTypes = searchParams.getAll("type");
    const URLQueryCategories = searchParams.getAll("category");

    const main_filter: OverviewFilter = {
      sort_by:
        searchParams.get("sort_by") ??
        (selectedType === "arbitration" ? "award_date" : undefined),
      sort_order:
        searchParams.get("sort_order") ??
        (selectedType === "arbitration" ? "desc" : undefined),
      per_page: searchParams.get("per_page") ?? "20",
      page: Number(searchParams.get("page") ?? 1),
      document_type:
        URLQueryTypes.length > 0
          ? URLQueryTypes
          : selectedType
            ? [selectedType]
            : [],
      category:
        URLQueryCategories.length > 0
          ? URLQueryCategories
          : selectedCategory
            ? [selectedCategory]
            : [],
      search: searchParams.get("search") ?? "",
      public: Boolean(searchParams.get("public")),
      ...arbitration_filter,
      ...contract_filter,
      ...affiliate_filter,
    };

    return main_filter;
  }, [searchParams, selectedAffiliates, selectedType, selectedCategory]);

  let queryKey: any[];
  let header_title: string;
  let filtered_status: any[];
  let document_type_filter: any[];
  let category_filter: any[] = [];
  let visible_columns: string[];

  switch (type) {
    case "research":
      switch (selectedType) {
        case "contract":
          visible_columns = [
            "title",
            "affiliate",
            "type",
            "status",
            "effective_date",
            "expiration_date",
            "uploaded_by",
          ];
          break;
        case "arbitration":
          visible_columns = [
            "title",
            "affiliate",
            "type",
            "award_date",
            "uploaded_by",
          ];
          break;
        default:
          visible_columns = [
            "title",
            "affiliate",
            "type",
            "award_date",
            "effective_date",
            "expiration_date",
            "status",
            "uploaded_by",
          ];
          break;
      }

      filtered_status = [
        { id: "", name: "View All", count: 0 },
        { id: "contract", name: "Contracts", count: 0 },
        { id: "arbitration", name: "Arbitrations", count: 0 },
        { id: "mou", name: "MOUs", count: 0 },
      ];
      document_type_filter = [
        { label: "Contract", value: "contract" },
        { label: "Arbitration", value: "arbitration" },
        { label: "Research", value: "research" },
        { label: "MOU", value: "mou" },
      ];

      queryKey = ["research-overview", filters, affiliate_uid];
      header_title = affiliate_uid
        ? (selectedAffiliate?.name ?? "Affiliate Research Documents")
        : OverviewRoles
          ? "Document Overview"
          : "Research Documents";
      break;

    case "governance":
      visible_columns = [
        "title",
        "affiliate",
        "type",
        "status",
        "keywords",
        "uploaded_by",
      ];
      filtered_status = [
        { id: "", name: "View All", count: 0 },
        { id: "general", name: "General", count: 0 },
        { id: "bylaws", name: "Bylaws", count: 0 },
      ];
      document_type_filter = [
        { value: "general", label: "General" },
        { value: "bylaws", label: "Bylaws" },
      ];
      queryKey = ["governance_overview", filters, affiliate_uid];
      header_title = affiliate_uid
        ? (selectedAffiliate?.name ?? "Affiliate Governance Documents")
        : OverviewRoles
          ? "Document Overview"
          : "Governance Documents";
      break;

    case "national":
      visible_columns = [
        "title",
        "type",
        "status",
        "category",
        "keywords",
        "uploaded_by",
      ];
      filtered_status = [
        { id: "", name: "View All", count: 0 },
        { id: "Affiliation", name: "Affiliation", count: 0 },
        {
          id: "Awards & Scholarships",
          name: "Awards & Scholarships",
          count: 0,
        },
        { id: "CBC", name: "CBC", count: 0 },
        { id: "Financial Reports", name: "Financial Reports", count: 0 },
        { id: "Forms", name: "Forms", count: 0 },
        { id: "Grievance", name: "Grievance", count: 0 },
        { id: "Handbooks", name: "Handbooks", count: 0 },
        { id: "HTUP", name: "HTUP", count: 0 },
        { id: "RA", name: "RA", count: 0 },
        { id: "Working Committees", name: "Working Committees", count: 0 },
        { id: "Year", name: "Year", count: 0 },
      ];

      category_filter = [
        {
          value: "Affiliation",
          label: "Affiliation",
          color: "bg-blue-100! text-blue-800!",
        },
        {
          value: "Awards & Scholarships",
          label: "Awards & Scholarships",
          color: "bg-purple-100! text-purple-800!",
        },
        { value: "CBC", label: "CBC", color: "bg-green-100 text-green-800" },
        {
          value: "Financial Reports",
          label: "Financial Reports",
          color: "bg-yellow-100! text-yellow-800!",
        },
        { value: "Forms", label: "Forms", color: "bg-pink-100 text-pink-800" },
        {
          value: "Grievance",
          label: "Grievance",
          color: "bg-red-100! text-red-800!",
        },
        {
          value: "Handbooks",
          label: "Handbooks",
          color: "bg-indigo-100! text-indigo-800!",
        },
        {
          value: "HTUP",
          label: "HTUP",
          color: "bg-orange-100! text-orange-800!",
        },
        { value: "RA", label: "RA", color: "bg-teal-100! text-teal-800!" },
        {
          value: "Working Committees",
          label: "Working Committees",
          color: "bg-cyan-100! text-cyan-800!",
        },
        { value: "Year", label: "Year", color: "bg-gray-100! text-gray-800!" },
      ];

      document_type_filter = [
        { value: "general", label: "General" },
        { value: "bylaws", label: "Bylaws" },
        { label: "Contract", value: "contract" },
        { label: "Arbitration", value: "arbitration" },
        { label: "Research", value: "research" },
        { label: "MOU", value: "mou" },
      ];
      queryKey = ["national-documents", filters];
      header_title = "National Documents";
      break;

    default:
      visible_columns = ["title", "type", "status", "keywords", "uploaded_by"];
      filtered_status = [
        { id: "", name: "View All", count: 0 },
        { id: "general", name: "General", count: 0 },
        { id: "bylaws", name: "Bylaws", count: 0 },
        { id: "contract", name: "Contracts", count: 0 },
        { id: "arbitration", name: "Arbitrations", count: 0 },
        { id: "mou", name: "MOUs", count: 0 },
      ];
      document_type_filter = [
        { value: "general", label: "General" },
        { value: "bylaws", label: "Bylaws" },
        { label: "Contract", value: "contract" },
        { label: "Arbitration", value: "arbitration" },
        { label: "Research", value: "research" },
        { label: "MOU", value: "mou" },
      ];
      queryKey = ["national-documents", filters];
      header_title = "National Documents";
      break;
  }

  const fetching_documents = useIsFetching({ queryKey: queryKey }) > 0;

  const fetchDocuments = async (): Promise<PaginatedData<Document>> => {
    switch (type) {
      case "research":
        return affiliate_uid
          ? research.affiliate(filters, affiliate_uid)
          : research.index(filters);
      case "governance":
        return affiliate_uid
          ? governance.affiliate(filters, affiliate_uid)
          : governance.index(filters);
      case "national":
        return NationalDocument.index(filters);
      default:
        return {
          items: [],
          current_page: 1,
          last_page: 1,
          per_page: 20,
          total: 0,
          sort_by: filters.sort_by,
          sort_order: filters.sort_order,
        };
    }
  };

  const updateDocument = (payload: UpdateDocumentForm) => {
    switch (type) {
      case "research":
        return research.update(payload, selectedDocument.id);
        break;
      case "governance":
        return governance.update(payload, selectedDocument.id);
        break;
      case "national":
        return NationalDocument.update(payload, selectedDocument.id);
        break;
      default:
        return Promise.resolve([]);
        break;
    }
  };

  const deleteDocument = (document_id: number) => {
    switch (type) {
      case "research":
        return research.delete(document_id);
        break;
      case "governance":
        return governance.delete(document_id);
        break;
      case "national":
        return NationalDocument.delete(document_id);
        break;
      default:
        return Promise.resolve([]);
        break;
    }
  };

  const { mutate: deleteDoc, isPending: deleting_document } = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.setQueryData(queryKey, (old: any, document_id: number) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.filter((item: any) => item.id !== document_id),
        };
      });
      toast.success("Document deleted successfully");
      queryClient.invalidateQueries({ queryKey: queryKey });
      setDeletingId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete document");
      setDeletingId(null);
    },
  });

  const { mutate: updateDoc, isPending: updating_document } = useMutation({
    mutationFn: updateDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKey,
      });
      setShowEditModal(true);
      setSelectedDocument(null);
      toast.success("Document Updated");
    },
    onError: async (err: any) => {
      if (err?.errors) {
        console.log(err.errors);
      } else {
        console.error(err);
      }
      toast.error(err.message || "Failed to upload document");
    },
  });

  const { mutate: downloadDoc, isPending: downloading } = useMutation({
    mutationFn: (id: number) => document.download(id),
    onSuccess: (blob) => {
      // Create a temporary <a> element to trigger download
      const link = window.document.createElement("a");
      link.href = blob;
      link.download = fileName ?? "File";
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);

      // Optional: revoke the object URL to free memory
      window.URL.revokeObjectURL(blob);

      toast.success("Download Complete");
    },
    onError: (err: any) => {
      toast.success("Can't Download File");
    },
  });

  const handleDownload = (document: Document) => {
    setFileName(toSnakeCaseFileName(document.title));
    setDownloadId(document.id);
    downloadDoc(document.id);
  };

  const hasCachedData = queryClient.getQueryData(queryKey) !== undefined;

  const handleViewPDF = (document: any) => {
    setViewingPdfDocument(document);
  };

  const handleBackToList = () => {
    setViewingPdfDocument(null);
  };

  const handleEditDocument = (document: any) => {
    setSelectedDocument(document);
    setShowEditModal(true);
  };

  const handleDeleteDocument = (documentId: number) => {
    deleteDoc(documentId);
    setDeletingId(documentId);
  };

  const handleClear = () => {
    setSelectedAffiliates([]);
  };

  const removeFilteredAffiliate = (id: string | number) => {
    setSelectedAffiliates((prev) =>
      prev.filter((affiliate) => affiliate.value !== id),
    );
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const updateSearchParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    // Reset to page 1 when filters change
    if (key !== "page") {
      newParams.set("page", "1");
    }
    setSearchParams(newParams);
  };

  const handleSearchChange = (value: string) => {
    updateSearchParam("search", value);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKey });
  };

  const handleApplyFilters = (params: URLSearchParams) => {
    setSearchParams(params);
    fetchDocuments();
  };

  const filter_options: FilterSection[] = [
    {
      title: "Sort Options",
      layout: "grid",
      icon: ArrowDownUp,
      filters: [
        {
          key: "sort_by",
          label: "Sort By",
          type: "select",
          options: [
            { label: "Title", value: "title" },
            { label: "Document Type", value: "type" },
            { label: "Sub Type", value: "sub_type" },
            { label: "Category", value: "category" },
            { label: "Status", value: "status" },
            { label: "Year", value: "year" },
            { label: "Uploaded By", value: "uploaded_by" },
            { label: "Outcome", value: "outcome" },
            { label: "Uploaded At", value: "created_at" },
          ],
        },
        {
          key: "sort_order",
          label: "Order",
          type: "select",
          options: [
            { label: "Ascending", value: "asc" },
            { label: "Descending", value: "desc" },
          ],
        },
      ],
    },
    {
      title: "Filters",
      description: "",
      icon: FileText,
      filters:
        type !== "national"
          ? [
              {
                key: "type",
                label: "Document Type",
                type: "checkbox",
                options: document_type_filter,
              },
            ]
          : [
              {
                key: "type",
                label: "Document Type",
                type: "checkbox",
                options: document_type_filter,
              },
              {
                key: "category",
                label: "Category",
                type: "checkbox",
                options: category_filter,
              },
            ],
    },
    {
      title: "Affiliate Filters",
      description: "",
      icon: Building2,
      filters: [
        {
          key: "affiliate_type",
          label: "Affiliate Type",
          type: "checkbox",
          options: [
            { value: "Associate", label: "Associate" },
            { value: "Professional", label: "Professional" },
            { value: "Wall-to-Wall", label: "Wall-to-Wall" },
          ],
        },
        {
          key: "employer",
          label: "Employer",
          type: "multiselect",
          onRefresh: () => refetch(),
          refreshing: affiliate_contract_employer_options,
          loading: affiliate_contract_employer_options,
          options:
            affiliate_employer_options?.map((data: any) => ({
              value: String(data.label),
              label: String(data.label),
            })) ?? [],
        },
        {
          key: "state",
          label: "State",
          type: "multiselect",
          refreshing: stateFetching,
          loading: stateFetching,
          options:
            states?.map((data: any) => ({
              value: String(data.name),
              label: String(data.name),
            })) ?? [],
        },
        {
          key: "cbc_region",
          label: "CBC Region",
          type: "multiselect",
          options: [
            { value: "Northeast", label: "Northeast" },
            { value: "Corridor", label: "Corridor" },
            { value: "South", label: "South" },
            { value: "Central", label: "Central" },
            { value: "Western", label: "Western" },
            { value: "local", label: "Local" },
          ],
        },
        {
          key: "ORG_region",
          label: "ORG Region",
          type: "multiselect",
          options: [
            { value: "1", label: "Region 1" },
            { value: "2", label: "Region 2" },
            { value: "3", label: "Region 3" },
            { value: "4", label: "Region 4" },
            { value: "5", label: "Region 5" },
            { value: "6", label: "Region 6" },
            { value: "7", label: "Region 7" },
          ],
        },
      ],
    },

    {
      title: "Contract Filters",
      description: "",
      icon: FileUser,
      filters: [
        {
          key: "status",
          label: "Status",
          type: "checkbox",
          options: [
            { value: "active", label: "Active" },
            { value: "expired", label: "Expired" },
            { value: "negotiation", label: "Negotiation" },
            { value: "draft", label: "Draft" },
          ],
        },
        {
          key: "effective",
          label: "Effective Date",
          type: "dateRange",
        },
        {
          key: "expire",
          label: "Expiration Date",
          type: "dateRange",
        },
      ],
    },
    {
      title: "Arbitration Filters",
      description: "",
      icon: ScrollText,
      filters: [
        {
          key: "outcome",
          label: "Outcome",
          type: "multiselect",
          options: [
            { value: "denied", label: "Denied" },
            { value: "sustained", label: "Sustained" },
            { value: "partial", label: "Partial" },
            { value: "dismissed", label: "Dismissed" },
            { value: "settlement", label: "Settlement" },
            { value: "supplemental_award", label: "Supplemental Award" },
            { value: "voluntary_settlement", label: "Voluntary Settlement" },
          ],
        },

        {
          key: "award_date",
          label: "Award Date",
          type: "dateRange",
        },
        {
          key: "arbitrator",
          label: "Arbitrator",
          type: "text",
        },
      ],
    },
  ];

  const categoryColorMap = Object.fromEntries(
    category_filter.map((cat) => [cat.value, cat.color]),
  );

  const columns: Column<Document>[] = [
    {
      key: "title",
      header: "Document",
      accessor: (row) => (
        <div className="space-y-0.5 text-xs">
          {/* Document title */}
          <div
            onClick={() => handleViewPDF(row)}
            className="font-bold text-gray-900 truncate max-w-[260px] hover:text-blue-600 cursor-pointer"
          >
            {row.title}
          </div>

          {/* File name + size */}
          <div className="flex items-center gap-2 text-gray-500">
            <span className="truncate max-w-[180px]">
              {" "}
              {row.file_name && toSnakeCaseFileName(row.title)}.
              {row.file_name &&
                `.${getFileExtension(row.file_name).toLocaleLowerCase()}`}
            </span>
            <span className="whitespace-nowrap">
              • {(row.file_size / 1024).toFixed(1)} KB
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "affiliate",
      header: "Affiliate",
      accessor: (row) => (
        <div className="text-xs text-gray-700 truncate max-w-[200px]">
          {row.affiliate?.name ?? "—"}
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      accessor: (row) => (
        <Badge>
          <span className="text-xs font-bold">{fileTypeFormat(row.type)}</span>
        </Badge>
      ),
    },
    {
      key: "category",
      header: "Category",
      accessor: (row) => {
        const sortedCategories = [...(row.category || [])].sort((a, b) =>
          a.localeCompare(b),
        );

        return (
          <div className="flex flex-wrap gap-2">
            {sortedCategories.map((cat) => (
              <Badge key={cat} className={categoryColorMap[cat]}>
                <span className="text-xs font-bold">{fileTypeFormat(cat)}</span>
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      accessor: (row) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full capitalize ${
            row.status === "active"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {row.status ?? "-"}
        </span>
      ),
    },
    {
      key: "award_date",
      header: "Award Date",
      accessor: (row) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full capitalize `}
        >
          {row.award_date && extractAndFormatDate(row.award_date)}
        </span>
      ),
    },
    {
      key: "effective_date",
      header: "Effective Date",
      accessor: (row) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full capitalize `}
        >
          {row.effective_date && extractAndFormatDate(row.effective_date)}
        </span>
      ),
    },
    {
      key: "expiration_date",
      header: "Expiration Date",
      accessor: (row) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full capitalize `}
        >
          {row.expiration_date && extractAndFormatDate(row.expiration_date)}
        </span>
      ),
    },
    {
      key: "keywords",
      header: "Keywords",
      accessor: (row) => {
        if (!row.keywords)
          return <span className="text-xs text-gray-400">—</span>;

        const keywords = row.keywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean);

        return (
          <div className="flex flex-wrap gap-1 max-w-[220px]">
            {keywords.map((keyword) => (
              <span
                key={keyword}
                className="inline-flex items-center px-2 py-0.5 text-xs font-medium
                       bg-gray-100 text-gray-700 rounded-md"
                title={keyword}
              >
                {keyword}
              </span>
            ))}
          </div>
        );
      },
    },

    {
      key: "uploaded_by",
      header: "Uploader",
      accessor: (row) => (
        <div className="space-y-0.5 text-xs">
          <div className="font-medium text-gray-800">
            {row.uploaded_by ?? "—"}
          </div>
          <div className="text-gray-500">
            {row.created_at
              ? new Date(row.created_at).toLocaleDateString()
              : "—"}
          </div>
        </div>
      ),
    },
  ];

  const visible_filter_options = filter_options.filter((section) => {
    // Hide Contract and Arbitration filters if type is not "research"
    if (type !== "research") {
      if (
        section.title === "Contract Filters" ||
        section.title === "Arbitration Filters"
      ) {
        return false;
      }
    }

    if (type === "national") {
      if (section.title === "Affiliate Filters") {
        return false;
      }
    }

    // Optional: additional logic if type is "research"
    if (type === "research") {
      if (!OverviewRoles && section.title === "Affiliate Filters") {
        return false;
      }
      if (
        selectedType === "arbitration" &&
        section.title === "Contract Filters"
      ) {
        return false;
      }
      if (
        selectedType === "contract" &&
        section.title === "Arbitration Filters"
      ) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="flex flex-col p-0 space-y-6 lg:p-4 bg-gray-50">
      <div className="sticky inset-0 z-[30] flex flex-col gap-4 p-4 bg-white border-b border-gray-200 shadow-sm md:flex-row md:items-center md:justify-between">
        {/* Left side: Icon + Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg shrink-0">
            {affiliate_uid ? (
              <Building2 className="w-5 h-5 text-gray-700" />
            ) : OverviewRoles ? (
              <FolderOpen className="w-5 h-5 text-gray-700" />
            ) : (
              <FileText className="w-5 h-5 text-gray-700" />
            )}
          </div>

          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {header_title}
            </h1>
            <p className="text-sm text-gray-500">
              {affiliate_uid
                ? "Documents associated with the selected affiliate"
                : "Browse and manage all available documents"}
            </p>
          </div>
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-2">
          {type == "national" ? (
            <RoleGuard roles={National_Roles}>
              <UploadDocument type={type} queryKey={queryKey} />
            </RoleGuard>
          ) : (
            <UploadDocument type={type} queryKey={queryKey} />
          )}
        </div>
      </div>

      <div className="flex flex-col justify-center w-full gap-2 lg:justify-between item-center lg:flex-row">
        {/* Repository Filter Tabs */}
        <div className="flex justify-center order-2 overflow-x-auto lg:order-1">
          <div className="w-full overflow-x-auto scrollbar-hide">
            <div className="inline-flex gap-2 p-1.5 bg-white border border-gray-200 rounded-lg shadow-xs min-w-min">
              {filtered_status.map((repo) => (
                <button
                  key={repo.id}
                  onClick={() =>
                    type == "national"
                      ? handleCategoryChange(repo.id)
                      : handleTypeChange(repo.id)
                  }
                  disabled={fetching_documents}
                  className={`
                    px-3 py-2 sm:px-4 sm:py-2.5 text-xs font-medium whitespace-nowrap rounded-md transition-all duration-200
                    ${
                      (selectedType || selectedCategory) === repo.id
                        ? "bg-gray-900 text-white shadow-md scale-105"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }
                    ${fetching_documents ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  {repo.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center flex-1 order-1 w-full lg:order-2 lg:justify-end">
          <SearchInput
            value={searchParams.get("search") ?? ""}
            className="w-full"
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-row gap-3 xs:items-center xs:justify-between">
        <div className="flex flex-row gap-3"></div>
        <AdvancedFilter
          onApply={handleApplyFilters}
          sections={visible_filter_options}
          searchParams={searchParams}
          onClear={handleClear}
          activeFilter={selectedAffiliates.length > 0}
          customActiveBadges={
            selectedAffiliates.length > 0 ? (
              <>
                {selectedAffiliates.map((affiliate) => (
                  <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-700 transition-all duration-200 bg-blue-100 rounded-full hover:bg-blue-200">
                    {affiliate.label}
                    <button
                      onClick={() => removeFilteredAffiliate(affiliate.value)}
                      className="transition-all duration-200 rounded-full hover:bg-blue-300 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </>
            ) : null
          }
          customRender={
            <>
              {!affiliate_uid && type !== "national" && (
                <RoleGuard roles={National_Roles}>
                  <SearchableMultiSelectFilter
                    placeholder="Select Affiliate"
                    name="affiliate_id"
                    value={selectedAffiliates}
                    onApply={setSelectedAffiliates}
                    options={[
                      ...(fetching_affiliate_options
                        ? [{ label: "Fetching Affiliates...", value: "" }]
                        : [
                            { label: "Select affiliate", value: "" },
                            { label: "No affiliate", value: "none" },
                            ...(affiliate_options
                              ?.filter((m) =>
                                m.name
                                  .toLowerCase()
                                  .includes(affiliateSearch.toLowerCase()),
                              )
                              .map((m) => ({
                                label: m.name,
                                value: m.id,
                              })) ?? []),
                          ]),
                    ]}
                    searchValue={affiliateSearch}
                    onSearchChange={setAffiliateSearch}
                    loading={fetching_affiliate_options || fetching_documents}
                  />
                </RoleGuard>
              )}

              <button
                type="button"
                onClick={handleRefresh}
                disabled={fetching_documents}
                className={`
                inline-flex items-center gap-2 px-3 py-2 text-xs font-medium
                border rounded-lg transition-all
                bg-white border-gray-300 text-gray-700
                hover:bg-gray-50
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 w-24
                ${
                  fetching_documents
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }
              `}
              >
                <RefreshCcw
                  size={14}
                  className={fetching_documents ? "animate-spin" : ""}
                />
                <span>Refresh</span>
              </button>

              <div className="inline-flex items-center gap-1 px-1 py-1 bg-white border border-gray-300 rounded-lg">
                <button
                  type="button"
                  onClick={() => setViewMode("card")}
                  disabled={fetching_documents}
                  title="Card view"
                  className={`
                        inline-flex items-center justify-center
                       px-3 py-[5px] text-xs
                        rounded-md transition-all
                        ${
                          viewMode === "card"
                            ? "bg-gray-900 text-white shadow-sm"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }
                        ${
                          fetching_documents
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }
                      `}
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  disabled={fetching_documents}
                  title="Table view"
                  className={`
                    inline-flex items-center justify-center
                    px-3 py-[5px] text-xs
                    rounded-md transition-all
                    ${
                      viewMode === "table"
                        ? "bg-gray-900 text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }
                    ${fetching_documents ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  <Rows3 size={14} />
                </button>
              </div>
            </>
          }
        />
      </div>

      {/* Document List */}
      <DataTable
        view={viewMode}
        columns={columns}
        queryKey={queryKey}
        queryFn={fetchDocuments}
        visibleColumns={visible_columns}
        renderActions={(row) => (
          <div className="flex justify-center flex-1 gap-2">
            <button
              disabled={downloading && downloadId == row.id}
              onClick={() => {
                handleDownload(row);
              }}
              className="px-2 py-1 text-xs rounded text-zinc-700 hover:bg-zinc-50"
            >
              {downloading && downloadId == row.id ? (
                <LoaderCircle size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
            </button>
            {type == "national" ? (
              <RoleGuard roles={National_Roles}>
                <button
                  onClick={() => handleEditDocument(row)}
                  className="px-2 py-1 text-xs text-yellow-700 rounded hover:bg-yellow-50"
                >
                  <SquarePen size={14} />
                </button>
              </RoleGuard>
            ) : (
              (NationalRole || userRole.affiliate_id === row.affiliate?.id) && (
                <button
                  onClick={() => handleEditDocument(row)}
                  className="px-2 py-1 text-xs text-yellow-700 rounded hover:bg-yellow-50"
                >
                  <SquarePen size={14} />
                </button>
              )
            )}

            {type === "national" ? (
              <RoleGuard roles={National_Roles}>
                <ConfirmationPopUp
                  message={`Are you sure you want to delete this file ${row.title}?`}
                  onConfirm={() => handleDeleteDocument(row.id)}
                >
                  <button
                    disabled={deletingId === row.id || deletingId !== null}
                    className={`w-full flex items-center gap-2.5 px-2 py-1 text-sm transition-colors hover:bg-red-50 ${
                      deletingId === row.id || deletingId !== null
                        ? "text-zinc-500"
                        : "text-red-500"
                    } ${deletingId === row.id && "!text-red-500"}`}
                  >
                    {deletingId === row.id ? (
                      <LoaderCircle className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </ConfirmationPopUp>
              </RoleGuard>
            ) : (
              (NationalRole || userRole.affiliate_id === row.affiliate?.id) && (
                <ConfirmationPopUp
                  message={`Are you sure you want to delete this file ${row.title}?`}
                  onConfirm={() => handleDeleteDocument(row.id)}
                >
                  <button
                    disabled={deletingId === row.id || deletingId !== null}
                    className={`w-full flex items-center gap-2.5 px-2 py-1 text-sm transition-colors hover:bg-red-50 ${
                      deletingId === row.id || deletingId !== null
                        ? "text-zinc-500"
                        : "text-red-500"
                    } ${deletingId === row.id && "!text-red-500"}`}
                  >
                    {deletingId === row.id ? (
                      <LoaderCircle className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </ConfirmationPopUp>
              )
            )}
          </div>
        )}
        renderCard={(doc, idx) => (
          <li
            key={doc.id}
            className="h-full transition-all duration-200 animate-fadeIn"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <DocumentCard
              doc={doc}
              showDefaultActions={true}
              onView={(doc) => {
                handleViewPDF(doc);
              }}
              onEdit={
                type == "national"
                  ? NationalRole
                    ? (doc) => handleEditDocument(doc)
                    : undefined
                  : NationalRole || userRole.affiliate_id === doc.affiliate?.id
                    ? (doc) => handleEditDocument(doc)
                    : undefined
              }
              onDownload={() => {
                handleDownload(doc);
              }}
              customMenuContent={
                type === "national" ? (
                  <RoleGuard roles={National_Roles}>
                    <div className="space-y-2">
                      <ConfirmationPopUp
                        message={`Are you sure you want to delete this file ${doc?.title}?`}
                        onConfirm={() => handleDeleteDocument(doc.id)}
                      >
                        <button
                          disabled={deletingId == doc.id || deletingId !== null}
                          className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors  hover:bg-red-50
                                ${
                                  deletingId == doc.id || deletingId !== null
                                    ? "text-zinc-500"
                                    : "text-red-500"
                                }
                                ${deletingId == doc.id && "!text-red-500"}
                                `}
                        >
                          {deletingId == doc.id ? (
                            <LoaderCircle className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          <span className="text-xs">Delete</span>
                        </button>
                      </ConfirmationPopUp>
                    </div>
                  </RoleGuard>
                ) : (
                  (NationalRole ||
                    userRole.affiliate_id === doc.affiliate?.id) && (
                    <div className="space-y-2">
                      <ConfirmationPopUp
                        message={`Are you sure you want to delete this file ${doc?.title}?`}
                        onConfirm={() => handleDeleteDocument(doc.id)}
                      >
                        <button
                          disabled={deletingId == doc.id || deletingId !== null}
                          className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors  hover:bg-red-50
                                ${
                                  deletingId == doc.id || deletingId !== null
                                    ? "text-zinc-500"
                                    : "text-red-500"
                                }
                                ${deletingId == doc.id && "!text-red-500"}
                                `}
                        >
                          {deletingId == doc.id ? (
                            <LoaderCircle className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          <span className="text-xs">Delete</span>
                        </button>
                      </ConfirmationPopUp>
                    </div>
                  )
                )
              }
            />
          </li>
        )}
      />

      {showEditModal && selectedDocument && (
        <EditDocument
          type={type}
          loading={updating_document}
          doc={selectedDocument}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedDocument(null);
          }}
          onSubmit={updateDoc}
        />
      )}
      {/* PDF Viewer */}
      {viewingPdfDocument && (
        <PdfViewer doc={viewingPdfDocument} onClose={handleBackToList} />
      )}
      <HelpButton category="Documents" pageTitle="Documents" />
    </div>
  );
}
