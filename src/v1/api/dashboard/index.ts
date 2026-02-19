// api/dashboard.ts
import type { Filters } from "../../components/dashboard/NationalDashboard";
import { request } from "../../lib/apiRequest";

// Helper function to build filter parameters with array support
function buildFilterParams(filters: Filters): URLSearchParams {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      if (Array.isArray(value)) {
        // For array values, append each value separately with [] notation
        value.forEach(v => {
          if (v !== undefined && v !== null && v !== "") {
            params.append(`${key}[]`, String(v));
          }
        });
      } else {
        params.append(key, String(value));
      }
    }
  });
  
  return params;
}

export const dashboard = {
  async national(filters: Filters) {
    const params = buildFilterParams(filters);
    const response = await request(`dashboard/national?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch dashboard data");

    const result = await response.json();
    return result.data;
  },

  // New: Modular dashboard endpoints
  async executiveSummary(filters: Filters) {
    const params = buildFilterParams(filters);
    const response = await request(`dashboard/executive-summary?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch executive summary");
    
    const result = await response.json();
    return result.data;
  },

  async demographicAnalysis(filters: Filters) {
    const params = buildFilterParams(filters);
    const response = await request(`dashboard/demographic-analysis?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch demographic analysis");
    
    const result = await response.json();
    return result.data;
  },

  async affiliateAnalytics(filters: Filters) {
    const params = buildFilterParams(filters);
    const response = await request(`dashboard/affiliate-analytics?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch affiliate analytics");
    
    const result = await response.json();
    return result.data;
  },

  async temporalAnalysis(filters: Filters) {
    const params = buildFilterParams(filters);
    const response = await request(`dashboard/temporal-analysis?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch temporal analysis");
    
    const result = await response.json();
    return result.data;
  },

  async systemGovernance(filters: Filters) {
    const params = buildFilterParams(filters);
    const response = await request(`dashboard/system-governance?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch system governance");
    
    const result = await response.json();
    return result.data;
  },

  async researchGovernance(filters: Filters) {
    const params = buildFilterParams(filters);
    const response = await request(`dashboard/research-governance?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch research governance");
    
    const result = await response.json();
    return result.data;
  },

  // NEW: Get filter options for dropdowns
  async getFilterOptions() {
    const response = await request('dashboard/filter-options');
    if (!response.ok) throw new Error("Failed to fetch filter options");
    
    const result = await response.json();
    return result.data || result;
  },

  // NEW: Search affiliates by name (for the multi-select dropdown)
  async searchAffiliates(searchTerm: string = "", limit: number = 20, affiliateType?: string | string[]) {
    const params = new URLSearchParams();
    params.append('search', searchTerm);
    params.append('limit', limit.toString());
    
    if (affiliateType) {
      if (Array.isArray(affiliateType)) {
        affiliateType.forEach(type => {
          if (type) params.append('affiliate_type[]', type);
        });
      } else {
        params.append('affiliate_type', affiliateType);
      }
    }

    const response = await request(`dashboard/affiliate-names?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to search affiliates");
    
    const result = await response.json();
    return result.data || result;
  },

  async universalSearch(searchTerm: string, searchType: string = 'all', limit: number = 10, filters?: Partial<Filters>) {
    const params = new URLSearchParams();
    params.append('search_term', searchTerm);
    params.append('search_type', searchType);
    params.append('limit', limit.toString());
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          if (Array.isArray(value)) {
            value.forEach(v => {
              if (v) params.append(`${key}[]`, String(v));
            });
          } else {
            params.append(key, String(value));
          }
        }
      });
    }

    const response = await request(`dashboard/search?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to perform universal search");

    const result = await response.json();
    return result.data;
  },

  async quickSearch(searchTerm: string, limit: number = 5) {
    const params = new URLSearchParams();
    params.append('q', searchTerm);
    params.append('limit', limit.toString());

    const response = await request(`dashboard/quick-search?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to perform quick search");

    const result = await response.json();
    return result.data;
  },

  // Keep backward compatibility
  async searchMembers(searchTerm: string, filters?: Partial<Filters>, limit: number = 10) {
    const results = await this.universalSearch(searchTerm, 'members', limit, filters);
    return results.results?.filter((r: any) => r.type === 'member').map((r: any) => r.data) || [];
  },

  async member() {
    const response = await request("dashboard/member");
    if (!response.ok) throw new Error("Failed to fetch dashboard data");

    const result = await response.json();
    return result.data;
  },

  async affiliate() {
    const response = await request("dashboard/affiliate-directory");
    if (!response.ok) throw new Error("Failed to fetch dashboard data");

    const result = await response.json();
    return result.data;
  },
};