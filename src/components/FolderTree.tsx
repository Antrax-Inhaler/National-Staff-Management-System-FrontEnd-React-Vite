// components/FolderTree.tsx
import React from "react";
import { ChevronRight, ChevronDown, Folder, File } from "lucide-react";

interface FolderTreeProps {
  folders: any[];
  expandedFolders: Set<number>;
  selectedFolder: number | null;
  onToggleFolder: (folderId: number) => void;
  onSelectFolder: (folderId: number | null) => void;
  level: number;
}

const FolderTree: React.FC<FolderTreeProps> = ({
  folders,
  expandedFolders,
  selectedFolder,
  onToggleFolder,
  onSelectFolder,
  level,
}) => {
  return (
    <div className="space-y-1">
      {folders.map((folder) => {
        const isExpanded = expandedFolders.has(folder.id);
        return (
          <div key={folder.id}>
            {/* Folder row */}
            <div
              className={`flex items-center gap-1 cursor-pointer pl-${level * 4} py-1 rounded 
                ${selectedFolder === folder.id ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"}`}
              onClick={() => onSelectFolder(folder.id)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFolder(folder.id);
                }}
                className="w-4 h-4 flex items-center justify-center"
              >
                {folder.children?.length > 0 ? (
                  isExpanded ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )
                ) : (
                  <span className="inline-block w-3" />
                )}
              </button>
              <Folder size={16} className="text-yellow-600" />
              <span className="truncate">{folder.name}</span>
            </div>

            {/* Child folders */}
            {isExpanded && folder.children && (
              <FolderTree
                folders={folder.children}
                expandedFolders={expandedFolders}
                selectedFolder={selectedFolder}
                onToggleFolder={onToggleFolder}
                onSelectFolder={onSelectFolder}
                level={level + 1}
              />
            )}

            {/* Files inside folder */}
            {isExpanded && folder.documents && (
              <div className="ml-8 space-y-1">
                {folder.documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-1 cursor-pointer pl-2 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded"
                  >
                    <File size={14} className="text-gray-400" />
                    {doc.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FolderTree;
