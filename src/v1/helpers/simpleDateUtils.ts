// src/utils/simpleDateUtils.ts
/**
 * Simple date formatter for MM/DD/YYYY dates with time support
 */

export const simpleFormatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "Not set";
  
  // Check if it's already in MM/DD/YYYY format
  const match = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const month = match[1].padStart(2, '0');
    const day = match[2].padStart(2, '0');
    const year = match[3];
    return `${month}/${day}/${year}`;
  }
  
  // Check for ISO format YYYY-MM-DD
  const isoMatch = dateString.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2].padStart(2, '0');
    const day = isoMatch[3].padStart(2, '0');
    return `${month}/${day}/${year}`;
  }
  
  // Handle ISO date-time format
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }
    
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  } catch {
    return "Invalid date";
  }
};

export const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return "Not set";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }
    
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12; // Convert 0-23 to 1-12
    
    return `${month}/${day}/${year} ${formattedHours}:${minutes} ${ampm}`;
  } catch {
    return "Invalid date";
  }
};

export const simpleFormatExportDate = (dateString: string | null | undefined): string => {
  const formatted = simpleFormatDate(dateString);
  return formatted === "Not set" || formatted === "Invalid date" ? "" : formatted;
};

export const formatDateTimeExport = (dateString: string | null | undefined): string => {
  const formatted = formatDateTime(dateString);
  return formatted === "Not set" || formatted === "Invalid date" ? "" : formatted;
};

// Additional helper functions for different date formats

export const formatDateShort = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return "-";
  }
};

export const formatTimeOnly = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    
    return `${formattedHours}:${minutes} ${ampm}`;
  } catch {
    return "";
  }
};

export const formatRelativeTime = (dateString: string | null | undefined): string => {
  if (!dateString) return "Never";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid";
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    
    // For dates older than a week, show the date
    return formatDateShort(dateString);
  } catch {
    return "Invalid";
  }
};

// Utility function to check if a date is in the future
export const isFutureDate = (dateString: string | null | undefined): boolean => {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return false;
    
    return date > new Date();
  } catch {
    return false;
  }
};

// Utility function to get date only (without time)
export const getDateOnly = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    
    // Reset time to 00:00:00
    date.setHours(0, 0, 0, 0);
    return date;
  } catch {
    return null;
  }
};


export const extractAndFormatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "Not set";
  
  const cleanString = dateString.trim();
  
  const isoMatch = cleanString.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2].padStart(2, '0');
    const day = isoMatch[3].padStart(2, '0');
    return `${month}/${day}/${year}`;
  }
  
  const slashMatch = cleanString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const month = slashMatch[1].padStart(2, '0');
    const day = slashMatch[2].padStart(2, '0');
    const year = slashMatch[3];
    return `${month}/${day}/${year}`;
  }
  
  const slashYearMatch = cleanString.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (slashYearMatch) {
    const year = slashYearMatch[1];
    const month = slashYearMatch[2].padStart(2, '0');
    const day = slashYearMatch[3].padStart(2, '0');
    return `${month}/${day}/${year}`;
  }
  
  const isoDateTimeMatch = cleanString.match(/^(\d{4})-(\d{1,2})-(\d{1,2})T/);
  if (isoDateTimeMatch) {
    const year = isoDateTimeMatch[1];
    const month = isoDateTimeMatch[2].padStart(2, '0');
    const day = isoDateTimeMatch[3].padStart(2, '0');
    return `${month}/${day}/${year}`;
  }
  
  const anyDateMatch = cleanString.match(/(\d{1,4})[^\d]+(\d{1,2})[^\d]+(\d{1,4})/);
  if (anyDateMatch) {
    let year, month, day;
    
    const part1 = anyDateMatch[1];
    const part2 = anyDateMatch[2];
    const part3 = anyDateMatch[3];
    
    if (part1.length === 4) {
      year = part1;
      month = part2.padStart(2, '0');
      day = part3.padStart(2, '0');
    } else if (part3.length === 4) {
      year = part3;
      month = part1.padStart(2, '0');
      day = part2.padStart(2, '0');
    } else {
      year = `20${part3}`.padStart(4, '20'); 
      month = part1.padStart(2, '0');
      day = part2.padStart(2, '0');
    }
    
    return `${month}/${day}/${year}`;
  }
  
  try {
    const numbers = cleanString.match(/\d+/g);
    if (numbers && numbers.length >= 3) {
      const month = numbers[0].padStart(2, '0');
      const day = numbers[1].padStart(2, '0');
      const year = numbers[2].padStart(4, '20');
      return `${month}/${day}/${year}`;
    }
  } catch {
  }
  
  return "Invalid date";
};

export const extractDateComponents = (dateString: string | null | undefined): { month: string; day: string; year: string } | null => {
  if (!dateString) return null;
  
  const formatted = extractAndFormatDate(dateString);
  if (formatted === "Not set" || formatted === "Invalid date") {
    return null;
  }
  
  const match = formatted.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    return {
      month: match[1],
      day: match[2],
      year: match[3]
    };
  }
  
  return null;
};


export const getDisplayDate = (dateString: string | null | undefined): string => {
  const components = extractDateComponents(dateString);
  if (!components) return "Not set";
  
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  
  const monthIndex = parseInt(components.month) - 1;
  const monthName = monthIndex >= 0 && monthIndex < 12 ? monthNames[monthIndex] : components.month;
  
  return `${monthName} ${parseInt(components.day)}, ${components.year}`;
};