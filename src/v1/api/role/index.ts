// src/api/profile/index.ts
import { request } from "../../lib/apiRequest";

interface paginateBase {
  perPage: number | string;
  page: number;
}

interface getHistory extends paginateBase {
  id: number;
  type: string;
  affiliate_id?: string | number | null;
}

export const role = {
  async history({ id, type, perPage, page, affiliate_id }: getHistory) {
    const query = new URLSearchParams();
    query.set("per_page", perPage.toString());
    query.set("page", page.toString());
    query.set("type", type.toString());
    if(affiliate_id) query.set("affiliate_id", affiliate_id.toString());

    const response = await request(`roles/history/${id.toString()}?${query.toString()}`);

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
};

export default role;
