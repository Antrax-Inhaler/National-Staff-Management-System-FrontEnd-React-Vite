import React, { useState } from "react";
import toast from "react-hot-toast";
import { Folder, LoaderCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Modal from "@v1/components/ui/Modal";
import InputField from "@/components/ui/InputField";
import { useSearchParams } from "react-router-dom";

export interface createFolderForm {
  folder_name?: string;
  folder_uid?: string;
}

function CreateFolder({ refetch }: { refetch: () => void }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const folderId = searchParams.get("f");
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formData, setFormData] = useState<createFolderForm>({
    folder_name: "",
    folder_uid: folderId || undefined,
  });

  const queryClient = useQueryClient();

  const handleCancel = () => {
    setFormData({
      folder_name: "",
    });
    setOpen(false);
  };

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: createFolderForm) => document.createFolder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      toast.success("Folder Created");
      setOpen(false);
      setUpdating(false);
    },
    onError: async (err: any) => {
      if (err?.errors) {
        setErrors(err.errors);
      } else {
        console.error(err);
      }
    },
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "category") {
      setFormData((prev) => ({
        ...prev,
        database_source: value,
      }));
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({ ...prev, [name]: [] }));
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    mutate(formData);
    console.log(formData);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-300 rounded-lg text-zinc-800 hover:bg-zinc-700 hover:text-white"
        title="Edit"
      >
        <Folder size={16} />
        <span>Create Folder</span>
      </button>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Create Folder"
        className="max-w-3xl min-w-2xl"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <InputField
            label="Folder Name"
            name="folder_name"
            value={formData.folder_name ?? ""}
            onChange={handleChange}
            error={errors.folder_name ?? ""}
            required
          />
          <div className="flex justify-end gap-3 pt-4 ">
            <button
              onClick={handleCancel}
              type="button"
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-blue-400"
            >
              {updating && <LoaderCircle size={18} className="animate-spin" />}
              {updating ? "Creating" : "Create Folder"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default CreateFolder;
