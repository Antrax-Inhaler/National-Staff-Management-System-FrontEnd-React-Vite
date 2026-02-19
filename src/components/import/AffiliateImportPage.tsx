import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  FileText, 
  Download, 
  RefreshCw,
  X,
  Building,
  MapPin,
  Briefcase,
  Tag,
  Hash,
  Globe,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Loader2,
  Database,
  Settings,
  Eye,
  ClipboardCheck,
  UserCheck,
  UserX,
  AlertTriangle,
  Info,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { affiliateImport, type ImportResult, type ImportOptions } from '../../v1/api/import/affiliateImport';

type ImportStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';
type ViewMode = 'upload' | 'preview' | 'results';
type AffiliateType = 'Associate' | 'Professional' | 'Wall-to-wall' | null;

interface AffiliateRecord {
  old_affiliate_name?: string;
  new_affiliate_name: string;
  state?: string;
  employer?: string;
  type?: AffiliateType;
  region?: string | number;
  cbc?: string;
}

const AffiliateImportPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [viewMode, setViewMode] = useState<ViewMode>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [importData, setImportData] = useState<AffiliateRecord[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importOptions, setImportOptions] = useState({
    skipDuplicates: true,
    updateExisting: true,
  });
  const [previewData, setPreviewData] = useState<AffiliateRecord[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<'all' | 'created' | 'updated' | 'skipped'>('all');
  const [showErrors, setShowErrors] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      
      // Validate file type
      if (!selectedFile.name.toLowerCase().endsWith('.csv') && 
          selectedFile.type !== 'text/csv') {
        toast.error('Please upload a CSV file');
        return;
      }

      // Validate file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      setFile(selectedFile);
      setStatus('idle');
      setImportResult(null);
      
      // Read and preview the file
      readAndPreviewFile(selectedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.csv']
    },
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    multiple: false,
    disabled: status === 'uploading' || status === 'processing'
  });

  const readAndPreviewFile = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split('\n');
      
      if (lines.length < 2) {
        toast.error('CSV file is empty');
        return;
      }

      // Parse headers
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      // Parse data rows
      const data: AffiliateRecord[] = [];
      for (let i = 1; i < Math.min(lines.length, 11); i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const record: AffiliateRecord = {
          new_affiliate_name: values[headers.indexOf('NEW AFFILIATE NAME')] || 
                              values[headers.indexOf('New Affiliate Name')] || 
                              values[headers.indexOf('new_affiliate_name')] || '',
        };
        
        // Map other fields if they exist
        const oldNameIdx = headers.findIndex(h => 
          h.toUpperCase().includes('OLD') && h.toUpperCase().includes('NAME')
        );
        if (oldNameIdx !== -1) record.old_affiliate_name = values[oldNameIdx];
        
        const stateIdx = headers.findIndex(h => 
          h.toUpperCase() === 'STATE'
        );
        if (stateIdx !== -1) record.state = values[stateIdx];
        
        const employerIdx = headers.findIndex(h => 
          h.toUpperCase() === 'EMPLOYER'
        );
        if (employerIdx !== -1) record.employer = values[employerIdx];
        
        const typeIdx = headers.findIndex(h => 
          h.toUpperCase() === 'TYPE'
        );
        if (typeIdx !== -1) record.type = values[typeIdx] as AffiliateType;
        
        const regionIdx = headers.findIndex(h => 
          h.toUpperCase() === 'REGION'
        );
        if (regionIdx !== -1) record.region = values[regionIdx];
        
        const cbcIdx = headers.findIndex(h => 
          h.toUpperCase() === 'CBC'
        );
        if (cbcIdx !== -1) record.cbc = values[cbcIdx];
        
        data.push(record);
      }
      
      setPreviewData(data);
      setViewMode('preview');
      
    } catch (error) {
      toast.error('Failed to read CSV file');
      coOrganizationle.error('File read error:', error);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    try {
      setStatus('uploading');
      
      const options: ImportOptions = {
        skip_duplicates: importOptions.skipDuplicates,
        update_existing: importOptions.updateExisting,
      };

      const result = await affiliateImport.bulkImport(file, options);

      setStatus('success');
      setImportResult(result);
      setViewMode('results');
      toast.success(`Import completed! ${result.data.created} created, ${result.data.updated} updated.`);

    } catch (error: any) {
      setStatus('error');
      toast.error(error.message || 'Import failed. Please try again.');
      coOrganizationle.error('Import error:', error);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await affiliateImport.downloadTemplate();
      toast.success('Template downloaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to download template');
    }
  };

  const clearFile = () => {
    setFile(null);
    setStatus('idle');
    setImportResult(null);
    setPreviewData([]);
    setViewMode('upload');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const toggleRowExpansion = (rowNumber: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowNumber)) {
      newExpanded.delete(rowNumber);
    } else {
      newExpanded.add(rowNumber);
    }
    setExpandedRows(newExpanded);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created': return 'bg-green-100 text-green-800';
      case 'updated': return 'bg-blue-100 text-blue-800';
      case 'skipped': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created': return <UserCheck className="text-green-600" size={16} />;
      case 'updated': return <RefreshCw className="text-blue-600" size={16} />;
      case 'skipped': return <UserX className="text-yellow-600" size={16} />;
      default: return null;
    }
  };

  // Filter results based on search and filter
  const filteredResults = importResult?.data.affiliates.filter(aff => {
    // Apply action filter
    if (filterAction !== 'all' && aff.action !== filterAction) return false;
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        aff.name.toLowerCase().includes(searchLower) ||
        aff.state?.toLowerCase().includes(searchLower) ||
        aff.employer_name?.toLowerCase().includes(searchLower) ||
        aff.affiliate_type?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  }) || [];

  return (
    <div className="min-h-screen md:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col justify-between gap-4 mb-6 md:flex-row md:items-center">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
                <Building className="text-blue-600" size={32} />
                Affiliate Bulk Import
              </h1>
              <p className="mt-2 text-gray-600">
                Import affiliates from CSV file. Match existing affiliates by old name or create new ones.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 px-4 py-3 font-medium text-blue-600 transition-all duration-200 bg-white border-2 border-blue-600 rounded-lg shadow-sm hover:bg-blue-50"
              >
                <Download size={18} />
                Download Template
              </button>
              
              <button
                onClick={() => setShowErrors(!showErrors)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 font-medium shadow-sm ${
                  showErrors 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-white border-2 border-red-600 text-red-600 hover:bg-red-50'
                }`}
              >
                <AlertTriangle size={18} />
                {showErrors ? 'Hide Errors' : 'Show Errors'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column: Upload & Options */}
          <div className="space-y-6 lg:col-span-1">
            {/* File Upload Area */}
            <div className="overflow-hidden bg-white border border-gray-200 shadow-xl rounded-2xl">
              <div className="p-6">
                <h2 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-900">
                  <Upload size={20} className="text-blue-600" />
                  Upload CSV File
                </h2>
                
                <div
                  {...getRootProps()}
                  className={`border-3 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                    isDragActive || isDragging
                      ? 'border-blue-500 bg-blue-50 scale-[1.02]'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                  } ${status === 'uploading' || status === 'processing' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input {...getInputProps()} />
                  
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-blue-100 to-blue-200">
                      <Upload size={24} className="text-blue-600" />
                    </div>
                    
                    {isDragActive ? (
                      <p className="text-lg font-medium text-blue-600">Drop the CSV file here...</p>
                    ) : file ? (
                      <>
                        <FileText size={48} className="mb-3 text-green-600" />
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="mt-1 text-sm text-gray-500">
                          {formatFileSize(file.size)} • CSV
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-lg font-medium text-gray-700">Drag & drop your CSV file here</p>
                        <p className="mt-2 text-gray-500">or click to browse</p>
                        <p className="mt-4 text-xs text-gray-400">Supports .csv files up to 10MB</p>
                        <p className="text-xs text-gray-400">Template includes matching by old names</p>
                      </>
                    )}
                  </div>
                </div>
                
                {file && (
                  <div className="flex items-center justify-between p-3 mt-4 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <FileText size={20} className="text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={clearFile}
                      className="p-2 text-gray-400 transition-colors rounded-lg hover:text-red-600 hover:bg-red-50"
                    >
                      <X size={20} />
                    </button>
                  </div>
                )}
              </div>
              
              {/* Import Options */}
              <div className="p-6 border-t border-gray-200">
                <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-900">
                  <Settings size={20} className="text-blue-600" />
                  Import Options
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-lg">
                        <UserX className="text-yellow-600" size={16} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Skip Duplicates</p>
                        <p className="text-sm text-gray-500">Skip rows where affiliate already exists</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setImportOptions(prev => ({ 
                        ...prev, 
                        skipDuplicates: !prev.skipDuplicates 
                      }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        importOptions.skipDuplicates ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        importOptions.skipDuplicates ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                        <RefreshCw className="text-blue-600" size={16} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Update Existing</p>
                        <p className="text-sm text-gray-500">Update matching affiliates with new data</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setImportOptions(prev => ({ 
                        ...prev, 
                        updateExisting: !prev.updateExisting 
                      }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        importOptions.updateExisting ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        importOptions.updateExisting ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
                
                <div className="mt-6 space-y-3">
                  <button
                    onClick={handleImport}
                    disabled={!file || status === 'uploading' || status === 'processing'}
                    className="flex items-center justify-center w-full gap-2 px-6 py-3 font-medium text-white transition-all duration-200 rounded-lg shadow-md bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
                  >
                    {status === 'uploading' || status === 'processing' ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Database size={20} />
                        Import Affiliates
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            {importResult && (
              <div className="p-6 bg-white border border-gray-200 shadow-xl rounded-2xl">
                <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-900">
                  <BarChart3 size={20} className="text-blue-600" />
                  Import Summary
                </h3>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                      <p className="text-2xl font-bold text-green-700">{importResult.data.created}</p>
                      <p className="text-sm text-green-600">Created</p>
                    </div>
                    <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                      <p className="text-2xl font-bold text-blue-700">{importResult.data.updated}</p>
                      <p className="text-sm text-blue-600">Updated</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                      <p className="text-2xl font-bold text-yellow-700">{importResult.data.skipped}</p>
                      <p className="text-sm text-yellow-600">Skipped</p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <p className="text-2xl font-bold text-gray-700">{importResult.data.total_rows}</p>
                      <p className="text-sm text-gray-600">Total Rows</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Success Rate</span>
                      <span className="font-bold text-green-600">
                        {importResult.data.total_rows > 0 
                          ? `${Math.round((importResult.data.processed / importResult.data.total_rows) * 100)}%`
                          : '0%'
                        }
                      </span>
                    </div>
                    <div className="w-full h-2 mt-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-2 bg-green-500 rounded-full"
                        style={{ 
                          width: `${importResult.data.total_rows > 0 
                            ? (importResult.data.processed / importResult.data.total_rows) * 100 
                            : 0
                          }%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Main Content */}
          <div className="lg:col-span-2">
            {/* Navigation Tabs */}
            <div className="mb-6 overflow-hidden bg-white border border-gray-200 shadow-xl rounded-2xl">
              <div className="border-b border-gray-200">
                <nav className="flex overflow-x-auto">
                  <button
                    onClick={() => setViewMode('upload')}
                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                      viewMode === 'upload'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <Upload size={18} />
                    Upload
                  </button>
                  <button
                    onClick={() => setViewMode('preview')}
                    disabled={!file}
                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                      viewMode === 'preview'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    } ${!file ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Eye size={18} />
                    Preview
                  </button>
                  <button
                    onClick={() => setViewMode('results')}
                    disabled={!importResult}
                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                      viewMode === 'results'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    } ${!importResult ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <ClipboardCheck size={18} />
                    Results
                  </button>
                </nav>
              </div>
            </div>

            {/* Content Area */}
            <div className="overflow-hidden bg-white border border-gray-200 shadow-xl rounded-2xl">
              {viewMode === 'upload' && !file && (
                <div className="p-12 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-blue-200">
                      <Building size={40} className="text-blue-600" />
                    </div>
                    <h3 className="mb-3 text-xl font-bold text-gray-900">
                      Import Affiliates from CSV
                    </h3>
                    <p className="mb-6 text-gray-600">
                      Upload a CSV file to bulk import affiliates. Use our template for proper formatting and old name matching.
                    </p>
                    
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="p-4 rounded-lg bg-blue-50">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full">
                          <FileSpreadsheet className="text-blue-600" size={24} />
                        </div>
                        <p className="font-medium text-gray-900">CSV Format</p>
                        <p className="mt-1 text-sm text-gray-600">Download our template for correct columns</p>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-green-50">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-green-100 rounded-full">
                          <Database className="text-green-600" size={24} />
                        </div>
                        <p className="font-medium text-gray-900">Smart Matching</p>
                        <p className="mt-1 text-sm text-gray-600">Match by old names or create new affiliates</p>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-purple-50">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-purple-100 rounded-full">
                          <Settings className="text-purple-600" size={24} />
                        </div>
                        <p className="font-medium text-gray-900">Flexible Options</p>
                        <p className="mt-1 text-sm text-gray-600">Skip duplicates or update existing records</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {viewMode === 'preview' && previewData.length > 0 && (
                <div className="p-6">
                  <h3 className="mb-6 text-xl font-bold text-gray-900">CSV Preview (First 10 Rows)</h3>
                  
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                            Old Name
                          </th>
                          <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                            New Name
                          </th>
                          <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                            State
                          </th>
                          <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                            Type
                          </th>
                          <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                            Region
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {previewData.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {row.old_affiliate_name || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {row.new_affiliate_name}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {row.state || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                row.type === 'Associate' ? 'bg-green-100 text-green-800' :
                                row.type === 'Professional' ? 'bg-blue-100 text-blue-800' :
                                row.type === 'Wall-to-wall' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {row.type || 'Not specified'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {row.region || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-500">
                      Showing {previewData.length} rows • {file?.name}
                    </div>
                    <button
                      onClick={handleImport}
                      disabled={status === 'uploading' || status === 'processing'}
                      className="flex items-center gap-2 px-4 py-2 text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {status === 'uploading' || status === 'processing' ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Database size={16} />
                          Start Import
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {viewMode === 'results' && importResult && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Import Results</h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {status === 'success' ? 'COMPLETED' : 'FAILED'}
                      </span>
                      {importResult.data.errors.length > 0 && (
                        <span className="px-3 py-1 text-sm font-medium text-red-800 bg-red-100 rounded-full">
                          {importResult.data.errors.length} ERROR(S)
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Results Filters */}
                  <div className="flex flex-col gap-3 mb-6 sm:flex-row">
                    <div className="relative flex-1">
                      <Search className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" size={20} />
                      <input
                        type="text"
                        placeholder="Search affiliates..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setFilterAction('all')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          filterAction === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setFilterAction('created')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          filterAction === 'created'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Created
                      </button>
                      <button
                        onClick={() => setFilterAction('updated')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          filterAction === 'updated'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Updated
                      </button>
                      <button
                        onClick={() => setFilterAction('skipped')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          filterAction === 'skipped'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Skipped
                      </button>
                    </div>
                  </div>
                  
                  {/* Results List */}
                  <div className="space-y-3">
                    {filteredResults.map((affiliate) => (
                      <div key={affiliate.row} className="overflow-hidden border border-gray-200 rounded-xl">
                        <div className="p-4 transition-colors cursor-pointer hover:bg-gray-50" onClick={() => toggleRowExpansion(affiliate.row)}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getActionColor(affiliate.action)}`}>
                                {getActionIcon(affiliate.action)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{affiliate.name}</p>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getActionColor(affiliate.action)}`}>
                                    {affiliate.action.toUpperCase()}
                                  </span>
                                  {affiliate.reason && (
                                    <span className="text-xs text-gray-500">{affiliate.reason}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="font-medium text-gray-900">Row {affiliate.row}</p>
                                <p className="text-sm text-gray-500">ID: {affiliate.affiliate_id}</p>
                              </div>
                              {expandedRows.has(affiliate.row) ? (
                                <ChevronUp size={20} className="text-gray-400" />
                              ) : (
                                <ChevronDown size={20} className="text-gray-400" />
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {expandedRows.has(affiliate.row) && (
                          <div className="p-4 border-t border-gray-200 bg-gray-50">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <div className="space-y-3">
                                <div>
                                  <p className="mb-1 text-xs font-medium text-gray-500">AFFILIATE DETAILS</p>
                                  <div className="space-y-2">
                                    {affiliate.state && (
                                      <div className="flex items-center gap-2">
                                        <MapPin size={16} className="text-gray-400" />
                                        <span className="text-sm">State: {affiliate.state}</span>
                                      </div>
                                    )}
                                    {affiliate.employer_name && (
                                      <div className="flex items-center gap-2">
                                        <Briefcase size={16} className="text-gray-400" />
                                        <span className="text-sm">Employer: {affiliate.employer_name}</span>
                                      </div>
                                    )}
                                    {affiliate.affiliate_type && (
                                      <div className="flex items-center gap-2">
                                        <Tag size={16} className="text-gray-400" />
                                        <span className="text-sm">Type: {affiliate.affiliate_type}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <div>
                                  <p className="mb-1 text-xs font-medium text-gray-500">REGIONS</p>
                                  <div className="space-y-2">
                                    {affiliate.Organization_region && (
                                      <div className="flex items-center gap-2">
                                        <Hash size={16} className="text-gray-400" />
                                        <span className="text-sm">Organization Region: {affiliate.Organization_region}</span>
                                      </div>
                                    )}
                                    {affiliate.cbc_region && (
                                      <div className="flex items-center gap-2">
                                        <Globe size={16} className="text-gray-400" />
                                        <span className="text-sm">CBC Region: {affiliate.cbc_region}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {filteredResults.length === 0 && (
                      <div className="py-12 text-center">
                        <Filter size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">No results match your filters</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Errors Section */}
                  {showErrors && importResult.data.errors.length > 0 && (
                    <div className="mt-8">
                      <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="text-red-600" size={20} />
                        <h4 className="text-lg font-semibold text-gray-900">Import Errors</h4>
                        <span className="px-2 py-1 text-sm text-red-800 bg-red-100 rounded-full">
                          {importResult.data.errors.length} error(s)
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        {importResult.data.errors.map((error, index) => (
                          <div key={index} className="p-4 border border-red-200 rounded-xl bg-red-50">
                            <div className="flex items-start gap-3">
                              <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 bg-red-100 rounded-full">
                                <span className="font-bold text-red-600">{error.row}</span>
                              </div>
                              <div className="flex-1">
                                <p className="mb-1 font-medium text-gray-900">Row {error.row}: {error.message}</p>
                                {error.data && (
                                  <div className="p-3 mt-3 bg-white rounded-lg">
                                    <p className="mb-2 text-xs font-medium text-gray-500">DATA:</p>
                                    <div className="grid grid-cols-2 gap-2">
                                      {Object.entries(error.data).map(([key, value]) => (
                                        <div key={key} className="text-sm">
                                          <span className="text-gray-600">{key}:</span>{' '}
                                          <span className="font-medium">{String(value) || 'N/A'}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="p-6 mt-8 bg-white border border-gray-200 shadow-xl rounded-2xl">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">How Affiliate Import Works</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
              <div className="flex items-center justify-center w-10 h-10 mb-3 bg-blue-200 rounded-lg">
                <FileSpreadsheet className="text-blue-600" size={20} />
              </div>
              <p className="mb-2 font-medium text-gray-900">1. Prepare CSV</p>
              <p className="text-sm text-gray-600">Use our template with old and new affiliate names</p>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
              <div className="flex items-center justify-center w-10 h-10 mb-3 bg-green-200 rounded-lg">
                <Database className="text-green-600" size={20} />
              </div>
              <p className="mb-2 font-medium text-gray-900">2. Smart Matching</p>
              <p className="text-sm text-gray-600">System matches by old names to rename existing affiliates</p>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl">
              <div className="flex items-center justify-center w-10 h-10 mb-3 bg-yellow-200 rounded-lg">
                <Settings className="text-yellow-600" size={20} />
              </div>
              <p className="mb-2 font-medium text-gray-900">3. Configure Options</p>
              <p className="text-sm text-gray-600">Choose to skip duplicates or update existing records</p>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
              <div className="flex items-center justify-center w-10 h-10 mb-3 bg-purple-200 rounded-lg">
                <ClipboardCheck className="text-purple-600" size={20} />
              </div>
              <p className="mb-2 font-medium text-gray-900">4. Review Results</p>
              <p className="text-sm text-gray-600">See detailed results with actions taken for each row</p>
            </div>
          </div>
          
          {/* CSV Format Guide */}
          <div className="p-4 mt-6 rounded-lg bg-gray-50">
            <div className="flex items-start gap-3">
              <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="mb-2 font-medium text-blue-800">CSV Format Requirements</p>
                <div className="grid grid-cols-1 gap-2 text-sm text-gray-700 md:grid-cols-2">
                  <div>
                    <span className="font-medium">OLD AFFILIATE NAME:</span> Optional, for matching existing affiliates
                  </div>
                  <div>
                    <span className="font-medium">NEW AFFILIATE NAME:</span> Required, new name for affiliate
                  </div>
                  <div>
                    <span className="font-medium">TYPE:</span> Associate, Professional, or Wall-to-wall
                  </div>
                  <div>
                    <span className="font-medium">REGION:</span> Number (3, 4, 6, 7) - saved as-is
                  </div>
                  <div>
                    <span className="font-medium">CBC:</span> Text (South, West, Cooridor)
                  </div>
                  <div>
                    <span className="font-medium">STATE/EMPLOYER:</span> Optional text fields
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AffiliateImportPage;