import React, { type ReactNode } from "react";

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

interface DocumentSearchParam {
  mainRender: ReactNode;
  resultRender: ReactNode;
}

function DocumentSearch() {
  const [globalSearch, setGlobalSearch];

  return (
    <div className="p-6 space-y-4">
      {/* 🔍 Filters */}
      <div className="flex items-center gap-2"></div>
      
    </div>
  );
}

export default DocumentSearch;
