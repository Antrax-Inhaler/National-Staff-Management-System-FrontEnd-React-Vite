import React from "react";
import { useSearchParams } from "react-router-dom";

interface PaginationProps {
  lastPage: number;
  perPageOptions?: (number | "All")[];
  onChange?: (page: number, perPage: number | "All") => void;
  disable?: boolean;
}

export default function Pagination({
  lastPage,
  perPageOptions = [10, 25, 50, 100, 500, 600, 1000, "All"],
  onChange,
  disable = false,
}: PaginationProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = Number(searchParams.get("page") ?? 1);
  const rawPerPage = searchParams.get("per_page") ?? "10";
  const perPage: number | "All" = disable
    ? "All"
    : rawPerPage === "All"
    ? "All"
    : Number(rawPerPage);

  // write to URL
  const updateParams = (page: number | string, per: number | "All") => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    params.set(
      "per_page",
      disable ? "All" : per === "All" ? "All" : per.toString()
    );
    setSearchParams(params);
    onChange?.(Number(page), per);
  };

  const pages =
    perPage === "All"
      ? [1] // only one page if showing all
      : Array.from({ length: lastPage }, (_, i) => i + 1);

  return (
    <div className="mt-6 flex flex-col items-center justify-between gap-4 border-gray-200 pt-4 sm:flex-row">
      {/* Per-page selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-700">Show</span>
        <select
          value={perPage}
          onChange={(e) => {
            const val =
              e.target.value === "All" ? "All" : Number(e.target.value);
            updateParams(1, val); // reset to first page when changing page size
          }}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5
                 text-sm text-gray-700 shadow-sm transition
                  focus:outline-none focus:ring-0"
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
      <nav className="inline-flex items-center gap-1">
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

        {perPage !== "All" &&
          pages.map((p) => (
            <button
              key={p}
              onClick={() => updateParams(p, perPage)}
              className={`rounded-md border px-3 py-1.5 text-sm shadow-sm transition
            focus:outline-none focus:ring-1 focus:ring-blue-500
            ${
              p === currentPage
                ? "border-blue-500 bg-blue-600 text-white hover:bg-blue-700"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
            >
              {p}
            </button>
          ))}

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
      </nav>
    </div>
  );
}
