import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Download, 
  Users, 
  RefreshCw,
  X,
  Eye,
  Search,
  Loader2,
  Play,
  Pause,
  StopCircle,
  Activity,
  AlertTriangle,
  History,
  ChevronLeft,
  Download as DownloadIcon,
  Table,
  CloudUpload,
  FileBarChart
} from 'lucide-react';
import { csvImport, type ImportJob, type ImportDataView, type ImportDetail, type ImportStatisticsResponse } from '../../v1/api/import/memberImport';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

type ImportStatus = 'idle' | 'uploading' | 'pending' | 'processing' | 'paused' | 'completed' | 'failed' | 'stopped';
type ViewMode = 'summary' | 'progress' | 'details' | 'errors' | 'history' | 'data';
type ActionFilter = 'all' | 'created' | 'updated' | 'skipped' | 'failed';

const CsvImportUI: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('summary');
  const [imports, setImports] = useState<ImportJob[]>([]);
  const [selectedImport, setSelectedImport] = useState<ImportJob | null>(null);
  const [importDetail, setImportDetail] = useState<ImportDetail | null>(null);
  const [importData, setImportData] = useState<ImportDataView | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all');
  const [chunkFilter, setChunkFilter] = useState<number | null>(null);
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [importStatistics, setImportStatistics] = useState<ImportStatisticsResponse['data'] | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    const validTypes = ['text/csv', 'text/plain'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }
    
    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
    
    setSelectedFile(file);
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a CSV file first');
      return;
    }
    
    setIsLoading(true);

    try {
      const result = await csvImport.uploadCsv(selectedFile);
      
      toast.success('CSV upload started successfully!');
      
      // Map the response to ImportJob type
      const newImportJob: ImportJob = {
        id: result.data.import_id,
        filename: result.data.filename,
        status: result.data.status as ImportJob['status'],
        total_rows: result.data.total_rows,
        processed_rows: result.data.progress_data?.processed_rows || 0,
        success_rows: result.data.progress_data?.success_rows || 0,
        failed_rows: result.data.progress_data?.failed_rows || 0,
        total_chunks: result.data.chunks,
        processed_chunks: 0,
        chunk_size: result.data.chunk_size,
        progress_percentage: result.data.progress_data?.progress_percentage || 0,
        created_at: result.data.created_at,
        started_at: null,
        completed_at: null,
        duration: null,
        has_errors: false,
        created_rows: result.data.progress_data?.created_rows,
        updated_rows: result.data.progress_data?.updated_rows,
        skipped_rows: result.data.progress_data?.skipped_rows,
      };
      
      setSelectedImport(newImportJob);
      setSelectedFile(null);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setViewMode('progress');
      fetchUserImports();
      
      // Start checking import status periodically
      startImportStatusCheck(result.data.import_id);
    } catch (error: any) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Check import status periodically
  const startImportStatusCheck = (importId: string) => {
    const checkInterval = setInterval(async () => {
      try {
        const result = await csvImport.getImportStatus(importId);
        const importJob = imports.find(i => i.id === importId) || selectedImport;
        
        if (importJob && result.data) {
          // Type-safe extraction of data
          const importStatus = result.data as any;
          
          // Update selected import if it's the current one
          if (selectedImport && selectedImport.id === importId) {
            const updatedImport = {
              ...importJob,
              status: importStatus.status as ImportJob['status'],
              processed_rows: importStatus.processed_rows || importJob.processed_rows,
              success_rows: importStatus.success_rows || importJob.success_rows,
              failed_rows: importStatus.failed_rows || importJob.failed_rows,
              progress_percentage: importStatus.progress_percentage || importJob.progress_percentage,
              created_rows: importStatus.created_rows,
              updated_rows: importStatus.updated_rows,
              skipped_rows: importStatus.skipped_rows,
            };
            setSelectedImport(updatedImport);
          }
          
          // Stop checking if import is completed, failed, or stopped
          if (['completed', 'failed', 'stopped'].includes(importStatus.status)) {
            clearInterval(checkInterval);
            fetchUserImports(); // Refresh the list
          }
        }
      } catch (error) {
        console.error('Failed to check import status:', error);
      }
    }, 3000); // Check every 3 seconds
    
    return checkInterval;
  };

  // Fetch user imports
  const fetchUserImports = async () => {
    try {
      const result = await csvImport.getUserImports();
      setImports(result.data.imports);
    } catch (error) {
      console.error('Failed to fetch imports:', error);
    }
  };

  // Fetch import detail
  const fetchImportDetail = async (importId: string) => {
    try {
      const result = await csvImport.getImportStatus(importId);
      setImportDetail(result.data);
      
      const importJob = imports.find(i => i.id === importId);
      if (importJob) {
        setSelectedImport(importJob);
      }
    } catch (error) {
      console.error('Failed to fetch import detail:', error);
    }
  };

  // Fetch import data with filters
  const fetchImportData = async (importId: string, page = 1) => {
    try {
      const filters: any = {
        page,
        per_page: itemsPerPage,
      };
      
      if (actionFilter !== 'all') {
        filters.action = actionFilter;
      }
      
      if (chunkFilter !== null) {
        filters.chunk_index = chunkFilter;
      }
      
      if (showErrorsOnly) {
        filters.has_errors = true;
      }
      
      if (searchTerm) {
        filters.search = searchTerm;
      }
      
      const result = await csvImport.getImportData(importId, filters);
      setImportData(result.data);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to fetch import data:', error);
    }
  };

  // Fetch import statistics
  const fetchImportStatistics = async (importId: string) => {
    try {
      const result = await csvImport.getImportStatistics(importId);
      setImportStatistics(result.data);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  // Control import
  const handleControlImport = async (action: 'pause' | 'resume' | 'stop') => {
    if (!selectedImport) return;
    
    setIsLoading(true);
    try {
      let result;
      switch (action) {
        case 'pause':
          result = await csvImport.pauseImport(selectedImport.id);
          break;
        case 'resume':
          result = await csvImport.resumeImport(selectedImport.id);
          break;
        case 'stop':
          result = await csvImport.stopImport(selectedImport.id);
          break;
      }
      
      toast.success(result.message);
      await fetchImportDetail(selectedImport.id);
      
    } catch (error: any) {
      toast.error(error.message || `Failed to ${action} import`);
    } finally {
      setIsLoading(false);
    }
  };

  // Download template
  const handleDownloadTemplate = async () => {
    try {
      await csvImport.downloadTemplate();
      toast.success('Template downloaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to download template');
    }
  };

  // Export data
  const handleExportData = async (importId?: string, action?: string) => {
    const targetImportId = importId || selectedImport?.id;
    if (!targetImportId) return;
    
    try {
      await csvImport.downloadExportedData(targetImportId, action);
      toast.success('Export completed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to export data');
    }
  };

  // Initialize auto-refresh
  useEffect(() => {
    fetchUserImports();
    
    if (autoRefresh) {
      refreshInterval.current = setInterval(() => {
        fetchUserImports();
      }, 10000);
    }
    
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [autoRefresh]);

  // Load import data when selected import changes
  useEffect(() => {
    if (selectedImport && viewMode === 'data') {
      fetchImportData(selectedImport.id);
      fetchImportStatistics(selectedImport.id);
    }
  }, [selectedImport, viewMode, actionFilter, chunkFilter, showErrorsOnly, searchTerm]);

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-800',
      processing: 'bg-blue-100 text-blue-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      stopped: 'bg-orange-100 text-orange-800',
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status] || colors.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Action badge component
  const ActionBadge = ({ action }: { action: string }) => {
    const colors: Record<string, string> = {
      created: 'bg-green-100 text-green-800',
      updated: 'bg-blue-100 text-blue-800',
      skipped: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[action] || 'bg-gray-100 text-gray-800'}`}>
        {action.charAt(0).toUpperCase() + action.slice(1)}
      </span>
    );
  };

  // Upload Area
  const UploadArea = () => (
    <div className="p-8 bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-blue-50">
            <CloudUpload size={48} className="text-blue-600" />
          </div>
        </div>
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Import CSV File</h2>
        <p className="mb-6 text-gray-600">
          Upload a CSV file to import member data. The file will be processed automatically.
        </p>
        
        {/* File Upload Input */}
        <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <div className="flex flex-col items-center justify-center gap-4">
            <Upload size={32} className="text-gray-400" />
            <div className="text-center">
              <p className="mb-2 text-lg font-medium text-gray-700">
                Select a CSV file to upload
              </p>
              <p className="text-sm text-gray-500 mb-4">Supports .csv files up to 10MB</p>
              
              {/* File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".csv,.txt,text/csv,text/plain"
                className="hidden"
                id="csv-file-input"
              />
              
              <div className="flex flex-col items-center gap-4">
                <label
                  htmlFor="csv-file-input"
                  className="px-6 py-3 font-medium text-blue-700 transition-colors bg-blue-100 rounded-lg cursor-pointer hover:bg-blue-200"
                >
                  Browse Files
                </label>
                
                {selectedFile && (
                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <FileText size={20} className="text-green-500" />
                        <div>
                          <p className="font-medium text-gray-900">{selectedFile.name}</p>
                          <p className="text-sm text-gray-500">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4 mt-6">
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isLoading}
            className="flex items-center gap-2 px-6 py-3 font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={20} />
                Upload CSV
              </>
            )}
          </button>
          
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 transition-colors bg-blue-50 rounded-lg hover:bg-blue-100"
          >
            <Download size={16} />
            Download Template
          </button>
          <button
            onClick={() => navigate('/members')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <Users size={16} />
            View Members
          </button>
        </div>
      </div>
    </div>
  );

  // Progress View - REMOVED: Progress bar and processed rows
  const ProgressView = () => {
    if (!selectedImport) return null;
    
    return (
      <div className="space-y-6">
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Activity size={24} className="text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Import Status</h2>
              </div>
              <p className="text-gray-600">{selectedImport.filename}</p>
              <p className="mt-1 text-sm text-gray-500">
                Import started at {new Date(selectedImport.created_at).toLocaleTimeString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={selectedImport.status} />
              <button
                onClick={() => setViewMode('summary')}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          {/* Stats - UPDATED: Removed progress percentage */}
          <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-3">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {selectedImport.created_rows?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-gray-600">Created</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {selectedImport.updated_rows?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-gray-600">Updated</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {selectedImport.failed_rows?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
          </div>
          
          {/* Control Buttons */}
          <div className="flex flex-wrap gap-3">
            {selectedImport.status === 'processing' && (
              <button
                onClick={() => handleControlImport('pause')}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-yellow-700 transition-colors bg-yellow-50 rounded-lg hover:bg-yellow-100 disabled:opacity-50"
              >
                <Pause size={16} />
                Pause Import
              </button>
            )}
            
            {selectedImport.status === 'paused' && (
              <button
                onClick={() => handleControlImport('resume')}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 transition-colors bg-green-50 rounded-lg hover:bg-green-100 disabled:opacity-50"
              >
                <Play size={16} />
                Resume Import
              </button>
            )}
            
            {['pending', 'processing', 'paused'].includes(selectedImport.status) && (
              <button
                onClick={() => handleControlImport('stop')}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 transition-colors bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50"
              >
                <StopCircle size={16} />
                Stop Import
              </button>
            )}
            
            <button
              onClick={() => {
                if (selectedImport.status === 'completed') {
                  setViewMode('data');
                } else {
                  toast('Please wait for import to complete to view data');
                }
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 transition-colors bg-blue-50 rounded-lg hover:bg-blue-100"
            >
              <Eye size={16} />
              View Data
            </button>
            
            <button
              onClick={() => {
                if (selectedImport.status === 'completed') {
                  handleExportData(selectedImport.id);
                } else {
                  toast('Please wait for import to complete to export data');
                }
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 transition-colors bg-purple-50 rounded-lg hover:bg-purple-100"
            >
              <DownloadIcon size={16} />
              Export Data
            </button>
            
            <button
              onClick={fetchUserImports}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <RefreshCw size={16} />
              Refresh Status
            </button>
          </div>
          
          {/* Status Message - UPDATED: Removed processed rows */}
          <div className="p-4 mt-6 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-700">
              <div className="font-medium mb-1">Current Status: {selectedImport.status.toUpperCase()}</div>
              <div>
                <span className="text-gray-600">Total Rows: </span>
                <span className="font-medium">{selectedImport.total_rows.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Import Details */}
        {importDetail && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Statistics */}
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Statistics</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Total Rows</div>
                    <div className="text-xl font-bold text-gray-900">{selectedImport.total_rows.toLocaleString()}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Success Rate</div>
                    <div className="text-xl font-bold text-green-600">
                      {selectedImport.total_rows > 0
                        ? `${Math.round(((selectedImport.created_rows || 0) + (selectedImport.updated_rows || 0)) / selectedImport.total_rows * 100)}%`
                        : '0%'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Import Details */}
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Import Details</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Chunk Size</span>
                  <span className="font-medium">{selectedImport.chunk_size} rows</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="font-medium">
                    <StatusBadge status={selectedImport.status} />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Started</span>
                  <span className="font-medium">
                    {new Date(selectedImport.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Data View - UPDATED: Removed progress bar reference
  const DataView = () => {
    if (!selectedImport || !importData) return null;
    
    return (
      <div className="space-y-6">
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col justify-between gap-4 mb-6 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Table size={24} className="text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Import Data</h2>
              </div>
              <p className="text-gray-600">{selectedImport.filename}</p>
              <p className="text-sm text-gray-500">
                Import completed at {selectedImport.completed_at 
                  ? new Date(selectedImport.completed_at).toLocaleString() 
                  : new Date(selectedImport.created_at).toLocaleString()}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setViewMode('progress')}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <ChevronLeft size={16} />
                Back to Status
              </button>
              <button
                onClick={() => handleExportData(selectedImport.id)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-purple-700 transition-colors bg-purple-50 rounded-lg hover:bg-purple-100"
              >
                <DownloadIcon size={16} />
                Export All
              </button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col gap-4 p-4 mb-6 bg-gray-50 rounded-lg md:flex-row md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search in data..."
                  className="w-full py-2 pl-10 pr-4 text-sm transition-colors border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value as ActionFilter)}
                className="px-3 py-2 text-sm transition-colors border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Actions</option>
                <option value="created">Created</option>
                <option value="updated">Updated</option>
                <option value="skipped">Skipped</option>
                <option value="failed">Failed</option>
              </select>
              
              <button
                onClick={() => setShowErrorsOnly(!showErrorsOnly)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  showErrorsOnly
                    ? 'bg-red-50 text-red-700 hover:bg-red-100'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <AlertTriangle size={16} />
                Errors Only
              </button>
              
              <button
                onClick={() => {
                  setActionFilter('all');
                  setChunkFilter(null);
                  setShowErrorsOnly(false);
                  setSearchTerm('');
                }}
                className="px-3 py-2 text-sm font-medium text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
          
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-4">
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{importData.summary.total}</div>
              <div className="text-sm text-gray-600">Total Rows</div>
            </div>
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{importData.summary.created}</div>
              <div className="text-sm text-gray-600">Created</div>
            </div>
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{importData.summary.updated}</div>
              <div className="text-sm text-gray-600">Updated</div>
            </div>
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{importData.summary.failed}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
          </div>
          
          {/* Data Table */}
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Row
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Action
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Data
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Errors
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {importData.rows.map((row) => (
                  <tr key={row.row_index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {row.row_index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <ActionBadge action={row.action} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-xs truncate">
                        <div className="text-sm font-medium text-gray-900">
                          {row.data['First Name'] || row.data['FirstName']} {row.data['Last Name'] || row.data['LastName']}
                        </div>
                        <div className="text-xs text-gray-500">
                          {row.data['Email'] || row.data['Home Email'] || row.data['Work Email']}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        row.status === 'success' 
                          ? 'bg-green-100 text-green-800'
                          : row.status === 'error'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {row.errors && row.errors.length > 0 ? (
                        <div className="text-xs text-red-600">
                          {row.errors[0]}
                          {row.errors.length > 1 && ` (+${row.errors.length - 1} more)`}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {importData.pagination.total_pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 mt-6 bg-white border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * itemsPerPage, importData.pagination.total_rows)}</span> of{' '}
                <span className="font-medium">{importData.pagination.total_rows}</span> results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchImportData(selectedImport.id, currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchImportData(selectedImport.id, currentPage + 1)}
                  disabled={currentPage === importData.pagination.total_pages}
                  className="px-3 py-1 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Statistics */}
        {importStatistics && (
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Detailed Statistics</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h4 className="mb-3 text-sm font-medium text-gray-700">Actions Summary</h4>
                <div className="space-y-2">
                  {Object.entries(importStatistics.actions_summary).map(([action, count]) => (
                    <div key={action} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">{action}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="mb-3 text-sm font-medium text-gray-700">Chunks Summary</h4>
                <div className="space-y-2">
                  {Object.entries(importStatistics.chunks_summary).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">{status}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // History View - UPDATED: Removed progress bar reference
  const HistoryView = () => (
    <div className="space-y-6">
      <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <History size={24} className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Import History</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchUserImports}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <RefreshCw size={20} />
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Auto-refresh</span>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoRefresh ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoRefresh ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
        
        {imports.length === 0 ? (
          <div className="py-12 text-center">
            <FileBarChart size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600">No import history yet</p>
            <p className="mt-1 text-sm text-gray-500">Upload a CSV file to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    File
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Rows
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Created
                  </th>
                  <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {imports.map((importItem) => (
                  <tr key={importItem.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <FileText size={20} className="text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                            {importItem.filename}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {importItem.id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={importItem.status} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">
                        {importItem.total_rows} rows
                      </div>
                      <div className="text-xs text-gray-500">
                        {importItem.created_rows || 0} created • {importItem.updated_rows || 0} updated
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {new Date(importItem.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedImport(importItem);
                            setViewMode('progress');
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        {importItem.status === 'completed' && (
                          <button
                            onClick={() => {
                              setSelectedImport(importItem);
                              setViewMode('data');
                            }}
                            className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                            title="View Data"
                          >
                            <Table size={16} />
                          </button>
                        )}
                        {importItem.status === 'completed' && (
                          <button
                            onClick={() => handleExportData(importItem.id)}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-purple-700 transition-colors bg-purple-50 rounded-lg hover:bg-purple-100"
                          >
                            <DownloadIcon size={16} />
                            Export All
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // Main render
  return (
    <div className="min-h-screen p-4 bg-gray-50 md:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">CSV Import Manager</h1>
              <p className="mt-1 text-gray-600">
                Import and manage member data from CSV files
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate('/members')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Users size={16} />
                View Members
              </button>
              
              <button
                onClick={() => setViewMode('history')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 transition-colors bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <History size={16} />
                View History
              </button>
            </div>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setViewMode('summary')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                viewMode === 'summary'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Upload size={16} />
                Upload
              </div>
            </button>
            
            {selectedImport && (
              <button
                onClick={() => setViewMode('progress')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  viewMode === 'progress'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Activity size={16} />
                  Status
                </div>
              </button>
            )}
            
            {selectedImport && selectedImport.status === 'completed' && (
              <button
                onClick={() => setViewMode('data')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  viewMode === 'data'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Table size={16} />
                  Data
                </div>
              </button>
            )}
            
            <button
              onClick={() => setViewMode('history')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                viewMode === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <History size={16} />
                History
              </div>
            </button>
          </div>
        </div>
        
        {/* Content */}
        {viewMode === 'summary' && <UploadArea />}
        {viewMode === 'progress' && <ProgressView />}
        {viewMode === 'data' && <DataView />}
        {viewMode === 'history' && <HistoryView />}
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="p-6 bg-white rounded-lg shadow-lg">
              <div className="flex items-center gap-3">
                <Loader2 className="animate-spin" size={24} />
                <div>
                  <p className="font-medium text-gray-900">Processing...</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className="pt-6 mt-6 text-sm text-center text-gray-500 border-t border-gray-200">
          <p>
            CSV Import System • Auto-refresh: {autoRefresh ? 'On' : 'Off'} • 
            {selectedImport ? ` Current: ${selectedImport.filename}` : ' No active import'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CsvImportUI;