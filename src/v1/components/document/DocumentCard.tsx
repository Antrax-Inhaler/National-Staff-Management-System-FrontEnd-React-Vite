import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FileText,
  Calendar,
  Building2,
  Download,
  MoreVertical,
  Edit,
  Trash2,
  Share2,
  FolderOpen,
  Eye,
  MapPin,
  Tag,
  User,
} from "lucide-react";

interface DocumentCardProps {
  doc: any;
  onView?: (doc: any) => void;
  onDownload?: (doc: any) => void;
  onEdit?: (doc: any) => void;
  onDelete?: (doc: any) => void;
  onShare?: (doc: any) => void;
  onMove?: (doc: any) => void;
  menuActions?: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: (doc: any) => void;
    variant?: "default" | "danger";
  }>;
  customMenuContent?: React.ReactNode;
  showDefaultActions?: boolean;
}

const toSnakeCaseFileName = (str: string) => {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};

const DocumentCard = ({
  doc,
  onView,
  onDownload,
  onEdit,
  onDelete,
  onShare,
  onMove,
  menuActions,
  customMenuContent,
  showDefaultActions = true,
}: DocumentCardProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleView = () => {
    onView?.(doc);
    setShowMenu(false);
  };

  const handleDownload = () => {
    onDownload?.(doc);
    setShowMenu(false);
  };

  const handleEdit = () => {
    onEdit?.(doc);
    setShowMenu(false);
  };

  const handleDelete = () => {
    onDelete?.(doc);
    setShowMenu(false);
  };

  const handleShare = () => {
    onShare?.(doc);
    setShowMenu(false);
  };

  const handleMove = () => {
    onMove?.(doc);
    setShowMenu(false);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + "B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + "KB";
    return (bytes / 1048576).toFixed(1) + "MB";
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getFileExtension = (filename: string) => {
    if (!filename) return "";
    return filename.split(".").pop()?.toUpperCase() || "";
  };

  const defaultMenuActions = [
    onView && {
      label: "View",
      icon: <Eye className="w-4 h-4" />,
      onClick: handleView,
    },
    onDownload && {
      label: "Download",
      icon: <Download className="w-4 h-4" />,
      onClick: handleDownload,
    },
    onShare && {
      label: "Share",
      icon: <Share2 className="w-4 h-4" />,
      onClick: handleShare,
    },
    onEdit && {
      label: "Edit",
      icon: <Edit className="w-4 h-4" />,
      onClick: handleEdit,
    },
    onMove && {
      label: "Move",
      icon: <FolderOpen className="w-4 h-4" />,
      onClick: handleMove,
    },
    onDelete && {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: handleDelete,
      variant: "danger" as const,
    },
  ].filter(Boolean) as Array<{
    label: string;
    icon: React.ReactNode;
    onClick: (doc: any) => void;
    variant?: "default" | "danger";
  }>;

  const actionsToRender = menuActions || defaultMenuActions;

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!showMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 192;
      const menuHeight = actionsToRender.length * 44;
      const padding = 8;

      let left = rect.right - menuWidth;
      if (left < padding) {
        left = padding;
      }

      let top = rect.bottom + padding;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      if (spaceBelow < menuHeight + padding && spaceAbove > spaceBelow) {
        top = rect.top - menuHeight - padding;
      }

      if (top + menuHeight > window.innerHeight - padding) {
        top = window.innerHeight - menuHeight - padding;
      }

      if (top < padding) {
        top = padding;
      }

      setMenuPosition({ top, left });
      setShowMenu(true);
    } else {
      setShowMenu(false);
    }
  };

  useEffect(() => {
    if (!showMenu) return;

    const handleClickOutside = () => {
      setShowMenu(false);
    };

    const handleScroll = () => {
      setShowMenu(false);
    };

    document.addEventListener("click", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("click", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [showMenu]);

  const fileExt = getFileExtension(doc.file_name);
  const fileSize = formatFileSize(doc.file_size);
  const effectiveDate = formatDate(doc.effective_date);

  return (
    <div className="w-full h-full transition-all duration-200 bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-gray-300">
      <div className="flex flex-col h-full p-3">
        {/* Main Content - grows to push footer down */}
        <div className="flex-1">
          <div className="flex items-start gap-2.5">
            <div className="flex-shrink-0">
              <div className="relative flex items-center justify-center w-10 h-10 border border-blue-200 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
                <FileText className="w-5 h-5 text-blue-600" />
                {fileExt && (
                  <span className="absolute -bottom-1 -right-1 text-[8px] font-bold bg-blue-600 text-white px-1 py-0.5 rounded shadow-sm">
                    {fileExt}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3
                    className="text-sm font-semibold text-gray-900 transition-colors cursor-pointer hover:text-blue-600 line-clamp-1"
                    onClick={handleView}
                    title={doc.title}
                  >
                    {doc.title || "Untitled doc"}
                  </h3>
                  <div className="flex flex-col gap-1 mt-1">
                    {(doc.file_name || fileSize) && (
                      <span className="text-[10px] text-gray-500">
                        {doc.file_name && (
                          <span className="truncate max-w-[35ch] shrink inline-flex">
                            {toSnakeCaseFileName(doc.title)}
                          </span>
                        )}
                        {fileExt && `.${fileExt.toLowerCase()}`}
                        {fileSize && ` • ${fileSize}`}
                      </span>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {doc.status && (
                        <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-green-700 bg-green-50 rounded border border-green-200 capitalize">
                          {doc.status}
                        </span>
                      )}
                      {doc.is_public !== undefined && (
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded border ${
                            doc.is_public
                              ? "text-orange-700 bg-orange-50 border-orange-200"
                              : "text-blue-700 bg-blue-50 border-blue-200"
                          }`}
                        >
                          {doc.is_public ? "Public" : "Private"}
                        </span>
                      )}
                      {doc.type && (
                        <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-gray-700 bg-gray-100 rounded border border-gray-200 capitalize">
                          {doc.type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  ref={buttonRef}
                  onClick={handleMenuToggle}
                  className="flex-shrink-0 p-1 transition-colors rounded-lg hover:bg-gray-100"
                  aria-label="More actions"
                >
                  <MoreVertical className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          </div>

          {(doc.affiliate?.name ||
            effectiveDate ||
            doc.state ||
            doc.folder?.display_name) && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 text-[11px] text-gray-600">
              {doc.affiliate?.name && (
                <div className="flex items-center gap-1">
                  <Building2 className="flex-shrink-0 w-3.5 h-3.5 text-gray-400" />
                  <span
                    className="truncate max-w-[140px]"
                    title={doc.affiliate.name}
                  >
                    {doc.affiliate.name}
                  </span>
                </div>
              )}

              {effectiveDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="flex-shrink-0 w-3.5 h-3.5 text-gray-400" />
                  <span>{effectiveDate}</span>
                </div>
              )}

              {doc.state && (
                <div className="flex items-center gap-1">
                  <MapPin className="flex-shrink-0 w-3.5 h-3.5 text-gray-400" />
                  <span>{doc.state}</span>
                </div>
              )}

              {doc.folder?.display_name && (
                <div className="flex items-center gap-1">
                  <FolderOpen className="flex-shrink-0 w-3.5 h-3.5 text-gray-400" />
                  <span
                    className="truncate max-w-[100px]"
                    title={doc.folder.display_name}
                  >
                    {doc.folder.display_name}
                  </span>
                </div>
              )}
            </div>
          )}

          {doc.keywords && doc.keywords.trim() && (
            <div className="flex items-start gap-1.5 mt-2.5">
              <Tag className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="flex flex-wrap gap-1">
                {doc.keywords
                  .split(",")
                  .filter((k: string) => k.trim())
                  .map((keyword: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-1.5 py-0.5 text-[10px] text-gray-700 transition-colors border border-gray-200 rounded cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-gray-300"
                    >
                      {keyword.trim()}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer - Always at bottom */}
        {doc.uploaded_by && (
          <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-gray-100 text-[11px] text-gray-500">
            <User className="w-3.5 h-3.5 text-gray-400" />
            <span>Uploaded by</span>
            <span className="font-medium text-gray-700">{doc.uploaded_by}</span>
          </div>
        )}
      </div>

      {showMenu &&
        menuPosition &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            className="fixed w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-[100] overflow-hidden"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {showDefaultActions &&
              actionsToRender.map((action, index) => {
                const isDanger = action.variant === "danger";
                const isLastDanger =
                  isDanger && index === actionsToRender.length - 1;

                return (
                  <React.Fragment key={index}>
                    {isLastDanger && actionsToRender.length > 1 && (
                      <div className="text-xs border-t border-gray-100" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        action.onClick(doc);
                        setShowMenu(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs transition-colors text-left ${
                        isDanger
                          ? "text-red-600 hover:bg-red-50"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span
                        className={isDanger ? "text-red-600" : "text-gray-500"}
                      >
                        {action.icon}
                      </span>
                      {action.label}
                    </button>
                  </React.Fragment>
                );
              })}
            {customMenuContent && (
              <>
                {customMenuContent}
                {showDefaultActions && actionsToRender.length > 0 && (
                  <div className="border-t border-gray-100" />
                )}
              </>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
};

export default DocumentCard;
