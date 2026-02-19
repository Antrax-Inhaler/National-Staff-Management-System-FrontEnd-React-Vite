// src/api/nationalInformation.ts
import { request } from "../../lib/apiRequest";

export interface NationalInformation {
  id: number;
  public_uid: string;
  type: 'announcement' | 'news' | 'resource' | 'event' | 'policy';
  title: string;
  content: string;
  category: string;
  author: string;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  created_at: string;
  updated_at: string;
  view_count?: number;
  reader_count?: number;
  total_views?: number;
  total_viewers?: number;
  is_unread?: boolean;
  attachments?: NationalInformationAttachment[];
  share_url?: string;
}

export interface NationalInformationAttachment {
  id: number;
  national_info_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  file_url?: string;
  created_at: string;
  updated_at: string;
}
export interface FilterParams {
  page?: number;
  perPage?: number | string;
  search?: string;
  type?: string;
  category?: string;
  status?: string;
  author?: string;
  sort_by?: string;
  sort_order?: string;
}

export interface PaginatedResponse {
  items: NationalInformation[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  sort_by?: string;
  sort_order?: string;
}

export interface BulkUpdateData {
  ids: number[];
  status: string;
  publish_date?: string;
  publish_time?: string;
}

export interface CreateData {
  type: string;
  title: string;
  content: string;
  category: string;
  author: string;
  status: string;
  published_at?: string;
  attachments?: File[];
}

export interface UpdateData {
  type?: string;
  title?: string;
  content?: string;
  category?: string;
  author?: string;
  status?: string;
  published_at?: string | null; 
  attachments?: File[];
  delete_attachments?: number[];
}
export interface Statistics {
  total: number;
  published: number;
  draft: number;
  archived: number;
  unread: number;
  total_views: number;
  most_viewed: Array<{ title: string; unique_viewers: number }>;
  recent_views: any[];
  by_type: Record<string, number>;
  unread_by_type: Record<string, number>;
  by_category: Record<string, number>;
}

export const nationalInformation = {
  // GET /national-information (index method)
  async list(params?: FilterParams): Promise<PaginatedResponse> {
    const query = new URLSearchParams();
    
    if (params?.page) query.set("page", params.page.toString());
    if (params?.perPage) query.set("per_page", params.perPage.toString());
    if (params?.search) query.set("search", params.search);
    if (params?.type) query.set("type", params.type);
    if (params?.category) query.set("category", params.category);
    if (params?.status) query.set("status", params.status);
    if (params?.author) query.set("author", params.author);
    if (params?.sort_by) query.set("sort_by", params.sort_by);
    if (params?.sort_order) query.set("sort_order", params.sort_order);
    
    const response = await request(`national-information?${query.toString()}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    
    return {
      items: result.data,
      current_page: result.meta?.current_page || 1,
      last_page: result.meta?.last_page || 1,
      per_page: result.meta?.per_page || 20,
      total: result.meta?.total || result.data.length,
      sort_by: result.meta?.sort_by,
      sort_order: result.meta?.sort_order,
    };
  },

  // GET /national-information/{id} (show method)
  async show(id: string | number): Promise<NationalInformation> {
    const response = await request(`national-information/${id}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || "Failed to fetch information");
    }
    
    return result.data;
  },

  // POST /national-information (store method)
  async create(data: CreateData): Promise<any> {
    const formData = new FormData();
    
    Object.keys(data).forEach(key => {
      const value = data[key as keyof CreateData];
      if (value !== undefined && value !== null) {
        if (key === 'attachments' && Array.isArray(value)) {
          (value as File[]).forEach((file, index) => {
            formData.append(`attachments[${index}]`, file);
          });
        } else {
          formData.append(key, value.toString());
        }
      }
    });
    
    const response = await request('national-information', {
      method: 'POST',
      body: formData,
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      if (result.errors) throw result;
      throw new Error(result.message || 'Failed to create information');
    }
    
    return result;
  },

  // PUT /national-information/{id} (update method)
  async update(id: number, data: UpdateData): Promise<any> {
    const formData = new FormData();
    
    Object.keys(data).forEach(key => {
      const value = data[key as keyof UpdateData];
      if (value !== undefined && value !== null) {
        if (key === 'attachments' && Array.isArray(value)) {
          (value as File[]).forEach((file, index) => {
            formData.append(`attachments[${index}]`, file);
          });
        } else if (key === 'delete_attachments' && Array.isArray(value)) {
          (value as number[]).forEach((attachmentId, index) => {
            formData.append(`delete_attachments[${index}]`, attachmentId.toString());
          });
        } else {
          formData.append(key, value.toString());
        }
      }
    });
    
    const response = await request(`national-information/${id}`, {
      method: 'PUT',
      body: formData,
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      if (result.errors) throw result;
      throw new Error(result.message || 'Failed to update information');
    }
    
    return result;
  },

  // DELETE /national-information/{id} (destroy method)
  async destroy(id: number): Promise<any> {
    const response = await request(`national-information/${id}`, {
      method: 'DELETE',
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      if (result.message) {
        throw new Error(result.message);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return result;
  },

async bulkUpdate(data: BulkUpdateData): Promise<any> {
  const response = await request('national-information/bulk-update', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.message || `HTTP error! status: ${response.status}`);
  }
  
  return result;
},
async bulkDelete(data: { ids: number[] }): Promise<any> {
  const response = await request('national-information/bulk-delete', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.message || `HTTP error! status: ${response.status}`);
  }
  
  return result;
},
  // GET /national-information/options (options method)
  async options(): Promise<any> {
    const response = await request('national-information/options');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    return result;
  },

  // GET /national-information/statistics (statistics method)
  async statistics(): Promise<{ success: boolean; data: Statistics }> {
    const response = await request('national-information/statistics');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    return result;
  },

  // GET /national-information/{id}/viewers (getViewers method)
  async getViewers(articleId: number): Promise<any> {
    const response = await request(`national-information/${articleId}/viewers`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    return result;
  },

  // GET /national-information/{id}/viewer-stats (getViewerStats method)
  async getViewerStats(articleId: number): Promise<any> {
    const response = await request(`national-information/${articleId}/viewer-stats`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    return result;
  },

  // POST /national-information/log-view (logView method)
  async logView(auditableId: number, action: string = "view"): Promise<any> {
    const response = await request("national-information/log-view", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auditable_type: "App\\Models\\NationalInformation",
        auditable_id: auditableId,
        action,
      }),
    });

    const result = await response.json();
    return result;
  },

  // GET /national-information/unread (getUnreadArticles method)
  async getUnreadArticles(params?: FilterParams): Promise<PaginatedResponse> {
    const query = new URLSearchParams();
    
    if (params?.page) query.set("page", params.page.toString());
    if (params?.perPage) query.set("per_page", params.perPage.toString());
    if (params?.search) query.set("search", params.search);
    if (params?.type) query.set("type", params.type);
    if (params?.category) query.set("category", params.category);
    
    const response = await request(`national-information/unread?${query.toString()}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    
    return {
      items: result.data,
      current_page: result.meta?.current_page || 1,
      last_page: result.meta?.last_page || 1,
      per_page: result.meta?.per_page || 20,
      total: result.meta?.total || result.data.length,
    };
  },

  // GET /national-information/unread/{type} (getUnreadArticlesByType method)
  async getUnreadArticlesByType(type: string, params?: FilterParams): Promise<PaginatedResponse> {
    const query = new URLSearchParams();
    
    if (params?.page) query.set("page", params.page.toString());
    if (params?.perPage) query.set("per_page", params.perPage.toString());
    if (params?.search) query.set("search", params.search);
    if (params?.category) query.set("category", params.category);
    
    const response = await request(`national-information/unread/${type}?${query.toString()}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    
    return {
      items: result.data,
      current_page: result.meta?.current_page || 1,
      last_page: result.meta?.last_page || 1,
      per_page: result.meta?.per_page || 20,
      total: result.meta?.total || result.data.length,
    };
  },
};