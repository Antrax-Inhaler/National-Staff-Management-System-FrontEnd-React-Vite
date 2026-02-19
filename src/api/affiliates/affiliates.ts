import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface Affiliate {
  id: number;
  name: string;
  code: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface AffiliateStats {
  total_documents: number;
  active_contracts: number;
  expiring_soon: number;
  expired_contracts: number;
  recent_uploads: number;
}

export const affiliatesAPI = {
  async getAffiliate(): Promise<Affiliate> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No active session");

    const token = session.access_token;
    const response = await fetch(`${API_BASE_URL}/api/affiliate`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Failed to fetch affiliate");
    
    return result.data;
  },

  async getAffiliateStats(): Promise<AffiliateStats> {
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

  async refreshStats(): Promise<AffiliateStats> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No active session");

    const token = session.access_token;
    const response = await fetch(`${API_BASE_URL}/api/affiliate/stats/refresh`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Failed to refresh stats");
    
    return result.data;
  }
};