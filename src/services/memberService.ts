// src/services/memberService.ts
import { supabase } from "../lib/supabaseClient";
const apiUrl = import.meta.env.VITE_API_BASE_URL;

const API_URL = `${apiUrl}/members`;

export interface Member {
  id: number;
  user_id: number;
  affiliate_id: number;
  affiliate?: {
    id: number;
    name: string;
  };
  member_id: string;
  first_name: string;
  last_name: string;
  level: string;
  employment_status: string;
  status: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  work_email?: string;
  work_phone?: string;
  work_fax?: string;
  home_email?: string;
  home_phone?: string;
  self_id?: string;
  non_nso: boolean;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface CreateMemberData {
  first_name: string;
  last_name: string;
  login_email: string;
  affiliate_id: number;
  level: "Associate" | "Professional";
  employment_status: "Full Time" | "Part Time";
  work_email?: string;
  work_phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  supabase_id: string;
}

async function getAuthHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const handleResponse = async (response: Response) => {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    console.error("❌ API error:", data || response.statusText);
    throw new Error(data?.message || "API request failed");
  }

  // most of your API responses seem to wrap results in { data: ... }
  return data?.data ?? data;
};

export const memberService = {
  async getMembers(affiliateId: number): Promise<Member[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_URL}?affiliate_id=${affiliateId}`,
      { headers }
    );
    return handleResponse(response);
  },

  async getMember(memberId: number): Promise<Member> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/${memberId}`, { headers });
    return handleResponse(response);
  },

  async createMember(memberData: CreateMemberData): Promise<Member> {
    const headers = await getAuthHeaders();
    const response = await fetch(API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(memberData),
    });
    return handleResponse(response);
  },

  async updateMember(memberId: number, updates: Partial<Member>): Promise<Member> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/${memberId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(updates),
    });
    return handleResponse(response);
  },

  async searchMembers(affiliateId: number, query: string): Promise<Member[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_URL}/search?affiliate_id=${affiliateId}&q=${encodeURIComponent(query)}`,
      { headers }
    );
    return handleResponse(response);
  },

  // ✅ Fixed MyProfile endpoints
  async getMyProfile(): Promise<Member> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/profile/me`, {
      method: "GET",
      headers,
    });
    return handleResponse(response);
  },

  async updateMyProfile(payload: Partial<Member>): Promise<Member> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/profile/me`, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },
};
