import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useDebounce } from "use-debounce";
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  FileText,
  Upload,
  X,
  Building,
  Calendar,
  Users,
  MapPin,
  Archive,
  BarChart3,
  Clock,
  Shield,
  Database,
  Tag,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Home,
  File,
  Grid,
  List,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import DataTable from "./../../../components/ui/DataTable";
import type { Column, Paginated } from "./../../../components/ui/DataTable";
import SearchInput from "./../../../components/ui/SearchInput";
import SelectField from "./../../../components/ui/SelectField";
import Badge from "./../../../components/ui/Badge";
import Modal from "./../../../components/ui/Modal";
import Tabs from "./../../../components/ui/Tabs";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Document {
  id: number;
  title: string;
  type: "contract" | "arbitration" | "mou" | "bylaws" | "research" | "general";
  category?: string;
  description?: string;
  file_name: string;
  file_path: string;
  file_size: number;
  database_source:
    | "contracts"
    | "arbitrations"
    | "mous"
    | "research_collection"
    | "general";
  is_archived: boolean;
  uploaded_at: string;

  // New fields from your controller
  contract_expiration_date?: string;
  employer?: string;
  cbc?: string;
  state?: string;
  effective_date?: string;
  status: "active" | "expired" | "negotiation" | "draft";
  keywords?: string;
  sub_type?: string;
  year?: number;
  is_public: boolean;

  affiliate?: {
    id: number;
    name: string;
    code: string;
  };
  uploader?: {
    id: number;
    name: string;
  };
  folder?: {
    id: number;
    name: string;
    parent_id?: number;
  };
}

interface Affiliate {
  id: number;
  name: string;
  code: string;
  region?: string;
}

interface DocumentFolder {
  id: number;
  name: string;
  parent_id?: number;
  database_source: string;
  children?: DocumentFolder[];
  document_count?: number;
  documents?: Document[];
}

interface DatabaseStats {
  contracts: number;
  contracts_archive: number;
  arbitrations: number;
  mous: number;
  research_collection: number;
  general: number;
}

// PDF Viewer Component
function PDFViewer({
  document,
  onClose,
}: {
  document: Document;
  onClose: () => void;
}) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPdfUrl = async () => {
      try {
        setLoading(true);
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) throw new Error("No active session");
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
        const token = session.access_token;
        const response = await fetch(
          `${apiUrl}/api/documents/${document.id}/download`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to get PDF URL");

        const result = await response.json();

        if (result.success) {
          setPdfUrl(result.data.download_url);
        } else {
          throw new Error(result.message || "Failed to load PDF");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load PDF");
        toast.error(err.message || "Failed to load PDF");
      } finally {
        setLoading(false);
      }
    };

    fetchPdfUrl();
  }, [document.id]);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={document.title}
      className="max-w-7xl h-[90vh]"
      size="xl"
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {document.title}
            </h2>
            <p className="text-sm text-gray-600">{document.file_name}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => pdfUrl && window.open(pdfUrl, "_blank")}
              className="flex items-center gap-2 px-3 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Download size={16} />
              Open in New Tab
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden bg-gray-100 border rounded-lg">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
                <p className="mt-2 text-gray-600">Loading PDF...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-red-600">
                <FileText size={48} className="mx-auto mb-2" />
                <p>Failed to load PDF: {error}</p>
              </div>
            </div>
          )}

          {pdfUrl && !loading && (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title={document.title}
            />
          )}
        </div>
      </div>
    </Modal>
  );
}

export default function NationalDocumentManager() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const [viewMode, setViewMode] = useState<
    "list" | "details" | "create" | "edit" | "pdf"
  >("list");
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [databaseStats, setDatabaseStats] = useState<DatabaseStats | null>(
    null
  );
  const [activeRepository, setActiveRepository] = useState<string>("all");
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(
    new Set()
  );
  const [showFolderManager, setShowFolderManager] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderParent, setNewFolderParent] = useState<number | null>(null);
  const [folderDocuments, setFolderDocuments] = useState<Document[]>([]);
  const [viewingPdfDocument, setViewingPdfDocument] = useState<Document | null>(
    null
  );
  const [viewType, setViewType] = useState<"table" | "file-manager">("table");

  const [advancedFilters, setAdvancedFilters] = useState({
    state: "",
    employer: "",
    cbc: "",
    status: "",
    year: "",
    affiliate_id: "",
    is_archived: "",
    is_public: "",
    contract_expiration_date_from: "",
    contract_expiration_date_to: "",
    folder_id: "",
  });

  // Repository tabs based on your routes and screenshot
  const repositories = [
    {
      id: "all",
      name: "All Documents",
      count: databaseStats
        ? Object.values(databaseStats).reduce((a, b) => a + b, 0)
        : 0,
    },
    {
      id: "contracts",
      name: "Contracts",
      count: databaseStats?.contracts || 0,
    },
    {
      id: "arbitrations",
      name: "Arbitrations",
      count: databaseStats?.arbitrations || 0,
    },
    { id: "mous", name: "MOUs", count: databaseStats?.mous || 0 },
    {
      id: "research_collection",
      name: "Research",
      count: databaseStats?.research_collection || 0,
    },
    { id: "general", name: "General", count: databaseStats?.general || 0 },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case "contract":
        return "primary";
      case "arbitration":
        return "danger";
      case "mou":
        return "success";
      case "bylaws":
        return "warning";
      case "research":
        return "info";
      case "general":
        return "gray";
      default:
        return "gray";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "expired":
        return "danger";
      case "negotiation":
        return "warning";
      case "draft":
        return "gray";
      default:
        return "gray";
    }
  };

  const getDatabaseSourceColor = (source: string) => {
    switch (source) {
      case "contracts":
        return "primary";
      case "arbitrations":
        return "danger";
      case "mous":
        return "success";
      case "research_collection":
        return "info";
      case "general":
        return "gray";
      default:
        return "gray";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const isExpiringSoon = (expirationDate: string) => {
    const expDate = new Date(expirationDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil(
      (expDate.getTime() - today.getTime()) / (1000 * 3600 * 24)
    );
    return daysUntilExpiry <= 90 && daysUntilExpiry >= 0;
  };

  const columns: Column<Document>[] = [
    {
      key: "title",
      header: "Document",
      accessor: (doc) => (
        <div className="flex items-start gap-3">
          <FileText className="flex-shrink-0 w-5 h-5 mt-1 text-gray-400" />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate">
              {doc.title}
            </div>
            <div className="text-sm text-gray-600 truncate">
              {doc.file_name}
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              <Badge
                variant={getTypeColor(doc.type)}
                size="sm"
                className="capitalize"
              >
                {doc.type}
              </Badge>
              <Badge
                variant={getDatabaseSourceColor(doc.database_source)}
                size="sm"
              >
                {doc.database_source}
              </Badge>
              {doc.is_archived && (
                <Badge variant="warning" size="sm">
                  Archived
                </Badge>
              )}
              {doc.is_public && (
                <Badge variant="success" size="sm">
                  Public
                </Badge>
              )}
              {doc.folder && (
                <Badge
                  variant="gray"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Folder size={12} />
                  {doc.folder.name}
                </Badge>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "affiliate",
      header: "Affiliate",
      accessor: (doc) =>
        doc.affiliate ? (
          <div className="flex items-center gap-2">
            <Building size={14} className="text-gray-400" />
            <span className="text-sm text-gray-900">{doc.affiliate.name}</span>
          </div>
        ) : (
          <Badge variant="gray" size="sm">
            National
          </Badge>
        ),
    },
    {
      key: "details",
      header: "Details",
      accessor: (doc) => (
        <div className="space-y-1 text-sm">
          {doc.employer && (
            <div className="text-gray-600 truncate">
              <Users size={12} className="inline mr-1" />
              {doc.employer}
            </div>
          )}
          {doc.state && (
            <div className="text-gray-600">
              <MapPin size={12} className="inline mr-1" />
              {doc.state}
            </div>
          )}
          {doc.cbc && (
            <div className="text-gray-600 truncate">
              <Shield size={12} className="inline mr-1" />
              {doc.cbc}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "dates",
      header: "Dates",
      accessor: (doc) => (
        <div className="space-y-1 text-sm">
          {doc.contract_expiration_date && (
            <div
              className={`flex items-center gap-1 ${
                isExpiringSoon(doc.contract_expiration_date)
                  ? "text-orange-600 font-medium"
                  : "text-gray-600"
              }`}
            >
              <Clock size={12} />
              {new Date(doc.contract_expiration_date).toLocaleDateString()}
              {isExpiringSoon(doc.contract_expiration_date) && (
                <Badge variant="warning" size="sm">
                  Expiring
                </Badge>
              )}
            </div>
          )}
          {doc.effective_date && (
            <div className="text-gray-600">
              <Calendar size={12} className="inline mr-1" />
              {new Date(doc.effective_date).toLocaleDateString()}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      accessor: (doc) => (
        <Badge variant={getStatusColor(doc.status)} className="capitalize">
          {doc.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      accessor: (doc) => (
        <div className="flex gap-1">
          <button
            onClick={() => handleViewPDF(doc)}
            className="p-1 text-blue-600 rounded hover:text-blue-800 hover:bg-blue-50"
            title="View PDF"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => handleDownload(doc.id)}
            className="p-1 text-green-600 rounded hover:text-green-800 hover:bg-green-50"
            title="Download"
          >
            <Download size={16} />
          </button>
          <button
            onClick={() => {
              setSelectedDocument(doc);
              setViewMode("details");
            }}
            className="p-1 text-gray-600 rounded hover:text-gray-800 hover:bg-gray-50"
            title="View Details"
          >
            <FileText size={16} />
          </button>
          <button
            onClick={() => {
              setEditingDocument(doc);
              setViewMode("edit");
            }}
            className="p-1 text-orange-600 rounded hover:text-orange-800 hover:bg-orange-50"
            title="Edit"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleDeleteDocument(doc.id)}
            className="p-1 text-red-600 rounded hover:text-red-800 hover:bg-red-50"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const fetchDatabaseStats = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const token = session.access_token;
      const response = await fetch(`${apiUrl}/api/database-stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setDatabaseStats(result.data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch database stats:", err);
    }
  };

  const fetchAffiliates = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const token = session.access_token;
      const response = await fetch(`${apiUrl}/api/affiliates`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAffiliates(result.data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch affiliates:", err);
    }
  };

  const fetchFolders = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const token = session.access_token;
      const response = await fetch(`${apiUrl}/api/folders`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const foldersWithCounts = await Promise.all(
            result.data.map(async (folder: DocumentFolder) => {
              const documents = await fetchDocumentsByFolder(folder.id);
              return {
                ...folder,
                document_count: documents.length,
                documents: documents,
              };
            })
          );
          setFolders(foldersWithCounts);
        }
      }
    } catch (err) {
      console.error("Failed to fetch folders:", err);
    }
  };

  const fetchDocumentsByFolder = async (
    folderId: number
  ): Promise<Document[]> => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const token = session.access_token;
      const response = await fetch(
        `${apiUrl}/api/documents?folder_id=${folderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          return result.data;
        }
      }
      return [];
    } catch (err) {
      console.error("Failed to fetch folder documents:", err);
      return [];
    }
  };

  const fetchFolderDocuments = async (folderId: number) => {
    try {
      setLoading(true);
      const documents = await fetchDocumentsByFolder(folderId);
      setFolderDocuments(documents);
    } catch (err) {
      toast.error("Failed to load folder documents");
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async (name: string, parentId: number | null) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const token = session.access_token;
      const response = await fetch(`${apiUrl}/api/folders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          parent_id: parentId,
          database_source:
            activeRepository !== "all" ? activeRepository : "general",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create folder");
      }

      toast.success("Folder created successfully!");
      setNewFolderName("");
      setNewFolderParent(null);
      fetchFolders();
      return result.data;
    } catch (err: any) {
      toast.error(err.message || "Failed to create folder");
      throw err;
    }
  };

  const fetchDocuments = async (
    page: number,
    perPage: number | "All"
  ): Promise<Paginated<Document>> => {
    try {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const token = session.access_token;

      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage === "All" ? "1000" : perPage.toString(),
      });

      if (debouncedSearch) params.append("search", debouncedSearch);

      if (activeRepository !== "all") {
        params.append("repository", activeRepository);
      }

      if (selectedFolder) {
        params.append("folder_id", selectedFolder.toString());
      }

      Object.entries(advancedFilters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      let url = `${apiUrl}/api/documents`;
      if (activeRepository !== "all") {
        switch (activeRepository) {
          case "contracts":
          case "arbitrations":
          case "mous":
          case "research_collection":
            url = `${apiUrl}/api/documents/repository/${activeRepository}`;
            break;
        }
      }

      const response = await fetch(`${url}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch documents");

      const result = await response.json();

      if (result.success) {
        return {
          items: result.data,
          current_page: result.meta?.current_page || 1,
          last_page: result.meta?.last_page || 1,
          per_page:
            result.meta?.per_page ||
            (typeof perPage === "number" ? perPage : 20),
          total: result.meta?.total || result.data.length,
        };
      } else {
        throw new Error(result.message || "Failed to fetch documents");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load documents");
      toast.error(err.message || "Failed to load documents");
      return {
        items: [],
        current_page: 1,
        last_page: 1,
        per_page: typeof perPage === "number" ? perPage : 20,
        total: 0,
      };
    } finally {
      setLoading(false);
    }
  };

  const handleViewPDF = (document: Document) => {
    setViewingPdfDocument(document);
    setViewMode("pdf");
  };

  const handleDownload = async (documentId: number) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const token = session.access_token;
      const response = await fetch(
        `${apiUrl}/api/documents/${documentId}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to get download URL");

      const result = await response.json();

      if (result.success) {
        const link = document.createElement("a");
        link.href = result.data.download_url;
        link.download = result.data.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Download started");
      } else {
        throw new Error(result.message || "Failed to download document");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to download document");
    }
  };

  const handleUploadDocument = async (formData: any) => {
    setUploadLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const token = session.access_token;
      const uploadData = new FormData();

      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== "") {
          uploadData.append(key, formData[key]);
        }
      });

      const response = await fetch(`${apiUrl}/api/documents`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to upload document");
      }

      toast.success("Document uploaded successfully!");
      handleBackToList();
      refreshTable();
      fetchDatabaseStats();
      fetchFolders();
    } catch (err: any) {
      toast.error(err.message || "Failed to upload document");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleUpdateDocument = async (formData: any) => {
    if (!editingDocument) return;

    setUploadLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const token = session.access_token;

      const response = await fetch(
        `${apiUrl}/api/documents/${editingDocument.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update document");
      }

      toast.success("Document updated successfully!");
      handleBackToList();
      refreshTable();
      fetchFolders();
    } catch (err: any) {
      toast.error(err.message || "Failed to update document");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this document? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const token = session.access_token;
      const response = await fetch(`${apiUrl}/api/documents/${documentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Failed to delete document");
      }

      toast.success("Document deleted successfully!");
      refreshTable();
      fetchDatabaseStats();
      fetchFolders();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete document");
    }
  };

  const refreshTable = () => {
    queryClient.invalidateQueries({
      queryKey: [
        "documents",
        activeRepository,
        selectedFolder,
        debouncedSearch,
        advancedFilters,
      ],
    });
  };

  const handleCreate = () => {
    fetchAffiliates();
    fetchFolders();
    setViewMode("create");
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedDocument(null);
    setEditingDocument(null);
    setViewingPdfDocument(null);
  };

  const clearAdvancedFilters = () => {
    setAdvancedFilters({
      state: "",
      employer: "",
      cbc: "",
      status: "",
      year: "",
      affiliate_id: "",
      is_archived: "",
      is_public: "",
      contract_expiration_date_from: "",
      contract_expiration_date_to: "",
      folder_id: "",
    });
    setSelectedFolder(null);
    setFolderDocuments([]);
    toast("All filters cleared", { icon: "🧹" });
  };

  const toggleFolder = async (folderId: number) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleFolderSelect = async (folderId: number | null) => {
    setSelectedFolder(folderId);
    if (folderId) {
      setAdvancedFilters((prev) => ({
        ...prev,
        folder_id: folderId.toString(),
      }));
      await fetchFolderDocuments(folderId);
    } else {
      setAdvancedFilters((prev) => ({ ...prev, folder_id: "" }));
      setFolderDocuments([]);
    }
  };

  // Load stats and folders on component mount
  useEffect(() => {
    fetchDatabaseStats();
    fetchAffiliates();
    fetchFolders();
  }, []);

  // Reset selected folder when repository changes
  useEffect(() => {
    setSelectedFolder(null);
    setAdvancedFilters((prev) => ({ ...prev, folder_id: "" }));
    setFolderDocuments([]);
  }, [activeRepository]);

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-3 mb-6 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              ORG Document Management System
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Comprehensive document management across all repositories and
              affiliates
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFolderManager(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <Folder size={16} />
              Manage Folders
            </button>
            <button
              onClick={() => fetchDatabaseStats()}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              title="Refresh Statistics"
            >
              <BarChart3 size={16} />
              Refresh Stats
            </button>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Plus size={18} />
              Upload Document
            </button>
          </div>
        </div>

        {/* Database Statistics */}
        {databaseStats && (
          <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-6">
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">
                  Contracts
                </span>
              </div>
              <div className="mt-1 text-2xl font-bold text-gray-900">
                {databaseStats.contracts}
              </div>
            </div>
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-gray-700">
                  Contracts Archive
                </span>
              </div>
              <div className="mt-1 text-2xl font-bold text-gray-900">
                {databaseStats.contracts_archive}
              </div>
            </div>
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-gray-700">
                  Arbitrations
                </span>
              </div>
              <div className="mt-1 text-2xl font-bold text-gray-900">
                {databaseStats.arbitrations}
              </div>
            </div>
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">MOUs</span>
              </div>
              <div className="mt-1 text-2xl font-bold text-gray-900">
                {databaseStats.mous}
              </div>
            </div>
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">
                  Research
                </span>
              </div>
              <div className="mt-1 text-2xl font-bold text-gray-900">
                {databaseStats.research_collection}
              </div>
            </div>
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  General
                </span>
              </div>
              <div className="mt-1 text-2xl font-bold text-gray-900">
                {databaseStats.general}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="px-4 py-3 mb-4 text-red-700 border border-red-200 rounded-lg bg-red-50">
            {error}
          </div>
        )}

        {/* Repository Tabs */}
        <div className="p-4 mb-4 bg-white rounded-lg">
          <Tabs
            tabs={repositories}
            activeTab={activeRepository}
            onTabChange={setActiveRepository}
          />
        </div>

        {/* View Toggle and Search */}
        <div className="p-4 mb-4 bg-white rounded-lg">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                <SearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Search documents, content, titles, descriptions..."
                  className="w-full pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              {/* View Type Toggle */}
              <div className="flex p-1 bg-gray-100 rounded-lg">
                <button
                  onClick={() => setViewType("table")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                    viewType === "table"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <List size={16} />
                  Table View
                </button>
                <button
                  onClick={() => setViewType("file-manager")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                    viewType === "file-manager"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Grid size={16} />
                  File Manager
                </button>
              </div>

              <AdvancedFilters
                filters={advancedFilters}
                onFiltersChange={setAdvancedFilters}
                onClear={clearAdvancedFilters}
                affiliates={affiliates}
                folders={folders}
              />
            </div>
          </div>

          {/* Selected Folder Indicator */}
          {selectedFolder && (
            <div className="flex items-center gap-2 mt-3 text-sm">
              <span className="text-gray-600">Viewing folder:</span>
              <Badge variant="gray" className="flex items-center gap-1">
                <Folder size={12} />
                {findFolderName(folders, selectedFolder)}
              </Badge>
              <button
                onClick={() => handleFolderSelect(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* Folder Navigation Sidebar - Always visible */}
          <div className="p-4 bg-white rounded-lg lg:w-80 h-fit">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Folders</h3>
              <button
                onClick={() => handleFolderSelect(null)}
                className={`p-1 rounded ${
                  !selectedFolder
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                title="Show all documents"
              >
                <Home size={16} />
              </button>
            </div>

            <div className="space-y-1 overflow-y-auto max-h-96">
              <FolderTree
                folders={folders}
                expandedFolders={expandedFolders}
                selectedFolder={selectedFolder}
                onToggleFolder={toggleFolder}
                onSelectFolder={handleFolderSelect}
                level={0}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {viewType === "table" ? (
              /* Table View */
              <div className="p-4 bg-white rounded-lg">
                <DataTable
                  columns={columns}
                  queryFn={fetchDocuments}
                  queryKey={[
                    "documents",
                    activeRepository,
                    selectedFolder,
                    debouncedSearch,
                    advancedFilters,
                  ]}
                  pagination={true}
                  perPageOptions={[10, 25, 50, 100]}
                />
              </div>
            ) : (
              /* File Manager View */
              <div className="p-4 bg-white rounded-lg">
                <FileManagerView
                  documents={folderDocuments.length > 0 ? folderDocuments : []}
                  selectedFolder={selectedFolder}
                  folders={folders}
                  onViewPDF={handleViewPDF}
                  onDownload={handleDownload}
                  onEdit={(doc) => {
                    setEditingDocument(doc);
                    setViewMode("edit");
                  }}
                  onDelete={handleDeleteDocument}
                  onViewDetails={(doc) => {
                    setSelectedDocument(doc);
                    setViewMode("details");
                  }}
                  loading={loading}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Details Modal */}
      <Modal
        isOpen={viewMode === "details"}
        onClose={handleBackToList}
        title="Document Details"
        className="max-w-4xl"
      >
        {selectedDocument && (
          <DocumentDetails
            document={selectedDocument}
            onClose={handleBackToList}
          />
        )}
      </Modal>

      {/* Upload/Edit Document Modal */}
      <Modal
        isOpen={viewMode === "create" || viewMode === "edit"}
        onClose={handleBackToList}
        title={viewMode === "create" ? "Upload New Document" : "Edit Document"}
        className="max-w-4xl"
      >
        <DocumentForm
          document={editingDocument}
          onCancel={handleBackToList}
          onSubmit={
            viewMode === "create" ? handleUploadDocument : handleUpdateDocument
          }
          loading={uploadLoading}
          mode={viewMode as "create" | "edit"}
          affiliates={affiliates}
          folders={folders}
        />
      </Modal>

      {/* Folder Management Modal */}
      <Modal
        isOpen={showFolderManager}
        onClose={() => setShowFolderManager(false)}
        title="Manage Folders"
        className="max-w-2xl"
      >
        <FolderManager
          folders={folders}
          onFolderCreate={createFolder}
          onClose={() => setShowFolderManager(false)}
        />
      </Modal>

      {/* PDF Viewer Modal */}
      {viewMode === "pdf" && viewingPdfDocument && (
        <PDFViewer document={viewingPdfDocument} onClose={handleBackToList} />
      )}
    </div>
  );
}

// File Manager View Component
function FileManagerView({
  documents,
  selectedFolder,
  folders,
  onViewPDF,
  onDownload,
  onEdit,
  onDelete,
  onViewDetails,
  loading,
}: {
  documents: Document[];
  selectedFolder: number | null;
  folders: DocumentFolder[];
  onViewPDF: (doc: Document) => void;
  onDownload: (id: number) => void;
  onEdit: (doc: Document) => void;
  onDelete: (id: number) => void;
  onViewDetails: (doc: Document) => void;
  loading: boolean;
}) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "contract":
        return "primary";
      case "arbitration":
        return "danger";
      case "mou":
        return "success";
      case "bylaws":
        return "warning";
      case "research":
        return "info";
      case "general":
        return "gray";
      default:
        return "gray";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (!selectedFolder) {
    return (
      <div className="py-12 text-center">
        <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="mb-2 text-lg font-medium text-gray-900">
          Select a Folder
        </h3>
        <p className="text-gray-600">
          Choose a folder from the sidebar to view its contents
        </p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="py-12 text-center">
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="mb-2 text-lg font-medium text-gray-900">No Documents</h3>
        <p className="text-gray-600">This folder is empty</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {findFolderName(folders, selectedFolder)}
          </h2>
          <p className="text-gray-600">
            {documents.length} document{documents.length !== 1 ? "s" : ""} in
            this folder
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="p-4 transition-shadow bg-white border border-gray-200 rounded-lg hover:shadow-md"
          >
            <div className="flex items-start justify-between mb-3">
              <FileText className="flex-shrink-0 w-8 h-8 text-red-500" />
              <div className="flex gap-1">
                <button
                  onClick={() => onViewPDF(doc)}
                  className="p-1 text-blue-600 rounded hover:text-blue-800 hover:bg-blue-50"
                  title="View PDF"
                >
                  <Eye size={14} />
                </button>
                <button
                  onClick={() => onDownload(doc.id)}
                  className="p-1 text-green-600 rounded hover:text-green-800 hover:bg-green-50"
                  title="Download"
                >
                  <Download size={14} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <h3
                className="text-sm font-medium text-gray-900 line-clamp-2"
                title={doc.title}
              >
                {doc.title}
              </h3>

              <div className="flex flex-wrap gap-1">
                <Badge
                  variant={getTypeColor(doc.type)}
                  size="sm"
                  className="capitalize"
                >
                  {doc.type}
                </Badge>
                {doc.is_archived && (
                  <Badge variant="warning" size="sm">
                    Archived
                  </Badge>
                )}
              </div>

              <div className="space-y-1 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Size:</span>
                  <span>{formatFileSize(doc.file_size)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Uploaded:</span>
                  <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                </div>
                {doc.affiliate && (
                  <div className="flex justify-between">
                    <span>Affiliate:</span>
                    <span className="ml-2 truncate">{doc.affiliate.name}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-1 pt-2 border-t">
                <button
                  onClick={() => onViewDetails(doc)}
                  className="flex-1 px-2 py-1 text-xs text-gray-600 rounded hover:text-gray-800 hover:bg-gray-50"
                >
                  Details
                </button>
                <button
                  onClick={() => onEdit(doc)}
                  className="flex-1 px-2 py-1 text-xs text-orange-600 rounded hover:text-orange-800 hover:bg-orange-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(doc.id)}
                  className="flex-1 px-2 py-1 text-xs text-red-600 rounded hover:text-red-800 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper function to find folder name by ID
function findFolderName(folders: DocumentFolder[], folderId: number): string {
  for (const folder of folders) {
    if (folder.id === folderId) return folder.name;
    if (folder.children) {
      const found = findFolderName(folder.children, folderId);
      if (found) return found;
    }
  }
  return "Unknown Folder";
}

// Folder Tree Component (keep the same)
function FolderTree({
  folders,
  expandedFolders,
  selectedFolder,
  onToggleFolder,
  onSelectFolder,
  level = 0,
}: {
  folders: DocumentFolder[];
  expandedFolders: Set<number>;
  selectedFolder: number | null;
  onToggleFolder: (id: number) => void;
  onSelectFolder: (id: number | null) => void;
  level?: number;
}) {
  return (
    <>
      {folders.map((folder) => {
        const hasChildren = folder.children && folder.children.length > 0;
        const isExpanded = expandedFolders.has(folder.id);
        const isSelected = selectedFolder === folder.id;

        return (
          <div key={folder.id}>
            <div
              className={`flex items-center gap-2 py-1 px-2 rounded text-sm cursor-pointer ${
                isSelected
                  ? "bg-blue-100 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              style={{ paddingLeft: `${level * 16 + 8}px` }}
              onClick={() => onSelectFolder(folder.id)}
            >
              {hasChildren ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFolder(folder.id);
                  }}
                  className="p-0.5 hover:bg-gray-200 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </button>
              ) : (
                <div className="w-5" />
              )}

              {isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />}

              <span className="flex-1 truncate">{folder.name}</span>

              {folder.document_count !== undefined && (
                <span className="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                  {folder.document_count}
                </span>
              )}
            </div>

            {hasChildren && isExpanded && (
              <FolderTree
                folders={folder.children!}
                expandedFolders={expandedFolders}
                selectedFolder={selectedFolder}
                onToggleFolder={onToggleFolder}
                onSelectFolder={onSelectFolder}
                level={level + 1}
              />
            )}
          </div>
        );
      })}
    </>
  );
}

// Folder Management Component (keep the same)
function FolderManager({
  folders,
  onFolderCreate,
  onClose,
}: {
  folders: DocumentFolder[];
  onFolderCreate: (name: string, parentId: number | null) => Promise<any>;
  onClose: () => void;
}) {
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderParent, setNewFolderParent] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error("Please enter a folder name");
      return;
    }

    setCreating(true);
    try {
      await onFolderCreate(newFolderName.trim(), newFolderParent);
      setNewFolderName("");
      setNewFolderParent(null);
    } finally {
      setCreating(false);
    }
  };

  const getAllFolders = (folders: DocumentFolder[]): DocumentFolder[] => {
    let all: DocumentFolder[] = [];
    folders.forEach((folder) => {
      all.push(folder);
      if (folder.children) {
        all = [...all, ...getAllFolders(folder.children)];
      }
    });
    return all;
  };

  const allFolders = getAllFolders(folders);

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-gray-50">
        <h4 className="mb-3 font-medium text-gray-900">Create New Folder</h4>

        <div className="space-y-3">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Folder Name
            </label>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              placeholder="Enter folder name"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Parent Folder (Optional)
            </label>
            <select
              value={newFolderParent || ""}
              onChange={(e) =>
                setNewFolderParent(
                  e.target.value ? Number(e.target.value) : null
                )
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Root Level</option>
              {allFolders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCreateFolder}
            disabled={creating || !newFolderName.trim()}
            className="w-full py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
          >
            {creating ? "Creating..." : "Create Folder"}
          </button>
        </div>
      </div>

      <div className="pt-4 border-t">
        <h4 className="mb-3 font-medium text-gray-900">Existing Folders</h4>
        {folders.length === 0 ? (
          <p className="text-sm text-gray-500">No folders created yet.</p>
        ) : (
          <FolderTreeView folders={folders} level={0} />
        )}
      </div>

      <div className="flex justify-end pt-4 border-t">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function FolderTreeView({
  folders,
  level = 0,
}: {
  folders: DocumentFolder[];
  level?: number;
}) {
  return (
    <div className="space-y-1">
      {folders.map((folder) => (
        <div key={folder.id}>
          <div
            className="flex items-center gap-2 py-1 text-sm"
            style={{ paddingLeft: `${level * 20}px` }}
          >
            <Folder size={16} className="text-gray-500" />
            <span className="text-gray-900">{folder.name}</span>
            {folder.document_count !== undefined && (
              <span className="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                {folder.document_count}
              </span>
            )}
          </div>

          {folder.children && folder.children.length > 0 && (
            <FolderTreeView folders={folder.children} level={level + 1} />
          )}
        </div>
      ))}
    </div>
  );
}

// Advanced Filters Component (keep the same)
function AdvancedFilters({
  filters,
  onFiltersChange,
  onClear,
  affiliates,
  folders,
}: any) {
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const getAllFolders = (folders: DocumentFolder[]): DocumentFolder[] => {
    let all: DocumentFolder[] = [];
    folders.forEach((folder) => {
      all.push(folder);
      if (folder.children) {
        all = [...all, ...getAllFolders(folder.children)];
      }
    });
    return all;
  };

  const allFolders = getAllFolders(folders);

  return (
    <div className="relative">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
      >
        <Filter size={16} />
        Advanced Filters
        {Object.values(filters).some((v) => v !== "") && (
          <span className="flex items-center justify-center w-5 h-5 text-xs text-white bg-blue-500 rounded-full">
            {Object.values(filters).filter((v) => v !== "").length}
          </span>
        )}
      </button>

      {showFilters && (
        <div className="absolute right-0 z-50 p-4 mt-2 bg-white border rounded-lg shadow-xl w-96">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Advanced Filters</h3>
            <button
              onClick={onClear}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-96">
            <SelectField
              label="Affiliate"
              name="affiliate_id"
              value={filters.affiliate_id}
              onChange={(e) =>
                handleFilterChange("affiliate_id", e.target.value)
              }
              options={[
                { label: "All Affiliates", value: "" },
                ...affiliates.map((affiliate: Affiliate) => ({
                  label: affiliate.name,
                  value: affiliate.id.toString(),
                })),
              ]}
            />

            <SelectField
              label="Folder"
              name="folder_id"
              value={filters.folder_id}
              onChange={(e) => handleFilterChange("folder_id", e.target.value)}
              options={[
                { label: "All Folders", value: "" },
                ...allFolders.map((folder: DocumentFolder) => ({
                  label: folder.name,
                  value: folder.id.toString(),
                })),
              ]}
            />

            <SelectField
              label="Status"
              name="status"
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              options={[
                { label: "All Statuses", value: "" },
                { label: "Active", value: "active" },
                { label: "Expired", value: "expired" },
                { label: "Negotiation", value: "negotiation" },
                { label: "Draft", value: "draft" },
              ]}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  State
                </label>
                <input
                  type="text"
                  value={filters.state}
                  onChange={(e) => handleFilterChange("state", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  placeholder="e.g., CA"
                  maxLength={2}
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Year
                </label>
                <input
                  type="number"
                  value={filters.year}
                  onChange={(e) => handleFilterChange("year", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  placeholder="e.g., 2024"
                  min="1900"
                  max="2030"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Employer
              </label>
              <input
                type="text"
                value={filters.employer}
                onChange={(e) => handleFilterChange("employer", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                placeholder="Filter by employer"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                CBC
              </label>
              <input
                type="text"
                value={filters.cbc}
                onChange={(e) => handleFilterChange("cbc", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                placeholder="Filter by CBC"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Archive Status"
                name="is_archived"
                value={filters.is_archived}
                onChange={(e) =>
                  handleFilterChange("is_archived", e.target.value)
                }
                options={[
                  { label: "All", value: "" },
                  { label: "Archived", value: "true" },
                  { label: "Not Archived", value: "false" },
                ]}
              />

              <SelectField
                label="Public Access"
                name="is_public"
                value={filters.is_public}
                onChange={(e) =>
                  handleFilterChange("is_public", e.target.value)
                }
                options={[
                  { label: "All", value: "" },
                  { label: "Public", value: "true" },
                  { label: "Private", value: "false" },
                ]}
              />
            </div>

            <div className="pt-3 border-t">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Contract Expiration Date Range
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-xs text-gray-600">
                    From
                  </label>
                  <input
                    type="date"
                    value={filters.contract_expiration_date_from}
                    onChange={(e) =>
                      handleFilterChange(
                        "contract_expiration_date_from",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-xs text-gray-600">To</label>
                  <input
                    type="date"
                    value={filters.contract_expiration_date_to}
                    onChange={(e) =>
                      handleFilterChange(
                        "contract_expiration_date_to",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Document Details Component (keep the same)
// Document Form Component (keep the same)
// ... (keep all the existing components that haven't changed)
// Document Details Component (keep the same as before)
function DocumentDetails({
  document,
  onClose,
}: {
  document: Document;
  onClose: () => void;
}) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const isExpiringSoon = (expirationDate: string) => {
    const expDate = new Date(expirationDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil(
      (expDate.getTime() - today.getTime()) / (1000 * 3600 * 24)
    );
    return daysUntilExpiry <= 90 && daysUntilExpiry >= 0;
  };

  return (
    <div className="space-y-6">
      {/* Header with title and badges */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{document.title}</h2>
          <p className="mt-1 text-gray-600">{document.file_name}</p>
        </div>
        <div className="flex gap-2">
          <Badge
            variant={
              document.type === "contract"
                ? "primary"
                : document.type === "arbitration"
                ? "danger"
                : document.type === "mou"
                ? "success"
                : "warning"
            }
            className="capitalize"
          >
            {document.type}
          </Badge>
          <Badge
            variant={
              document.status === "active"
                ? "success"
                : document.status === "expired"
                ? "danger"
                : "warning"
            }
            className="capitalize"
          >
            {document.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="pb-2 font-medium text-gray-900 border-b">
            Basic Information
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Database Source
              </label>
              <Badge
                variant={
                  document.database_source === "contracts"
                    ? "primary"
                    : document.database_source === "arbitrations"
                    ? "danger"
                    : document.database_source === "mous"
                    ? "success"
                    : "info"
                }
              >
                {document.database_source}
              </Badge>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Category
              </label>
              <p className="text-gray-900">
                {document.category || "Uncategorized"}
              </p>
            </div>
          </div>

          {document.folder && (
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Folder
              </label>
              <div className="flex items-center gap-2 text-gray-900">
                <Folder size={16} />
                {document.folder.name}
              </div>
            </div>
          )}

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Description
            </label>
            <p className="text-gray-900">
              {document.description || "No description provided"}
            </p>
          </div>

          {document.keywords && (
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Keywords
              </label>
              <div className="flex flex-wrap gap-1">
                {document.keywords.split(",").map((keyword, index) => (
                  <Badge key={index} variant="gray" size="sm">
                    {keyword.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                File Size
              </label>
              <p className="text-gray-900">
                {formatFileSize(document.file_size)}
              </p>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Uploaded
              </label>
              <p className="text-gray-900">
                {new Date(document.uploaded_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Contract & Organization Details */}
        <div className="space-y-4">
          <h3 className="pb-2 font-medium text-gray-900 border-b">
            Contract & Organization Details
          </h3>

          {document.affiliate && (
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Affiliate
              </label>
              <p className="flex items-center gap-2 text-gray-900">
                <Building size={16} />
                {document.affiliate.name} ({document.affiliate.code})
              </p>
            </div>
          )}

          {document.employer && (
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Employer
              </label>
              <p className="flex items-center gap-2 text-gray-900">
                <Users size={16} />
                {document.employer}
              </p>
            </div>
          )}

          {document.cbc && (
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                CBC
              </label>
              <p className="flex items-center gap-2 text-gray-900">
                <Shield size={16} />
                {document.cbc}
              </p>
            </div>
          )}

          {document.state && (
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                State
              </label>
              <p className="flex items-center gap-2 text-gray-900">
                <MapPin size={16} />
                {document.state}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {document.effective_date && (
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Effective Date
                </label>
                <p className="flex items-center gap-2 text-gray-900">
                  <Calendar size={16} />
                  {new Date(document.effective_date).toLocaleDateString()}
                </p>
              </div>
            )}

            {document.contract_expiration_date && (
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Expiration Date
                  {isExpiringSoon(document.contract_expiration_date) && (
                    <Badge variant="warning" size="sm" className="ml-2">
                      Expiring Soon
                    </Badge>
                  )}
                </label>
                <p
                  className={`flex items-center gap-2 ${
                    isExpiringSoon(document.contract_expiration_date)
                      ? "text-orange-600 font-medium"
                      : "text-gray-900"
                  }`}
                >
                  <Clock size={16} />
                  {new Date(
                    document.contract_expiration_date
                  ).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {document.year && (
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Year
              </label>
              <p className="text-gray-900">{document.year}</p>
            </div>
          )}

          {document.sub_type && (
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Sub Type
              </label>
              <p className="text-gray-900">{document.sub_type}</p>
            </div>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="pt-4 border-t">
        <div className="flex gap-4 text-sm">
          {document.is_archived && (
            <div className="flex items-center gap-1 text-orange-600">
              <Archive size={14} />
              Archived
            </div>
          )}
          {document.is_public && (
            <div className="flex items-center gap-1 text-green-600">
              <Shield size={14} />
              Public Access
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// Document Form Component (keep the same as before)
function DocumentForm({
  document,
  onCancel,
  onSubmit,
  loading,
  mode,
  affiliates,
  folders,
}: {
  document?: Document | null;
  onCancel: () => void;
  onSubmit: (data: any) => void;
  loading: boolean;
  mode: "create" | "edit";
  affiliates: Affiliate[];
  folders: DocumentFolder[];
}) {
  const [formData, setFormData] = useState({
    title: document?.title || "",
    type: document?.type || "contract",
    category: document?.category || "",
    description: document?.description || "",
    affiliate_id: document?.affiliate?.id?.toString() || "",
    database_source: document?.database_source || "contracts",
    folder_id: document?.folder?.id?.toString() || "",

    // New fields
    contract_expiration_date: document?.contract_expiration_date || "",
    employer: document?.employer || "",
    cbc: document?.cbc || "",
    state: document?.state || "",
    effective_date: document?.effective_date || "",
    status: document?.status || "active",
    keywords: document?.keywords || "",
    sub_type: document?.sub_type || "",
    year: document?.year?.toString() || "",
    is_public: document?.is_public || false,
    is_archived: document?.is_archived || false,

    file: null as File | null,
  });

  const [filePreview, setFilePreview] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = { ...formData };
    if (mode === "edit") {
      // Remove file from edit data if not changed
      delete (submitData as any).file;
    }

    onSubmit(submitData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, file }));

    if (file) {
      setFilePreview(file.name);
    } else {
      setFilePreview(null);
    }
  };

  const databaseSourceOptions = [
    { value: "contracts", label: "Contracts" },
    { value: "arbitrations", label: "Arbitrations" },
    { value: "mous", label: "MOUs" },
    { value: "research_collection", label: "Research Collection" },
    { value: "general", label: "General" },
  ];

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

  const getAllFolders = (folders: DocumentFolder[]): DocumentFolder[] => {
    let all: DocumentFolder[] = [];
    folders.forEach((folder) => {
      all.push(folder);
      if (folder.children) {
        all = [...all, ...getAllFolders(folder.children)];
      }
    });
    return all;
  };

  const allFolders = getAllFolders(folders);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="pb-2 font-medium text-gray-900 border-b">
            Basic Information
          </h3>

          <div>
            <label
              htmlFor="title"
              className="block mb-1 text-sm font-medium text-gray-700"
            >
              Title *
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              placeholder="Enter document title"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="type"
                className="block mb-1 text-sm font-medium text-gray-700"
              >
                Type *
              </label>
              <select
                id="type"
                required
                value={formData.type}
                onChange={(e) => handleChange("type", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="database_source"
                className="block mb-1 text-sm font-medium text-gray-700"
              >
                Database Source *
              </label>
              <select
                id="database_source"
                required
                value={formData.database_source}
                onChange={(e) =>
                  handleChange("database_source", e.target.value)
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              >
                {databaseSourceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="category"
                className="block mb-1 text-sm font-medium text-gray-700"
              >
                Category
              </label>
              <input
                type="text"
                id="category"
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., Legal, Financial"
              />
            </div>

            <div>
              <label
                htmlFor="sub_type"
                className="block mb-1 text-sm font-medium text-gray-700"
              >
                Sub Type
              </label>
              <input
                type="text"
                id="sub_type"
                value={formData.sub_type}
                onChange={(e) => handleChange("sub_type", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., Collective Bargaining"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="folder_id"
              className="block mb-1 text-sm font-medium text-gray-700"
            >
              Folder
            </label>
            <select
              id="folder_id"
              value={formData.folder_id}
              onChange={(e) => handleChange("folder_id", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
            >
              <option value="">No Folder</option>
              {allFolders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="description"
              className="block mb-1 text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              placeholder="Document description and notes"
            />
          </div>

          <div>
            <label
              htmlFor="keywords"
              className="block mb-1 text-sm font-medium text-gray-700"
            >
              Keywords
            </label>
            <input
              type="text"
              id="keywords"
              value={formData.keywords}
              onChange={(e) => handleChange("keywords", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              placeholder="Comma-separated keywords"
            />
          </div>

          {mode === "create" && (
            <div>
              <label
                htmlFor="file"
                className="block mb-1 text-sm font-medium text-gray-700"
              >
                File *
              </label>
              <div className="p-4 text-center border-2 border-gray-300 border-dashed rounded-lg">
                <input
                  type="file"
                  id="file"
                  required={mode === "create"}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                />
                <label htmlFor="file" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    {filePreview ? filePreview : "Click to select a file"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT (Max 10MB)
                  </p>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Contract & Organization Details */}
        <div className="space-y-4">
          <h3 className="pb-2 font-medium text-gray-900 border-b">
            Contract & Organization Details
          </h3>

          <div>
            <label
              htmlFor="affiliate_id"
              className="block mb-1 text-sm font-medium text-gray-700"
            >
              Affiliate
            </label>
            <select
              id="affiliate_id"
              value={formData.affiliate_id}
              onChange={(e) => handleChange("affiliate_id", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
            >
              <option value="">National Resource (Available to all)</option>
              {affiliates.map((affiliate) => (
                <option key={affiliate.id} value={affiliate.id}>
                  {affiliate.name} ({affiliate.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="employer"
                className="block mb-1 text-sm font-medium text-gray-700"
              >
                Employer
              </label>
              <input
                type="text"
                id="employer"
                value={formData.employer}
                onChange={(e) => handleChange("employer", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                placeholder="Employer name"
              />
            </div>

            <div>
              <label
                htmlFor="cbc"
                className="block mb-1 text-sm font-medium text-gray-700"
              >
                CBC
              </label>
              <input
                type="text"
                id="cbc"
                value={formData.cbc}
                onChange={(e) => handleChange("cbc", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                placeholder="CBC name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="state"
                className="block mb-1 text-sm font-medium text-gray-700"
              >
                State
              </label>
              <input
                type="text"
                id="state"
                value={formData.state}
                onChange={(e) => handleChange("state", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., CA"
                maxLength={2}
              />
            </div>

            <div>
              <label
                htmlFor="year"
                className="block mb-1 text-sm font-medium text-gray-700"
              >
                Year
              </label>
              <input
                type="number"
                id="year"
                value={formData.year}
                onChange={(e) => handleChange("year", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., 2024"
                min="1900"
                max="2030"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="effective_date"
                className="block mb-1 text-sm font-medium text-gray-700"
              >
                Effective Date
              </label>
              <input
                type="date"
                id="effective_date"
                value={formData.effective_date}
                onChange={(e) => handleChange("effective_date", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="contract_expiration_date"
                className="block mb-1 text-sm font-medium text-gray-700"
              >
                Expiration Date
              </label>
              <input
                type="date"
                id="contract_expiration_date"
                value={formData.contract_expiration_date}
                onChange={(e) =>
                  handleChange("contract_expiration_date", e.target.value)
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="status"
              className="block mb-1 text-sm font-medium text-gray-700"
            >
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => handleChange("status", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_public"
                checked={formData.is_public}
                onChange={(e) => handleChange("is_public", e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="is_public"
                className="block ml-2 text-sm text-gray-700"
              >
                Public Access
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_archived"
                checked={formData.is_archived}
                onChange={(e) => handleChange("is_archived", e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="is_archived"
                className="block ml-2 text-sm text-gray-700"
              >
                Archived
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-blue-400"
          disabled={loading}
        >
          {loading
            ? "Processing..."
            : mode === "create"
            ? "Upload Document"
            : "Update Document"}
        </button>
      </div>
    </form>
  );
}
