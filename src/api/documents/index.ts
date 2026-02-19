import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Rename interfaces to avoid conflicts
export interface DocumentData {
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

export const documentsAPI = {
  async getDocuments(params?: {
    search?: string;
    repository?: string;
    folder_id?: number;
    expiring_soon?: string;
    page?: number;
    per_page?: number;
    [key: string]: any;
  }): Promise<{ data: DocumentData[]; meta: any }> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No active session");

    const token = session.access_token;
    const urlParams = new URLSearchParams();
    
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        urlParams.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/api/documents?${urlParams.toString()}`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Failed to fetch documents");
    
    return {
      data: result.data,
      meta: result.meta
    };
  },

  async getDocument(id: number): Promise<DocumentData> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No active session");

    const token = session.access_token;
    const response = await fetch(`${API_BASE_URL}/api/documents/${id}`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Failed to fetch document");
    
    return result.data;
  },

  async downloadDocument(id: number): Promise<{ download_url: string; file_name: string }> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No active session");

    const token = session.access_token;
    const response = await fetch(`${API_BASE_URL}/api/documents/${id}/download`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Failed to get download URL");
    
    return result.data;
  },

  async uploadDocument(formData: FormData): Promise<DocumentData> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No active session");

    const token = session.access_token;
    const response = await fetch(`${API_BASE_URL}/api/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || "Failed to upload document");
    }
    
    return result.data;
  },

  async updateDocument(id: number, data: any): Promise<DocumentData> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No active session");

    const token = session.access_token;
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
      throw new Error(result.message || "Failed to update document");
    }
    
    return result.data;
  },

  async deleteDocument(id: number): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No active session");

    const token = session.access_token;
    const response = await fetch(`${API_BASE_URL}/api/documents/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || "Failed to delete document");
    }
  }
};