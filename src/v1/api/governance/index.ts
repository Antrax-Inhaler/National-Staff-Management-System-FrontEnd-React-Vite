import { request } from "../../lib/apiRequest";
import type { DocumentFormData } from "@v1/components/explorer/UploadDocument";
import type { DocumentEditFormData } from "@v1/components/explorer/EditDocument";
import type { FolderTree } from "lucide-react";
import type { OverviewFilter } from "@v1/api/research";
import type { DocumentForm, UpdateDocumentForm } from "@v1/types";

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

// export interface DocumentFormData {
//   title: string;
//   type: string;
//   category?: string;
//   category_group: string;
//   description?: string;
//   affiliate_id?: number;
//   folder_id?: number;
//   expiration_date?: string;
//   employer?: string;
//   cbc?: string;
//   state?: string;
//   effective_date?: string;
//   status?: string;
//   database_source: string;
//   is_archived?: boolean;
//   keywords?: string;
//   sub_type?: string;
//   year?: number;
//   is_public?: boolean;
//   file?: File;
// }

const keyMap: Record<string, string> = {
  perPage: "per_page",
  sortBy: "sort_by",
  sortOrder: "sort_order",
};

export const governance = {
  async overview(params: overview) {
    const { perPage, sort_by, sort_order } = params;

    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;

      const queryKey = keyMap[key] ?? key;

      if (Array.isArray(value)) {
        value.forEach((v) => query.append(queryKey, String(v)));
      } else {
        query.set(queryKey, String(value));
      }
    });
    console.log(query.toString());

    const response = await request(`governance/overview?${query.toString()}`);

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

  async upload(payload: DocumentForm, affiliate_uid?: string) {
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

      formData.append(key, String(value));
    });

    if (affiliate_uid) {
      formData.append("affiliate_uid", affiliate_uid);
    }

    if (!formData.has("category_group")) {
      formData.append("category_group", "governance");
    }

    const response = await request("governance/upload", {
      method: "POST",
      body: formData,
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
    const response = await request(`governance/update/${id}`, {
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
    const response = await request(`governance/delete/${id}`, {
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

  async createFolder(
    folder_name: string,
    folder_uid?: string | null,
    affiliate_uid?: string | null,
  ) {
    const formData = new FormData();

    formData.append("folder_name", folder_name);
    if (folder_uid && affiliate_uid) {
      formData.append("folder_uid", folder_uid);
    }
    if (affiliate_uid && !folder_uid) {
      formData.append("affiliate_uid", affiliate_uid);
    }
    if (!formData.has("category_group")) {
      formData.append("category_group", "governance");
    }

    const response = await request("governance/create-folder", {
      method: "POST",
      body: formData,
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

  async updateFolder(folder_name: string, folder_uid?: string | null) {
    const formData = new FormData();
    formData.append("folder_name", folder_name);
    if (folder_uid) formData.append("folder_uid", folder_uid);
    const response = await request("governance/update-folder", {
      method: "PUT",
      body: formData,
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

  async folderTree(search?: string) {
    const query = new URLSearchParams();
    console.log("check affilaites");
    if (search) query.set("search", search);
    const response = await request(
      `governance/affiliate-folders?${query.toString()}`,
    );

    const result = await response.json();
    if (!response.ok) {
      if (result.errors) {
        throw result;
      }
      throw new Error(result.message || "Failed to upload document");
    }

    return result;
  },

  async folders(folder_uid?: string, affiliate_uid?: string) {
    const params = new URLSearchParams();
    if (folder_uid) params.append("folder", folder_uid);
    if (affiliate_uid) params.append("public_uid", affiliate_uid);
    const res = await request(`governance/folders?${params.toString()}`);
    return res.json();
  },
  async affiliate(filters: OverviewFilter, affiliate_uid: string) {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      if (Array.isArray(value)) {
        value.forEach((v) => query.append(key, String(v)));
      } else {
        query.set(key, String(value));
      }
    });

    const response = await request(
      `governance/affiliate/${affiliate_uid}?${query.toString()}`,
    );
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

  async index(filters: OverviewFilter) {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      if (Array.isArray(value)) {
        value.forEach((v) => query.append(key, String(v)));
      } else {
        query.set(key, String(value));
      }
    });

    const response = await request(`governance/index?${query.toString()}`);
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
};
