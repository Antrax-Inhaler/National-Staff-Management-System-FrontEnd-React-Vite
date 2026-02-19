// src/components/information/EditInformation.tsx
import React, { useState, useRef, useEffect } from "react";
import { Pencil, X, FileText } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Modal from "../ui/Modal";
import InputField from "../ui/InputField";
import SelectField from "../ui/SelectField";
import AlertMessage from "../ui/AlertMessage";
import { nationalInformation, type UpdateData } from "@v1/api/nationalInformation/index.ts";
import type { NationalInformation, NationalInformationAttachment } from "@v1/pages/national/Information";
import toast from "react-hot-toast";
import TiptapEditor from "../ui/TiptapEditor";

const TYPE_OPTIONS = [
  { label: "Announcement", value: "announcement" },
  { label: "News", value: "news" },
  { label: "Resource", value: "resource" },
  { label: "Event", value: "event" },
  { label: "Policy", value: "policy" },
];

const CATEGORY_OPTIONS = [
  { label: "General", value: "general" },
  { label: "Membership", value: "membership" },
  { label: "Events", value: "events" },
  { label: "Resources", value: "resources" },
  { label: "Policies", value: "policies" },
  { label: "Updates", value: "updates" },
];

const STATUS_OPTIONS = [
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
  { label: "Archived", value: "archived" },
];

interface EditInformationProps {
  information: NationalInformation;
  queryKey: any[];
}

interface FormData {
  type: string;
  title: string;
  content: string;
  category: string;
  author: string;
  status: string;
  published_at: string;
  attachments: File[];
  delete_attachments: number[];
}

export default function EditInformation({ information, queryKey }: EditInformationProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormData>({
    type: information.type,
    title: information.title,
    content: information.content,
    category: information.category,
    author: information.author,
    status: information.status,
    published_at: information.published_at?.split('T')[0] || "",
    attachments: [],
    delete_attachments: [],
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [filesToDelete, setFilesToDelete] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Update form when information changes or modal opens
  useEffect(() => {
    if (open) {
      // Convert published_at from Laravel format (YYYY-MM-DD HH:mm:ss) to datetime-local format (YYYY-MM-DDTHH:mm)
      let publishedAtForInput = "";
      if (information.published_at) {
        const date = new Date(information.published_at);
        if (!isNaN(date.getTime())) {
          // Format: YYYY-MM-DDTHH:mm
          publishedAtForInput = date.toISOString().slice(0, 16);
        }
      }

      setForm({
        type: information.type,
        title: information.title,
        content: information.content,
        category: information.category,
        author: information.author,
        status: information.status,
        published_at: publishedAtForInput,
        attachments: [],
        delete_attachments: [],
      });
    }
  }, [open, information]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: [] }));
    setGeneralError("");
  };

  const handleContentChange = (content: string) => {
    setForm(prev => ({ ...prev, content }));
    setErrors(prev => ({ ...prev, content: [] }));
    setGeneralError("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB limit`);
        return false;
      }
      return true;
    });

    setUploadedFiles(prev => [...prev, ...validFiles]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveNewFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingFile = (attachmentId: number) => {
    setFilesToDelete(prev => [...prev, attachmentId]);
  };

  const handleUndoDeleteFile = (attachmentId: number) => {
    setFilesToDelete(prev => prev.filter(id => id !== attachmentId));
  };

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: UpdateData) => 
      nationalInformation.update(information.id, payload),
    onSuccess: (result) => {
      console.log("Update successful:", result);
      setSuccessMessage("Information updated successfully");
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["national-information"] });
      toast.success("Information updated successfully");
      
      setTimeout(() => {
        setSuccessMessage("");
        setOpen(false);
        resetForm();
      }, 3000);
    },
    onError: (error: any) => {
      console.error("Update error:", error);
      if (error?.errors) {
        setErrors(error.errors);
        const errorMessages = Object.values(error.errors).flat() as string[];
        if (errorMessages.length > 0) {
          setGeneralError(`${errorMessages.join(", ")}`);
        }
      } else if (error?.message) {
        setGeneralError(error.message);
      } else {
        setGeneralError("An unexpected error occurred");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError("");

    // Create payload with only changed fields
    const payload: UpdateData = {};
    
    // Always send all required fields when editing
    payload.type = form.type;
    payload.title = form.title;
    payload.content = form.content;
    payload.category = form.category;
    payload.author = form.author;
    payload.status = form.status;
    
    // Handle published_at conversion from datetime-local to Laravel format
    if (form.published_at) {
      // Convert from YYYY-MM-DDTHH:mm to YYYY-MM-DD HH:mm:ss
      const date = new Date(form.published_at);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        payload.published_at = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }
    } else if (form.status === "published" && !information.published_at) {
      // Auto-set published date if status changed to published
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      payload.published_at = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } else if (form.status !== "published" && information.published_at) {
      // If changing from published to draft/archived, clear published date
      payload.published_at = null;
    }
    
    // Always include attachments if any
    if (uploadedFiles.length > 0) {
      payload.attachments = uploadedFiles;
    }
    
    // Always include delete_attachments if any
    if (filesToDelete.length > 0) {
      payload.delete_attachments = filesToDelete;
    }

    console.log("Update payload being sent:", payload);
    mutate(payload);
  };

  const resetForm = () => {
    setForm({
      type: information.type,
      title: information.title,
      content: information.content,
      category: information.category,
      author: information.author,
      status: information.status,
      published_at: information.published_at?.split('T')[0] || "",
      attachments: [],
      delete_attachments: [],
    });
    setUploadedFiles([]);
    setFilesToDelete([]);
    setErrors({});
    setGeneralError("");
    setSuccessMessage("");
  };

  const existingAttachments = information.attachments?.filter(
    attachment => !filesToDelete.includes(attachment.id)
  ) || [];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1 text-yellow-600 transition rounded-full md:p-2 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        title="Edit Information"
      >
        <Pencil className="w-4 h-4" />
      </button>

      <Modal
        isOpen={open}
        onClose={() => {
          setOpen(false);
          resetForm();
        }}
        title="Edit Information"
        className="max-w-4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {generalError && <AlertMessage type="error" message={generalError} />}
          {successMessage && <AlertMessage type="success" message={successMessage} />}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SelectField
              label="Type"
              name="type"
              value={form.type}
              onChange={handleChange}
              options={[
                { label: "Select Type", value: "" },
                ...TYPE_OPTIONS,
              ]}
              error={errors.type}
              required
            />

            <SelectField
              label="Category"
              name="category"
              value={form.category}
              onChange={handleChange}
              options={[
                { label: "Select Category", value: "" },
                ...CATEGORY_OPTIONS,
              ]}
              error={errors.category}
              required
            />

            <InputField
              label="Title"
              name="title"
              value={form.title}
              onChange={handleChange}
              error={errors.title}
              required
              className="md:col-span-2"
            />

            <InputField
              label="Author"
              name="author"
              value={form.author}
              onChange={handleChange}
              error={errors.author}
              required
            />

            <SelectField
              label="Status"
              name="status"
              value={form.status}
              onChange={handleChange}
              options={STATUS_OPTIONS}
              error={errors.status}
              required
            />

            {(form.status === "published" || information.status === "published") && (
              <InputField
                label="Publish Date & Time"
                name="published_at"
                type="datetime-local"
                value={form.published_at}
                onChange={handleChange}
                error={errors.published_at}
                helperText="Leave empty to use current time when published"
              />
            )}
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Content <span className="text-red-500">*</span>
            </label>
            <TiptapEditor
              value={form.content}
              onChange={handleContentChange}
              placeholder="Write your content here..."
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content[0]}</p>
            )}
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Attachments
            </label>
            <div className="space-y-4">
              {/* Existing Attachments */}
              {existingAttachments.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-gray-700">
                    Current Attachments
                  </h4>
                  <div className="space-y-2">
                    {existingAttachments.map((attachment: NationalInformationAttachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <a
                            href={attachment.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {attachment.file_name}
                          </a>
                          <span className="text-xs text-gray-500">
                            ({(attachment.file_size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteExistingFile(attachment.id)}
                          className="text-red-500 hover:text-red-700"
                          title="Delete attachment"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Files Marked for Deletion */}
              {filesToDelete.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-red-600">
                    Files to be Deleted
                  </h4>
                  <div className="space-y-2">
                    {information.attachments
                      ?.filter(attachment => filesToDelete.includes(attachment.id))
                      .map((attachment: NationalInformationAttachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-red-400" />
                            <span className="text-sm text-red-700 line-through">
                              {attachment.file_name}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleUndoDeleteFile(attachment.id)}
                            className="text-green-500 hover:text-green-700"
                            title="Undo delete"
                          >
                            Undo
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* New File Upload */}
              <div>
                <h4 className="mb-2 text-sm font-medium text-gray-700">
                  Add New Attachments
                </h4>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="mt-1 text-xs text-gray-500">
                  PDF, DOC, XLS, PPT, JPG, PNG, GIF (Max 10MB each)
                </p>

                {uploadedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-400" />
                          <span className="text-sm text-blue-700">
                            {file.name}
                          </span>
                          <span className="text-xs text-blue-500">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveNewFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? "Updating..." : "Update Information"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}