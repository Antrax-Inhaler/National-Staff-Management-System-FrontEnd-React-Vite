import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ChevronRight } from "lucide-react";
import { request } from "../lib/apiRequest";
import Pagination from "./ui/Pagination";
import TableSkeleton from "./ui/skeletons/TableSkeleton";

interface DocumentFilter {
  state?: string;
  affiliate?: number;
  cbc?: string;
  employer?: string;
  expiration_date?: string;
  title?: string;
}

interface AdvanceDocumentFilter extends DocumentFilter {
  search?: string;
}

interface Folder {
  id: number;
  name: string;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
}

interface Document {
  id: number;
  title: string;
  type: string;
  category: string;
  file_name: string;
  file_path: string;
  file_size: number;
  created_at: string;
  folder_id: number | null;
}

interface DocumentsPaginated {
  current_page: number;
  data: Document[];
  last_page: number;
  total: number;
}

interface FileResponse {
  folders: Folder[];
  documents: DocumentsPaginated;
}

interface FileManagerDataViewProps<T> {
  folderId?: number | null;
  localSearch?: string;
  globalSearch?: string;
  type?: "all" | "folder" | "document" | string;
  viewHeader?: React.ReactNode;
  renderFolder: (
    folder: Folder,
    openFolder: (id: number, folder: Folder) => void
  ) => React.ReactNode;
  renderDocument: (document: T) => React.ReactNode;
}

/**
 * Fetches and displays folders + documents with breadcrumb navigation and caching.
 */
export default function FileManagerDataView<T>({
  folderId: initialFolderId = null,
  localSearch = "",
  globalSearch = "",
  type = "all",
  viewHeader,
  renderFolder,
  renderDocument,
}: FileManagerDataViewProps<T>) {
  const [searchParams] = useSearchParams();
  const page = Number(searchParams.get("page") ?? 1);
  const [path, setPath] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<number | null>(
    initialFolderId
  );

  // --- Query setup with automatic caching
  const queryKey = useMemo(
    () => [
      "file-manager",
      { folderId: currentFolder, localSearch, globalSearch, type, page },
    ],
    [currentFolder, localSearch, globalSearch, type, page]
  );

  const { data, isLoading, isFetching, isError, refetch } =
    useQuery<FileResponse>({
      queryKey,
      queryFn: async () => {
        const params = new URLSearchParams();
        if (currentFolder) params.append("folder_id", currentFolder.toString());
        if (localSearch) params.append("local_search", localSearch);
        if (globalSearch) params.append("global_search", globalSearch);
        if (type) params.append("type", type);
        params.append("page", page.toString());

        const res = await request(`documents/fetch?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch file data");
        return res.json();
      },
      keepPreviousData: true,
      staleTime: 1000 * 60 * 5,
    });

  // --- Navigation handlers
  const openFolder = (id: number, folder: Folder) => {
    setPath((prev) => [...prev, folder]);
    setCurrentFolder(id);
  };

  const goBackTo = (index: number | null) => {
    if (index === null) {
      // Go back to root
      setPath([]);
      setCurrentFolder(null);
    } else {
      // Go to specific parent
      const newPath = path.slice(0, index + 1);
      setPath(newPath);
      setCurrentFolder(newPath[index].id);
    }
  };

  if (isError)
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-600">
        <p>Something went wrong while fetching files.</p>
        <button
          onClick={() => refetch()}
          className="px-3 py-1 mt-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );

  if (isLoading) return <TableSkeleton columns={3} rows={6} />;

  const folders = data?.folders ?? [];
  const documents = data?.documents.data ?? [];

  return (
    <div className="relative space-y-4">
      {/* Header */}
      {viewHeader && (
        <div className="flex items-center justify-between">{viewHeader}</div>
      )}

      {/* Breadcrumb path */}
      <div className="flex flex-wrap items-center gap-1 text-sm text-gray-600">
        <button
          onClick={() => goBackTo(null)}
          className="font-medium hover:underline"
        >
          Root
        </button>
        {path.map((folder, index) => (
          <React.Fragment key={folder.id}>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <button
              onClick={() => goBackTo(index)}
              className={`hover:underline ${
                index === path.length - 1 ? "font-semibold text-gray-800" : ""
              }`}
            >
              {folder.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Overlay while refetching */}
      {isFetching && !isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-gray-700">
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            <span className="text-sm">Refreshing files...</span>
          </div>
        </div>
      )}

      {/* Folders */}
      {folders.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-gray-600 uppercase">
            Folders
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {folders.map((folder) => renderFolder(folder, openFolder))}
          </div>
        </div>
      )}

      {/* Documents */}
      {documents.length > 0 ? (
        <div>
          <h3 className="mt-4 mb-2 text-sm font-medium text-gray-600 uppercase">
            Documents
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-5">
            {documents.map((doc) => renderDocument(doc))}
          </div>
        </div>
      ) : (
        folders.length === 0 && (
          <div className="py-10 text-center text-gray-500">
            No documents found
          </div>
        )
      )}

      {/* Pagination */}
      {data?.documents.last_page > 1 && (
        <Pagination lastPage={data.documents.last_page} />
      )}
    </div>
  );
}
