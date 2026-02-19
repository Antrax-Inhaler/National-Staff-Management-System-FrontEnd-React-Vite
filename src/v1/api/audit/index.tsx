import type { AuditFilter } from "@v1/types";
import { request } from "../../lib/apiRequest";

export type AuditLog = {
  id: number;
  action: string;
  entity: {
    id: number;
    type: string;
    name: string;
  };
  performed_by: {
    id: number;
    name: string;
  };
  old_values: any;
  new_values: any;
  timestamp: string;
};

interface baseRequest {
  perPage: number | string;
  page: number;
  sort_by?: string;
  sort_order?: string;
}

export interface AuditRequest extends baseRequest {
  action?: string;
  affiliate?: string | number;
  type?: string;
}

export const audit = {
  async all(filters: AuditFilter) {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value == undefined || value == null || value == "") return;

      if (Array.isArray(value)) {
        query.set(key, value.map(String).join(","));
      } else {
        query.set(key, String(value));
      }
    });
    console.log(query.toString())
    const response = await request(`audits/logs?${query.toString()}`);

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();

    return {
      items: result.data,
      current_page: result.meta?.current_page || 1,
      last_page: result.meta?.last_page || 1,
      per_page:
        result.meta?.per_page || (typeof perPage === "number" ? perPage : 20),
      total: result.meta?.total || result.data.length,
      sort_by: result.meta?.sort_by || sort_by,
      sort_order: result.meta?.sort_order || sort_order,
    };
  },

  async affiliate(id: string): Promise<Affiliate> {
    const response = await request(`affiliates/info/${id}`);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch affiliate info: ${error}`);
    }

    const result = await response.json();
    return result.data;
  },
};
