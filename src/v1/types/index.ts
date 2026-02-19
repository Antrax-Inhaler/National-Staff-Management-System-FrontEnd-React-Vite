// START EXPORT HERE
export * from "@v1/types/api";
export * from "@v1/types/document";
export * from "@v1/types/affiliate";
export * from "@v1/types/member";
export * from "@v1/types/audit";
export * from "@v1/types/helpVideos";
// DONT DELETE THIS YET
export interface PaginatedData<T> {
  items: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  sort_by?: string;
  sort_order?: string;
}
