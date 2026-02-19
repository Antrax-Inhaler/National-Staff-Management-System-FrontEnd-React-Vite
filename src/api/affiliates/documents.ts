// api/affiliates/documents.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface Document {
  id: number;
  title: string;
  type: 'contract' | 'arbitration' | 'mou' | 'bylaws' | 'research' | 'general';
  category?: string;
  description?: string;
  file_name: string;
  file_path: string;
  file_size: number;
  database_source: 'contracts' | 'arbitrations' | 'mous' | 'research_collection' | 'general';
  is_archived: boolean;
  uploaded_at: string;
  
  contract_expiration_date?: string;
  employer?: string;
  cbc?: string;
  state?: string;
  effective_date?: string;
  status: 'active' | 'expired' | 'negotiation' | 'draft';
  keywords?: string;
  sub_type?: string;
  year?: number;
  is_public: boolean;
  
  affiliate?: {
    id: number;
    name: string;
    code: string;
  };
  uploader?: {
    id: number;
    name: string;
  };
  folder?: {
    id: number;
    name: string;
    parent_id?: number;
  };
}

export interface DocumentFolder {
  id: number;
  name: string;
  parent_id?: number;
  database_source: string;
  children?: DocumentFolder[];
  document_count?: number;
}

// Helper function to get auth token
const getAuthToken = async (): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("No active session - please log in again");
  }
  return session.access_token;
};

export const documentsAPI = {
  async getDocuments(params?: {
    search?: string;
    repository?: string;
    folder_id?: number;
    expiring_soon?: string;
    page?: number;
    per_page?: number;
    [key: string]: any;
  }): Promise<{ data: Document[]; meta: any }> {
    try {
      const token = await getAuthToken();
      
      const urlParams = new URLSearchParams();
      
      // Add all parameters to URL
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            urlParams.append(key, value.toString());
          }
        });
      }

      // Add default pagination if not provided
      if (!params?.page) urlParams.append('page', '1');
      if (!params?.per_page) urlParams.append('per_page', '20');

      const response = await fetch(`${API_BASE_URL}/api/documents?${urlParams.toString()}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed - please log in again");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || "Failed to fetch documents");
      }
      
      return {
        data: result.data || [],
        meta: result.meta || {
          current_page: 1,
          last_page: 1,
          per_page: params?.per_page || 20,
          total: result.data?.length || 0
        }
      };
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  },

  async getDocument(id: number): Promise<Document> {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/documents/${id}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed - please log in again");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      if (!result.success) throw new Error(result.message || "Failed to fetch document");
      
      return result.data;
    } catch (error) {
      console.error('Error fetching document:', error);
      throw error;
    }
  },

  async downloadDocument(id: number): Promise<{ download_url: string; file_name: string }> {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/documents/${id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed - please log in again");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) throw new Error(result.message || "Failed to get download URL");

      return result.data;
    } catch (error) {
      console.error('Error downloading document:', error);
      throw error;
    }
  },

  async getFolders(): Promise<DocumentFolder[]> {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/folders`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed - please log in again");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      if (!result.success) throw new Error(result.message || "Failed to fetch folders");
      
      return result.data || [];
    } catch (error) {
      console.error('Error fetching folders:', error);
      throw error;
    }
  },

  async uploadDocument(formData: FormData): Promise<Document> {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData - let browser set it with boundary
        },
        body: formData,
      });

      const result = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed - please log in again");
        }
        if (response.status === 422 && result.errors) {
          const errorMessages = Object.values(result.errors).flat().join(', ');
          throw new Error(`Validation failed: ${errorMessages}`);
        }
        throw new Error(result.message || "Failed to upload document");
      }
      
      return result.data;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },

  async updateDocument(id: number, data: any): Promise<Document> {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/documents/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed - please log in again");
        }
        if (response.status === 422 && result.errors) {
          const errorMessages = Object.values(result.errors).flat().join(', ');
          throw new Error(`Validation failed: ${errorMessages}`);
        }
        throw new Error(result.message || "Failed to update document");
      }
      
      return result.data;
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  },

  async deleteDocument(id: number): Promise<void> {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/documents/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed - please log in again");
        }
        const result = await response.json();
        throw new Error(result.message || "Failed to delete document");
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }
};