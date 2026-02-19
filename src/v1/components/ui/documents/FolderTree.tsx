import React from "react";
import type { DocumentFolder } from "../../../pages/affiliate/Documents";
import { ChevronDown, ChevronRight, Folder } from "lucide-react";

function FolderTree({
  folders,
  expandedFolders,
  selectedFolder,
  onToggleFolder,
  onSelectFolder,
  level = 0,
}: {
  folders: DocumentFolder[] | undefined;
  expandedFolders: Set<number>;
  selectedFolder: number | null;
  onToggleFolder: (id: number) => void;
  onSelectFolder: (id: number | null) => void;
  level?: number;
}) {
  return (
    <>
      {folders && folders.map((folder) => {
        const hasChildren = folder.children && folder.children.length > 0;
        const isExpanded = expandedFolders.has(folder.id);
        const isSelected = selectedFolder === folder.id;

        return (
          <div key={folder.id}>
            <div
              className={`flex items-center gap-2 py-1 px-2 rounded text-sm cursor-pointer ${
                isSelected
                  ? "bg-blue-100 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              style={{ paddingLeft: `${level * 16 + 8}px` }}
              onClick={() => onSelectFolder(folder.id)}
            >
              {hasChildren ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFolder(folder.id);
                  }}
                  className="p-0.5 hover:bg-gray-200 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </button>
              ) : (
                <div className="w-5" />
              )}

              <Folder size={16} />

              <span className="flex-1 truncate">{folder.folder_name ?? folder.name}</span>

              {folder.document_count !== undefined && (
                <span className="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                  {folder.document_count}
                </span>
              )}
            </div>

            {hasChildren && isExpanded && (
              <FolderTree
                folders={folder.children!}
                expandedFolders={expandedFolders}
                selectedFolder={selectedFolder}
                onToggleFolder={onToggleFolder}
                onSelectFolder={onSelectFolder}
                level={level + 1}
              />
            )}
          </div>
        );
      })}
    </>
  );
}

export default FolderTree;
