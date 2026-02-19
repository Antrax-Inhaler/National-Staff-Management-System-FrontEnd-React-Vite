// @v1/api/helpVideos/index.ts
import { request } from "../../lib/apiRequest";
import type { 
  HelpVideo, 
  HelpVideoFilter, 
  HelpVideoStatistics,
  UploadVideoData, 
  UpdateVideoData,
  PaginatedHelpVideos,
  HelpVideoOptions
} from "@v1/types/helpVideos";

// Define API Response interface locally since it's used here
interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    sort_by?: string;
    sort_order?: string;
  };
}

export const helpVideos = {
  async getAll(filters: HelpVideoFilter): Promise<APIResponse<PaginatedHelpVideos>> {
    const query = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value == undefined || value == null || value === "") return;

      if (Array.isArray(value)) {
        query.set(key, value.map(String).join(","));
      } else {
        query.set(key, String(value));
      }
    });

    const response = await request(`help-videos?${query.toString()}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: APIResponse<any> = await response.json();
    
    // Transform the response to match PaginatedHelpVideos structure
    const paginatedData: PaginatedHelpVideos = {
      data: result.data || [], // Changed from result.data?.data to result.data
      current_page: result.meta?.current_page || 1,
      last_page: result.meta?.last_page || 1,
      per_page: result.meta?.per_page || (typeof filters.per_page === 'number' ? filters.per_page : 12),
      total: result.meta?.total || (result.data || []).length,
    };

    return {
      success: true,
      data: paginatedData,
      message: result.message || 'Videos retrieved successfully',
      meta: result.meta
    };
  },

  async getOptions(): Promise<APIResponse<HelpVideoOptions>> {
    const response = await request('help-videos/options');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: APIResponse<HelpVideoOptions> = await response.json();
    return result;
  },

  async getById(id: number): Promise<APIResponse<HelpVideo>> {
    const response = await request(`help-videos/${id}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: APIResponse<HelpVideo> = await response.json();
    return result;
  },

  async getByUid(publicUid: string): Promise<APIResponse<HelpVideo>> {
    const response = await request(`help-videos/public/${publicUid}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: APIResponse<HelpVideo> = await response.json();
    return result;
  },

  async getStatistics(): Promise<APIResponse<HelpVideoStatistics>> {
    const response = await request('help-videos/statistics');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: APIResponse<HelpVideoStatistics> = await response.json();
    return result;
  },

  async upload(payload: UploadVideoData): Promise<APIResponse<HelpVideo>> {
    let formData: FormData;
    
    if (payload instanceof FormData) {
      formData = payload;
    } else {
      formData = new FormData();

      Object.entries(payload).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") return;

        if (key === "video_file" && value instanceof File) {
          formData.append("video", value);
          return;
        }

        if (key === "thumbnail_file" && value instanceof File) {
          formData.append("thumbnail", value);
          return;
        }

        if (key === "is_active") {
          formData.append(key, value ? "1" : "0");
          return;
        }

        if (typeof value === "boolean") {
          formData.append(key, value ? "1" : "0");
          return;
        }

        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
          return;
        }

        formData.append(key, String(value));
      });
    }

    const response = await request("help-videos", {
      method: "POST",
      body: formData,
    });

    const result: APIResponse<HelpVideo> = await response.json();
    if (!response.ok) {
      if (result.message) {
        throw new Error(result.message);
      }
      throw new Error("Failed to upload video");
    }

    return result;
  },

  async update(payload: UpdateVideoData): Promise<APIResponse<HelpVideo>> {
    let formData: FormData;
    
    if (payload instanceof FormData) {
      formData = payload;
      if (!formData.has('id')) {
        throw new Error('ID is required for update');
      }
    } else {
      formData = new FormData();
      
      Object.entries(payload).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") return;
        
        if (key === "thumbnail_file" && value instanceof File) {
          formData.append("thumbnail", value);
          return;
        }

        if (typeof value === "boolean") {
          formData.append(key, value ? "1" : "0");
          return;
        }

        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
          return;
        }

        formData.append(key, String(value));
      });
    }

    formData.append("_method", "PUT");
    
    const id = payload instanceof FormData ? formData.get('id') : payload.id;
    const response = await request(`help-videos/${id}`, {
      method: "POST",
      body: formData,
    });

    const result: APIResponse<HelpVideo> = await response.json();
    if (!response.ok) {
      if (result.message) {
        throw new Error(result.message);
      }
      throw new Error("Failed to update video");
    }

    return result;
  },

  async delete(id: number): Promise<APIResponse<void>> {
    const response = await request(`help-videos/${id}`, {
      method: "DELETE",
    });

    const result: APIResponse<void> = await response.json();
    if (!response.ok) {
      if (result.message) {
        throw new Error(result.message);
      }
      throw new Error("Failed to delete video");
    }

    return result;
  },

  async incrementViews(id: number): Promise<APIResponse<HelpVideo>> {
    const response = await request(`help-videos/${id}/views`, {
      method: "POST",
    });

    const result: APIResponse<HelpVideo> = await response.json();
    if (!response.ok) {
      if (result.message) {
        throw new Error(result.message);
      }
      throw new Error("Failed to increment views");
    }

    return result;
  },
};