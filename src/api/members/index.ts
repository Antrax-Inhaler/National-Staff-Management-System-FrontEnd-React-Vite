// src/api/members/index.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface ProfileData {
  id: number;
  first_name: string;
  last_name: string;
  member_id?: string;
  level?: string;
  employment_status?: string;
  status?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  work_email?: string;
  home_email?: string;
  home_phone?: string;
  self_id?: string;
  affiliate?: {
    id: number;
    name: string;
  };
  email?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EditProfileData {
  first_name: string;
  last_name: string;
  member_id?: string | null;
  work_email?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  home_email?: string | null;
  home_phone?: string | null;
  self_id?: string | null;
}

export interface ActivityLog {
  id: number;
  action: string;
  auditable_type: string;
  old_values: Record<string, any>;
  new_values: Record<string, any>;
  ip_address: string;
  user_agent?: string;
  created_at: string;
  user?: {
    name: string;
    email: string;
  };
}

export const membersAPI = {
  async getProfile(): Promise<ProfileData> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No active session");

    const token = session.access_token;
    const response = await fetch(`${API_BASE_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const result = await response.json();
    return result.data;
  },

  async updateProfile(updateData: EditProfileData): Promise<ProfileData> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No active session");

    const token = session.access_token;
    const response = await fetch(`${API_BASE_URL}/api/profile`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    const responseData = await response.json();

    if (!response.ok) {
      if (response.status === 422 && responseData.errors) {
        const errorMessages = Object.values(responseData.errors).flat().join(', ');
        throw new Error(`Validation failed: ${errorMessages}`);
      }
      throw new Error(responseData.message || "Failed to update profile");
    }

    return responseData.data;
  },

  async getActivityLogs(): Promise<ActivityLog[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No active session");

    const token = session.access_token;
    const response = await fetch(`${API_BASE_URL}/api/profile/activity-logs`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const result = await response.json();
    return result.data || [];
  }
};