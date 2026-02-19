import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";

interface PaginationProps {
  lastPage: number;
  perPageOptions?: (number | "All")[];
  onChange?: (page: number, perPage: number | "All") => void;
  disable?: boolean;
  pageParam?: string;
  perPageParam?: string;
  showPageInputThreshold?: number;
}

export default function Pagination({
  lastPage,
  perPageOptions = [20, 25, 50, 100, 500, 600, 1000, "All"],
  onChange,
  disable = false,
  pageParam = "page",
  perPageParam = "per_page",
  showPageInputThreshold = 10,
}: PaginationProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pageInput, setPageInput] = useState("");

  const currentPage = Number(searchParams.get(pageParam) ?? 1);
  const rawPerPage = searchParams.get(perPageParam) ?? "20";
  const perPage: number | "All" = disable
    ? "All"
    : rawPerPage === "All"
    ? "All"
    : Number(rawPerPage);

  const updateParams = (page: number | string, per: number | "All") => {
    const params = new URLSearchParams(searchParams);
    params.set(pageParam, page.toString());
    params.set(
      perPageParam,
      disable ? "All" : per === "All" ? "All" : per.toString()
    );
    setSearchParams(params);
    onChange?.(Number(page), per);
  };

  const shouldShowPageInput = lastPage > showPageInputThreshold;

  const handlePageInputSubmit = () => {
    const pageNum = parseInt(pageInput);
    if (pageNum >= 1 && pageNum <= lastPage) {
      updateParams(pageNum, perPage);
      setPageInput("");
    }
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handlePageInputSubmit();
    }
  };

  // Generate first few and last few page buttons for large pagination
  const getPageButtons = () => {
    if (lastPage <= 7) {
      return Array.from({ length: lastPage }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [1];
    
    // Show pages around current page
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(lastPage - 1, currentPage + 1);
    
    if (startPage > 2) {
      pages.push("...");
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    if (endPage < lastPage - 1) {
      pages.push("...");
    }
    
    if (lastPage > 1) {
      pages.push(lastPage);
    }
    
    return pages;
  };

  const pageButtons = getPageButtons();

  return (
    <div className="flex flex-col items-center justify-between gap-4 pt-4 mt-6 border-gray-200 sm:flex-row">
      {/* Per-page selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-700">Show</span>
        <select
          value={perPage}
          onChange={(e) => {
            const val = e.target.value === "All" ? "All" : Number(e.target.value);
            updateParams(1, val);
          }}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5
                   text-sm text-gray-700 shadow-sm transition
                   focus:outline-none focus:ring-0"
          disabled={disable}
        >
          {perPageOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt === "All" ? "All" : opt}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-700">per page</span>
      </div>

      {/* Page navigation */}
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <div className="flex items-center gap-1">
          <button
            disabled={currentPage === 1 || perPage === "All"}
            onClick={() => updateParams(currentPage - 1, perPage)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5
                     text-sm text-gray-700 shadow-sm transition
                     hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50
                     focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            Prev
          </button>

          {perPage !== "All" && !shouldShowPageInput && (
            <div className="flex items-center gap-1">
              {pageButtons.map((page, idx) => {
                if (page === "...") {
                  return (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-3 py-1.5 text-sm text-gray-500"
                    >
                      ...
                    </span>
                  );
                }
                
                // Type guard to ensure page is a number
                const pageNumber = page as number;
                return (
                  <button
                    key={pageNumber}
                    onClick={() => updateParams(pageNumber, perPage)}
                    className={`rounded-md border px-3 py-1.5 text-sm shadow-sm transition
                    min-w-[2.5rem] focus:outline-none focus:ring-1 focus:ring-blue-500
                    ${
                      pageNumber === currentPage
                        ? "border-blue-500 bg-blue-600 text-white hover:bg-blue-700"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>
          )}

          {perPage !== "All" && shouldShowPageInput && (
            <div className="flex items-center gap-2 px-3">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span>Page</span>
                <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-md shadow-sm">
                  <button
                    onClick={() => updateParams(currentPage - 1, perPage)}
                    disabled={currentPage === 1}
                    className="px-2 py-1.5 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  >
                    ‹
                  </button>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max={lastPage}
                      value={pageInput || currentPage}
                      onChange={(e) => setPageInput(e.target.value)}
                      onKeyDown={handlePageInputKeyDown}
                      className="w-12 py-1.5 text-center bg-transparent border-none
                               focus:outline-none focus:ring-0"
                    />
                  </div>
                  <button
                    onClick={() => updateParams(currentPage + 1, perPage)}
                    disabled={currentPage === lastPage}
                    className="px-2 py-1.5 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  >
                    ›
                  </button>
                </div>
                <span>of</span>
                <span className="font-medium">{lastPage}</span>
              </div>
            </div>
          )}

          <button
            disabled={currentPage === lastPage || perPage === "All"}
            onClick={() => updateParams(currentPage + 1, perPage)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5
                     text-sm text-gray-700 shadow-sm transition
                     hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50
                     focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            Next
          </button>
        </div>

        {/* Quick jump for many pages */}
        {shouldShowPageInput && perPage !== "All" && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Go to:</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="1"
                max={lastPage}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onKeyDown={handlePageInputKeyDown}
                className="w-16 rounded-md border border-gray-300 bg-white px-2 py-1.5
                         text-sm text-gray-700 shadow-sm transition text-center
                         focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Page"
              />
              <button
                onClick={handlePageInputSubmit}
                disabled={!pageInput || parseInt(pageInput) < 1 || parseInt(pageInput) > lastPage}
                className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm
                         hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Go
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}