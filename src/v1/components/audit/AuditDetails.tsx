import { useState } from "react";
import { ArrowRight, Eye } from "lucide-react";
import Modal from "@v1/components/ui/Modal";
import { ActionButton } from "@v1/components/ui/ActionButton";

interface AuditDetailProps {
  type?: string;
  affiliate?: string;
  old_values: any;
  new_values: any;
}

// Utility function to format field names
function formatFieldName(field) {
  return field
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Utility function to format values
function formatValue(value) {
  if (value === null || value === undefined || value === "") {
    return <span className="italic text-gray-400">Empty</span>;
  }

  // Check if it's a date
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    try {
      const date = new Date(value);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return value;
    }
  }

  // Handle boolean
  if (typeof value === "boolean") {
    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${
          value ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}
      >
        {value ? "Yes" : "No"}
      </span>
    );
  }

  // Handle objects/arrays
  if (typeof value === "object") {
    return (
      <pre className="p-2 text-xs rounded bg-gray-50">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  return String(value);
}

// Helper function to check if a value is empty
function isEmpty(value) {
  return value === null || value === undefined || value === "";
}

export default function AuditDetails({
  type,
  old_values,
  new_values,
  affiliate,
}: AuditDetailProps) {
  const [open, setOpen] = useState(false);

  const allFields = Array.from(
    new Set([
      ...Object.keys(old_values || {}),
      ...Object.keys(new_values || {}),
    ]),
  ).sort();

  // Check if any old values exist (non-empty)
  const hasOldValues = allFields.some((field) => !isEmpty(old_values?.[field]));

  // Check if any new values exist (non-empty)
  const hasNewValues = allFields.some((field) => !isEmpty(new_values?.[field]));

  const isRoleType = ["Role", "OfficerPosition"].includes(type);

  // Calculate column widths based on which columns are shown
  const getColWidths = () => {
    if (isRoleType) {
      if (hasOldValues && hasNewValues) {
        return { field: "30%", old: "35%", new: "35%" };
      } else if (hasOldValues || hasNewValues) {
        return { field: "40%", value: "60%" };
      }
    } else {
      if (hasOldValues && hasNewValues) {
        return { field: "20%", old: "37%", arrow: "6%", new: "37%" };
      } else if (hasOldValues || hasNewValues) {
        return { field: "30%", value: "70%" };
      }
    }
    return { field: "100%" };
  };

  const colWidths = getColWidths();

  return (
    <>
      <ActionButton
        label="Details"
        icon={Eye}
        iconSize={14}
        onClick={() => setOpen(true)}
      />
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={`Log Details`}
        size="xl"
      >
        <div className="space-y-6">
          {/* Header Info */}
          {affiliate && (
            <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
              <p className="text-xs text-blue-800">
                <span className="font-semibold">Affiliate:</span> {affiliate}
              </p>
            </div>
          )}

          {/* Changes Table */}
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <colgroup>
                  <col style={{ width: colWidths.field }} />
                  {isRoleType ? (
                    <>
                      {hasOldValues && <col style={{ width: colWidths.old }} />}
                      {hasNewValues && <col style={{ width: colWidths.new }} />}
                    </>
                  ) : (
                    <>
                      {hasOldValues && hasNewValues && (
                        <>
                          <col style={{ width: colWidths.old }} />
                          <col style={{ width: colWidths.arrow }} />
                          <col style={{ width: colWidths.new }} />
                        </>
                      )}
                      {(hasOldValues || hasNewValues) &&
                        !(hasOldValues && hasNewValues) && (
                          <col style={{ width: colWidths.value }} />
                        )}
                    </>
                  )}
                </colgroup>
                <thead className="bg-gray-50">
                  {isRoleType ? (
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase border-r">
                        User
                      </th>
                      {hasOldValues && (
                        <th
                          className={`px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase ${
                            hasNewValues ? "border-r" : ""
                          }`}
                        >
                          Action
                        </th>
                      )}
                      {hasNewValues && (
                        <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase">
                          Role
                        </th>
                      )}
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase border-r">
                        Field
                      </th>
                      {hasOldValues && (
                        <th
                          className={`px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase ${
                            hasNewValues ? "border-r" : ""
                          }`}
                        >
                          Old Value
                        </th>
                      )}
                      {hasOldValues && hasNewValues && (
                        <th className="px-2 py-3 text-center border-r">
                          <ArrowRight
                            size={16}
                            className="mx-auto text-gray-400"
                          />
                        </th>
                      )}
                      {hasNewValues && (
                        <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-700 uppercase">
                          New Value
                        </th>
                      )}
                    </tr>
                  )}
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allFields.length > 0 &&
                  allFields.some(
                    (field) =>
                      !isEmpty(old_values?.[field]) ||
                      !isEmpty(new_values?.[field]),
                  )
                    ? allFields.map((field) => {
                        const oldVal = old_values?.[field];
                        const newVal = new_values?.[field];

                        // Skip rows where both values are empty
                        if (isEmpty(oldVal) && isEmpty(newVal)) {
                          return null;
                        }

                        return (
                          <tr
                            key={field}
                            className="text-left hover:bg-gray-50"
                          >
                            <td className="px-4 py-4 align-top border-r">
                              <span className="text-xs text-gray-900 break-words whitespace-normal">
                                {formatFieldName(field)}
                              </span>
                            </td>

                            {hasOldValues && (
                              <td
                                className={`px-4 py-4 align-top ${
                                  hasNewValues ? "border-r" : ""
                                }`}
                              >
                                <div className="text-xs text-gray-900 break-words whitespace-normal">
                                  {isRoleType
                                    ? formatFieldName(oldVal)
                                    : formatValue(oldVal)}
                                </div>
                              </td>
                            )}

                            {!isRoleType && hasOldValues && hasNewValues && (
                              <td className="px-2 py-4 text-center align-top border-r">
                                <ArrowRight
                                  size={16}
                                  className="mx-auto text-blue-500"
                                />
                              </td>
                            )}

                            {hasNewValues && (
                              <td className="px-4 py-4 align-top">
                                <div className="text-xs font-semibold text-gray-900 break-words whitespace-normal">
                                  {isRoleType
                                    ? formatFieldName(newVal)
                                    : formatValue(newVal)}
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    : null}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="flex items-center justify-between p-4 rounded-lg">
            <p className="text-xs text-gray-600">
              <span className="font-semibold">
                {
                  allFields.filter(
                    (field) =>
                      !isEmpty(old_values?.[field]) ||
                      !isEmpty(new_values?.[field]),
                  ).length
                }
              </span>{" "}
              {isRoleType ? "user" : "field"}
              {allFields.filter(
                (field) =>
                  !isEmpty(old_values?.[field]) ||
                  !isEmpty(new_values?.[field]),
              ).length !== 1
                ? "s"
                : ""}{" "}
              modified
            </p>
            <ActionButton
              label="Close"
              onClick={() => setOpen(false)}
              buttonClassName=" bg-gray-800! hover:bg-gray-700! text-white"
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
