import type {
  DocumentForm,
  OverviewFilter,
  UpdateDocumentForm,
} from "@v1/types";
import { request } from "@v1/lib/apiRequest";

interface base {
  perPage: number | string;
  page: number;
  sort_by?: string;
  sort_order?: string;
}

interface overview extends base {
  type?: string;
  search?: string;
  status?: string[];
  employer?: string;
  cbc?: string;
  year?: string;
  expirationDateFrom?: string;
  expirationDateTo?: string;
  affiliate_id?: string;
}

export const NationalDocument = {
  async upload(payload: DocumentForm) {    
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") return;

      if (key === "file" && value instanceof File) {
        formData.append(key, value);
        return;
      }

      if (typeof value === "boolean") {
        formData.append(key, value ? "1" : "0");
        return;
      }

      // Handle arrays - send as JSON string
      if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
        return;
      }

      if (!formData.has("category_group")) {
        formData.append("category_group", "national");
      }

      formData.append(key, String(value));
    });

    const response = await request("documents/upload", {
      method: "POST",
      body: formData,
      formData: true,
    });

    const result = await response.json();
    if (!response.ok) {
      if (result.errors) {
        throw result;
      }

      throw new Error(result.message || "Failed to upload document");
    }

    return result;
  },

  async update(payload: UpdateDocumentForm, id: number) {
    const response = await request(`documents/update/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) {
      if (result.errors) {
        throw result;
      }
      throw new Error(result.message || "Failed to upload document");
    }

    return result;
  },

  async delete(id: number) {
    const response = await request(`documents/delete/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const result = await response.json();
      if (result.errors) {
        throw result;
      }
      throw new Error(result.message || "Failed to delete document");
    }

    return response.json();
  },

  // New Function ================================================================================

  async index(filters: OverviewFilter) {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value == undefined || value == null || value == "") return;

      if (Array.isArray(value)) {
        query.set(key, value.map(String).join(","));
      } else {
        query.set(key, String(value));
      }
    });
    console.log(query.toString());
    const response = await request(`documents/index?${query.toString()}`);
    const result = await response.json();

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    return {
      items: result.data,
      current_page: result.meta?.current_page || 1,
      last_page: result.meta?.last_page || 1,
      per_page:
        result.meta?.per_page ||
        (typeof filters.per_page === "number" ? filters.per_page : 20),
      total: result.meta?.total || result.data.length,
      sort_by: result.meta?.sort_by || filters.sort_by,
      sort_order: result.meta?.sort_order || filters.sort_order,
    };
  },

  async employers(): Promise<String[]> {
    const response = await request(`research/employers`);
    if (!response.ok) {
      const result = await response.json();
      if (result.errors) {
        throw result;
      }
      throw new Error(result.message || "Failed to fetch affiliate options");
    }

    const result = await response.json();
    return result ?? [];
  },

  async arbitrators() {
    const response = await request(`documents/arbitrators`);
    if (!response.ok) {
      const result = await response.json();
      if (result.errors) {
        throw result;
      }
      throw new Error(result.message || "Failed to fetch affiliate options");
    }

    const result = await response.json();
    return result ?? [];
  },
};
