import { request } from "@v1/lib/apiRequest";

export interface domainQueryParam {
  perPage: number | string;
  page: number;
}

export interface domainForm {
  domain: string;
  type: string;
  status: string;
  affiliate_id?: string | undefined | number;
}

export interface affiliateDomainQueryParam extends domainQueryParam {
  affiliate_id: number | string | undefined;
}

export const domain = {
  async all(params: domainQueryParam) {
    const { perPage, page } = params;

    const query = new URLSearchParams();
    query.set("per_page", perPage.toString());
    query.set("page", page.toString());

    const response = await request(`domains/all?${query.toString()}`);

    if (!response.ok) throw new Error("Network response was not ok");

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

  async affiliate(params: affiliateDomainQueryParam) {
    const { perPage, page, affiliate_id } = params;

    const query = new URLSearchParams();
    query.set("per_page", perPage.toString());
    query.set("page", page.toString());

    const response = await request(
      `domains/affiliate/${affiliate_id}?${query.toString()}`,
    );

    if (!response.ok) throw new Error("Network response was not ok");

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

  async blacklists(params: domainQueryParam) {
    const { perPage, page } = params;

    const query = new URLSearchParams();
    query.set("per_page", perPage.toString());
    query.set("page", page.toString());

    const response = await request(`domains/blacklisted?${query.toString()}`);

    if (!response.ok) throw new Error("Network response was not ok");

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

  async block(payload: domainForm) {
    const response = await request("domains/block-domain", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      if (result.errors) {
        throw result;
      }
      throw new Error(result.message || "Failed to add a domain");
    }

    return result;
  },

  async create(payload: domainForm) {
    const response = await request("domains/create-domain", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      if (result.errors) {
        throw result;
      }
      throw new Error(result.message || "Failed to add a domain");
    }

    return result;
  },

  async delete(id: number | string) {
    const response = await request("domains/delete-domain", {
      method: "DELETE",
      body: JSON.stringify({
        domain_id: id,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      if (result.errors) {
        throw result;
      }
      throw new Error(result.message || "Failed to add a domain");
    }

    return result;
  },
};
