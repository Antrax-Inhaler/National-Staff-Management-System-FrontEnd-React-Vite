// @v1/types/helpVideos.ts (update this file)
import type { BaseFilter } from "./api";

export interface HelpVideo {
  id: number;
  public_uid: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration: string | null;
  category: string;
  view_count: number;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface HelpVideoOptions {
  categories: string[];
}

export interface HelpVideoFilter extends BaseFilter {
  category?: string;
  search?: string;
  is_active?: boolean;
  created_by?: number;
}

export interface HelpVideoStatistics {
  total_videos: number;
  total_views: number;
  categories: string[];
  most_viewed: Array<{
    id: number;
    title: string;
    view_count: number;
  }>;
  recent_videos: Array<{
    id: number;
    title: string;
    created_at: string;
  }>;
}

export type UploadVideoData = FormData | {
  title: string;
  description: string;
  video_file: File;
  thumbnail_file?: File;
  category: string;
  is_active?: boolean;
};

export type UpdateVideoData = FormData | {
  id: number;
  title?: string;
  description?: string;
  thumbnail_file?: File;
  category?: string;
  is_active?: boolean;
};

export interface APIResponse<T> {
  success: boolean;
  data: T;
  message: string;  // Make message required
}

export interface PaginatedHelpVideos {
  data: HelpVideo[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  sort_by?: string;
  sort_order?: string;
}