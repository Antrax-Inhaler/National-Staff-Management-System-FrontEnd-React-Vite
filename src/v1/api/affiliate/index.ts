import type {
  Affiliate,
  AffiliateExportFilter,
  AffiliateFilter,
  DeleteAffiliate,
  ExportFilter,
} from "@v1/types";
import { request } from "../../lib/apiRequest";

export interface memberFilter {
  position: string[];
  employment_status: string[];
  level: string[];
}

export interface AffiliateFormData {
  name: string;
  state?: string;
  employer_name?: string;
  ein?: string;
  affiliation_date?: string;
  affiliate_type?: string;
  cbc_region?: string;
  ORG_region?: string;
  logo?: File;
}

export interface AffiliateUpdateData extends AffiliateFormData {
  affiliate_id: string | number;
}

export interface fetchAffiliates {
  perPage: number | string;
  page: number;
  searchTerm: string;
  sort_by?: string;
  sort_order?: string;
  filters?: {
    affiliate_type?: string[];
    cbc_region?: string[];
    ORG_region?: string[];
    has_logo?: boolean;
    has_ein?: boolean;
    has_employer?: boolean;
  };
}

export interface AffiliatesResponse {
  data: Affiliate[];
  current_page: number;
  from: number;
  last_page: number;
  per_page: number;
  to: number;
  total: number;
}

export const affiliate = {
  async all(params: fetchAffiliates) {
    const { perPage, page, searchTerm, sort_by, sort_order, filters } = params;

    const query = new URLSearchParams();
    query.set("per_page", perPage.toString());
    query.set("page", page.toString());
    if (searchTerm) query.set("search", searchTerm);
    if (sort_by) query.set("sort_by", sort_by);
    if (sort_order) query.set("sort_order", sort_order);

    // Add filters to query params
    if (filters) {
      if (filters.affiliate_type?.length)
        query.set("affiliate_type", filters.affiliate_type.join(","));
      if (filters.cbc_region?.length)
        query.set("cbc_region", filters.cbc_region.join(","));
      if (filters.ORG_region?.length)
        query.set("ORG_region", filters.ORG_region.join(","));
      if (filters.has_logo !== undefined)
        query.set("has_logo", filters.has_logo.toString());
      if (filters.has_ein !== undefined)
        query.set("has_ein", filters.has_ein.toString());
      if (filters.has_employer !== undefined)
        query.set("has_employer", filters.has_employer.toString());
    }

    const response = await request(`affiliates/all?${query.toString()}`);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch affiliates: ${error}`);
    }

    const result = await response.json();

    return {
      items: result.data,
      current_page: result.meta?.current_page || 1,
      last_page: result.meta?.last_page || 1,
      per_page:
        result.meta?.per_page || (typeof perPage === "number" ? perPage : 20),
      total: result.meta?.total || result.data.length,
    };
  },

  async info(id: string): Promise<Affiliate> {
    const response = await request(`affiliates/info/${id}`);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch affiliate info: ${error}`);
    }

    const result = await response.json();
    return result.data;
  },

  async create(payload: FormData): Promise<Affiliate> {
    const response = await request("affiliates/create", {
      method: "POST",
      body: payload,
    });

    const result = await response.json();
    if (!response.ok) {
      if (result.errors) {
        throw result;
      }
      throw new Error(result.message || "Failed to create affiliate");
    }

    return result;
  },

  async update(payload: FormData): Promise<Affiliate> {
    if (!payload.has("_method")) {
      payload.append("_method", "PUT");
    }

    const response = await request("affiliates/update", {
      method: "POST",
      body: payload,
    });

    const result = await response.json();
    if (!response.ok) {
      if (result.errors) {
        throw result;
      }
      throw new Error(result.message || "Failed to create affiliate");
    }

    return result;
  },

  async delete(id: string | number): Promise<void> {
    const response = await request(`affiliates/delete/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const result = await response.json();
      if (result.errors) {
        throw result;
      }
      throw new Error(result.message || "Failed to delete affiliate");
    }

    const result = await response.json();
    return result;
  },

  async options(
    search?: string,
    affiliate_id?: string | number,
  ): Promise<Affiliate[]> {
    const query = new URLSearchParams();
    console.log("check affilaites");
    if (search) query.set("search", search);
    if (affiliate_id) query.set("affiliate_id", affiliate_id.toString());
    const response = await request(`affiliates/options?${query.toString()}`);
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

  // async employers(): Promise<String[]> {
  //   const response = await request(`affiliates/employers`);
  //   if (!response.ok) {
  //     const result = await response.json();
  //     if (result.errors) {
  //       throw result;
  //     }
  //     throw new Error(result.message || "Failed to fetch affiliate options");
  //   }

  //   const result = await response.json();
  //   return result ?? [];
  // },

  async allAffiliates(): Promise<String[]> {
    const response = await request(`affiliates/all-affiliates`);
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

  // ======================================= NEW =========================================

  async index(filters: AffiliateFilter) {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value == undefined || value == null || value == "") return;

      if (Array.isArray(value)) {
        query.set(key, value.map(String).join(","));
      } else {
        query.set(key, String(value));
      }
    });

    const response = await request(`affiliates/index?${query.toString()}`);
    console.log(query.toString());

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

  async remove(payload: DeleteAffiliate) {
    console.log(payload);
    const response = await request(`affiliates/remove`, {
      method: "DELETE",
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) {
      if (result.message) {
        throw result;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return result;
  },

  async export(filters: AffiliateExportFilter) {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value == undefined || value == null || value == "") return;
      if (Array.isArray(value)) {
        query.set(key, value.map(String).join(","));
      } else {
        query.set(key, String(value));
      }
    });

    const response = await request(`affiliates/export?${query.toString()}`);

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
    const response = await request(`affiliates/employers`);
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
