// src/components/information/CreateInformation.tsx
import React, { useState, useRef } from "react";
import { Plus, X, Upload, FileText } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Modal from "../ui/Modal";
import InputField from "../ui/InputField";
import SelectField from "../ui/SelectField";
import AlertMessage from "../ui/AlertMessage";
import { nationalInformation } from "@v1/api/nationalInformation/index";
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

interface CreateInformationProps {
  onSuccess?: () => void;
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
}

export default function CreateInformation({ onSuccess }: CreateInformationProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormData>({
    type: "",
    title: "",
    content: "",
    category: "",
    author: "",
    status: "draft",
    published_at: "",
    attachments: [],
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

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
    
    // Validate file sizes (10MB max)
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

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: FormData) => nationalInformation.create(payload),
    onSuccess: () => {
      setOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["national-information"] });
      toast.success("Information created successfully");
      onSuccess?.();
    },
    onError: (error: any) => {
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

    const payload = {
      ...form,
      attachments: uploadedFiles,
      published_at: form.status === "published" && !form.published_at 
        ? new Date().toISOString().split('T')[0]
        : form.published_at,
    };

    mutate(payload);
  };

  const resetForm = () => {
    setForm({
      type: "",
      title: "",
      content: "",
      category: "",
      author: "",
      status: "draft",
      published_at: "",
      attachments: [],
    });
    setUploadedFiles([]);
    setErrors({});
    setGeneralError("");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition-colors bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <Plus className="w-4 h-4" />
        Create Information
      </button>

      <Modal
        isOpen={open}
        onClose={() => {
          setOpen(false);
          resetForm();
        }}
        title="Create New Information"
        className="max-w-4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {generalError && <AlertMessage type="error" message={generalError} />}

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

            {form.status === "published" && (
              <InputField
                label="Publish Date"
                name="published_at"
                type="date"
                value={form.published_at}
                onChange={handleChange}
                error={errors.published_at}
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
              Attachments (Optional)
            </label>
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-gray-500">
                PDF, DOC, XLS, PPT, JPG, PNG, GIF (Max 10MB each)
              </p>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">
                    Selected Files ({uploadedFiles.length})
                  </h4>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">
                            {file.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
              {isPending ? "Creating..." : "Create Information"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}