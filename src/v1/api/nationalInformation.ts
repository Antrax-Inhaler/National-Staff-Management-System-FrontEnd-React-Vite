// src/api/nationalInformation.ts
import { request } from "../lib/apiRequest";

export interface NationalInformation {
  public_uid: string;
  id: number;
  type: string;
  title: string;
  content: string;
  category: string;
  author: string;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  attachments?: Attachment[];
  view_count?: number;
  reader_count?: number; 
  is_unread?: boolean; 
  share_url?: string;
}

export interface Attachment {
  id: number;
  national_info_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  file_url?: string;
  created_at: string;
  updated_at: string;
  file_type?: string;
  icon?: string;
}

export interface Options {
  types: string[];
  categories: string[];
  statuses: string[];
  authors: string[];
}

export interface CreateNationalInfoData {
  type: string;
  title: string;
  content: string;
  category: string;
  author: string;
  status: string;
  published_at?: string;
  attachments?: File[];
}

export interface UpdateNationalInfoData extends Partial<CreateNationalInfoData> {
  delete_attachments?: number[];
}

export interface LogViewData {
  auditable_type: string;
  auditable_id: number;
  action: string;
}

export interface FilterParams {
  search?: string;
  type?: string;
  category?: string;
  status?: string;
  author?: string;
  from_date?: string;
  to_date?: string;
  published_from?: string;
  published_to?: string;
  sort_by?: string;
  sort_order?: string;
  page?: number;
  per_page?: number;
}

export interface Statistics {
  total: number;
  published: number;
  draft: number;
  archived: number;
  total_views: number;
  unread: number;
  by_type: Record<string, number>;
  unread_by_type: Record<string, number>;
  by_category: Record<string, number>;
  most_viewed?: Array<{id: number, title: string, unique_viewers: number}>;
  recent_views?: Array<{date: string, daily_viewers: number}>;
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

export const nationalInformation = {
  async list(params: FilterParams = {}): Promise<PaginatedResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.set(key, value.toString());
      }
    });

    const response = await request(`national-information?${queryParams.toString()}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();

    // Check if it's a paginated response or direct data array
    if (Array.isArray(result.data)) {
      return {
        items: result.data,
        current_page: result.meta?.current_page || 1,
        last_page: result.meta?.last_page || 1,
        per_page: result.meta?.per_page || 20,
        total: result.meta?.total || result.data.length,
        sort_by: result.meta?.sort_by || params.sort_by,
        sort_order: result.meta?.sort_order || params.sort_order,
      };
    } else if (result.data && Array.isArray(result.data.data)) {
      return {
        items: result.data.data,
        current_page: result.data.current_page || 1,
        last_page: result.data.last_page || 1,
        per_page: result.data.per_page || 20,
        total: result.data.total || result.data.data.length,
        sort_by: result.data.sort_by || params.sort_by,
        sort_order: result.data.sort_order || params.sort_order,
      };
    } else if (Array.isArray(result)) {
      return {
        items: result,
        current_page: 1,
        last_page: 1,
        per_page: result.length,
        total: result.length,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
      };
    } else {
      throw new Error('Unexpected API response structure');
    }
  },

  async getUnreadArticles(params: FilterParams = {}): Promise<PaginatedResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.set(key, value.toString());
      }
    });

    const response = await request(`national-information/unread?${queryParams.toString()}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();

    if (Array.isArray(result.data)) {
      return {
        items: result.data,
        current_page: result.meta?.current_page || 1,
        last_page: result.meta?.last_page || 1,
        per_page: result.meta?.per_page || 20,
        total: result.meta?.total || result.data.length,
        sort_by: result.meta?.sort_by || params.sort_by,
        sort_order: result.meta?.sort_order || params.sort_order,
      };
    } else if (result.data && Array.isArray(result.data.data)) {
      return {
        items: result.data.data,
        current_page: result.data.current_page || 1,
        last_page: result.data.last_page || 1,
        per_page: result.data.per_page || 20,
        total: result.data.total || result.data.data.length,
        sort_by: result.data.sort_by || params.sort_by,
        sort_order: result.data.sort_order || params.sort_order,
      };
    } else {
      throw new Error('Unexpected API response structure');
    }
  },

  async show(identifier: string | number): Promise<NationalInformation> {
    const isNumericId = typeof identifier === 'number' || /^\d+$/.test(identifier);
    
    if (!isNumericId) {
      const response = await request('national-information');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      
      const item = result.data?.find((item: NationalInformation) => 
        item.public_uid === identifier
      );
      
      if (!item) {
        throw new Error('Information not found');
      }
      
      return item;
    } else {
      const response = await request(`national-information/${identifier}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      
      if (result.data && typeof result.data === 'object' && !Array.isArray(result.data)) {
        return result.data;
      }
      return result.data || result;
    }
  },

  async create(data: CreateNationalInfoData): Promise<NationalInformation> {
    const formData = new FormData();

    // Append text fields
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'attachments') {
        // Handle attachments separately
        if (value && Array.isArray(value)) {
          value.forEach((file: File) => {
            formData.append('attachments[]', file);
          });
        }
      } else if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    const response = await request('national-information', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      if (result.errors) {
        throw result;
      }
      throw new Error(result.message || 'Failed to create national information');
    }

    return result.data;
  },

  async update(id: number, data: UpdateNationalInfoData): Promise<NationalInformation> {
    const formData = new FormData();

    // Append text fields
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'attachments') {
        // Handle new attachments
        if (value && Array.isArray(value)) {
          value.forEach((file: File) => {
            formData.append('attachments[]', file);
          });
        }
      } else if (key === 'delete_attachments') {
        // Handle attachments to delete
        if (value && Array.isArray(value)) {
          value.forEach((attachmentId: number) => {
            formData.append('delete_attachments[]', attachmentId.toString());
          });
        }
      } else if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    const response = await request(`national-information/${id}`, {
      method: 'PUT',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      if (result.errors) {
        throw result;
      }
      throw new Error(result.message || 'Failed to update national information');
    }

    return result.data;
  },

  async delete(id: number | string): Promise<any> {
    const response = await request(`national-information/${id}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete national information');
    }

    return result;
  },

  async statistics(): Promise<Statistics> {
    const response = await request('national-information/statistics');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    return result.data as Statistics;
  },
  
  async options(): Promise<Options> {
    const response = await request('national-information/options');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    return result.data as Options;
  },

  async logView(data: LogViewData) {
    const response = await request('national-information/log-view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to log view');
    }

    return result;
  },

  async bulkUpdate(ids: number[], status: string): Promise<any> {
    console.log('Bulk update request:', { ids, status });
    
    const response = await request('national-information/bulk-update', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids, status }),
    });

    const result = await response.json();
    console.log('Bulk update response:', result);

    if (!response.ok) {
        console.error('Bulk update failed:', result);
        throw new Error(result.message || 'Failed to bulk update');
    }

    return result.data;
  },

  async getViewers(articleId: number): Promise<any> {
    const response = await request(`national-information/${articleId}/viewers`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    return result.data;
  },

  async getViewerStats(articleId: number): Promise<any> {
    const response = await request(`national-information/${articleId}/viewer-stats`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    return result.data;
  },
};