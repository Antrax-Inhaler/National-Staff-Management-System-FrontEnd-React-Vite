import React, { useState } from "react";
import { Upload, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface FileUploadProps {
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  onFileSelect?: (file: File | null) => void;
}

export default function FileUpload({
  label = "Click to select a file",
  accept = ".pdf",
  maxSizeMB = 10,
  onFileSelect,
}: FileUploadProps) {
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "uploaded" | "error"
  >("idle");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    // ✅ Validate file type
    if (
      accept &&
      !accept.split(",").some((ext) => file.name.endsWith(ext.trim()))
    ) {
      toast.error(`Please upload a valid file type: ${accept}`);
      return;
    }

    // ✅ Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    setFilePreview(file.name);
    onFileSelect?.(file);

    // ✅ Simulate progress
    setUploadStatus("uploading");
    setUploadProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setUploadStatus("uploaded");
      }
    }, 100);
  };

  const handleRemoveFile = () => {
    setFilePreview(null);
    setUploadProgress(0);
    setUploadStatus("idle");
    onFileSelect?.(null);
  };

  return (
    <div className="relative p-4 text-center border-2 border-gray-300 border-dashed rounded-lg">
      {!filePreview ? (
        <>
          <input
            type="file"
            id="file"
            onChange={handleFileChange}
            className="hidden"
            accept={accept}
          />

          <label htmlFor="file" className="block cursor-pointer">
            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600">{label}</p>
            <p className="mt-1 text-xs text-gray-500">
              Accepted: {accept} (Max {maxSizeMB}MB)
            </p>
          </label>
        </>
      ) : (
        <div className="flex flex-col items-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <p className="text-sm font-medium text-gray-700">{filePreview}</p>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="p-1 rounded-full hover:bg-gray-200"
              aria-label="Remove file"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>

          {/* Progress Bar */}
          {uploadStatus === "uploading" && (
            <div className="w-full h-2 overflow-hidden bg-gray-200 rounded-full">
              <div
                className="h-2 transition-all duration-200 bg-blue-500"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          {/* Status Indicator */}
          {uploadStatus === "uploaded" && (
            <div className="flex items-center justify-center text-sm text-green-600">
              <CheckCircle className="w-4 h-4 mr-1" /> Ready to submit
            </div>
          )}
        </div>
      )}
    </div>
  );
}
