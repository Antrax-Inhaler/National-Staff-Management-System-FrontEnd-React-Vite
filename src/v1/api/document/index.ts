import type { createFolderForm } from "../../components/document/CreateFolder";
import type { UpdateDocumentForm } from "../../components/document/EditDocument";
import type { DocumentForm } from "../../components/document/UploadDocument";
import { request } from "../../lib/apiRequest";

export interface documentFilter {
  search?: string;
  status?: string;
  year?: string;
  state?: string;
  expiration?: string;
  repository?: string;
  folder_id?: string;
}

export interface documentGetParams {
  page: number;
  perPage: number | string;
  filters?: documentFilter;
  affiliate_id?: number;
}

export const document = {
  // EXISTING all() method - KEEP AS IS
  async all(params: documentGetParams) {
    const query = new URLSearchParams();
    if (params.affiliate_id)
      query.set("affiliate", params.affiliate_id.toString());

    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        query.set(`${key}`, value);
      });
    }

    if (params.page) query.set("page", params.page.toString());
    if (params.perPage) query.set("per_page", params.perPage.toString());

    const response = await request(`documents/all?${query.toString()}`);

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    return {
      items: result.data,
      current_page: result.meta?.current_page || 1,
      last_page: result.meta?.last_page || 1,
      per_page:
        result.meta?.per_page ||
        (typeof params.perPage === "number" ? params.perPage : 20),
      total: result.meta?.total || result.data.length,
    };
  },
  async researchStats() {
    const response = await request("documents/stats/research");
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const result = await response.json();
    if (!result.success)
      throw new Error(result.message || "Failed to fetch research stats");

    return result.data;
  },

  // NEW: Governance documents statistics  
  async governanceStats() {
    const response = await request("documents/stats/governance");
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const result = await response.json();
    if (!result.success)
      throw new Error(result.message || "Failed to fetch governance stats");

    return result.data;
  },
  // NEW: Research Documents only
  async research(params: documentGetParams) {
    const query = new URLSearchParams();
    if (params.affiliate_id)
      query.set("affiliate", params.affiliate_id.toString());

    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        query.set(`${key}`, value);
      });
    }

    if (params.page) query.set("page", params.page.toString());
    if (params.perPage) query.set("per_page", params.perPage.toString());

    const response = await request(`documents/research?${query.toString()}`);

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    return {
      items: result.data,
      current_page: result.meta?.current_page || 1,
      last_page: result.meta?.last_page || 1,
      per_page:
        result.meta?.per_page ||
        (typeof params.perPage === "number" ? params.perPage : 20),
      total: result.meta?.total || result.data.length,
      category_group: result.meta?.category_group || 'research'
    };
  },

  // NEW: Governance Documents only  
  async governance(params: documentGetParams) {
    const query = new URLSearchParams();
    if (params.affiliate_id)
      query.set("affiliate", params.affiliate_id.toString());

    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        query.set(`${key}`, value);
      });
    }

    if (params.page) query.set("page", params.page.toString());
    if (params.perPage) query.set("per_page", params.perPage.toString());

    const response = await request(`documents/governance?${query.toString()}`);

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    return {
      items: result.data,
      current_page: result.meta?.current_page || 1,
      last_page: result.meta?.last_page || 1,
      per_page:
        result.meta?.per_page ||
        (typeof params.perPage === "number" ? params.perPage : 20),
      total: result.meta?.total || result.data.length,
      category_group: result.meta?.category_group || 'governance'
    };
  },

  // EXISTING METHODS - KEEP ALL AS IS
  async status() {
    const response = await request("documents/status");
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const result = await response.json();
    if (!result.success)
      throw new Error(result.message || "Failed to fetch affiliate stats");

    return result.data;
  },

  async specific() {
    const response = await request("documents/specific");
  },

  async upload(payload: DocumentForm) {
    const formData = new FormData();
    console.log(payload);
    
    // Append all fields including files
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        if (key === 'file' && value instanceof File) {
          formData.append(key, value);
        } else if (key !== 'file') {
          formData.append(key, String(value));
        }
      }
    });
    
    // Ensure category_group is always included
    if (!formData.has('category_group')) {
      formData.append('category_group', 'research');
    }

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

  async update(payload: UpdateDocumentForm) {
    const formData = new FormData();
    
    // Append all fields including files
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        if (key === 'file' && value instanceof File) {
          formData.append(key, value);
        } else if (key !== 'file') {
          formData.append(key, String(value));
        }
      }
    });
    
    // Ensure category_group is always included
    if (!formData.has('category_group')) {
      formData.append('category_group', 'research');
    }

    // For PUT with FormData, we need to use POST with _method=PUT
    // OR if your backend supports PUT with FormData directly
    formData.append('_method', 'PUT');

    const response = await request(`documents/update/${payload.id}`, {
      method: "POST", // Use POST with _method=PUT
      body: formData,
      formData: true,
    });

    const result = await response.json();
    if (!response.ok) {
      if (result.errors) {
        throw result;
      }
      throw new Error(result.message || "Failed to update document");
    }

    return result;
  },

  async remove(id: number) {
    const response = await request(`documents/delete/${id}`, {
      method: "DELETE",
    });

    const result = await response.json();
    if (!response.ok) {
      if (result.errors) {
        throw result;
      }
      throw new Error(result.message || "Failed to delete document");
    }

    return result;
  },

  async download(id: number) {
    const response = await request(`research/stream/${id}`);
    if (!response.ok) {
      throw new Error("Failed to stream document");
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    return url;
  },

  async folders() {
    const response = await request("documents/folders");
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication failed - please log in again");
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success)
      throw new Error(result.message || "Failed to fetch folders");

    return result.data ?? [];
  },

  async createFolder(payload: createFolderForm) {
    const response = await request("documents/create-folder", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) {
      if (result.errors) {
        throw result;
      }
      throw new Error(result.message || "Failed to create folder");
    }

    return result;
  },

  async fetch() {
    const response = await request(`documents/fetch`);
  },

  async search(param: documentGetParams) {
    const { filters, page, perPage } = param;
    const query = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          query.set(key, String(value));
        }
      });
    }

    query.set("per_page", perPage.toString());
    query.set("page", page.toString());

    const response = await request(`documents/search?${query}`);
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