import { useQuery } from "@tanstack/react-query";
import { Activity, ChevronDown } from "lucide-react";
import React from "react";
import { getActivityLogs } from "../api/activityLog";
import {
  formatAction,
  formatDate,
  formatFieldName,
} from "../helpers/formatter";

export interface ActivityLog {
  id: number;
  action: string;
  auditable_type: string;
  old_values: Record<string, any>;
  new_values: Record<string, any>;
  ip_address: string;
  user_agent?: string;
  created_at: string;
  user?: {
    name: string;
    email: string;
  };
}

function ActivityLogs() {
  const {
    data: activityLogs,
    isLoading,
    error: activityLogError,
    refetch,
  } = useQuery<ActivityLog[] | []>({
    queryKey: ["activity_logs"],
    queryFn: getActivityLogs,
  });

  return (
    <>
      {/* Activity Logs */}
      <div className="p-6 mt-6 bg-white border border-gray-200 rounded-lg hidden">
        <h2 className="flex items-center gap-2 mb-6 text-lg font-semibold text-gray-900">
          <Activity className="w-5 h-5 text-gray-600" />
          Recent Activity
        </h2>

        <div className="space-y-3 overflow-y-auto max-h-80">
          {activityLogs && activityLogs.length > 0 ? (
            activityLogs?.slice(0, 10).map((log) => (
              <details key={log.id} className="group">
                <summary className="flex items-center justify-between p-3 list-none transition-colors border border-gray-200 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {formatAction(log.action)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(log.created_at)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      IP: {log.ip_address}
                    </div>
                  </div>
                  <ChevronDown className="flex-shrink-0 w-4 h-4 ml-2 text-gray-500 transition-transform transform group-open:rotate-180" />
                </summary>

                <div className="p-3 mt-2 bg-white border border-gray-200 rounded-lg">
                  <div className="space-y-2 text-sm">
                    {Object.keys(log.new_values || {}).length > 0 ? (
                      Object.entries(log.new_values || {})
                        .map(([field, newValue]) => {
                          const oldValue = log.old_values?.[field];

                          // Skip if both values are empty/not provided
                          if (
                            (!oldValue ||
                              oldValue === "" ||
                              oldValue === "Not provided") &&
                            (!newValue ||
                              newValue === "" ||
                              newValue === "Not provided")
                          ) {
                            return null;
                          }

                          // Format values properly
                          const formatValue = (value: any): string => {
                            if (!value) return "";
                            if (typeof value === "object") {
                              // Handle user objects
                              if (value.name || value.email) {
                                return (
                                  value.name ||
                                  value.email ||
                                  `User ${value.id}`
                                );
                              }
                              // Handle affiliate objects
                              if (value.name && value.id) {
                                return `${value.name} (ID: ${value.id})`;
                              }
                              return JSON.stringify(value);
                            }
                            if (
                              typeof value === "string" &&
                              value.startsWith("{")
                            ) {
                              try {
                                const parsed = JSON.parse(value);
                                if (parsed.name || parsed.email) {
                                  return (
                                    parsed.name ||
                                    parsed.email ||
                                    `User ${parsed.id}`
                                  );
                                }
                                if (parsed.name && parsed.id) {
                                  return `${parsed.name} (ID: ${parsed.id})`;
                                }
                              } catch {
                                // Not JSON, return as is
                              }
                            }
                            return value;
                          };

                          const formattedOldValue = formatValue(oldValue);
                          const formattedNewValue = formatValue(newValue);

                          return (
                            <div
                              key={field}
                              className="flex items-start justify-between py-1"
                            >
                              <span className="text-xs font-medium text-gray-700 capitalize">
                                {formatFieldName(field)}:
                              </span>
                              <div className="max-w-xs ml-4 text-right">
                                {formattedOldValue &&
                                  formattedOldValue !== "" &&
                                  formattedOldValue !== "Not provided" && (
                                    <div className="mb-1 text-xs text-gray-500 line-through break-words">
                                      {formattedOldValue}
                                    </div>
                                  )}
                                <div className="text-xs text-gray-900 break-words">
                                  {formattedNewValue &&
                                  formattedNewValue !== "" &&
                                  formattedNewValue !== "Not provided"
                                    ? formattedNewValue
                                    : "(removed)"}
                                </div>
                              </div>
                            </div>
                          );
                        })
                        .filter(Boolean)
                    ) : (
                      <div className="py-2 text-xs text-center text-gray-500">
                        No changes recorded
                      </div>
                    )}
                  </div>
                </div>
              </details>
            ))
          ) : (
            <div className="py-8 text-sm text-center text-gray-500">
              No recent activitysss
            </div>
          )}
        </div>

        {/* View All Button */}
        {activityLogs && activityLogs!.length > 10 && (
          <button className="w-full p-2 mt-4 text-sm font-medium text-blue-600 transition-colors border border-gray-200 rounded-lg hover:text-blue-800 hover:bg-gray-50">
            View All Activity ({activityLogs?.length})
          </button>
        )}
      </div>
    </>
  );
}

export default ActivityLogs;
