import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  Users, 
  RefreshCw,
  X,
  Eye,
  EyeOff,
  Filter as FilterIcon,
  Search,
  ChevronDown,
  ChevronUp,
  BarChart3,
  UserPlus,
  Building,
  Shield,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  UserCheck,
  UserX,
  Loader2,
  Play,
  Pause,
  StopCircle,
  Clock,
  Activity,
  Layers,
  Database,
  Zap,
  CheckSquare,
  AlertTriangle,
  History,
  TrendingUp,
  FileCheck,
  FileX,
  FileSpreadsheet,
  Check,
  ChevronRight,
  ChevronLeft,
  Info,
  MoreHorizontal,
  ExternalLink,
  Download as DownloadIcon,
  SkipForward,
  Table,
  Save
} from 'lucide-react';
import { csvImport } from '../../v1/api/import';
import { toast } from 'react-hot-toast';

type ImportStatus = 'idle' | 'uploading' | 'pending' | 'processing' | 'paused' | 'completed' | 'failed' | 'stopped';
type ViewMode = 'summary' | 'progress' | 'details' | 'errors' | 'history' | 'data';

interface ImportJob {
  id: string;
  filename: string;
  status: ImportStatus;
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
}

interface ImportDetail {
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

interface ImportedDataRow {
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

interface ImportDataView {
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

const CsvImportPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [currentImport, setCurrentImport] = useState<ImportJob | null>(null);
  const [importDetail, setImportDetail] = useState<ImportDetail | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('summary');
  const [isDragging, setIsDragging] = useState(false);
  const [userImports, setUserImports] = useState<ImportJob[]>([]);
  const [selectedImportId, setSelectedImportId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'processing' | 'failed'>('all');
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false); // Changed to false by default
  
  // Data viewer state
  const [importedData, setImportedData] = useState<ImportDataView | null>(null);
  const [currentDataPage, setCurrentDataPage] = useState(1);
  const [dataLoading, setDataLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [dataColumns, setDataColumns] = useState<string[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [realTimeUpdates, setRealTimeUpdates] = useState<number>(0);
  const [dataFilter, setDataFilter] = useState({
    action: 'all',
    status: 'all',
    search: '',
  });

  // Error and connection state
  const [apiErrorCount, setApiErrorCount] = useState(0);
  const [hasApiError, setHasApiError] = useState(false);
  const [isPollingActive, setIsPollingActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Added saving state

  // Refs for debouncing
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const fetchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const apiCallCountRef = useRef<number>(0);
  const lastFetchTimeRef = useRef<number>(0);

  // Cleanup all intervals and timeouts
  const cleanupAllTimers = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (fetchDebounceRef.current) {
      clearTimeout(fetchDebounceRef.current);
      fetchDebounceRef.current = null;
    }
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [pollingInterval]);

  // Safe API call wrapper with rate limiting
  const safeApiCall = useCallback(async <T,>(apiFunction: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T> => {
    // Rate limiting: don't make more than 5 calls in 10 seconds
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 2000 && apiCallCountRef.current > 5) {
      throw new Error('Rate limit exceeded. Please slow down.');
    }

    try {
      setHasApiError(false);
      const result = await apiFunction(...args);
      setApiErrorCount(0);
      apiCallCountRef.current = 0;
      lastFetchTimeRef.current = now;
      return result;
    } catch (error) {
      setHasApiError(true);
      setApiErrorCount(prev => prev + 1);
      apiCallCountRef.current++;
      throw error;
    }
  }, []);

  // Fetch user imports with debounce
  const fetchUserImports = useCallback(async () => {
    if (fetchDebounceRef.current) {
      clearTimeout(fetchDebounceRef.current);
    }

    fetchDebounceRef.current = setTimeout(async () => {
      try {
        const response = await safeApiCall(csvImport.getUserImports);
        if (response.success) {
          setUserImports(response.data.imports);
          
          const activeStatuses = ['pending', 'processing', 'paused'] as ImportStatus[];
          const activeImport = response.data.imports.find(
            (imp: ImportJob) => activeStatuses.includes(imp.status)
          );
          
          if (activeImport && autoRefresh) {
            startPolling(activeImport.id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch imports:', error);
        if (apiErrorCount >= 3) {
          toast.error('Too many connection errors. Please refresh the page.');
          stopPolling();
        }
      }
    }, 1000);
  }, [autoRefresh, apiErrorCount, safeApiCall]);

  // Fetch imported data with better error handling
  const fetchImportedData = useCallback(async (importId: string, page = 1, filters = {}) => {
    if (!importId || dataLoading) return;
    
    try {
      setDataLoading(true);
      
      const response = await safeApiCall(csvImport.getImportData, importId, {
        ...filters,
        page,
        per_page: 20,
      });
      
      if (response.success) {
        const data = response.data || {};
        const rows = data.rows || [];
        const summary = data.summary || { created: 0, updated: 0, skipped: 0, failed: 0, total: 0 };
        const pagination = data.pagination || { current_page: 1, total_pages: 1, total_rows: 0, per_page: 20 };
        
        setImportedData({
          rows,
          summary,
          pagination,
          filters: data.filters || {}
        });
        
        setLastUpdateTime(new Date());
        setRealTimeUpdates(prev => prev + 1);
        setCurrentDataPage(page);
        
        if (rows.length > 0 && rows[0].data) {
          const columns = Object.keys(rows[0].data);
          setDataColumns(columns);
        } else {
          setDataColumns([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch imported data:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('500')) {
        toast.error('Failed to load imported data');
      }
    } finally {
      setDataLoading(false);
    }
  }, [dataLoading, safeApiCall]);

  // Fetch import details with improved error handling
  const fetchImportDetails = useCallback(async (importId: string, retryCount = 0) => {
    if (!importId || (pollingRef.current && retryCount > 0)) return;
    
    // Prevent too frequent calls
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 3000) {
      return;
    }
    
    try {
      const response = await safeApiCall(csvImport.getImportStatus, importId);
      
      if (response.success) {
        const normalizedStatus = normalizeStatus(response.data.import.status);
        
        setImportDetail(response.data);
        setSelectedImportId(importId);
        
        // Update user imports list
        setUserImports(prev => prev.map(imp => {
          if (imp.id === importId) {
            return {
              ...imp,
              ...response.data.import,
              status: normalizedStatus
            };
          }
          return imp;
        }));
        
        // Update current import if it's the active one
        if (currentImport?.id === importId) {
          setCurrentImport({
            ...currentImport,
            ...response.data.import,
            status: normalizedStatus
          });
          
          // Show saving state when processing but rows are 0
          if (normalizedStatus === 'processing' && response.data.import.processed_rows === 0) {
            setIsSaving(true);
          } else {
            setIsSaving(false);
          }
        }
        
        // Only fetch data when in data view and import is complete
        if (viewMode === 'data' && (normalizedStatus === 'completed' || normalizedStatus === 'failed')) {
          setTimeout(() => {
            const filters: any = {};
            if (dataFilter.action !== 'all') filters.action = dataFilter.action;
            if (dataFilter.status !== 'all') filters.status = dataFilter.status;
            
            fetchImportedData(importId, currentDataPage, filters);
          }, 2000);
        }
        
        // Stop polling if import is no longer active
        const activeStatuses = ['pending', 'processing', 'paused'] as ImportStatus[];
        if (!activeStatuses.includes(normalizedStatus)) {
          stopPolling();
          setIsSaving(false);
        }
      }
    } catch (error) {
      console.error('Failed to fetch import details:', error);
      
      // Retry logic for 500 errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      const is500Error = errorMessage.includes('500');
      
      if (is500Error && retryCount < 2) {
        // Exponential backoff for 500 errors
        const delay = Math.pow(2, retryCount) * 3000;
        setTimeout(() => {
          fetchImportDetails(importId, retryCount + 1);
        }, delay);
        return;
      }
      
      if (!is500Error) {
        toast.error('Failed to update import status');
      }
      
      if (apiErrorCount >= 5) {
        stopPolling();
        toast.error('Too many connection errors. Polling stopped.');
      }
    }
  }, [currentImport, viewMode, dataFilter, currentDataPage, fetchImportedData, apiErrorCount, safeApiCall]);

  // Handle data export
  const handleExportData = useCallback(async (importId: string, action: string | null = null) => {
    try {
      const response = await safeApiCall(csvImport.exportImportData, importId, action);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `import-data-${importId}-${action || 'all'}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Data exported successfully');
      }
    } catch (error: any) {
      console.error('Export failed:', error);
      toast.error(error.message || 'Export failed');
    }
  }, [safeApiCall]);

  // Start polling for updates with longer interval
  const startPolling = useCallback((importId: string) => {
    cleanupAllTimers();
    
    if (apiErrorCount >= 3) {
      toast.error('Too many errors. Manual refresh required.');
      return;
    }
    
    setIsPollingActive(true);
    
    const interval = setInterval(() => {
      if (!hasApiError || apiErrorCount < 3) {
        fetchImportDetails(importId);
      }
    }, 8000); // Increased to 8 seconds
    
    pollingRef.current = interval;
    
    return () => {
      clearInterval(interval);
    };
  }, [fetchImportDetails, apiErrorCount, hasApiError, cleanupAllTimers]);

  // Stop polling
  const stopPolling = useCallback(() => {
    cleanupAllTimers();
    setIsPollingActive(false);
    setIsSaving(false);
  }, [cleanupAllTimers]);

  // Manual refresh handler
  const handleManualRefresh = useCallback(async () => {
    if (selectedImportId) {
      await fetchImportDetails(selectedImportId);
      toast.success('Import status refreshed');
    } else {
      await fetchUserImports();
      toast.success('Imports list refreshed');
    }
  }, [selectedImportId, fetchImportDetails, fetchUserImports]);

  // Initial fetch
  useEffect(() => {
    fetchUserImports();
    
    return () => {
      cleanupAllTimers();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAllTimers();
    };
  }, [cleanupAllTimers]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      
      if (!selectedFile.name.toLowerCase().endsWith('.csv') && 
          selectedFile.type !== 'text/csv') {
        toast.error('Please upload a CSV file');
        return;
      }

      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      setFile(selectedFile);
      setStatus('idle');
      setCurrentImport(null);
      setImportDetail(null);
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
    disabled: status === 'uploading'
  });

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    try {
      setStatus('uploading');
      setIsSaving(true); // Show saving state
      const data = await safeApiCall(csvImport.uploadCsv, file);
      
      if (data.success) {
        toast.success('Import started successfully! Processing in background.');
        setStatus('pending');
        
        const importJob: ImportJob = {
          id: data.data.import_id,
          filename: data.data.filename,
          status: 'pending' as ImportStatus,
          total_rows: data.data.total_rows,
          processed_rows: 0,
          success_rows: 0,
          failed_rows: 0,
          total_chunks: data.data.chunks,
          processed_chunks: 0,
          chunk_size: data.data.chunk_size,
          progress_percentage: 0,
          created_at: data.data.created_at,
          started_at: null,
          completed_at: null,
          duration: null,
          has_errors: false
        };
        
        setCurrentImport(importJob);
        setSelectedImportId(importJob.id);
        
        // Start polling after a delay to let the import initialize
        setTimeout(() => {
          startPolling(data.data.import_id);
        }, 2000);
        
        setTimeout(() => fetchUserImports(), 3000);
      } else {
        setStatus('failed');
        setIsSaving(false);
        toast.error(`Import failed to start: ${data.message}`);
      }
    } catch (error: any) {
      setStatus('failed');
      setIsSaving(false);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed. Please try again.';
      toast.error(errorMessage);
      console.error('Upload error:', error);
    }
  };

  const handleControlAction = async (action: 'pause' | 'resume' | 'stop') => {
    if (!currentImport) return;
    
    try {
      let response;
      switch (action) {
        case 'pause':
          response = await safeApiCall(csvImport.pauseImport, currentImport.id);
          toast.success('Import paused');
          break;
        case 'resume':
          response = await safeApiCall(csvImport.resumeImport, currentImport.id);
          toast.success('Import resumed');
          break;
        case 'stop':
          response = await safeApiCall(csvImport.stopImport, currentImport.id);
          toast.success('Import stopped');
          break;
      }
      
      if (response?.success) {
        // Don't immediately fetch, let polling handle it
        setTimeout(() => fetchImportDetails(currentImport.id), 1000);
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : `Failed to ${action} import`;
      toast.error(errorMessage);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await safeApiCall(csvImport.downloadTemplate);
      toast.success('Template downloaded successfully');
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to download template';
      toast.error(errorMessage);
    }
  };

  const clearFile = () => {
    setFile(null);
    setStatus('idle');
    setCurrentImport(null);
    setImportDetail(null);
    setSelectedImportId(null);
    setImportedData(null);
    setIsSaving(false);
    stopPolling();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Updated formatDuration function to remove negative signs and provide better formatting
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    
    // Handle negative values by taking absolute value
    const absoluteSeconds = Math.abs(seconds);
    
    if (absoluteSeconds === 0) return '0 seconds';
    
    if (absoluteSeconds < 60) {
      return `${Math.round(absoluteSeconds)} second${absoluteSeconds !== 1 ? 's' : ''}`;
    } else if (absoluteSeconds < 3600) {
      const minutes = Math.round(absoluteSeconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (absoluteSeconds < 86400) {
      const hours = Math.round(absoluteSeconds / 3600);
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      const days = Math.round(absoluteSeconds / 86400);
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
  };

  // Alternative: More detailed format if preferred
  const formatDurationDetailed = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    
    // Handle negative values by taking absolute value
    const absoluteSeconds = Math.abs(seconds);
    
    if (absoluteSeconds < 60) {
      return `${Math.round(absoluteSeconds)}s`;
    } else if (absoluteSeconds < 3600) {
      const minutes = Math.floor(absoluteSeconds / 60);
      const remainingSeconds = Math.floor(absoluteSeconds % 60);
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      const hours = Math.floor(absoluteSeconds / 3600);
      const minutes = Math.floor((absoluteSeconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  const normalizeStatus = (status: string): ImportStatus => {
    const statusLower = status.toLowerCase();
    const validStatuses: ImportStatus[] = ['idle', 'uploading', 'pending', 'processing', 'paused', 'completed', 'failed', 'stopped'];
    
    if (validStatuses.includes(statusLower as ImportStatus)) {
      return statusLower as ImportStatus;
    }
    
    switch (statusLower) {
      case 'running':
      case 'in_progress':
      case 'queued':
        return 'processing';
      case 'done':
      case 'finished':
        return 'completed';
      case 'cancelled':
        return 'stopped';
      case 'waiting':
        return 'pending';
      default:
        return 'idle';
    }
  };

  const getStatusColor = (status: ImportStatus) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'processing': 
        return 'bg-yellow-100 text-yellow-800';
      case 'paused': 
        return 'bg-orange-100 text-orange-800';
      case 'completed': 
        return 'bg-green-100 text-green-800';
      case 'failed': 
        return 'bg-red-100 text-red-800';
      case 'stopped': 
        return 'bg-gray-100 text-gray-800';
      case 'idle':
      case 'uploading':
        return 'bg-gray-100 text-gray-800';
      default: 
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: ImportStatus) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'idle': return <FileText className="text-gray-600" size={16} />;
      case 'uploading': return <Upload className="text-blue-600" size={16} />;
      case 'pending': return <Clock className="text-blue-600" size={16} />;
      case 'processing': return <Activity className="text-yellow-600" size={16} />;
      case 'paused': return <Pause className="text-orange-600" size={16} />;
      case 'completed': return <CheckCircle className="text-green-600" size={16} />;
      case 'failed': return <AlertCircle className="text-red-600" size={16} />;
      case 'stopped': return <StopCircle className="text-gray-600" size={16} />;
      default: 
        return <FileText className="text-gray-600" size={16} />;
    }
  };

  const getActionColor = (action: string) => {
    if (!action) return 'bg-gray-100 text-gray-800';
    
    switch (action.toLowerCase()) {
      case 'created': return 'bg-green-100 text-green-800';
      case 'updated': return 'bg-blue-100 text-blue-800';
      case 'skipped': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDataStatusIcon = (status: string) => {
    if (!status) return <Info className="text-gray-600" size={16} />;
    
    switch (status.toLowerCase()) {
      case 'success': return <Check className="text-green-600" size={16} />;
      case 'error': return <X className="text-red-600" size={16} />;
      case 'warning': return <AlertTriangle className="text-yellow-600" size={16} />;
      default: return <Info className="text-gray-600" size={16} />;
    }
  };

  const toggleRowExpansion = (rowIndex: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowIndex)) {
      newExpanded.delete(rowIndex);
    } else {
      newExpanded.add(rowIndex);
    }
    setExpandedRows(newExpanded);
  };

  const filteredImports = userImports.filter(imp => {
    if (filterStatus !== 'all') {
      if (filterStatus === 'processing') {
        if (!['pending', 'processing', 'paused'].includes(imp.status)) return false;
      } else if (imp.status !== filterStatus) {
        return false;
      }
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        imp.filename.toLowerCase().includes(searchLower) ||
        imp.id.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  // Helper to format row count display
  const formatRowCountDisplay = (importJob: ImportJob) => {
    if (importJob.status === 'processing' && importJob.processed_rows === 0 && isSaving) {
      return 'Saving...';
    }
    return `${importJob.processed_rows}/${importJob.total_rows} rows`;
  };

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Zap className="text-blue-600" size={32} />
                Async CSV Import
              </h1>
              <p className="text-gray-600 mt-2">
                Upload large CSV files for background processing. Track progress in real-time.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-200 font-medium shadow-sm"
              >
                <Download size={18} />
                Download Template
              </button>
              
              {currentImport && ['processing', 'paused', 'pending'].includes(currentImport.status) && (
                <button
                  onClick={() => handleControlAction('stop')}
                  className="flex items-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-medium shadow-sm"
                >
                  <StopCircle size={18} />
                  Stop Import
                </button>
              )}
              
              <button
                onClick={() => {
                  setAutoRefresh(!autoRefresh);
                  if (autoRefresh) {
                    stopPolling();
                  } else if (currentImport) {
                    startPolling(currentImport.id);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 font-medium shadow-sm ${
                  autoRefresh 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-white border-2 border-green-600 text-green-600 hover:bg-green-50'
                }`}
              >
                {autoRefresh ? <CheckSquare size={18} /> : <AlertTriangle size={18} />}
                Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>

        {/* Connection Status Indicator */}
        {hasApiError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle size={18} />
              <span className="font-medium">Connection issues detected</span>
              <span className="text-sm">• Auto-refresh may be limited</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: File Upload & Active Import */}
          <div className="lg:col-span-1 space-y-6">
            {/* File Upload Area */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Upload size={20} className="text-blue-600" />
                  Upload CSV File
                </h2>
                
                <div
                  {...getRootProps()}
                  className={`border-3 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                    isDragActive || isDragging
                      ? 'border-blue-500 bg-blue-50 scale-[1.02]'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                  } ${status === 'uploading' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input {...getInputProps()} />
                  
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-4">
                      <Upload size={24} className="text-blue-600" />
                    </div>
                    
                    {isDragActive ? (
                      <p className="text-lg font-medium text-blue-600">Drop the CSV file here...</p>
                    ) : file ? (
                      <>
                        <FileText size={48} className="text-green-600 mb-3" />
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatFileSize(file.size)} • CSV
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-lg font-medium text-gray-700">Drag & drop your CSV file here</p>
                        <p className="text-gray-500 mt-2">or click to browse</p>
                        <p className="text-xs text-gray-400 mt-4">Supports .csv files up to 10MB</p>
                        <p className="text-xs text-gray-400">Processed in background with queue</p>
                      </>
                    )}
                  </div>
                </div>
                
                {file && (
                  <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText size={20} className="text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={clearFile}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="border-t border-gray-200 p-6">
                <div className="space-y-3">
                  <button
                    onClick={handleUpload}
                    disabled={!file || status === 'uploading'}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    {status === 'uploading' || isSaving ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        {isSaving ? 'Saving...' : 'Starting Import...'}
                      </>
                    ) : (
                      <>
                        <Play size={20} />
                        Start Import
                      </>
                    )}
                  </button>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Database size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800 mb-1">Async Processing</p>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Files processed in background</li>
                        <li>• Progress updates every 8 seconds</li>
                        <li>• Pause/Resume/Stop controls</li>
                        <li>• Process large files without timeout</li>
                        <li>• Automatic retry on failure</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Import Card */}
            {currentImport && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Activity className="text-blue-600" size={20} />
                      Active Import
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(currentImport.status)}`}>
                        {currentImport.status.toUpperCase()}
                      </span>
                      {isPollingActive && (
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Live updating" />
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">File: {currentImport.filename}</p>
                      <p className="text-xs text-gray-500">ID: {currentImport.id}</p>
                    </div>
                    
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{currentImport.progress_percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(currentImport.progress_percentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{formatRowCountDisplay(currentImport)}</span>
                        <span>{currentImport.processed_chunks} / {currentImport.total_chunks} chunks</span>
                      </div>
                    </div>
                    
                    {/* Stats - Updated to use the new formatDuration function */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-2xl font-bold text-green-700">{currentImport.success_rows}</p>
                        <p className="text-xs text-green-600">Success</p>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg">
                        <p className="text-2xl font-bold text-red-700">{currentImport.failed_rows}</p>
                        <p className="text-xs text-red-600">Failed</p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-2xl font-bold text-blue-700">{formatDuration(currentImport.duration)}</p>
                        <p className="text-xs text-blue-600">Duration</p>
                      </div>
                    </div>
                    
                    {/* Control Buttons */}
                    <div className="flex gap-2 pt-4 border-t border-gray-200">
                      {currentImport.status === 'processing' && (
                        <button
                          onClick={() => handleControlAction('pause')}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                        >
                          <Pause size={16} />
                          Pause
                        </button>
                      )}
                      
                      {currentImport.status === 'paused' && (
                        <button
                          onClick={() => handleControlAction('resume')}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        >
                          <Play size={16} />
                          Resume
                        </button>
                      )}
                      
                      {['processing', 'paused', 'pending'].includes(currentImport.status) && (
                        <button
                          onClick={() => handleControlAction('stop')}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <StopCircle size={16} />
                          Stop
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          setSelectedImportId(currentImport.id);
                          setViewMode('progress');
                          fetchImportDetails(currentImport.id);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Eye size={16} />
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Main Content */}
          <div className="lg:col-span-2">
            {/* Navigation Tabs */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex overflow-x-auto">
                  <button
                    onClick={() => setViewMode('summary')}
                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                      viewMode === 'summary'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <BarChart3 size={18} />
                    Dashboard
                  </button>
                  <button
                    onClick={() => {
                      if (currentImport) {
                        setSelectedImportId(currentImport.id);
                        fetchImportDetails(currentImport.id);
                      }
                      setViewMode('progress');
                    }}
                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                      viewMode === 'progress'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <Activity size={18} />
                    Live Progress
                  </button>
                  <button
                    onClick={() => {
                      if (currentImport || selectedImportId) {
                        const importId = currentImport?.id || selectedImportId;
                        if (importId) {
                          setSelectedImportId(importId);
                          setViewMode('data');
                          setTimeout(() => fetchImportedData(importId), 1000);
                        }
                      }
                    }}
                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                      viewMode === 'data'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <FileSpreadsheet size={18} />
                    Imported Data
                  </button>
                  <button
                    onClick={() => setViewMode('history')}
                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                      viewMode === 'history'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <History size={18} />
                    Import History
                  </button>
                </nav>
              </div>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              {viewMode === 'summary' && (
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Import Dashboard</h3>
                  
                  {/* Stats Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-700 font-medium">Total Imports</p>
                          <p className="text-2xl font-bold text-blue-900 mt-1">{userImports.length}</p>
                        </div>
                        <Database className="text-blue-600" size={24} />
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-700 font-medium">Completed</p>
                          <p className="text-2xl font-bold text-green-900 mt-1">
                            {userImports.filter(i => i.status === 'completed').length}
                          </p>
                        </div>
                        <CheckCircle className="text-green-600" size={24} />
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-5 rounded-xl border border-yellow-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-yellow-700 font-medium">In Progress</p>
                          <p className="text-2xl font-bold text-yellow-900 mt-1">
                            {userImports.filter(i => ['pending', 'processing', 'paused'].includes(i.status)).length}
                          </p>
                        </div>
                        <Activity className="text-yellow-600" size={24} />
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-red-50 to-red-100 p-5 rounded-xl border border-red-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-red-700 font-medium">Failed/Stopped</p>
                          <p className="text-2xl font-bold text-red-900 mt-1">
                            {userImports.filter(i => ['failed', 'stopped'].includes(i.status)).length}
                          </p>
                        </div>
                        <AlertCircle className="text-red-600" size={24} />
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">Recent Activity</h4>
                      <button
                        onClick={handleManualRefresh}
                        className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        disabled={isPollingActive}
                      >
                        <RefreshCw size={14} className={isPollingActive ? 'animate-spin' : ''} />
                        Refresh
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {userImports.slice(0, 5).map((imp) => (
                        <div 
                          key={imp.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedImportId(imp.id);
                            setViewMode('progress');
                            fetchImportDetails(imp.id);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100">
                              {getStatusIcon(imp.status)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{imp.filename}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-gray-500">
                                  {new Date(imp.created_at).toLocaleDateString()}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(imp.status)}`}>
                                  {imp.status}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              {imp.status === 'processing' && imp.processed_rows === 0 && isSaving 
                                ? 'Saving...' 
                                : `${imp.processed_rows}/${imp.total_rows} rows`}
                            </p>
                            <p className="text-xs text-gray-500">
                              {imp.progress_percentage.toFixed(0)}% complete
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {userImports.length === 0 && (
                        <div className="text-center py-12">
                          <FileCheck size={48} className="mx-auto text-gray-300 mb-4" />
                          <p className="text-gray-500">No imports yet</p>
                          <p className="text-sm text-gray-400 mt-1">Upload a CSV file to get started</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {viewMode === 'progress' && importDetail && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Import Progress Details</h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(importDetail.import.status)}`}>
                        {importDetail.import.status.toUpperCase()}
                      </span>
                      {importDetail.import.has_errors && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          HAS ERRORS
                        </span>
                      )}
                      {isPollingActive && (
                        <div className="flex items-center gap-1 text-sm text-green-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span>Live</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gray-50 p-5 rounded-xl">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">File Information</p>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Filename:</span>
                              <span className="font-medium">{importDetail.import.filename}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total Rows:</span>
                              <span className="font-medium">{importDetail.import.total_rows}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Chunk Size:</span>
                              <span className="font-medium">{importDetail.import.chunk_size}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Progress</p>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Rows:</span>
                              <span className="font-medium">
                                {importDetail.import.status === 'processing' && importDetail.import.processed_rows === 0 && isSaving
                                  ? 'Saving...'
                                  : `${importDetail.import.processed_rows}/${importDetail.import.total_rows}`}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Chunks:</span>
                              <span className="font-medium">{importDetail.import.processed_chunks}/{importDetail.import.total_chunks}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Progress:</span>
                              <span className="font-medium text-blue-600">{importDetail.import.progress_percentage.toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-5 rounded-xl">
                      <p className="text-sm font-medium text-gray-700 mb-4">Performance Metrics</p>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Chunks Completed</span>
                            <span>{importDetail.statistics.chunk_status_summary.completed}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full"
                              style={{ 
                                width: `${(importDetail.statistics.chunk_status_summary.completed / importDetail.import.total_chunks) * 100}%` 
                              }}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Success Rate</span>
                            <span>{importDetail.statistics.success_rates.row_success_rate.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${importDetail.statistics.success_rates.row_success_rate}%` }}
                            />
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t border-gray-200">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-gray-500">Avg Chunk Time</p>
                              <p className="font-medium">{formatDurationDetailed(importDetail.statistics.performance_metrics.average_chunk_time_seconds)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Rows/Second</p>
                              <p className="font-medium">{importDetail.statistics.performance_metrics.rows_per_second.toFixed(1)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-5 rounded-xl">
                      <p className="text-sm font-medium text-gray-700 mb-4">Chunk Status</p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span className="text-sm text-gray-700">Completed</span>
                          </div>
                          <span className="font-medium">{importDetail.statistics.chunk_status_summary.completed}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            <span className="text-sm text-gray-700">Processing</span>
                          </div>
                          <span className="font-medium">{importDetail.statistics.chunk_status_summary.processing}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <span className="text-sm text-gray-700">Pending</span>
                          </div>
                          <span className="font-medium">{importDetail.statistics.chunk_status_summary.pending}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <span className="text-sm text-gray-700">Failed</span>
                          </div>
                          <span className="font-medium">{importDetail.statistics.chunk_status_summary.failed}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chunks Timeline */}
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Chunks Timeline</h4>
                    <div className="bg-gray-50 p-5 rounded-xl">
                      <div className="space-y-3">
                        {importDetail.chunks.map((chunk) => (
                          <div key={chunk.chunk_index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                chunk.status === 'completed' ? 'bg-green-100 text-green-600' :
                                chunk.status === 'processing' ? 'bg-yellow-100 text-yellow-600' :
                                chunk.status === 'failed' ? 'bg-red-100 text-red-600' :
                                'bg-blue-100 text-blue-600'
                              }`}>
                                <span className="text-sm font-medium">#{chunk.chunk_index}</span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  Chunk {chunk.chunk_index} • Rows {chunk.start_row}-{chunk.end_row}
                                </p>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                                    chunk.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    chunk.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                    chunk.status === 'failed' ? 'bg-red-100 text-red-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {chunk.status}
                                  </span>
                                  {chunk.processing_duration && (
                                    <span className="text-xs text-gray-500">
                                      {formatDurationDetailed(chunk.processing_duration)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="font-medium text-gray-900">
                                {chunk.success_rows}/{chunk.total_rows} rows
                              </p>
                              {chunk.success_rows > 0 && (
                                <p className="text-xs text-green-600">
                                  {((chunk.success_rows / chunk.total_rows) * 100).toFixed(1)}% success
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h4>
                    <div className="relative pl-6">
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-300" />
                      
                      {importDetail.timeline.slice().reverse().map((event, index) => (
                        <div key={index} className="relative mb-6 last:mb-0">
                          <div className="absolute left-[-6px] top-2 w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
                          <div className="ml-6">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium text-gray-900">{event.details}</p>
                                  <p className="text-sm text-gray-500 mt-1">
                                    {new Date(event.timestamp).toLocaleString()}
                                  </p>
                                </div>
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                  {event.event.replace('_', ' ').toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {viewMode === 'data' && (
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Imported Data Viewer</h3>
                      <div className="flex items-center gap-4 mt-1">
                        {importDetail && (
                          <p className="text-gray-600">
                            Viewing data from: <span className="font-medium">{importDetail.import.filename}</span>
                          </p>
                        )}
                        {lastUpdateTime && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <RefreshCw size={14} className={dataLoading ? 'animate-spin' : ''} />
                            <span>Updated: {lastUpdateTime.toLocaleTimeString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-2">
                        <FilterIcon size={18} className="text-gray-400" />
                        <select
                          value={dataFilter.action}
                          onChange={(e) => {
                            const newFilter = { ...dataFilter, action: e.target.value };
                            setDataFilter(newFilter);
                            const importId = currentImport?.id || selectedImportId;
                            if (importId) {
                              const filters: any = {};
                              if (e.target.value !== 'all') filters.action = e.target.value;
                              setTimeout(() => {
                                fetchImportedData(importId, 1, filters);
                              }, 500);
                            }
                          }}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="all">All Actions</option>
                          <option value="created">Created Only</option>
                          <option value="updated">Updated Only</option>
                          <option value="skipped">Skipped Only</option>
                          <option value="failed">Failed Only</option>
                        </select>
                      </div>
                      
                      <button
                        onClick={() => {
                          const importId = currentImport?.id || selectedImportId;
                          if (importId) {
                            handleExportData(importId, dataFilter.action !== 'all' ? dataFilter.action : null);
                          }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <DownloadIcon size={18} />
                        Export Data
                      </button>
                    </div>
                  </div>

                  {/* Real-time indicator */}
                  {currentImport?.status === 'processing' && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-4 py-2 rounded-lg mb-4">
                      <Save size={14} className="animate-pulse" />
                      <span>Processing data... This may take a moment</span>
                    </div>
                  )}

                  {dataLoading ? (
                    <div className="text-center py-12">
                      <Loader2 className="mx-auto animate-spin text-blue-600" size={32} />
                      <p className="text-gray-600 mt-4">Loading imported data...</p>
                    </div>
                  ) : importedData && importedData.rows && importedData.rows.length > 0 ? (
                    <>
                      {/* Summary Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-green-700 font-medium">Created</p>
                              <p className="text-2xl font-bold text-green-900 mt-1">
                                {importedData.summary?.created || 0}
                              </p>
                            </div>
                            <UserPlus className="text-green-600" size={20} />
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-blue-700 font-medium">Updated</p>
                              <p className="text-2xl font-bold text-blue-900 mt-1">
                                {importedData.summary?.updated || 0}
                              </p>
                            </div>
                            <RefreshCw className="text-blue-600" size={20} />
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-yellow-700 font-medium">Skipped</p>
                              <p className="text-2xl font-bold text-yellow-900 mt-1">
                                {importedData.summary?.skipped || 0}
                              </p>
                            </div>
                            <SkipForward className="text-yellow-600" size={20} />
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-red-700 font-medium">Failed</p>
                              <p className="text-2xl font-bold text-red-900 mt-1">
                                {importedData.summary?.failed || 0}
                              </p>
                            </div>
                            <X className="text-red-600" size={20} />
                          </div>
                        </div>
                      </div>

                      {/* Data Table */}
                      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                                  #
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Row Data
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                                  Action
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                                  Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                                  Details
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {importedData.rows.map((row, index) => (
                                <React.Fragment key={`${row.import_id}-${row.row_index}-${index}`}>
                                  <tr 
                                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                                      row.action === 'failed' ? 'bg-red-50' : 
                                      row.action === 'skipped' ? 'bg-yellow-50' : ''
                                    }`}
                                    onClick={() => toggleRowExpansion(index)}
                                  >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {row.row_index || index + 1}
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="text-sm text-gray-900 max-w-xl truncate">
                                        {row.data && Object.entries(row.data).slice(0, 3).map(([key, value]) => (
                                          <div key={key} className="inline-flex items-center mr-3 mb-1">
                                            <span className="font-medium text-gray-500">{key}:</span>
                                            <span className="ml-1 text-gray-700">{String(value)}</span>
                                          </div>
                                        ))}
                                        {row.data && Object.keys(row.data).length > 3 && (
                                          <span className="text-gray-400 text-xs ml-2">
                                            +{Object.keys(row.data).length - 3} more
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActionColor(row.action || '')}`}>
                                        {(row.action || 'unknown').toUpperCase()}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center gap-2">
                                        {getDataStatusIcon(row.status || '')}
                                        <span className="text-sm text-gray-900 capitalize">{row.status || 'unknown'}</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {expandedRows.has(index) ? (
                                        <ChevronUp size={20} className="text-gray-400" />
                                      ) : (
                                        <ChevronRight size={20} className="text-gray-400" />
                                      )}
                                    </td>
                                  </tr>
                                  
                                  {/* Expanded Row Details */}
                                  {expandedRows.has(index) && (
                                    <tr>
                                      <td colSpan={5} className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                          {/* Data Details */}
                                          <div>
                                            <h4 className="text-sm font-medium text-gray-700 mb-3">Row Data</h4>
                                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                                              <pre className="text-sm text-gray-800 whitespace-pre-wrap max-h-64 overflow-y-auto">
                                                {JSON.stringify(row.data || {}, null, 2)}
                                              </pre>
                                            </div>
                                          </div>
                                          
                                          {/* Action Details */}
                                          <div>
                                            <h4 className="text-sm font-medium text-gray-700 mb-3">Processing Details</h4>
                                            <div className="space-y-3">
                                              <div className="bg-white p-4 rounded-lg border border-gray-200">
                                                <div className="space-y-2">
                                                  <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600">Row Number:</span>
                                                    <span className="text-sm font-medium">{row.row_index}</span>
                                                  </div>
                                                  
                                                  <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600">Chunk:</span>
                                                    <span className="text-sm font-medium">{row.chunk_index}</span>
                                                  </div>
                                                  
                                                  <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600">Processed At:</span>
                                                    <span className="text-sm font-medium">{row.processed_at || 'N/A'}</span>
                                                  </div>
                                                  
                                                  {row.message && (
                                                    <div>
                                                      <span className="text-sm text-gray-600">Message:</span>
                                                      <p className="text-sm mt-1 p-2 bg-blue-50 rounded">{row.message}</p>
                                                    </div>
                                                  )}
                                                  
                                                  {row.errors && row.errors.length > 0 && (
                                                    <div className="mt-3">
                                                      <span className="text-sm text-red-600 font-medium">Errors:</span>
                                                      <ul className="mt-1 space-y-1">
                                                        {row.errors.map((error, idx) => (
                                                          <li key={idx} className="text-sm text-red-600">
                                                            • {error}
                                                          </li>
                                                        ))}
                                                      </ul>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination */}
                        {importedData.pagination && importedData.pagination.total_pages > 1 && (
                          <div className="px-6 py-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-700">
                                Showing page {importedData.pagination.current_page} of {importedData.pagination.total_pages}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    const importId = currentImport?.id || selectedImportId;
                                    if (importId && importedData.pagination.current_page > 1) {
                                      setTimeout(() => {
                                        fetchImportedData(
                                          importId, 
                                          importedData.pagination.current_page - 1,
                                          dataFilter.action !== 'all' ? { action: dataFilter.action } : {}
                                        );
                                      }, 500);
                                    }
                                  }}
                                  disabled={importedData.pagination.current_page === 1}
                                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <ChevronLeft size={16} />
                                </button>
                                
                                <span className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm">
                                  {importedData.pagination.current_page}
                                </span>
                                
                                <button
                                  onClick={() => {
                                    const importId = currentImport?.id || selectedImportId;
                                    if (importId && importedData.pagination.current_page < importedData.pagination.total_pages) {
                                      setTimeout(() => {
                                        fetchImportedData(
                                          importId, 
                                          importedData.pagination.current_page + 1,
                                          dataFilter.action !== 'all' ? { action: dataFilter.action } : {}
                                        );
                                      }, 500);
                                    }
                                  }}
                                  disabled={importedData.pagination.current_page === importedData.pagination.total_pages}
                                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <ChevronRight size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <FileSpreadsheet className="mx-auto text-gray-300 mb-4" size={48} />
                      <p className="text-gray-500">No imported data found</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {selectedImportId ? 'Data may still be processing or no rows were imported' : 'Select an import to view data'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {viewMode === 'history' && (
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Import History</h3>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          placeholder="Search imports..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
                        />
                      </div>
                      
                      <div className="flex gap-1">
                        <button
                          onClick={() => setFilterStatus('all')}
                          className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                            filterStatus === 'all'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => setFilterStatus('completed')}
                          className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                            filterStatus === 'completed'
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Completed
                        </button>
                        <button
                          onClick={() => setFilterStatus('processing')}
                          className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                            filterStatus === 'processing'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Active
                        </button>
                        <button
                          onClick={() => setFilterStatus('failed')}
                          className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                            filterStatus === 'failed'
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Failed
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {filteredImports.map((imp) => (
                      <div 
                        key={imp.id}
                        className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                          setSelectedImportId(imp.id);
                          setViewMode('progress');
                          fetchImportDetails(imp.id);
                        }}
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                {getStatusIcon(imp.status)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{imp.filename}</p>
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="text-sm text-gray-500">
                                    {new Date(imp.created_at).toLocaleDateString()}
                                  </span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(imp.status)}`}>
                                    {imp.status.toUpperCase()}
                                  </span>
                                  {imp.has_errors && (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      HAS ERRORS
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="font-medium text-gray-900">
                                {formatRowCountDisplay(imp)}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="w-32 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-500 h-2 rounded-full"
                                    style={{ width: `${Math.min(imp.progress_percentage, 100)}%` }}
                                  />
                                </div>
                                <span className="text-sm text-gray-600">{imp.progress_percentage.toFixed(0)}%</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-green-700">{imp.success_rows}</p>
                              <p className="text-xs text-gray-600">Success</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-red-700">{imp.failed_rows}</p>
                              <p className="text-xs text-gray-600">Failed</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-blue-700">{imp.processed_chunks}</p>
                              <p className="text-xs text-gray-600">Chunks</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-gray-700">{formatDuration(imp.duration)}</p>
                              <p className="text-xs text-gray-600">Duration</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {filteredImports.length === 0 && (
                      <div className="text-center py-12">
                        <FileX size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">No imports found</p>
                        <p className="text-sm text-gray-400 mt-1">
                          {searchTerm ? 'Try a different search term' : 'Upload a CSV file to get started'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How Async Import Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
              <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center mb-3">
                <Upload className="text-blue-600" size={20} />
              </div>
              <p className="font-medium text-gray-900 mb-2">1. Upload</p>
              <p className="text-sm text-gray-600">Upload any size CSV file (up to 10MB)</p>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
              <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center mb-3">
                <Layers className="text-green-600" size={20} />
              </div>
              <p className="font-medium text-gray-900 mb-2">2. Chunk Processing</p>
              <p className="text-sm text-gray-600">File is split into chunks (default: 1000 rows)</p>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl">
              <div className="w-10 h-10 bg-yellow-200 rounded-lg flex items-center justify-center mb-3">
                <Activity className="text-yellow-600" size={20} />
              </div>
              <p className="font-medium text-gray-900 mb-2">3. Background Processing</p>
              <p className="text-sm text-gray-600">Chunks processed in queue, you can leave the page</p>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
              <div className="w-10 h-10 bg-purple-200 rounded-lg flex items-center justify-center mb-3">
                <TrendingUp className="text-purple-600" size={20} />
              </div>
              <p className="font-medium text-gray-900 mb-2">4. Real-time Tracking</p>
              <p className="text-sm text-gray-600">Monitor progress, pause/resume, and view statistics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CsvImportPage;