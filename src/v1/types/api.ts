export interface BaseFilter {
  search?: string | null;
  per_page?: number | string;
  page?: number;
  sort_by?: string;
  sort_order?: string;
}

export interface PaginatedData<T> {
  items: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  sort_by?: string;
  sort_order?: string;
}
