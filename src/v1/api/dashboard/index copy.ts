// src/v1/api/dashboard/index.ts
import { request } from "../../lib/apiRequest";

// Define Filters interface in the same file
export interface Filters {
  time_range: string;
  affiliate_id?: string;
  member_level?: string;
  state?: string;
  start_date?: string;
  end_date?: string;
  affiliate_type?: string;
}

export const dashboard = {
  // New modular endpoints
  async getExecutiveSummary(filters: Filters) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });

    const response = await request(`dashboard/executive-summary?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch executive summary");
    return (await response.json()).data;
  },

  async getDemographicAnalysis(filters: Filters) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });

    const response = await request(`dashboard/demographic-analysis?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch demographic analysis");
    return (await response.json()).data;
  },

  async getAffiliateAnalytics(filters: Filters) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });

    const response = await request(`dashboard/affiliate-analytics?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch affiliate analytics");
    return (await response.json()).data;
  },

  async getTemporalAnalysis(filters: Filters) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });

    const response = await request(`dashboard/temporal-analysis?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch temporal analysis");
    return (await response.json()).data;
  },

  async getSystemGovernance(filters: Filters) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });

    const response = await request(`dashboard/system-governance?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch system governance data");
    return (await response.json()).data;
  },

  async getResearchGovernance(filters: Filters) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });

    const response = await request(`dashboard/research-governance?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch research governance data");
    return (await response.json()).data;
  },

  async searchMembers(searchTerm: string, filters?: Partial<Filters>, limit: number = 10) {
    const params = new URLSearchParams();
    params.append('search_term', searchTerm);
    params.append('limit', limit.toString());
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value));
        }
      });
    }

    const response = await request(`dashboard/search-members?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to search members");
    return (await response.json()).data;
  },

  // Keep original methods for backward compatibility
  async national(filters: Filters) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });

    const response = await request(`dashboard/national?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch dashboard data");
    return (await response.json()).data;
  },

  async member() {
    const response = await request("dashboard/member");
    if (!response.ok) throw new Error("Failed to fetch dashboard data");
    return (await response.json()).data;
  },

  async affiliate() {
    const response = await request("dashboard/affiliate-directory");
    if (!response.ok) throw new Error("Failed to fetch dashboard data");
    return (await response.json()).data;
  },
};