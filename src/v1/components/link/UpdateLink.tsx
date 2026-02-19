import React, { useState, type ReactNode } from "react";
import type { Document, DocumentFolder } from "../../pages/affiliate/Documents";
import type { Affiliate } from "../../pages/affiliate/Members";
import toast from "react-hot-toast";
import { Building, LoaderCircle, Plus, Upload } from "lucide-react";
import Modal from "../ui/Modal";
import InputField from "../ui/InputField";
import SelectField from "../ui/SelectField";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { document } from "../../api/document";
import TextAreaInput from "../ui/TextAreaInput";
import StateSelect from "../ui/StateCitySelect/StateSelect";
import type { State } from "../ui/StateCitySelect/types";
import FileUpload from "../ui/FileUpload";
import CheckboxField from "../ui/CheckboxField";
import { links, type linkForm, type updateLinkForm } from "../../api/link";
import { useAuth } from "../../contexts/AuthContext";
import { affiliate } from "../../api/affiliate";
import { Roles } from "../../constants/roles";
import RoleGuard from "../RoleGuard";
import type { Link } from "../../pages/Links";

interface updateLinkParam {
  link: Link;
  renderButton: ReactNode;
}

function UpdateLink({ link, renderButton }: updateLinkParam) {
  const [open, setOpen] = useState(false);
  const { userRole } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formData, setFormData] = useState<updateLinkForm>({
    id: link.id,
    title: link.title,
    url: link.url,
    description: link.description ?? "",
    category: link.category ?? "",
    display_order: link.display_order ?? 0,
    is_active: link.is_active ?? false,
    is_public: link.is_public ?? false,
    affiliate_id: link.affiliate_id ?? null,
  });

  const handleCancel = () => {
    setFormData({
      id: link.id,
      title: link.title,
      url: link.url,
      description: link.description ?? "",
      category: link.category ?? "",
      display_order: link.display_order ?? 0,
      is_active: link.is_active ?? false,
      is_public: link.is_public ?? false,
      affiliate_id: link.affiliate_id ?? null,
    });
    setOpen(false);
    setUploading(false);
  };

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: updateLinkForm) => links.update(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table-links"] });
      queryClient.invalidateQueries({ queryKey: ["grid-links"] });
      toast.success("Link Updated");
      setUploading(false);
      setOpen(false);
    },
    onError: async (err: any) => {
      if (err?.errors) {
        setErrors(err.errors);
        setUploading(false);
      } else {
        console.error(err);
        setUploading(false);
      }
    },
  });

  const categoryOptions = [
    { value: "Resources", label: "Resources" },
    { value: "Documents", label: "Documents" },
    { value: "Tools", label: "Tools" },
    { value: "External", label: "External" },
    { value: "Internal", label: "Internal" },
  ];

  const {
    data: affiliates,
    isFetching,
    isLoading,
  } = useQuery({
    queryKey: ["affiliates"],
    queryFn: () => affiliate.options(),
    enabled: userRole.roles.includes(Roles.NATIONAL_ADMINISTRATOR),
  });

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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    let fieldValue: string | boolean = value;

    // ✅ Narrow type safely
    if (type === "checkbox" && "checked" in e.target) {
      fieldValue = e.target.checked;
    }

    if (name === "category") {
      setFormData((prev) => ({
        ...prev,
        database_source: value,
      }));
    }

    setFormData((prev) => ({
      ...prev,
      [name]: fieldValue,
    }));

    setErrors((prev) => ({ ...prev, [name]: [] }));
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    mutate(formData);
  };

  const handleStateChange = (state: State) => {
    setFormData((prev) =>
      prev ? { ...prev, ["state"]: state.state_code } : prev
    );
  };
  const handleFileSelect = (file: File | null) => {
    setFormData((prev) => (prev ? { ...prev, ["file"]: file } : prev));
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
      >
        {renderButton}
      </button>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Link"
        className="max-w-3xl min-w-2xl"
        disableClose={uploading}
      >
        <form onSubmit={handleUpload} className="space-y-6">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <RoleGuard roles={[Roles.NATIONAL_ADMINISTRATOR]}>
                  {affiliates && (
                    <SelectField
                      label="Affiliate"
                      name="affiliate_id"
                      options={affiliates?.map((affiliate) => ({
                        label: affiliate.name,
                        value: affiliate.id,
                      }))}
                      value={formData.affiliate_id ?? ""}
                      onChange={handleChange}
                      error={errors.affiliate_id}
                    />
                  )}
                </RoleGuard>
                <InputField
                  label="Title"
                  name="title"
                  value={formData.title ?? ""}
                  onChange={handleChange}
                  error={errors.title ?? ""}
                  required
                />
                <InputField
                  label="URL"
                  name="url"
                  value={formData.url ?? ""}
                  onChange={handleChange}
                  error={errors.url ?? ""}
                  required
                />
                <TextAreaInput
                  label="Description"
                  name="description"
                  value={formData.description ?? ""}
                  onChange={handleChange}
                  error={errors.description ?? ""}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Link description and notes"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <SelectField
                  label="Category"
                  name="category"
                  options={categoryOptions}
                  value={formData.category ?? ""}
                  onChange={handleChange}
                  error={errors.category}
                  required
                />

                <InputField
                  label="Display Order"
                  name="display_order"
                  type="number"
                  min={1}
                  max={1000}
                  value={formData.display_order ?? 1}
                  onChange={handleChange}
                  error={errors.display_order ?? ""}
                  required
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <CheckboxField
                  label="Active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  required
                  error={errors.is_active}
                />
                <CheckboxField
                  label="Public"
                  name="is_public"
                  checked={formData.is_public}
                  onChange={handleChange}
                  required
                  error={errors.is_public}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={handleCancel}
              type="button"
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-blue-400"
              disabled={uploading}
            >
              {uploading && <LoaderCircle size={18} className="animate-spin" />}
              {uploading ? "Updating... " : "Update "}
              Link
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default UpdateLink;
