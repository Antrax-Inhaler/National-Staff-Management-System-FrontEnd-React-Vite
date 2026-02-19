import { Headphones, Mail } from "lucide-react";
import React from "react";

function TechSupportInfo() {
  return (
    <div className="p-5 bg-white border border-gray-200 rounded-lg lg:col-span-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Headphones className="w-5 h-5 text-gray-700" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              Technical Support
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Need help? Contact us via email.
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center justify-end gap-2 mb-1">
            <Mail className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">
              Email
            </span>
          </div>
          <a
            href="mailto:tech@organization.org"
            className="text-sm font-semibold text-gray-900 transition-colors hover:text-gray-700"
          >
            tech@organization.org
          </a>
        </div>
      </div>
    </div>
  );
}

export default TechSupportInfo;
