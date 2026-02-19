// src/pages/members/DocumentLibrary.tsx
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useDebounce } from "use-debounce";
import { 
  Search, Filter, Download, FileText, Building, Calendar, 
  User, X, Eye, MapPin, Users, Shield, Clock, AlertTriangle,
  Folder, Grid, List, BarChart3, TrendingUp, FileSearch
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import toast from 'react-hot-toast';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Document {
  id: number;
  title: string;
  type: 'contract' | 'arbitration' | 'mou' | 'bylaws' | 'research' | 'general';
  category?: string;
  description?: string;
  file_name: string;
  file_path: string;
  file_size: number;
  database_source: 'contracts' | 'arbitrations' | 'mous' | 'research_collection' | 'general';
  uploaded_at: string;
  
  // Contract-specific fields
  contract_expiration_date?: string;
  employer?: string;
  cbc?: string;
  state?: string;
  effective_date?: string;
  status: 'active' | 'expired' | 'negotiation' | 'draft';
  year?: number;
  
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

interface MemberStats {
  total_documents: number;
  contracts_count: number;
  expiring_soon: number;
  recent_documents: number;
  affiliate_documents: number;
  national_documents: number;
}

interface DocumentFolder {
  id: number;
  name: string;
  parent_id?: number;
  children?: DocumentFolder[];
  document_count?: number;
}

export default function MemberDocumentLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [activeRepository, setActiveRepository] = useState<string>("all");
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);
  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [memberStats, setMemberStats] = useState<MemberStats | null>(null);
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  
  const [advancedFilters, setAdvancedFilters] = useState({
    type: "",
    category: "",
    state: "",
    employer: "",
    status: "",
    year: ""
  });

  // Repository tabs for members
  const repositories = [
    { id: "all", name: "All Documents", count: memberStats?.total_documents || 0 },
    { id: "contracts", name: "Contracts", count: memberStats?.contracts_count || 0 },
    { id: "expiring", name: "Expiring Soon", count: memberStats?.expiring_soon || 0 },
    { id: "arbitrations", name: "Arbitrations", count: 0 },
    { id: "mous", name: "MOUs", count: 0 },
    { id: "recent", name: "Recent", count: memberStats?.recent_documents || 0 },
  ];

  const { data: documents, isLoading, error } = useQuery({
    queryKey: ["member-documents", activeRepository, selectedFolder, debouncedSearch, advancedFilters],
    queryFn: fetchDocuments,
  });

  async function fetchDocuments(): Promise<Document[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const token = session.access_token;

      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      
      if (activeRepository !== "all") {
        if (activeRepository === "expiring") {
          params.append("expiring_soon", "true");
        } else if (activeRepository === "recent") {
          params.append("recent", "true");
        } else {
          params.append("repository", activeRepository);
        }
      }

      if (selectedFolder) {
        params.append("folder_id", selectedFolder.toString());
      }

      Object.entries(advancedFilters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/documents?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch documents");

      const result = await response.json();

      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.message || "Failed to fetch documents");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load documents");
      return [];
    }
  }

  const fetchMemberStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const token = session.access_token;
      const response = await fetch(`${apiUrl}/api/member/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setMemberStats(result.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch member stats:', err);
    }
  };

  const fetchFolders = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const token = session.access_token;
      const response = await fetch(`${apiUrl}/api/folders`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setFolders(result.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch folders:', err);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const token = session.access_token;
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/documents/${doc.id}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to get download URL");

      const result = await response.json();

      if (result.success) {
        const link = window.document.createElement("a");
        link.href = result.data.download_url;
        link.download = result.data.file_name;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);

        toast.success(`Downloading ${doc.title}`);
      } else {
        throw new Error(result.message || "Failed to download document");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to download document");
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'contract': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'arbitration': return 'bg-red-100 text-red-800 border border-red-200';
      case 'mou': return 'bg-green-100 text-green-800 border border-green-200';
      case 'bylaws': return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'research': return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'general': return 'bg-gray-100 text-gray-800 border border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'negotiation': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isExpiringSoon = (expirationDate: string) => {
    if (!expirationDate) return false;
    const expDate = new Date(expirationDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return daysUntilExpiry <= 90 && daysUntilExpiry >= 0;
  };

  const isExpired = (expirationDate: string) => {
    if (!expirationDate) return false;
    const expDate = new Date(expirationDate);
    const today = new Date();
    return expDate < today;
  };

  const clearFilters = () => {
    setAdvancedFilters({
      type: "",
      category: "",
      state: "",
      employer: "",
      status: "",
      year: ""
    });
    setSelectedFolder(null);
    setSearchTerm("");
    toast.success("All filters cleared");
  };

  const toggleFolder = (folderId: number) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleFolderSelect = (folderId: number | null) => {
    setSelectedFolder(folderId);
  };

  const hasActiveFilters = Object.values(advancedFilters).some(v => v !== "") || selectedFolder || searchTerm;

  // Get unique values for filter options
  const documentTypes = Array.from(new Set(documents?.map(doc => doc.type) || []));
  const categories = Array.from(new Set(documents?.filter(doc => doc.category).map(doc => doc.category) || []));
  const states = Array.from(new Set(documents?.filter(doc => doc.state).map(doc => doc.state) || []));
  const employers = Array.from(new Set(documents?.filter(doc => doc.employer).map(doc => doc.employer) || []));
  const years = Array.from(new Set(documents?.filter(doc => doc.year).map(doc => doc.year?.toString()) || []));

  useEffect(() => {
    fetchMemberStats();
    fetchFolders();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen p-4 bg-gray-50">
        <div className="mx-auto max-w-7xl">
          <div className="px-4 py-3 text-red-700 border border-red-200 rounded-lg bg-red-50">
            Error loading documents: {error.toString()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Member Document Library</h1>
          <p className="mt-1 text-gray-600">Access your affiliate documents and national resources</p>
        </div>

        {/* Member Statistics */}
        {memberStats && (
          <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-4">
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Total Documents</span>
              </div>
              <div className="mt-1 text-2xl font-bold text-gray-900">{memberStats.total_documents}</div>
            </div>
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Contracts</span>
              </div>
              <div className="mt-1 text-2xl font-bold text-gray-900">{memberStats.contracts_count}</div>
            </div>
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-gray-700">Expiring Soon</span>
              </div>
              <div className="mt-1 text-2xl font-bold text-gray-900">{memberStats.expiring_soon}</div>
            </div>
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Recent</span>
              </div>
              <div className="mt-1 text-2xl font-bold text-gray-900">{memberStats.recent_documents}</div>
            </div>
          </div>
        )}

        {/* Repository Tabs */}
        <div className="p-4 mb-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="flex-1">
              <div className="flex flex-wrap gap-1">
                {repositories.map((repo) => (
                  <button
                    key={repo.id}
                    onClick={() => setActiveRepository(repo.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeRepository === repo.id
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <span>{repo.name}</span>
                    {repo.count > 0 && (
                      <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full text-xs">
                        {repo.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            {/* View Toggle */}
            <div className="flex p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setViewType("grid")}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                  viewType === "grid" 
                    ? "bg-white text-gray-900 shadow-sm" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Grid size={16} />
                Grid
              </button>
              <button
                onClick={() => setViewType("list")}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                  viewType === "list" 
                    ? "bg-white text-gray-900 shadow-sm" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <List size={16} />
                List
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-4 mb-6 bg-white border border-gray-200 rounded-lg">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search documents, contracts, employers..."
                  className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* Filter Dropdown */}
            <div className="flex gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="relative flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                >
                  <Filter size={16} />
                  Filters
                  {hasActiveFilters && (
                    <span className="absolute w-3 h-3 bg-blue-500 rounded-full -top-1 -right-1"></span>
                  )}
                </button>
                
                {showFilters && (
                  <div className="absolute right-0 z-50 p-4 mt-2 bg-white border rounded-lg shadow-xl w-80">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900">Document Filters</h3>
                      <button
                        onClick={clearFilters}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <X size={14} />
                        Clear All
                      </button>
                    </div>
                    
                    <div className="space-y-3 overflow-y-auto max-h-96">
                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">
                          Document Type
                        </label>
                        <select
                          value={advancedFilters.type}
                          onChange={(e) => setAdvancedFilters(prev => ({ ...prev, type: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">All Types</option>
                          {documentTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">
                          Category
                        </label>
                        <select
                          value={advancedFilters.category}
                          onChange={(e) => setAdvancedFilters(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">All Categories</option>
                          {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block mb-1 text-sm font-medium text-gray-700">
                            State
                          </label>
                          <select
                            value={advancedFilters.state}
                            onChange={(e) => setAdvancedFilters(prev => ({ ...prev, state: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">All States</option>
                            {states.map(state => (
                              <option key={state} value={state}>{state}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block mb-1 text-sm font-medium text-gray-700">
                            Year
                          </label>
                          <select
                            value={advancedFilters.year}
                            onChange={(e) => setAdvancedFilters(prev => ({ ...prev, year: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">All Years</option>
                            {years.map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">
                          Employer
                        </label>
                        <select
                          value={advancedFilters.employer}
                          onChange={(e) => setAdvancedFilters(prev => ({ ...prev, employer: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">All Employers</option>
                          {employers.map(employer => (
                            <option key={employer} value={employer}>{employer}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">
                          Status
                        </label>
                        <select
                          value={advancedFilters.status}
                          onChange={(e) => setAdvancedFilters(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">All Statuses</option>
                          <option value="active">Active</option>
                          <option value="expired">Expired</option>
                          <option value="negotiation">Negotiation</option>
                          <option value="draft">Draft</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="pt-3 mt-4 border-t">
                      <button
                        onClick={() => setShowFilters(false)}
                        className="w-full px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                      >
                        Close Filters
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Filters Indicator */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedFolder && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-800 bg-blue-100 rounded-full">
                  <Folder size={12} />
                  {findFolderName(folders, selectedFolder)}
                  <button onClick={() => setSelectedFolder(null)} className="ml-1 hover:text-blue-600">
                    <X size={12} />
                  </button>
                </span>
              )}
              {Object.entries(advancedFilters).map(([key, value]) => 
                value && (
                  <span key={key} className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-800 bg-gray-100 rounded-full">
                    {key}: {value}
                    <button 
                      onClick={() => setAdvancedFilters(prev => ({ ...prev, [key]: "" }))} 
                      className="ml-1 hover:text-gray-600"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )
              )}
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Folder Navigation Sidebar */}
          <div className="p-4 bg-white border border-gray-200 rounded-lg lg:w-64 h-fit">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Folders</h3>
              <button
                onClick={() => handleFolderSelect(null)}
                className={`text-xs ${!selectedFolder ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
              >
                View All
              </button>
            </div>
            
            <div className="space-y-1 overflow-y-auto max-h-96">
              <FolderTree 
                folders={folders}
                expandedFolders={expandedFolders}
                selectedFolder={selectedFolder}
                onToggleFolder={toggleFolder}
                onSelectFolder={handleFolderSelect}
                level={0}
              />
            </div>
          </div>

          {/* Documents Content */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="p-4 bg-white border border-gray-200 rounded-lg animate-pulse">
                    <div className="w-3/4 h-4 mb-2 bg-gray-200 rounded"></div>
                    <div className="w-1/2 h-3 mb-4 bg-gray-200 rounded"></div>
                    <div className="w-full h-3 mb-1 bg-gray-200 rounded"></div>
                    <div className="w-2/3 h-3 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : documents && documents.length > 0 ? (
              viewType === "grid" ? (
                /* Grid View */
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {documents.map((doc) => (
                    <DocumentCard 
                      key={doc.id} 
                      document={doc} 
                      onView={() => setSelectedDocument(doc)}
                      onDownload={handleDownload}
                    />
                  ))}
                </div>
              ) : (
                /* List View */
                <div className="bg-white border border-gray-200 rounded-lg">
                  {documents.map((doc, index) => (
                    <DocumentListItem 
                      key={doc.id} 
                      document={doc} 
                      onView={() => setSelectedDocument(doc)}
                      onDownload={handleDownload}
                      isLast={index === documents.length - 1}
                    />
                  ))}
                </div>
              )
            ) : (
              <div className="p-8 text-center bg-white border border-gray-200 rounded-lg">
                <FileSearch className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="mb-2 text-lg font-medium text-gray-900">No documents found</h3>
                <p className="text-gray-600">
                  {hasActiveFilters 
                    ? "Try adjusting your filters to see more results."
                    : "There are no documents available for your access at this time."
                  }
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 font-medium text-blue-600 hover:text-blue-800"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}

            {/* Document Count */}
            {documents && documents.length > 0 && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Showing {documents.length} document{documents.length !== 1 ? 's' : ''}
                  {hasActiveFilters && " (filtered)"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Detail Modal */}
      {selectedDocument && (
        <MemberDocumentDetails 
          document={selectedDocument} 
          onClose={() => setSelectedDocument(null)}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
}

// Document Card Component for Grid View
function DocumentCard({ document: doc, onView, onDownload }: { 
  document: Document; 
  onView: () => void;
  onDownload: (doc: Document) => void;
}) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isExpiringSoon = (expirationDate: string) => {
    if (!expirationDate) return false;
    const expDate = new Date(expirationDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return daysUntilExpiry <= 90 && daysUntilExpiry >= 0;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'contract': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'arbitration': return 'bg-red-100 text-red-800 border border-red-200';
      case 'mou': return 'bg-green-100 text-green-800 border border-green-200';
      case 'bylaws': return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'research': return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'general': return 'bg-gray-100 text-gray-800 border border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  return (
    <div
      className="p-4 transition-shadow bg-white border border-gray-200 rounded-lg cursor-pointer hover:shadow-md group"
      onClick={onView}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <FileText className="flex-shrink-0 w-8 h-8 text-red-500" />
        <div className="flex flex-col items-end gap-1">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(doc.type)}`}>
            {doc.type}
          </span>
          {doc.contract_expiration_date && isExpiringSoon(doc.contract_expiration_date) && (
            <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-800 bg-orange-100 border border-orange-200 rounded-full">
              <AlertTriangle size={10} />
              Expiring
            </span>
          )}
        </div>
      </div>

      {/* Title and Description */}
      <h3 className="mb-2 font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600">
        {doc.title}
      </h3>
      
      {doc.description && (
        <p className="mb-3 text-sm text-gray-600 line-clamp-2">
          {doc.description}
        </p>
      )}

      {/* Document Details */}
      <div className="mb-3 space-y-2">
        {doc.employer && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Users size={12} />
            <span className="truncate">{doc.employer}</span>
          </div>
        )}
        {doc.state && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <MapPin size={12} />
            <span>{doc.state}</span>
          </div>
        )}
        {doc.contract_expiration_date && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Clock size={12} />
            <span>Expires {new Date(doc.contract_expiration_date).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="mb-3 space-y-1 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <FileText size={12} />
          <span className="truncate">{doc.file_name}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar size={12} />
          <span>{formatFileSize(doc.file_size)} • {new Date(doc.uploaded_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <Building size={12} />
          <span>{doc.affiliate?.name || "National"}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload(doc);
          }}
          className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          <Download size={14} />
          Download
        </button>
      </div>
    </div>
  );
}

// Document List Item Component for List View
function DocumentListItem({ document: doc, onView, onDownload, isLast }: { 
  document: Document; 
  onView: () => void;
  onDownload: (doc: Document) => void;
  isLast: boolean;
}) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'contract': return 'bg-blue-100 text-blue-800';
      case 'arbitration': return 'bg-red-100 text-red-800';
      case 'mou': return 'bg-green-100 text-green-800';
      case 'bylaws': return 'bg-orange-100 text-orange-800';
      case 'research': return 'bg-purple-100 text-purple-800';
      case 'general': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div 
      className={`flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer ${!isLast ? 'border-b border-gray-200' : ''}`}
      onClick={onView}
    >
      <FileText className="flex-shrink-0 w-8 h-8 text-red-500" />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-gray-900 truncate">{doc.title}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(doc.type)}`}>
            {doc.type}
          </span>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Building size={12} />
            {doc.affiliate?.name || "National"}
          </span>
          {doc.employer && (
            <span className="flex items-center gap-1">
              <Users size={12} />
              {doc.employer}
            </span>
          )}
          {doc.state && (
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              {doc.state}
            </span>
          )}
          <span>{formatFileSize(doc.file_size)}</span>
          <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
        </div>
        
        {doc.description && (
          <p className="mt-1 text-sm text-gray-600 line-clamp-1">{doc.description}</p>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDownload(doc);
        }}
        className="flex items-center flex-shrink-0 gap-2 px-3 py-2 text-blue-600 rounded-lg hover:text-blue-800 hover:bg-blue-50"
      >
        <Download size={16} />
        <span className="hidden sm:inline">Download</span>
      </button>
    </div>
  );
}

// Member Document Details Modal
function MemberDocumentDetails({ document: doc, onClose, onDownload }: { 
  document: Document; 
  onClose: () => void;
  onDownload: (doc: Document) => void;
}) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isExpiringSoon = (expirationDate: string) => {
    if (!expirationDate) return false;
    const expDate = new Date(expirationDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return daysUntilExpiry <= 90 && daysUntilExpiry >= 0;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'contract': return 'bg-blue-100 text-blue-800';
      case 'arbitration': return 'bg-red-100 text-red-800';
      case 'mou': return 'bg-green-100 text-green-800';
      case 'bylaws': return 'bg-orange-100 text-orange-800';
      case 'research': return 'bg-purple-100 text-purple-800';
      case 'general': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'negotiation': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{doc.title}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(doc.type)}`}>
                  {doc.type}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                  {doc.status}
                </span>
                {doc.contract_expiration_date && isExpiringSoon(doc.contract_expiration_date) && (
                  <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-800 bg-orange-100 rounded-full">
                    <AlertTriangle size={12} />
                    Expiring Soon
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          {/* File Info */}
          <div className="p-4 mb-6 rounded-lg bg-gray-50">
            <div className="flex items-center gap-4">
              <FileText className="w-12 h-12 text-red-500" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{doc.file_name}</p>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                  <span>{formatFileSize(doc.file_size)}</span>
                  <span>Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Document Information */}
            <div className="space-y-4">
              <h3 className="pb-2 font-medium text-gray-900 border-b">Document Information</h3>
              
              {doc.description && (
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Description</label>
                  <p className="text-gray-700">{doc.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Category</label>
                  <p className="text-gray-900">{doc.category || "Uncategorized"}</p>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Year</label>
                  <p className="text-gray-900">{doc.year || "N/A"}</p>
                </div>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Affiliate</label>
                <p className="flex items-center gap-2 text-gray-900">
                  <Building size={16} />
                  {doc.affiliate?.name || "National Resource"}
                </p>
              </div>

              {doc.uploader && (
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Uploaded By</label>
                  <p className="flex items-center gap-2 text-gray-900">
                    <User size={16} />
                    {doc.uploader.name}
                  </p>
                </div>
              )}
            </div>

            {/* Contract Details */}
            {(doc.employer || doc.cbc || doc.state || doc.contract_expiration_date) && (
              <div className="space-y-4">
                <h3 className="pb-2 font-medium text-gray-900 border-b">Contract Details</h3>
                
                {doc.employer && (
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Employer</label>
                    <p className="flex items-center gap-2 text-gray-900">
                      <Users size={16} />
                      {doc.employer}
                    </p>
                  </div>
                )}

                {doc.cbc && (
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">CBC</label>
                    <p className="flex items-center gap-2 text-gray-900">
                      <Shield size={16} />
                      {doc.cbc}
                    </p>
                  </div>
                )}

                {doc.state && (
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">State</label>
                    <p className="flex items-center gap-2 text-gray-900">
                      <MapPin size={16} />
                      {doc.state}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {doc.effective_date && (
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Effective Date</label>
                      <p className="flex items-center gap-2 text-gray-900">
                        <Calendar size={16} />
                        {new Date(doc.effective_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {doc.contract_expiration_date && (
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-700">Expiration Date</label>
                      <p className={`flex items-center gap-2 ${
                        isExpiringSoon(doc.contract_expiration_date) ? 'text-orange-600 font-medium' : 'text-gray-900'
                      }`}>
                        <Clock size={16} />
                        {new Date(doc.contract_expiration_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
            <button
              onClick={() => onDownload(doc)}
              className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Download size={16} />
              Download Document
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Folder Tree Component
function FolderTree({ 
  folders, 
  expandedFolders, 
  selectedFolder, 
  onToggleFolder, 
  onSelectFolder,
  level = 0 
}: { 
  folders: DocumentFolder[];
  expandedFolders: Set<number>;
  selectedFolder: number | null;
  onToggleFolder: (id: number) => void;
  onSelectFolder: (id: number | null) => void;
  level?: number;
}) {
  return (
    <>
      {folders.map(folder => {
        const hasChildren = folder.children && folder.children.length > 0;
        const isExpanded = expandedFolders.has(folder.id);
        const isSelected = selectedFolder === folder.id;
        
        return (
          <div key={folder.id}>
            <div 
              className={`flex items-center gap-2 py-1 px-2 rounded text-sm cursor-pointer ${
                isSelected 
                  ? 'bg-blue-100 text-blue-700 font-medium' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              style={{ paddingLeft: `${level * 16 + 8}px` }}
              onClick={() => onSelectFolder(folder.id)}
            >
              {hasChildren ? (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFolder(folder.id);
                  }}
                  className="p-0.5 hover:bg-gray-200 rounded"
                >
                  {isExpanded ? '▼' : '►'}
                </button>
              ) : (
                <div className="w-4" />
              )}
              
              <Folder size={14} />
              
              <span className="flex-1 truncate">{folder.name}</span>
              
              {folder.document_count !== undefined && (
                <span className="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                  {folder.document_count}
                </span>
              )}
            </div>
            
            {hasChildren && isExpanded && (
              <FolderTree
                folders={folder.children!}
                expandedFolders={expandedFolders}
                selectedFolder={selectedFolder}
                onToggleFolder={onToggleFolder}
                onSelectFolder={onSelectFolder}
                level={level + 1}
              />
            )}
          </div>
        );
      })}
    </>
  );
}

// Helper function to find folder name by ID
function findFolderName(folders: DocumentFolder[], folderId: number): string {
  for (const folder of folders) {
    if (folder.id === folderId) return folder.name;
    if (folder.children) {
      const found = findFolderName(folder.children, folderId);
      if (found) return found;
    }
  }
  return "Unknown Folder";
}