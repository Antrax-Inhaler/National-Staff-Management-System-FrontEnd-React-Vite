import { useMutation, useQuery } from "@tanstack/react-query";
import { document } from "@v1/api/document";
import Modal from "@v1/components/ui/Modal";
import {
  getFileExtension,
  toSnakeCase,
  toSnakeCaseFileName,
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
  Loader2,
  LoaderCircle,
  MapPin,
  User,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

function PdfViewer({ doc, onClose }: { doc: any; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const { mutate, isPending } = useMutation({
    mutationFn: (id: number) => document.download(id),
    onSuccess: (blob) => {
      // Create a temporary <a> element to trigger download
      const link = window.document.createElement("a");
      link.href = blob;
      link.download = toSnakeCaseFileName(doc.title); // set the downloaded file name
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);

      // Optional: revoke the object URL to free memory
      window.URL.revokeObjectURL(blob);

      toast.success("Download started");
    },
    onError: (err: any) => {},
  });

  const {
    data: fileURL,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["pdf-view", doc.id],
    queryFn: () => document.download(doc.id),
    enabled: !!doc.id,
  });

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title=""
      className="max-w-8xl h-[90%]"
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
            <div className="px-4 py-3 space-y-4">
              {/* Title & Status */}
              <div>
                <h1 className="text-sm font-semibold text-gray-900 mb-1.5">
                  {doc.title}
                </h1>
                <div className="flex items-center gap-1.5 mb-2">
                  {doc.status && (
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        doc.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {doc.status}
                    </span>
                  )}
                  {doc.type && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">
                      {doc.type}
                    </span>
                  )}
                </div>
                {doc.description && (
                  <p className="text-xs leading-relaxed text-gray-600">
                    {doc.description}
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
                      {toSnakeCaseFileName(doc.title)}.
                      {getFileExtension(doc.file_name).toLowerCase()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] text-gray-500 mb-0.5">
                      File Size
                    </dt>
                    <dd className="text-xs text-gray-900">
                      {formatFileSize(doc.file_size)}
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
                  {doc.affiliate && (
                    <div className="flex items-start gap-1.5">
                      <Building2 className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <dt className="text-[10px] text-gray-500 mb-0.5">
                          Affiliate
                        </dt>
                        <dd className="text-xs leading-tight text-gray-900">
                          {doc?.affiliate?.name}
                        </dd>
                      </div>
                    </div>
                  )}

                  {doc.employer && (
                    <div className="flex items-start gap-1.5">
                      <User className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <dt className="text-[10px] text-gray-500 mb-0.5">
                          Employer
                        </dt>
                        <dd className="text-xs leading-tight text-gray-900">
                          {doc.employer}
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

                  {doc.award_date && (
                    <div className="flex items-start gap-1.5">
                      <Calendar className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <dt className="text-[10px] text-gray-500 mb-0.5">
                          Award Date
                        </dt>
                        <dd className="text-xs text-gray-900">
                          {formatDate(doc.award_date)}
                        </dd>
                      </div>
                    </div>
                  )}

                  {doc.effective_date && (
                    <div className="flex items-start gap-1.5">
                      <Calendar className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <dt className="text-[10px] text-gray-500 mb-0.5">
                          Effective Date
                        </dt>
                        <dd className="text-xs text-gray-900">
                          {formatDate(doc.effective_date)}
                        </dd>
                      </div>
                    </div>
                  )}

                  {doc.expiration_date && (
                    <div className="flex items-start gap-1.5">
                      <Calendar className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <dt className="text-[10px] text-gray-500 mb-0.5">
                          Expiration Date
                        </dt>
                        <dd className="text-xs text-gray-900">
                          {formatDate(doc.expiration_date)}
                        </dd>
                      </div>
                    </div>
                  )}

                  {doc.year && (
                    <div className="flex items-start gap-1.5">
                      <Hash className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <dt className="text-[10px] text-gray-500 mb-0.5">
                          Year
                        </dt>
                        <dd className="text-xs text-gray-900">{doc.year}</dd>
                      </div>
                    </div>
                  )}

                  {doc.created_at && (
                    <div className="flex items-start gap-1.5">
                      <Clock className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <dt className="text-[10px] text-gray-500 mb-0.5">
                          Uploaded
                        </dt>
                        <dd className="text-xs text-gray-900">
                          {formatDate(doc.created_at)}
                        </dd>
                      </div>
                    </div>
                  )}
                </dl>
              </div>

              {/* Keywords */}
              {doc.keywords && (
                <div className="pt-3 border-t border-gray-200">
                  <h3 className="text-[10px] font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Keywords
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {doc.keywords.split(",").map((keyword, index) => (
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
              {doc.category && (
                <div className="pt-3 border-t border-gray-200">
                  <h3 className="text-[10px] font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Additional Information
                  </h3>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-[10px] text-gray-500 mb-0.5">
                        Category
                      </dt>
                      <dd className="text-xs text-gray-900">{doc.category}</dd>
                    </div>
                  </dl>
                </div>
              )}
            </div>
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
                    {doc.title}
                  </h2>
                  <p className="text-[10px] text-gray-500 truncate">
                    {toSnakeCaseFileName(doc.title)}.
                    {getFileExtension(doc.file_name).toLowerCase()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                <button
                  onClick={() => mutate(doc.id)}
                  disabled={!fileURL || isLoading || isPending}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isPending ? (
                    <LoaderCircle size={12} className="animate-spin" />
                  ) : (
                    <Download size={12} />
                  )}
                  Download
                </button>
                <button
                  onClick={() => fileURL && window.open(fileURL, "_blank")}
                  disabled={!fileURL || isLoading}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ExternalLink size={12} />
                  Open in New Tab
                </button>
              </div>
            </div>
          </div>

          {/* PDF Content */}
          <div className="flex-1 overflow-hidden bg-gray-100">
            {isLoading && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2
                    size={36}
                    className="mx-auto text-blue-600 animate-spin"
                  />
                  <p className="mt-3 text-xs font-medium text-gray-700">
                    Loading document...
                  </p>
                  <p className="mt-1 text-[10px] text-gray-500">
                    Please wait while we prepare your file
                  </p>
                </div>
              </div>
            )}

            {isError && (
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
                    onClick={onClose}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Close Viewer
                  </button>
                </div>
              </div>
            )}

            {fileURL && !isLoading && !isError && (
              <iframe
                src={fileURL}
                className="w-full h-full border-0"
                title={doc.title}
              />
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default PdfViewer;
