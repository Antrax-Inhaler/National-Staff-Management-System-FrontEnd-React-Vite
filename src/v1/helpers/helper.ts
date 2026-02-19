import type { Member } from "@v1/types";
import type { DocumentFolder } from "../pages/Documents";

export const displayValue = (value: string | null | undefined): string => {
  return value ? value : "Not provided";
};

export const safeDisplayValue = (value: any): string => {
  if (value === null || value === undefined) {
    return "Not provided";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
};

export function findFolderName(
  folders: DocumentFolder[] | undefined,
  folderId: number,
): string {
  if (!folders) return "Unknown Folder";

  for (const folder of folders) {
    if (folder.id === folderId) return folder.folder_name;
    if (folder.children) {
      const found = findFolderName(folder.children, folderId);
      if (found) return found;
    }
  }
  return "Unknown Folder";
}

export function fileTypeFormat(type?: string | null): string {
  if (!type) return "—";

  const normalized = type.trim().toLowerCase();

  // Acronyms that should stay fully uppercase
  const ACRONYMS = ["mou"];

  if (ACRONYMS.includes(normalized)) {
    return normalized.toUpperCase();
  }

  // Default: capitalize first letter only
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export const getGoogleMapsUrl = (member: Member) => {
  const parts = [
    member.address_line1,
    member.address_line2,
    member.city,
    member.state,
    member.zip_code,
  ].filter((part) => part && part.trim() !== "");

  if (parts.length === 0) {
    // Fallback to just city if no detailed address
    if (member.city && member.city.trim() !== "") {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(member.city + (member.state ? `, ${member.state}` : ""))}`;
    }
    return null;
  }

  const query = parts.join(", ").replace(/\s+/g, "+");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};
