import { useMutation, useQueryClient } from "@tanstack/react-query";
import { governance } from "@v1/api/governance";
import { research } from "@v1/api/research";
import Modal from "@v1/components/ui/Modal";
import { Folder } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";

function CreateFolder({
  isResearch = false,
  size = "md",
  folder_uid,
  affiliate_uid,
  queryKey,
}: {
  isResearch?: boolean;
  size?: string;
  folder_uid?: string | null;
  affiliate_uid?: string | null;
  queryKey?: any[];
}) {
  const [open, setOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const buttonSizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-xs",
    lg: "px-5 py-2.5 text-xs",
  };

  const { mutate } = useMutation({
    mutationFn: (folder_name: string) =>
      isResearch
        ? research.createFolder(folder_name, folder_uid, affiliate_uid)
        : governance.createFolder(folder_name, folder_uid, affiliate_uid),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: isResearch
          ? ["research-folder-structure"]
          : ["governance-folder-structure"],
      });

      toast.success("Folder Created");
      setIsSubmitting(false);
      setOpen(false);
      resetForm();
    },
    onError: async (err: any) => {
      if (err?.errors) {
        console.log(err.errors);
      } else {
        console.error(err);
        toast.error(err.message || "Failed to upload document");
      }
      setErrorMessage("Failed to upload document");
    },
  });

  const resetForm = () => {
    setFolderName("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    mutate(folderName);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-2 font-semibold text-white transition bg-amber-600 rounded-lg shadow-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1 ${buttonSizeClasses[size]}`}
      >
        <Folder size={14} />
        <span>Create Folder</span>
      </button>

      <Modal
        isOpen={open}
        onClose={() => {
          setOpen(false);
          resetForm();
        }}
        title="Create New Folder"
        className="max-w-md w-[95vw] md:w-full"
      >
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Content */}
          <div className="py-6 ">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Folder Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="folder_name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                required
                autoFocus
                className="w-full px-4 py-2.5 text-sm transition border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="Enter folder name"
              />
              <p className="mt-1.5 text-xs text-gray-500">
                Create a new folder in the current location to organize your
                documents.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 transition bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !folderName.trim()}
              className="px-4 py-2 text-sm font-medium text-white transition rounded-lg bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Folder"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default CreateFolder;
