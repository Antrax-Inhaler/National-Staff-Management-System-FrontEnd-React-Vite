// services/affiliateImport.ts
import { request } from '../../lib/apiRequest';

export interface AffiliateRecord {
  old_affiliate_name?: string;
  new_affiliate_name: string;
  state?: string;
  employer?: string;
  type?: string;
  region?: string | number;
  cbc?: string;
}

export interface ImportResult {
  success: boolean;
  message: string;
  data: {
    total_rows: number;
    processed: number;
    created: number;
    updated: number;
    skipped: number;
    errors: Array<{
      row: number;
      message: string;
      data?: AffiliateRecord;
    }>;
    affiliates: Array<{
      row: number;
      affiliate_id: number | string;
      name: string;
      action: 'created' | 'updated' | 'skipped';
      reason?: string;
      state?: string;
      employer_name?: string;
      affiliate_type?: string;
      ORG_region?: string | number;
      cbc_region?: string;
    }>;
  };
}

export interface ImportOptions {
  skip_duplicates: boolean;
  update_existing: boolean;
}

export const affiliateImport = {
  // Bulk import affiliates
async bulkImport(file: File, options: ImportOptions): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('csv_file', file);
    
    // Send as booleans (not strings)
    formData.append('skip_duplicates', options.skip_duplicates ? '1' : '0');
    formData.append('update_existing', options.update_existing ? '1' : '0');

    const response = await request('affiliate-import/bulk', {
      method: 'POST',
      body: formData,
    });

    const text = await response.text();
    if (!text) {
      throw new Error('Empty response from server');
    }

    const result = JSON.parse(text);

    if (!response.ok) {
      console.error('Import failed:', result);
      throw new Error(result.message || 'Import failed');
    }

    return result;
  },

  // Get template info
  async getTemplateInfo() {
    const response = await request('affiliate-import/template', {
      method: 'GET',
    });

    const text = await response.text();
    if (!text) {
      throw new Error('Empty response from server');
    }

    const result = JSON.parse(text);

    if (!response.ok) {
      throw new Error(result.message || 'Failed to get template info');
    }

    return result;
  },

  // Download template
  async downloadTemplate() {
    const response = await request('affiliate-import/download-template', {
      method: 'GET',
    });

    if (!response.ok) {
      const text = await response.text();
      let errorMessage = 'Failed to download template';
      
      if (text) {
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = text;
        }
      }
      
      throw new Error(errorMessage);
    }

    // Create blob and download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'affiliates-import-template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};