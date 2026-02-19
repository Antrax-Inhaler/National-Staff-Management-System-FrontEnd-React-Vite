// src/components/search/DocumentViewerModal.tsx
import { useMutation, useQuery } from "@tanstack/react-query";
import { document } from "@v1/api/document";
import Modal from "@v1/components/ui/Modal";
import {
  getFileExtension,
  toSnakeCaseFileName
} from "@v1/helpers/formatter";
import {
  Building2,
  Calendar,
  Clock,
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  Hash,
  LoaderCircle,
  MapPin,
  User,
  Eye
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentData?: any;
  documentId?: number;
}

function DocumentViewerModal({ 
  isOpen, 
  onClose, 
  documentData: initialDocumentData,
  documentId 
}: DocumentViewerModalProps) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [localDocumentData, setLocalDocumentData] = useState<any>(initialDocumentData);

  // Fetch document by ID if documentId is provided but no initial data
  const { data: fetchedDocument, isLoading: isLoadingDocument } = useQuery({
    queryKey: ["document-by-id", documentId],
    queryFn: async () => {
      if (!documentId) return null;
      
      try {
        // Use your existing document API to fetch by ID
        const response = await document.get?.(documentId);
        return response?.data || null;
      } catch (err) {
        console.error('Failed to fetch document by ID:', err);
        toast.error('Failed to load document');
        return null;
      }
    },
    enabled: !!documentId && !initialDocumentData && isOpen,
  });

  // Update local document data when fetchedDocument changes
  useEffect(() => {
    if (fetchedDocument) {
      setLocalDocumentData(fetchedDocument);
    }
  }, [fetchedDocument]);

  // Update local document data when initialDocumentData changes
  useEffect(() => {
    if (initialDocumentData) {
      setLocalDocumentData(initialDocumentData);
    }
  }, [initialDocumentData]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const { mutate: downloadDoc, isPending: isDownloading } = useMutation({
    mutationFn: (id: number) => document.download(id),
    onSuccess: (blob) => {
      const link = window.document.createElement("a");
      link.href = blob;
      link.download = localDocumentData?.title 
        ? `${toSnakeCaseFileName(localDocumentData.title)}.${getFileExtension(localDocumentData.file_name).toLowerCase()}`
        : "document";
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(blob);
      toast.success("Download started");
    },
    onError: (err: any) => {
      toast.error("Failed to download document");
    },
  });

  const {
    data: fileURL,
    isLoading: isLoadingFile,
    isError: isFileError,
  } = useQuery({
    queryKey: ["pdf-view", localDocumentData?.id],
    queryFn: () => document.download(localDocumentData?.id),
    enabled: !!localDocumentData?.id && isOpen,
  });

  const handleClose = () => {
    setError(null);
    setLocalDocumentData(null);
    onClose();
  };

  const handleOpenInDocumentPage = () => {
    if (!localDocumentData?.id) return;
    
    // Navigate to the document page with search parameter
    const documentCategoryGroup = localDocumentData?.category_group?.toLowerCase();
    const basePath = documentCategoryGroup === 'research' 
      ? '/research-documents'
      : documentCategoryGroup === 'governance'
      ? '/governance-documents'
      : '/research-documents';
    
    // Use document ID for searching in the document page
    const searchTerm = localDocumentData.title || '';
    
    handleClose(); // Close modal first
    navigate(`${basePath}?search=${encodeURIComponent(searchTerm)}`);
  };

  // Don't render if no document data and we're not loading
  if (!localDocumentData && !isLoadingDocument && !documentId) {
    return null;
  }

  const getFileDisplayName = () => {
    if (!localDocumentData?.file_name) return 'N/A';
    
    const extension = getFileExtension(localDocumentData.file_name).toLowerCase();
    const title = toSnakeCaseFileName(localDocumentData.title || 'document');
    return `${title}.${extension}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Document Viewer"
      className="max-w-8xl h-[90%]"
      showCloseButton={true}
    >
      <div className="flex flex-col h-full lg:flex-row bg-gray-50 md:flex-row">
        {/* Left Sidebar - Document Details */}
        <div className="flex flex-col w-64 bg-white border-r border-gray-200">
          {/* Sidebar Header */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                  Document Details
                </h2>
              </div>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingDocument ? (
              <div className="flex items-center justify-center h-full">
                <LoaderCircle size={24} className="text-blue-600 animate-spin" />
              </div>
            ) : (
              <div className="px-4 py-3 space-y-4">
                {/* Title & Status */}
                <div>
                  <h1 className="text-sm font-semibold text-gray-900 mb-1.5">
                    {localDocumentData?.title || 'Untitled Document'}
                  </h1>
                  <div className="flex items-center gap-1.5 mb-2">
                    {localDocumentData?.status && (
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          localDocumentData.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {localDocumentData.status}
                      </span>
                    )}
                    {localDocumentData?.category_group && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">
                        {localDocumentData.category_group}
                      </span>
                    )}
                  </div>
                  {localDocumentData?.description && (
                    <p className="text-xs leading-relaxed text-gray-600">
                      {localDocumentData.description}
                    </p>
                  )}
                </div>

                {/* File Information */}
                <div className="pt-3 border-t border-gray-200">
                  <h3 className="text-[10px] font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    File Information
                  </h3>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-[10px] text-gray-500 mb-0.5">
                        File Name
                      </dt>
                      <dd className="text-xs leading-tight text-gray-900 break-all">
                        {getFileDisplayName()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-gray-500 mb-0.5">
                        File Size
                      </dt>
                      <dd className="text-xs text-gray-900">
                        {localDocumentData?.file_size ? formatFileSize(localDocumentData.file_size) : 'N/A'}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Organization Details */}
                <div className="pt-3 border-t border-gray-200">
                  <h3 className="text-[10px] font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Organization
                  </h3>
                  <dl className="space-y-2">
                    {localDocumentData?.affiliate && (
                      <div className="flex items-start gap-1.5">
                        <Building2 className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <dt className="text-[10px] text-gray-500 mb-0.5">
                            Affiliate
                          </dt>
                          <dd className="text-xs leading-tight text-gray-900">
                            {localDocumentData?.affiliate?.name || 'N/A'}
                          </dd>
                        </div>
                      </div>
                    )}
                    {localDocumentData?.employer && (
                      <div className="flex items-start gap-1.5">
                        <User className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <dt className="text-[10px] text-gray-500 mb-0.5">
                            Employer
                          </dt>
                          <dd className="text-xs leading-tight text-gray-900">
                            {localDocumentData.employer}
                          </dd>
                        </div>
                      </div>
                    )}

                    {localDocumentData?.state && (
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <dt className="text-[10px] text-gray-500 mb-0.5">
                            State
                          </dt>
                          <dd className="text-xs text-gray-900">{localDocumentData.state}</dd>
                        </div>
                      </div>
                    )}

                    {localDocumentData?.folder && (
                      <div className="flex items-start gap-1.5">
                        <FolderOpen className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <dt className="text-[10px] text-gray-500 mb-0.5">
                            Folder
                          </dt>
                          <dd className="text-xs leading-tight text-gray-900">
                            {localDocumentData.folder.display_name || 'N/A'}
                          </dd>
                        </div>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Dates */}
                <div className="pt-3 border-t border-gray-200">
                  <h3 className="text-[10px] font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Important Dates
                  </h3>
                  <dl className="space-y-2">
                    {localDocumentData?.effective_date && (
                      <div className="flex items-start gap-1.5">
                        <Calendar className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <dt className="text-[10px] text-gray-500 mb-0.5">
                            Effective Date
                          </dt>
                          <dd className="text-xs text-gray-900">
                            {formatDate(localDocumentData.effective_date)}
                          </dd>
                        </div>
                      </div>
                    )}

                    {localDocumentData?.created_at && (
                      <div className="flex items-start gap-1.5">
                        <Clock className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <dt className="text-[10px] text-gray-500 mb-0.5">
                            Uploaded
                          </dt>
                          <dd className="text-xs text-gray-900">
                            {formatDate(localDocumentData.created_at)}
                          </dd>
                        </div>
                      </div>
                    )}

                    {localDocumentData?.year && (
                      <div className="flex items-start gap-1.5">
                        <Hash className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <dt className="text-[10px] text-gray-500 mb-0.5">
                            Year
                          </dt>
                          <dd className="text-xs text-gray-900">{localDocumentData.year}</dd>
                        </div>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Keywords */}
                {localDocumentData?.keywords && (
                  <div className="pt-3 border-t border-gray-200">
                    <h3 className="text-[10px] font-semibold text-gray-700 uppercase tracking-wider mb-2">
                      Keywords
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {localDocumentData.keywords.split(",").map((keyword: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700 border border-gray-200"
                        >
                          {keyword.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Info */}
                <div className="pt-3 border-t border-gray-200">
                  <h3 className="text-[10px] font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Additional Information
                  </h3>
                  <dl className="space-y-2">
                    {localDocumentData?.category && (
                      <div>
                        <dt className="text-[10px] text-gray-500 mb-0.5">
                          Category
                        </dt>
                        <dd className="text-xs text-gray-900">{localDocumentData.category}</dd>
                      </div>
                    )}

                    {localDocumentData?.type && (
                      <div>
                        <dt className="text-[10px] text-gray-500 mb-0.5">Type</dt>
                        <dd className="text-xs text-gray-900">{localDocumentData.type}</dd>
                      </div>
                    )}

                    {localDocumentData?.cbc && (
                      <div>
                        <dt className="text-[10px] text-gray-500 mb-0.5">CBC</dt>
                        <dd className="text-xs text-gray-900">{localDocumentData.cbc}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content - PDF Viewer */}
        <div className="flex flex-col flex-1 bg-white">
          {/* Top Bar */}
          <div className="px-4 py-2.5 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center flex-shrink-0 rounded w-7 h-7 bg-blue-50">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xs font-semibold text-gray-900 truncate">
                    {localDocumentData?.title || 'Loading...'}
                  </h2>
                  <p className="text-[10px] text-gray-500 truncate">
                    {getFileDisplayName()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                <button
                  onClick={() => localDocumentData?.id && downloadDoc(localDocumentData.id)}
                  disabled={!localDocumentData?.id || isDownloading || isLoadingFile}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isDownloading ? (
                    <LoaderCircle size={12} className="animate-spin" />
                  ) : (
                    <Download size={12} />
                  )}
                  Download
                </button>
                
                <button
                  onClick={handleOpenInDocumentPage}
                  disabled={!localDocumentData?.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Open in document page"
                >
                  <Eye size={12} />
                  Open Page
                </button>
                
                <button
                  onClick={() => fileURL && window.open(fileURL, "_blank")}
                  disabled={!fileURL || isLoadingFile}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ExternalLink size={12} />
                  New Tab
                </button>
              </div>
            </div>
          </div>

          {/* PDF Content */}
          <div className="flex-1 overflow-hidden bg-gray-100">
            {isLoadingFile || isLoadingDocument ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <LoaderCircle
                    size={36}
                    className="mx-auto text-blue-600 animate-spin"
                  />
                  <p className="mt-3 text-xs font-medium text-gray-700">
                    {isLoadingDocument ? 'Loading document details...' : 'Loading file...'}
                  </p>
                  <p className="mt-1 text-[10px] text-gray-500">
                    Please wait while we prepare your file
                  </p>
                </div>
              </div>
            ) : isFileError || error ? (
              <div className="flex items-center justify-center h-full px-4">
                <div className="max-w-sm text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-red-50">
                    <FileText size={24} className="text-red-600" />
                  </div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">
                    Unable to Load Document
                  </h3>
                  <p className="mb-3 text-xs text-gray-600">
                    {error || "An error occurred while loading the PDF file."}
                  </p>
                  <button
                    onClick={handleClose}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Close Viewer
                  </button>
                </div>
              </div>
            ) : fileURL ? (
              <iframe
                src={fileURL}
                className="w-full h-full border-0"
                title={localDocumentData?.title || 'Document'}
              />
            ) : (
              <div className="flex items-center justify-center h-full px-4">
                <div className="max-w-sm text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-gray-50">
                    <FileText size={24} className="text-gray-400" />
                  </div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">
                    Document Preview
                  </h3>
                  <p className="mb-3 text-xs text-gray-600">
                    Preview not available. Please download the file to view it.
                  </p>
                  <button
                    onClick={() => localDocumentData?.id && downloadDoc(localDocumentData.id)}
                    disabled={!localDocumentData?.id || isDownloading}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isDownloading ? (
                      <LoaderCircle size={12} className="animate-spin" />
                    ) : (
                      <Download size={12} />
                    )}
                    Download Document
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default DocumentViewerModal;