import { Bug, ExternalLink } from "lucide-react";
import React from "react";

function BugReportCard() {
  return (
    <div className="p-5 bg-white border border-gray-200 rounded-lg last:lg:col-span-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Bug className="w-5 h-5 text-gray-700" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">Report a Bug</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Found an issue? Let us know so we can fix it.
            </p>
          </div>
        </div>
        <div className="text-right">
          <a
            href="https://form.fillout.com/t/oSKUFkmEcYus"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white transition-colors bg-gray-900 rounded-lg hover:bg-gray-700"
          >
            Submit Report
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default BugReportCard;
