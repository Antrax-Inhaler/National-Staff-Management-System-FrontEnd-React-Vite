export function formatRoleName(roleKey: string): string {
  if (!roleKey) return "";

  return roleKey
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // ["Affiliate", "Officer"]
    .join(" "); // "Affiliate Officer"
}

export function formatDate(dateString?: string) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDateYear(dateString?: string, fallback: string = "N/A") {
  if (!dateString) return fallback;

  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export const calculateTenure = (startDate?: string, endDate?: string) => {
  if (!startDate) return "N/A";

  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date(); // default to today

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return "N/A";

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  // Adjust negative days: borrow from previous month
  if (days < 0) {
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    days += prevMonth;
    months -= 1;
  }

  // Adjust negative months: borrow from previous year
  if (months < 0) {
    months += 12;
    years -= 1;
  }

  // Build output
  const result = [];

  if (years > 0) result.push(`${years} yr${years > 1 ? "s" : ""}`);
  if (months > 0) result.push(`${months} mo`);
  if (years === 0 && days > 0) result.push(`${days} day${days > 1 ? "s" : ""}`);

  // If total is zero
  if (result.length === 0) return "0 day";

  return result.join(" ");
};

export const formatAction = (action: string) => {
  return action
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Helper to format field names for display
export const formatFieldName = (field: string): string => {
  return field
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Convert a role name like "national_administrator" into "National Administrator"
 */
export const readableName = (roleName: string): string => {
  if (!roleName) return "";

  // Special case for ORG - convert ORG to ORG in any part of the string
  const formattedName = roleName
    .split("_") // split on underscores
    .map((word) => {
      // Convert 'nso' to 'NSO' regardless of case
      if (word.toLowerCase() === "nso") {
        return "NSO";
      }
      // Capitalize other words normally
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" "); // join with spaces

  return formattedName;
};

export function toSnakeCase(str: string): string {
  return str
    .trim() // Remove leading/trailing whitespace
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`) // Convert camelCase
    .replace(/__+/g, "_") // Remove double underscores
    .replace(/^_/, ""); // Remove leading underscore
}

export function toSnakeCaseFileName(str: string): string {
  return str
    .trim() // remove leading/trailing whitespace
    .toLowerCase() // normalize all letters to lowercase
    .replace(/[^a-z0-9]+/g, "_") // replace anything that's not a-z or 0-9 with _
    .replace(/^_+|_+$/g, "") // remove leading/trailing underscores
    .replace(/__+/g, "_"); // collapse multiple underscores
}


export const getFileExtension = (filename: string) => {
  return filename.split(".").pop()?.toUpperCase() || "";
};
