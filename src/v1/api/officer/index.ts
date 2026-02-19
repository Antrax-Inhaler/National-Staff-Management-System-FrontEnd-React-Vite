// src/api/officer.ts
import { request } from "../../lib/apiRequest";

export type positionForm = {
  member_id: number | undefined;
  position_id: number | undefined;
  start_date: string;
  type: string;
};

interface searchParam {
  search?: string;
  id?: number | string; // Numeric ID
  uid?: string; // Public UID
}

export const officers = {
  async getOfficers(page: number, perPage: number | string) {
    const response = await request("officers/get-officers");
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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

  async getNoPosition(id?: number | string) {
    const query = new URLSearchParams();
    if (id) query.set("affiliate_id", id.toString());
    const response = await request(`officers/no-positions?${query.toString()}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    return result.data;
  },

  async assignPosition(payload: positionForm) {
    if (!payload) {
      throw new Error(`Empty form`);
    }
    const response = await request("officers/assign-officer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      if (result.errors) {
        throw result;
      }
      throw new Error(
        result.message || `HTTP error! status: ${response.status}`,
      );
    }

    return result;
  },

  async openPosition(id: number, perPage: number | string) {
    const query = new URLSearchParams();
    query.set("position", id.toString());

    const response = await request(
      `officers/open-position?${query.toString()}`,
      {
        method: "PATCH",
      },
    );

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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

  async affiliateOfficers(
    id?: string | number,
    page: number = 1,
    perPage: number | string = "All",
  ) {
    const response = await request(`officers/affiliate-officers/${id}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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

  async userSearch({ search, id, uid }: searchParam) {
    const query = new URLSearchParams();
    if (id) query.set("id", id?.toString());
    if (uid) query.set("uid", uid.toString());
    if (search) query.set("search", search);

    const response = await request(`officers/user-search?${query.toString()}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    return result.data;
  },
};
