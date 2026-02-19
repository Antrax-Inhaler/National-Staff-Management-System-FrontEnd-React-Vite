import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Rename interfaces to avoid conflicts
export interface AffiliateMember {
  id: number;
  first_name: string;
  last_name: string;
  member_id: string;
  level: string;
  employment_status: string;
  status: string;
  work_email?: string | null;
  work_phone?: string | null;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  affiliate?: {
    id: number;
    name: string;
  };
}

export interface AffiliateStatsData {
  total_documents: number;
  active_contracts: number;
  expiring_soon: number;
  expired_contracts: number;
  recent_uploads: number;
}

export interface CreateMemberData {
  member_id: string;
  first_name: string;
  last_name: string;
  login_email: string;
  work_email?: string | null;
  work_phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  level: string;
  employment_status: string;
}

export interface UpdateMemberData {
  first_name?: string;
  last_name?: string;
  work_email?: string | null;
  work_phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  level?: string;
  employment_status?: string;
  status?: string;
}

export const affiliatesAPI = {
  async getMembers(params?: {
    search?: string;
    employment_status?: string;
    level?: string;
    page?: number;
    per_page?: number;
  }): Promise<{ data: AffiliateMember[]; meta: any }> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No active session");

    const token = session.access_token;
    const urlParams = new URLSearchParams();
    
    if (params?.search) urlParams.append('search', params.search);
    if (params?.employment_status) urlParams.append('employment_status', params.employment_status);
    if (params?.level) urlParams.append('level', params.level);
    if (params?.page) urlParams.append('page', params.page.toString());
    if (params?.per_page) urlParams.append('per_page', params.per_page.toString());

    const response = await fetch(`${API_BASE_URL}/api/members?${urlParams.toString()}`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Failed to fetch members");
    
    return {
      data: result.data,
      meta: result.meta
    };
  },

  async getMember(id: number): Promise<AffiliateMember> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No active session");

    const token = session.access_token;
    const response = await fetch(`${API_BASE_URL}/api/members/${id}`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Failed to fetch member");
    
    return result.data;
  },

  async createMember(memberData: CreateMemberData): Promise<AffiliateMember> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No active session");

    const token = session.access_token;
    const response = await fetch(`${API_BASE_URL}/api/members`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(memberData),
    });

    const result = await response.json();
    
    if (!response.ok) {
      if (response.status === 422 && result.errors) {
        const errorMessages = Object.values(result.errors).flat().join(', ');
        throw new Error(`Validation failed: ${errorMessages}`);
      }
      throw new Error(result.message || "Failed to create member");
    }
    
    return result.data;
  },

  async updateMember(id: number, memberData: UpdateMemberData): Promise<AffiliateMember> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No active session");

    const token = session.access_token;
    const response = await fetch(`${API_BASE_URL}/api/members/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(memberData),
    });

    const result = await response.json();
    
    if (!response.ok) {
      if (response.status === 422 && result.errors) {
        const errorMessages = Object.values(result.errors).flat().join(', ');
        throw new Error(`Validation failed: ${errorMessages}`);
      }
      throw new Error(result.message || "Failed to update member");
    }
    
    return result.data;
  },

  async validateField(field: string, value: string, memberId?: number): Promise<{ valid: boolean; message: string }> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No active session");

    const token = session.access_token;
    const params = new URLSearchParams({ field, value });
    if (memberId) params.append('member_id', memberId.toString());

    const response = await fetch(`${API_BASE_URL}/api/members/validate-field?${params.toString()}`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const result = await response.json();
    return result;
  },

  async getStats(): Promise<AffiliateStatsData> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No active session");

    const token = session.access_token;
    const response = await fetch(`${API_BASE_URL}/api/affiliate/stats`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Failed to fetch affiliate stats");
    
    return result.data;
  },
};