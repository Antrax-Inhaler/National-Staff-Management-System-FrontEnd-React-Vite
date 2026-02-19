import { request } from "../../lib/apiRequest";

interface nationaLeaders {
  perPage: number | string;
  page: number;
  search?: string;
}

export interface nationalLeaderUsers extends nationaLeaders {
  role_id?: number | string | null;
}

export interface assignForm {
  user_ids?: number[];
  user_id?: number;
  role_id?: number;
}

export interface roleForm {
  name: string;
  description: string;
}

export const national = {
  async all(params: nationaLeaders) {
    const { perPage, page, search } = params;
    const query = new URLSearchParams();
    query.set("per_page", perPage.toString());
    query.set("page", page.toString());

    if (search) query.set("search", search);

    const response = await request(`national/all?${query.toString()}`);
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

  async roles() {
    const response = await request("national/roles");

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();

    return result.data;
  },

  async roleOptions() {
    const response = await request("national/role-options");

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();

    console.log(result);
    return result.data;
  },

  async create(payload: roleForm) {
    const response = await request("national/detach", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();

    return result.message;
  },
  async assign(payload: assignForm) {
    const response = await request("national/assign", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    // if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();

    if (!response.ok) {
      if (result.errors) {
        throw result;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return result.message;
  },
  async removeUser(payload: assignForm) {
    const response = await request("national/detach", {
      method: "DELETE",
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();

    return result.message;
  },

  async users(role_id: number, search?: string, affiliate_id?: string) {
    const query = new URLSearchParams();
    if (role_id) query.set("role", role_id.toString());
    if (affiliate_id) query.set("affiliate", affiliate_id);
    if (search) query.set("search", search);

    const response = await request(`national/users?${query.toString()}`);

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();

    return result.data;
  },

  async roleUsers(params: nationalLeaderUsers) {
    const { perPage, page, search } = params;
    const query = new URLSearchParams();
    query.set("per_page", perPage.toString());
    query.set("page", page.toString());
    query.set("role", params.role_id!.toString());

    if (search) query.set("search", search);

    const response = await request(`national/leaders?${query.toString()}`);
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

  async history(params: nationalLeaderUsers) {
    const { perPage, page, role_id } = params;
    const query = new URLSearchParams();
    query.set("per_page", perPage.toString());
    query.set("page", page.toString());
    // query.set("role", role_id!.toString());
    console.log("fetching");
    const response = await request(
      `national/get-history/${role_id}?${query.toString()}`
    );
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    console.log(result);
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
