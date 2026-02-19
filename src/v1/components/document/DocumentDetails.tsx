import React, { useState, type ReactNode } from "react";
import type { Document } from "../../pages/affiliate/Documents";
import Badge from "../ui/Badge";
import {
  AlertTriangle,
  Calendar,
  Clock,
  MapPin,
  Shield,
  Users,
  FileText,
  X,
} from "lucide-react";
import Modal from "../ui/Modal";

interface DocumentDetailsProps {
  document: Document;
  renderButton?: ReactNode;
}

export default function DocumentDetails({
  document,
  renderButton,
}: DocumentDetailsProps) {
  const [open, setOpen] = useState(false);
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const isExpiringSoon = (expirationDate: string) => {
    if (!expirationDate) return false;
    const expDate = new Date(expirationDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil(
      (expDate.getTime() - today.getTime()) / (1000 * 3600 * 24)
    );
    return daysUntilExpiry <= 90 && daysUntilExpiry >= 0;
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex-1 px-2 py-1 text-xs text-gray-600 rounded hover:text-gray-800 hover:bg-gray-50"
      >
        {renderButton ?? "Details"}
      </button>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Upload Document"
        className="max-w-3xl min-w-2xl"
      >
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl">
          {/* Header */}
          <div className="flex items-start justify-between px-6 py-4 border-b">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {document.title}
              </h2>
              <p className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                <FileText size={14} className="text-gray-400" />
                {document.file_name}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  document.type === "contract"
                    ? "primary"
                    : document.type === "arbitration"
                    ? "danger"
                    : "success"
                }
                className="capitalize"
              >
                {document.type}
              </Badge>
              {document.contract_expiration_date &&
                isExpiringSoon(document.contract_expiration_date) && (
                  <Badge variant="warning" className="flex items-center gap-1">
                    <AlertTriangle size={14} /> Expiring Soon
                  </Badge>
                )}
              {/* <button
                onClick={onClose}
                className="p-1 ml-3 text-gray-400 rounded-lg hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={16} />
              </button> */}
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-2">
            {/* Left: Document Info */}
            <section className="space-y-5">
              <h3 className="pb-1 text-sm font-semibold tracking-wide text-gray-700 uppercase border-b">
                Document Information
              </h3>

              <InfoItem
                label="Description"
                value={document.description || "No description provided"}
              />

              <div className="grid grid-cols-2 gap-4">
                <InfoItem
                  label="File Size"
                  value={formatFileSize(document.file_size)}
                />
                <InfoItem
                  label="Uploaded"
                  value={new Date(document.uploaded_at).toLocaleDateString()}
                />
              </div>

              {document.keywords && (
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-600">
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
            </section>

            {/* Right: Contract Info */}
            <section className="space-y-5">
              <h3 className="pb-1 text-sm font-semibold tracking-wide text-gray-700 uppercase border-b">
                Contract Details
              </h3>

              {document.employer && (
                <InfoIcon
                  label="Employer"
                  value={document.employer}
                  icon={<Users size={16} />}
                />
              )}

              {document.cbc && (
                <InfoIcon
                  label="CBC"
                  value={document.cbc}
                  icon={<Shield size={16} />}
                />
              )}

              {document.state && (
                <InfoIcon
                  label="State"
                  value={document.state}
                  icon={<MapPin size={16} />}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                {document.effective_date && (
                  <InfoIcon
                    label="Effective Date"
                    value={new Date(
                      document.effective_date
                    ).toLocaleDateString()}
                    icon={<Calendar size={16} />}
                  />
                )}

                {document.contract_expiration_date && (
                  <InfoIcon
                    label="Expiration Date"
                    value={new Date(
                      document.contract_expiration_date
                    ).toLocaleDateString()}
                    icon={<Clock size={16} />}
                    className={
                      isExpiringSoon(document.contract_expiration_date)
                        ? "text-orange-600 font-medium"
                        : ""
                    }
                  />
                )}
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-600">
                  Status
                </label>
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
            </section>
          </div>
        </div>
      </Modal>
    </>
  );
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <label className="block mb-1 text-sm font-medium text-gray-600">
        {label}
      </label>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  );
}

function InfoIcon({
  label,
  value,
  icon,
  className = "",
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div>
      <label className="block mb-1 text-sm font-medium text-gray-600">
        {label}
      </label>
      <p
        className={`flex items-center gap-2 text-sm text-gray-900 ${className}`}
      >
        {icon}
        {value}
      </p>
    </div>
  );
}
