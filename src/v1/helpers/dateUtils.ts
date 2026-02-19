// src/utils/dateUtils.ts
/**
 * Date utility functions that avoid timezone issues by not using JavaScript Date objects
 * Handles date strings in ISO format (YYYY-MM-DD) and other common formats
 */

// Helper to parse date string parts
const parseDateString = (dateString: string | null): { year: number; month: number; day: number } | null => {
  if (!dateString) return null;
  
  // Remove any time portion if present
  const dateOnly = dateString.split('T')[0].split(' ')[0];
  
  // Try different date formats in order of priority
  const patterns = [
    // US format: MM/DD/YYYY or M/D/YYYY (check this first since that's your data format)
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // ISO format: YYYY-MM-DD
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    // DD-MM-YYYY or D-M-YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
  ];
  
  for (const pattern of patterns) {
    const match = dateOnly.match(pattern);
    if (match) {
      let year: number, month: number, day: number;
      
      if (pattern.toString().includes('MM/DD/YYYY')) {
        // US format: MM/DD/YYYY
        month = parseInt(match[1], 10);
        day = parseInt(match[2], 10);
        year = parseInt(match[3], 10);
      } else if (pattern.toString().includes('YYYY-MM-DD')) {
        // ISO format
        year = parseInt(match[1], 10);
        month = parseInt(match[2], 10);
        day = parseInt(match[3], 10);
      } else {
        // DD-MM-YYYY format
        day = parseInt(match[1], 10);
        month = parseInt(match[2], 10);
        year = parseInt(match[3], 10);
      }
      
      // Validate the parsed values
      if (isValidDate(year, month, day)) {
        return { year, month, day };
      }
    }
  }
  
  return null;
};

// Validate if the date components represent a valid date
const isValidDate = (year: number, month: number, day: number): boolean => {
  // Basic validation
  if (year < 1000 || year > 9999) return false;
  if (month < 1 || month > 12) return false;
  
  // Check days in month
  const daysInMonth = getDaysInMonth(year, month);
  if (day < 1 || day > daysInMonth) return false;
  
  return true;
};

// Get number of days in a month (accounts for leap years)
const getDaysInMonth = (year: number, month: number): number => {
  const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  // February leap year check
  if (month === 2 && isLeapYear(year)) {
    return 29;
  }
  
  return monthDays[month - 1] || 31;
};

// Check if year is a leap year
const isLeapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
};

// Pad a number with leading zeros
const padZero = (num: number, length: number = 2): string => {
  return num.toString().padStart(length, '0');
};

/**
 * Format a date string to MM/DD/YYYY format
 * @param dateString - Date string in any common format
 * @returns Formatted date string or "Not set" if invalid
 */
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return "Not set";
  
  const parsed = parseDateString(dateString);
  if (!parsed) return "Invalid date";
  
  const { month, day, year } = parsed;
  return `${padZero(month)}/${padZero(day)}/${year}`;
};

/**
 * Format a date string to MMM DD, YYYY format (e.g., Jan 15, 2024)
 * @param dateString - Date string in any common format
 * @returns Formatted date string or empty string if invalid
 */
export const formatDisplayDate = (dateString: string | null): string => {
  if (!dateString) return "";
  
  const parsed = parseDateString(dateString);
  if (!parsed) return "";
  
  const { month, day, year } = parsed;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return `${monthNames[month - 1]} ${padZero(day)}, ${year}`;
};

/**
 * Format a date string to YYYY-MM-DD format (ISO)
 * @param dateString - Date string in any common format
 * @returns ISO formatted date string or empty string if invalid
 */
export const formatISODate = (dateString: string | null): string => {
  if (!dateString) return "";
  
  const parsed = parseDateString(dateString);
  if (!parsed) return "";
  
  const { year, month, day } = parsed;
  return `${year}-${padZero(month)}-${padZero(day)}`;
};

/**
 * Format a date string to DD MMM YY format (e.g., 15 Jan '24)
 * @param dateString - Date string in any common format
 * @returns Compact formatted date string or empty string if invalid
 */
export const formatCompactDate = (dateString: string | null): string => {
  if (!dateString) return "";
  
  const parsed = parseDateString(dateString);
  if (!parsed) return "";
  
  const { month, day, year } = parsed;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const shortYear = year.toString().slice(-2);
  
  return `${padZero(day)} ${monthNames[month - 1]} '${shortYear}`;
};

/**
 * Format a date with time to MM/DD/YYYY HH:MM AM/PM format
 * @param dateTimeString - Date time string (ISO format with time)
 * @returns Formatted date time string or "Not set" if invalid
 */
export const formatDateTime = (dateTimeString: string | null): string => {
  if (!dateTimeString) return "Not set";
  
  // Extract date part
  const datePart = dateTimeString.split('T')[0].split(' ')[0];
  const date = formatDate(datePart);
  if (date === "Invalid date" || date === "Not set") return "Invalid date";
  
  // Extract time part if available
  const timeMatch = dateTimeString.match(/T?(\d{2}):(\d{2}):?(\d{2})?/);
  if (!timeMatch) return date;
  
  let hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // Convert 0 to 12
  
  return `${date} ${padZero(hours)}:${padZero(minutes)} ${ampm}`;
};

/**
 * Format date for export (MM/DD/YYYY or empty string)
 * @param dateString - Date string in any common format
 * @returns Formatted date for export or empty string if invalid
 */
export const formatExportDate = (dateString: string | null): string => {
  if (!dateString) return "";
  
  const parsed = parseDateString(dateString);
  if (!parsed) return "";
  
  const { month, day, year } = parsed;
  return `${padZero(month)}/${padZero(day)}/${year}`;
};

/**
 * Get relative time (e.g., "2 days ago") without timezone issues
 * @param dateString - Date string in any common format
 * @returns Relative time string
 */
export const getRelativeTime = (dateString: string | null): string => {
  if (!dateString) return "";
  
  const parsed = parseDateString(dateString);
  if (!parsed) return "";
  
  // Convert to timestamp for comparison
  const dateObj = new Date(parsed.year, parsed.month - 1, parsed.day);
  const now = new Date();
  
  // Calculate difference in days
  const diffMs = now.getTime() - dateObj.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  
  return `${Math.floor(diffDays / 365)} years ago`;
};

/**
 * Extract year from date string
 * @param dateString - Date string in any common format
 * @returns Year as number or null if invalid
 */
export const getYear = (dateString: string | null): number | null => {
  const parsed = parseDateString(dateString);
  return parsed ? parsed.year : null;
};

/**
 * Extract month from date string (1-12)
 * @param dateString - Date string in any common format
 * @returns Month as number or null if invalid
 */
export const getMonth = (dateString: string | null): number | null => {
  const parsed = parseDateString(dateString);
  return parsed ? parsed.month : null;
};

/**
 * Extract day from date string (1-31)
 * @param dateString - Date string in any common format
 * @returns Day as number or null if invalid
 */
export const getDay = (dateString: string | null): number | null => {
  const parsed = parseDateString(dateString);
  return parsed ? parsed.day : null;
};

/**
 * Check if date string is valid
 * @param dateString - Date string to validate
 * @returns True if valid date string
 */
export const isValidDateString = (dateString: string | null): boolean => {
  return !!parseDateString(dateString);
};

/**
 * Helper to handle dates that might already be in MM/DD/YYYY format
 * This is a special case handler for your specific data format
 */
export const safeFormatDate = (dateString: string | null): string => {
  if (!dateString) return "Not set";
  
  // First try the regular parser
  const result = formatDate(dateString);
  if (result !== "Invalid date") return result;
  
  // If it fails, check if it's already in MM/DD/YYYY format
  const usFormatMatch = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usFormatMatch) {
    const month = parseInt(usFormatMatch[1], 10);
    const day = parseInt(usFormatMatch[2], 10);
    const year = parseInt(usFormatMatch[3], 10);
    
    if (isValidDate(year, month, day)) {
      return `${padZero(month)}/${padZero(day)}/${year}`;
    }
  }
  
  return "Invalid date";
};


export const formatDateWithoutTimezone = (dateString?: string): string => {
  if (!dateString) return "Not set";

  try {
    const [year, month, day] = dateString.split("T")[0].split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "UTC",
    });
  } catch (error) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: "UTC",
      });
    } catch {
      return dateString;
    }
  }
};