import { request } from "../../lib/apiRequest";

export interface InformationFilter {
  search?: string;
  type?: string[];
  status?: string[];
  published_before?: string;
  published_after?: string;
}

export interface InformationGetParam {
  page: number;
  perPage: number | string;
  filters?: InformationFilter;
}

export interface InformationForm {
  type: 'announcement' | 'policy' | 'report' | 'update';
  title: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
}

export interface UpdateInformationForm extends InformationForm {
  id: number;
}

export interface Information {
  id: number;
  type: 'announcement' | 'policy' | 'report' | 'update';
  title: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface InformationCategory {
  type: string;
  total: number;
}

export interface InformationStats {
  total: number;
  published: number;
  draft: number;
  archived: number;
  announcements: number;
  policies: number;
  reports: number;
  updates: number;
}

export interface BulkActionPayload {
  ids: number[];
  action: 'delete' | 'publish' | 'archive' | 'draft';
}

// Custom fetch for FormData
const fetchWithFormData = async (url: string, formData: FormData, method: string = 'POST') => {
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  
  const headers: HeadersInit = {
    'Accept': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const apiUrl = `${import.meta.env.VITE_API_URL || ''}/api/v1${url}`;
  // console.log('Making request to:', apiUrl);
  // console.log('Method:', method);
  // console.log('Headers:', headers);
  // console.log('FormData entries:', Array.from(formData.entries()));

  try {
    const response = await fetch(apiUrl, {
      method,
      headers,
      body: formData,
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    // First check if response is OK
    if (!response.ok) {
      let errorText = await response.text();
      console.error('Server error response:', errorText);
      
      // Try to parse as JSON first
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.message || `HTTP ${response.status}: ${response.statusText}`);
      } catch {
        // If not JSON, throw with text
        throw new Error(`HTTP ${response.status}: ${response.statusText}. ${errorText.substring(0, 200)}`);
      }
    }

    // Try to get response as text first to debug
    const responseText = await response.text();
    console.log('Response text:', responseText);

    // Try to parse as JSON
    try {
      const result = JSON.parse(responseText);
      console.log('Parsed JSON:', result);
      return result;
    } catch (jsonError) {
      console.error('Failed to parse JSON:', jsonError);
      throw new Error(`Server returned invalid JSON: ${responseText.substring(0, 200)}`);
    }
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

export const information = {
  async all(params: InformationGetParam) {
    const query = new URLSearchParams();
    
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          if (Array.isArray(value)) {
            value.forEach(val => query.append(`${key}[]`, val));
          } else {
            query.set(key, value.toString());
          }
        }
      });
    }

    if (params.page) query.set("page", params.page.toString());
    if (params.perPage) query.set("per_page", params.perPage.toString());

    const response = await request(`information?${query.toString()}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText}. ${errorText}`);
    }
    
    const result = await response.json();

    return {
      items: result.data,
      current_page: result.meta?.current_page || 1,
      last_page: result.meta?.last_page || 1,
      per_page: result.meta?.per_page || (typeof params.perPage === "number" ? params.perPage : 20),
      total: result.meta?.total || result.data.length,
    };
  },

  async categories() {
    const response = await request("information/categories");
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText}. ${errorText}`);
    }
    
    const result = await response.json();

    if (!result.success)
      throw new Error(result.message || "Failed to fetch information categories");

    return result.data;
  },

  async create(payload: InformationForm) {
    console.log("Sending payload to create information:", payload);
    
    try {
      const formData = new FormData();
      
      // Append form data
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      // Log what's being sent
      console.log('FormData to send:');
      formData.forEach((value, key) => {
        console.log(`${key}:`, value);
      });

      const result = await fetchWithFormData('information', formData, 'POST');
      
      console.log("API Response:", result);
      
      if (!result.success) {
        console.error("API Error:", result.message || result.error);
        throw new Error(result.message || "Failed to create information");
      }

      return result.data;
    } catch (error: any) {
      console.error("Create information error:", error);
      throw error;
    }
  },

  async update(payload: UpdateInformationForm) {
    const response = await request(`information/${payload.id}`, {
      method: "PUT",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText}. ${errorText}`);
    }
    
    const result = await response.json();

    if (!result.success)
      throw new Error(result.message || "Failed to update information");

    return result.data;
  },

  async delete(id: number) {
    const response = await request(`information/${id}`, {
      method: "DELETE",
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText}. ${errorText}`);
    }
    
    const result = await response.json();

    if (!result.success)
      throw new Error(result.message || "Failed to delete information");

    return result.data;
  },

  async show(id: number) {
    const response = await request(`information/${id}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText}. ${errorText}`);
    }
    
    const result = await response.json();

    if (!result.success)
      throw new Error(result.message || "Failed to fetch information");

    return result.data;
  },

  async publicAll(params: InformationGetParam) {
    const query = new URLSearchParams();
    
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          if (Array.isArray(value)) {
            value.forEach(val => query.append(`${key}[]`, val));
          } else {
            query.set(key, value.toString());
          }
        }
      });
    }

    if (params.page) query.set("page", params.page.toString());
    if (params.perPage) query.set("per_page", params.perPage.toString());

    const response = await request(`information/public?${query.toString()}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText}. ${errorText}`);
    }
    
    const result = await response.json();

    return {
      items: result.data,
      current_page: result.meta?.current_page || 1,
      last_page: result.meta?.last_page || 1,
      per_page: result.meta?.per_page || (typeof params.perPage === "number" ? params.perPage : 20),
      total: result.meta?.total || result.data.length,
    };
  },

  async publicShow(id: number) {
    const response = await request(`information/public/${id}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText}. ${errorText}`);
    }
    
    const result = await response.json();

    if (!result.success)
      throw new Error(result.message || "Failed to fetch public information");

    return result.data;
  },

  async stats() {
    const response = await request("information/stats");
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText}. ${errorText}`);
    }
    
    const result = await response.json();

    if (!result.success)
      throw new Error(result.message || "Failed to fetch information statistics");

    return result.data;
  },

  async bulkActions(payload: BulkActionPayload) {
    const response = await request("information/bulk-actions", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${response.statusText}. ${errorText}`);
    }
    
    const result = await response.json();

    if (!result.success)
      throw new Error(result.message || "Failed to perform bulk action");

    return result.data;
  },
};

// Alternative export for the public API only
export const publicInformation = {
  async all(params: InformationGetParam) {
    return information.publicAll(params);
  },

  async show(id: number) {
    return information.publicShow(id);
  },

  async categories() {
    return information.categories();
  },

  async stats() {
    return information.stats();
  },
};