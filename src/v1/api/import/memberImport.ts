import { request } from '../../lib/apiRequest';

export interface ImportJob {
  id: string;
  filename: string;
  status: 'pending' | 'processing' | 'paused' | 'completed' | 'failed' | 'stopped';
  total_rows: number;
  processed_rows: number;
  success_rows: number;
  failed_rows: number;
  total_chunks: number;
  processed_chunks: number;
  chunk_size: number;
  progress_percentage: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  duration: number | null;
  has_errors: boolean;
  created_rows?: number;
  updated_rows?: number;
  skipped_rows?: number;
}

export interface ImportedDataRow {
  id?: string;
  row_index: number;
  data: Record<string, any>;
  action: 'created' | 'updated' | 'skipped' | 'failed';
  status: 'success' | 'error' | 'warning';
  errors?: string[];
  message?: string;
  original_data?: Record<string, any>;
  created_record?: {
    id: string;
    type: string;
    [key: string]: any;
  };
  chunk_index: number;
  import_id: string;
  processed_at?: string;
}

export interface ImportDataView {
  rows: ImportedDataRow[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_rows: number;
    per_page: number;
  };
  summary: {
    total: number;
    created: number;
    updated: number;
    skipped: number;
    failed: number;
  };
  filters: {
    action?: string;
    status?: string;
    has_errors?: boolean;
    chunk_index?: number;
  };
}

export interface ImportDetail {
  import: ImportJob;
  chunks: Array<{
    chunk_index: number;
    status: string;
    total_rows: number;
    processed_rows: number;
    success_rows: number;
    failed_rows: number;
    start_row: number;
    end_row: number;
    started_at: string | null;
    completed_at: string | null;
    processing_duration: number | null;
    has_errors: boolean;
  }>;
  statistics: {
    chunk_status_summary: {
      completed: number;
      failed: number;
      pending: number;
      processing: number;
    };
    performance_metrics: {
      average_chunk_time_seconds: number;
      total_processing_time_seconds: number;
      rows_per_second: number;
    };
    success_rates: {
      row_success_rate: number;
      chunk_success_rate: number;
    };
  };
  timeline: Array<{
    event: string;
    timestamp: string;
    details: string;
  }>;
}

export interface ImportStatisticsResponse {
  success: boolean;
  data: {
    import: {
      id: string;
      filename: string;
      status: string;
      total_rows: number;
      processed_rows: number;
      success_rows: number;
      failed_rows: number;
      created_rows?: number;
      updated_rows?: number;
      skipped_rows?: number;
    };
    actions_summary: {
      created: number;
      updated: number;
      skipped: number;
      failed: number;
    };
    chunks_summary: {
      total: number;
      completed: number;
      pending: number;
      processing: number;
      failed: number;
    };
  };
}

export interface ImportProgressResponse {
  success: boolean;
  data: {
    import_id: string;
    status: string;
    progress: {
      total_rows: number;
      processed_rows: number;
      success_rows: number;
      failed_rows: number;
      created_rows: number;
      updated_rows: number;
      skipped_rows: number;
      progress_percentage: number;
      remaining_rows: number;
    };
    estimated_time_remaining: string | null;
    is_completed: boolean;
    is_failed: boolean;
    is_stopped: boolean;
    timestamp: string;
  };
}

interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    import_id: string;
    filename: string;
    total_rows: number;
    chunks: number;
    chunk_size: number;
    status: string;
    estimated_time: string;
    created_at: string;
    progress_data?: {
      total_rows: number;
      processed_rows: number;
      success_rows: number;
      failed_rows: number;
      created_rows: number;
      updated_rows: number;
      skipped_rows: number;
      progress_percentage: number;
      remaining_rows: number;
    };
    analysis_summary?: {
      total_rows: number;
      valid_rows: number;
      invalid_rows: number;
      header: string[];
      validation_mode: string;
      note: string;
    };
  };
}

interface ControlResponse {
  success: boolean;
  message: string;
  data: {
    import_id: string;
    status: string;
    [key: string]: any;
  };
}

interface GetImportDataResponse {
  success: boolean;
  data: ImportDataView;
}

interface SearchImportDataResponse {
  success: boolean;
  data: {
    results: ImportedDataRow[];
    total: number;
    search_term: string;
  };
}

interface UserImportsResponse {
  success: boolean;
  data: {
    imports: ImportJob[];
    total: number;
  };
}

interface ImportStatusResponse {
  success: boolean;
  data: ImportDetail;
}

interface ClearImportResponse {
  success: boolean;
  message: string;
}

export const csvImport = {
  // Upload CSV file (starts async processing)
  async uploadCsv(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('csv_file', file);

    const response = await request('csv-import/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Upload failed:', result);
      throw new Error(result.message || 'Upload failed');
    }

    return result;
  },

  // Get import status and details
  async getImportStatus(importId: string): Promise<ImportStatusResponse> {
    const response = await request(`csv-import/status/${importId}`, {
      method: 'GET',
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Failed to get import status:', result);
      throw new Error(result.message || 'Failed to get import status');
    }

    return result;
  },

  // Get all user imports
  async getUserImports(): Promise<UserImportsResponse> {
    const response = await request('csv-import/user-imports', {
      method: 'GET',
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Failed to get user imports:', result);
      throw new Error(result.message || 'Failed to get imports');
    }

    return result;
  },

  // Pause import
  async pauseImport(importId: string): Promise<ControlResponse> {
    const response = await request(`csv-import/pause/${importId}`, {
      method: 'POST',
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Failed to pause import:', result);
      throw new Error(result.message || 'Failed to pause import');
    }

    return result;
  },

  // Resume import
  async resumeImport(importId: string): Promise<ControlResponse> {
    const response = await request(`csv-import/resume/${importId}`, {
      method: 'POST',
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Failed to resume import:', result);
      throw new Error(result.message || 'Failed to resume import');
    }

    return result;
  },

  // Stop import
  async stopImport(importId: string): Promise<ControlResponse> {
    const response = await request(`csv-import/stop/${importId}`, {
      method: 'POST',
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Failed to stop import:', result);
      throw new Error(result.message || 'Failed to stop import');
    }

    return result;
  },

  // Download template
  async downloadTemplate() {
    const response = await request('csv-import/template', {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to download template');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'members-upload-template-limited.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // Get import data with pagination and filtering
  async getImportData(importId: string, filters: any = {}): Promise<GetImportDataResponse> {
    const params = new URLSearchParams();
    
    // Add pagination
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.per_page) params.append('per_page', filters.per_page.toString());
    
    // Add filters
    if (filters.action) params.append('action', filters.action);
    if (filters.status) params.append('status', filters.status);
    if (filters.has_errors !== undefined) params.append('has_errors', filters.has_errors.toString());
    if (filters.chunk_index) params.append('chunk_index', filters.chunk_index.toString());
    if (filters.search) params.append('search', filters.search);
    
    const response = await request(`csv-import/${importId}/data?${params.toString()}`, {
      method: 'GET',
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Failed to get import data:', result);
      throw new Error(result.message || 'Failed to get import data');
    }

    return result;
  },

  // Search import data
  async searchImportData(importId: string, searchTerm: string, filters: any = {}): Promise<SearchImportDataResponse> {
    const response = await request(`csv-import/${importId}/data/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        search_term: searchTerm,
        ...filters,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Failed to search import data:', result);
      throw new Error(result.message || 'Failed to search import data');
    }

    return result;
  },

  // Export import data
  async exportImportData(importId: string, action: string | null = null): Promise<Response> {
    const params = new URLSearchParams();
    if (action) params.append('action', action);
    
    const response = await request(`csv-import/${importId}/data/export?${params.toString()}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to export data');
    }

    return response;
  },

  // Get import statistics
  async getImportStatistics(importId: string): Promise<ImportStatisticsResponse> {
    const response = await request(`csv-import/${importId}/statistics`, {
      method: 'GET',
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Failed to get import statistics:', result);
      throw new Error(result.message || 'Failed to get import statistics');
    }

    return result;
  },

  // Get data by action
  async getImportDataByAction(importId: string, action: string, page = 1, perPage = 20): Promise<GetImportDataResponse> {
    const params = new URLSearchParams({
      action,
      page: page.toString(),
      per_page: perPage.toString(),
    });
    
    const response = await request(`csv-import/${importId}/data/action/${action}?${params.toString()}`, {
      method: 'GET',
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Failed to get import data by action:', result);
      throw new Error(result.message || 'Failed to get import data');
    }

    return result;
  },

  // Download exported data
  async downloadExportedData(importId: string, action: string | null = null) {
    const response = await this.exportImportData(importId, action);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to export data');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-');
    const filename = action 
      ? `import-${importId}-${action}-${timestamp}.csv`
      : `import-${importId}-all-data-${timestamp}.csv`;
    
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    return { success: true, filename };
  },

  // Get import summary
  async getImportSummary(importId: string) {
    const response = await request(`csv-import/status/${importId}`, {
      method: 'GET',
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Failed to get import summary:', result);
      throw new Error(result.message || 'Failed to get import summary');
    }

    return result;
  },

  // Clear import data (optional - if you implement this in backend)
  async clearImportData(importId: string): Promise<ClearImportResponse> {
    const response = await request(`csv-import/${importId}/data/clear`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Failed to clear import data:', result);
      throw new Error(result.message || 'Failed to clear import data');
    }

    return result;
  },

  // Get import progress (new endpoint you might need to add to backend)
  async getImportProgress(importId: string): Promise<ImportProgressResponse> {
    const response = await request(`csv-import/${importId}/progress`, {
      method: 'GET',
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Failed to get import progress:', result);
      throw new Error(result.message || 'Failed to get import progress');
    }

    return result;
  },
};

export default csvImport;