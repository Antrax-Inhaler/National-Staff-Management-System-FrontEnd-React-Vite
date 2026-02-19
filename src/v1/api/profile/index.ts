// src/api/profile/index.ts
import { request } from "../../lib/apiRequest";

export interface ProfileData {
  id: number;
  first_name: string;
  last_name: string;
  member_id?: string;
  work_email?: string;
  level?: string;
  employment_status?: string;
  status?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state_id?: number;
  state?: string;
  zip_code?: string;
  mobile_phone?: string;
  home_phone?: string;
  date_of_birth?: string;
  date_of_hire?: string;
  gender?: string;
  self_id?: string;
  profile_photo_url?: string; // Stores file path from Supabase
  affiliate?: {
    id: number;
    name: string;
  };
  email?: string;
  created_at?: string;
  updated_at?: string;
  photo_url?: string | null;
  roles?: ProfileRole[];
}

export interface ProfileRole {
  id: number;
  type: string;
  name: string;
}

export interface OfficerHistory {
  id: number;
  affiliate_id: number;
  position_id: number;
  member_id: number;
  start_date?: string;
  end_date?: string;
  is_vacant: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  member?: {
    id: number;
    first_name?: string;
    last_name?: string;
  };
}

export interface ProfileOfficerHistory {
  id: number;
  name: string;
  display_order: number;
  created_at: string;
  updated_at: string;
  current_officer: OfficerHistory;
  previous_officer: OfficerHistory;
}

export interface EditProfileData {
  first_name: string;
  last_name: string;
  member_id?: string | null;
  work_email?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state_id?: number | null;
  state?: string | null;
  zip_code?: string | null;
  mobile_phone?: string | null;
  home_phone?: string | null;
  date_of_birth?: string | null;
  date_of_hire?: string | null;
  gender?: string | null;
  self_id?: string | null;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export const profile = {
  async info(): Promise<ProfileData> {
    const response = await request("profile/info");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<ProfileData> = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Failed to fetch profile");
    }

    if (!result.data) {
      throw new Error("No profile data received");
    }

    return result.data;
  },

  async update(updateData: EditProfileData): Promise<ApiResponse<ProfileData>> {
    const response = await request("profile/update", {
      method: "PUT",
      body: JSON.stringify(updateData),
    });

    // if (!response.ok) {
    //   throw new Error(`HTTP error! status: ${response.status}`);
    // }

    const result: ApiResponse<ProfileData> = await response.json();

    if (!result.success) {
      if (result.errors) {
        // console.log(result)
        throw result;
      }
      throw new Error(result.message || "Failed to update profile");
    }

    return result;
  },

  async generateID(): Promise<ApiResponse<ProfileData>> {
    const response = await request("profile/generate-id", {
      method: "PUT",
    });

    const result: ApiResponse<ProfileData> = await response.json();

    if (!result.success) {
      if (result.errors) {
        throw result;
      }
      throw new Error(result.message || "Failed to generate Member ID");
    }

    return result;
  },

  async uploadPhoto(file: File): Promise<ApiResponse<ProfileData>> {
    // Validate file before upload
    if (!file) {
      throw new Error("No file provided");
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      throw new Error(
        "Invalid file type. Please upload JPG, PNG, GIF, or WEBP images."
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("File size must be less than 5MB");
    }

    const formData = new FormData();
    formData.append("profile_photo", file);

    const response = await request("profile/upload-photo", {
      method: "POST",
      body: formData,
      formData: true,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<ProfileData> = await response.json();

    if (!result.success) {
      if (result.errors) {
        throw result;
      }
      throw new Error(result.message || "Failed to upload profile photo");
    }

    return result;
  },

  async deletePhoto(): Promise<ApiResponse> {
    const response = await request("profile/delete-photo", {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse = await response.json();

    if (!result.success) {
      if (result.errors) {
        throw result;
      }
      throw new Error(result.message || "Failed to delete profile photo");
    }

    return result;
  },

  async missingDataCount() {
    const response = await request("profile/missing-data-count");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Failed to fetch profile");
    }

    if (!result.data) {
      throw new Error("No profile data received");
    }

    return result;
  },
};

export default profile;
