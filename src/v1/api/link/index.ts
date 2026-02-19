// @v1/api/link.ts
import { request } from "../../lib/apiRequest";

export interface linkFilter {
  search?: string;
  category?: string;
  status?: "active" | "inactive";
  affiliate_id?: number;
  is_public?: boolean;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface linkGetParam {
  page?: number;
  perPage?: number | string;
  filters?: linkFilter;
}

export interface linkForm {
  title: string;
  url: string;
  description: string;
  category: string;
  display_order: number;
  is_active: boolean;
  is_public: boolean;
  affiliate_id?: number | null;
}

export interface updateLinkForm extends linkForm {
  id: number;
}

export const links = {
  async all(params: linkGetParam) {
    const query = new URLSearchParams();
    
    // Add filter parameters
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          if (Array.isArray(value)) {
            query.set(key, value.join(','));
          } else {
            query.set(key, value.toString());
          }
        }
      });
    }

    // Add pagination parameters
    if (params.page) query.set("page", params.page.toString());
    if (params.perPage) query.set("per_page", params.perPage.toString());

    const response = await request(`links?${query.toString()}`);

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();

    return {
      items: result.data,
      current_page: result.meta?.current_page || 1,
      last_page: result.meta?.last_page || 1,
      per_page: result.meta?.per_page || (typeof params.perPage === "number" ? params.perPage : 25),
      total: result.meta?.total || result.data.length,
    };
  },

  async categories(params?: { affiliate_id?: number; is_public?: boolean }) {
    const query = new URLSearchParams();
    if (params?.affiliate_id) query.set("affiliate_id", params.affiliate_id.toString());
    if (params?.is_public !== undefined) query.set("is_public", params.is_public.toString());

    const url = `links/categories${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await request(url);
    const result = await response.json();

    if (!result.success)
      throw new Error(result.message || "Failed to fetch categories");

    return result.data;
  },

  async create(payload: linkForm) {
    const response = await request(`links`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (!result.success)
      throw new Error(result.message || result.error || "Failed to create link");

    return result.data;
  },

  async update(payload: updateLinkForm) {
    const response = await request(`links/${payload.id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (!result.success)
      throw new Error(result.message || result.error || "Failed to update link");

    return result.data;
  },

  async delete(id: number) {
    const response = await request(`links/${id}`, {
      method: "DELETE",
    });
    const result = await response.json();

    if (!result.success)
      throw new Error(result.message || result.error || "Failed to delete link");

    return result.data;
  },

  async exportToCSV(filters: linkFilter) {
    const query = new URLSearchParams();
    
    // Add filter parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        if (Array.isArray(value)) {
          query.set(key, value.join(','));
        } else {
          query.set(key, value.toString());
        }
      }
    });

    const response = await request(`links/export?${query.toString()}`);
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    // Handle CSV response
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `links-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
};