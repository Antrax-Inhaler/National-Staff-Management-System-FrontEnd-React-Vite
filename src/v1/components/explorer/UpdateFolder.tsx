import Modal from "@v1/components/ui/Modal";
import { useState } from "react";

function UpdateFolder({
  folder,
  loading = false,
  isOpen = false,
  onClose,
  onSubmit,
}: {
  folder: any;
  loading?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (folder_name: string, folder_uid?: string) => void;
}) {
  const [folderName, setFolderName] = useState(folder.display_name);

  const resetForm = () => {
    setFolderName("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    onSubmit(folderName, folder.id);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => {
          onClose();
          resetForm();
        }}
        title="Update Folder"
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
                onClose();
                resetForm();
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 transition bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !folderName.trim()}
              className="px-4 py-2 text-sm font-medium text-white transition rounded-lg bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Updating..." : "Update Folder"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default UpdateFolder;
