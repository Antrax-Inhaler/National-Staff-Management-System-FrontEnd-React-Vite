import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  X, 
  Users, 
  Building, 
  FileText, 
  ExternalLink,
  Link as LinkIcon,
  Info,
  Globe,
  History,
  Clock,
  Zap,
  Tag,
  Eye
} from "lucide-react";
import { dashboard } from "../api/dashboard";
import DocumentViewerModal from "../components/search/DocumentViewerModal";

interface SearchResult {
  type: 'member' | 'affiliate' | 'document' | 'link' | 'national_information';
  score: number;
  data: {
    public_uid?: string;
    id: number;
    name: string;
    email?: string;
    phone?: string;
    type?: string;
    first_name?: string;
    last_name?: string;
    member_id?: string;
    level?: string;
    status?: string;
    work_email?: string;
    work_phone?: string;
    address_line1?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    profile_photo_url?: string | null;
    affiliate_name?: string;
    affiliate_logo_url?: string | null;
    result_type?: string;
    affiliate_type?: string;
    member_count?: number;
    title?: string;
    category?: string;
    description?: string;
    category_group?: string;
    url?: string;
    is_public?: boolean;
    is_active?: boolean;
    display_order?: number;
    info_type?: string;
    content?: string;
    content_preview?: string;
    author?: string;
    published_at?: string;
    attachment_count?: number;
    attachments?: Array<{
      id: number;
      file_name: string;
      file_size: number;
      download_url?: string;
      created_at?: string;
    }>;
    created_at?: string;
    updated_at?: string;
  };
}

interface SearchSuggestion {
  id: string;
  type: 'keyword';
  text: string;
  description?: string;
  route?: string;
  icon: React.ReactNode;
  keywords?: string[];
}

interface SearchHistoryItem {
  id: string;
  term: string;
  timestamp: number;
  resultCount: number;
  searchCount: number;
}

const UniversalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [keywordResults, setKeywordResults] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Helper function to check if search terms are similar
  const areTermsSimilar = (term1: string, term2: string): boolean => {
    const t1 = term1.toLowerCase().trim();
    const t2 = term2.toLowerCase().trim();
    
    // If terms are the same
    if (t1 === t2) return true;
    
    // If one term is contained within the other (and similar length)
    if (t1.includes(t2) && t1.length - t2.length <= 2) return true;
    if (t2.includes(t1) && t2.length - t1.length <= 2) return true;
    
    // Check for common prefixes (like "jove" and "joven")
    const minLength = Math.min(t1.length, t2.length);
    if (minLength >= 3) {
      // Check if terms share a common prefix
      const commonPrefix = t1.substring(0, Math.min(4, minLength)) === t2.substring(0, Math.min(4, minLength));
      if (commonPrefix && Math.abs(t1.length - t2.length) <= 2) return true;
    }
    
    return false;
  };

  // Find similar terms in history
  const findSimilarTerm = (term: string): SearchHistoryItem | null => {
    const normalizedTerm = term.toLowerCase().trim();
    
    // First, check for exact match
    const exactMatch = searchHistory.find(item => 
      item.term.toLowerCase().trim() === normalizedTerm
    );
    if (exactMatch) return exactMatch;
    
    // Check for similar terms
    for (const item of searchHistory) {
      if (areTermsSimilar(item.term, term)) {
        return item;
      }
    }
    
    return null;
  };

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setSearchHistory(parsed);
      } catch (e) {
        console.error('Failed to load search history:', e);
      }
    }
  }, []);

  // Save search history to localStorage
  useEffect(() => {
    if (searchHistory.length > 0) {
      localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    }
  }, [searchHistory]);

  // Keyword-based suggestions
  const keywordSuggestions: SearchSuggestion[] = [
    {
      id: 'members',
      type: 'keyword',
      text: 'Members',
      description: 'Manage and browse all affiliate members',
      route: '/members',
      icon: <Users size={14} />,
      keywords: ['members', 'member management', 'member roster']
    },
    {
      id: 'affiliates',
      type: 'keyword',
      text: 'Affiliates',
      description: 'Manage affiliate organizations',
      route: '/affiliates',
      icon: <Building size={14} />,
      keywords: ['affiliates', 'affiliate management', 'organizations']
    },
    {
      id: 'research-docs',
      type: 'keyword',
      text: 'Research Documents',
      description: 'Research materials and document library',
      route: '/research-documents',
      icon: <FileText size={14} />,
      keywords: ['research documents', 'research materials']
    },
    {
      id: 'governance-docs',
      type: 'keyword',
      text: 'Governance Documents',
      description: 'Policies and procedures',
      route: '/governance-documents',
      icon: <FileText size={14} />,
      keywords: ['governance documents', 'policies', 'procedures']
    },
    {
      id: 'national-info',
      type: 'keyword',
      text: 'National Information',
      description: 'Announcements, news, and events',
      route: '/national-information',
      icon: <Info size={14} />,
      keywords: ['national information', 'announcements', 'news']
    },
    {
      id: 'leader-roster',
      type: 'keyword',
      text: 'National Leaders',
      description: 'View national leadership roles',
      route: '/leader-roster',
      icon: <Users size={14} />,
      keywords: ['national leaders', 'leadership', 'roles']
    },
    {
      id: 'officers',
      type: 'keyword',
      text: 'Affiliate Officers',
      description: 'Manage officer positions',
      route: '/officers',
      icon: <Users size={14} />,
      keywords: ['affiliate officers', 'officer management']
    },
    {
      id: 'links',
      type: 'keyword',
      text: 'Link Directory',
      description: 'Access important links',
      route: '/links',
      icon: <LinkIcon size={14} />,
      keywords: ['links', 'link directory', 'resources']
    },
    {
      id: 'audit-logs',
      type: 'keyword',
      text: 'Audit Logs',
      description: 'View system activity',
      route: '/audit-logs',
      icon: <History size={14} />,
      keywords: ['audit logs', 'audit trail', 'activity logs']
    },
    {
      id: 'dashboard',
      type: 'keyword',
      text: 'Dashboard',
      description: 'Main dashboard overview',
      route: '/dashboard',
      icon: <Globe size={14} />,
      keywords: ['dashboard', 'overview', 'home page']
    }
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Generate keyword suggestions based on search term
  useEffect(() => {
    if (searchTerm.trim().length === 0) {
      setKeywordResults([]);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    
    const matchedKeywords = keywordSuggestions.filter(suggestion => {
      return (
        suggestion.text.toLowerCase().includes(searchLower) ||
        suggestion.description?.toLowerCase().includes(searchLower) ||
        suggestion.keywords?.some(keyword => 
          keyword.toLowerCase().includes(searchLower)
        )
      );
    });

    setKeywordResults(matchedKeywords.slice(0, 5));
  }, [searchTerm]);

  const handleDocumentClick = (result: SearchResult) => {
    // Store document data for the modal
    setSelectedDocument(result.data);
    setSelectedDocumentId(result.data.id);
    
    // Open the modal instead of navigating
    setDocumentModalOpen(true);
    
    // Close the search dropdown
    setIsOpen(false);
    setSearchTerm("");
    setSearchResults([]);
    setKeywordResults([]);
  };

  const performSearch = async (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log("Searching for:", term);
      
      const response = await dashboard.universalSearch(term, 'all', 10);
      console.log("Universal Search Response:", response);
      
      let results: SearchResult[] = [];
      if (response && Array.isArray(response.results)) {
        results = response.results.map((item: any) => ({
          type: item.type,
          score: item.score || 100,
          data: item.data
        }));
      } else if (Array.isArray(response)) {
        results = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        results = response.data;
      }
      
      setSearchResults(results);
      
      // Smart history management
      if (results.length > 0) {
        const similarItem = findSimilarTerm(term);
        
        if (similarItem) {
          // Update existing similar term with newer information
          setSearchHistory(prev => {
            const newHistory = prev.filter(item => item.id !== similarItem.id);
            const updatedItem: SearchHistoryItem = {
              ...similarItem,
              term: term.length > similarItem.term.length ? term : similarItem.term, // Keep the longer/more specific term
              timestamp: Date.now(),
              resultCount: results.length,
              searchCount: similarItem.searchCount + 1
            };
            return [updatedItem, ...newHistory].slice(0, 20);
          });
        } else {
          // Add new search term
          const historyItem: SearchHistoryItem = {
            id: Date.now().toString(),
            term: term,
            timestamp: Date.now(),
            resultCount: results.length,
            searchCount: 1
          };
          
          setSearchHistory(prev => {
            // Group similar terms before adding new one
            const groupedHistory = groupSimilarTerms([historyItem, ...prev]);
            return groupedHistory.slice(0, 20);
          });
        }
      }
      
    } catch (error: any) {
      console.error('Search error:', error);
      setError(error.message || "Failed to search");
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Group similar terms in history
  const groupSimilarTerms = (history: SearchHistoryItem[]): SearchHistoryItem[] => {
    const grouped: SearchHistoryItem[] = [];
    const usedIds = new Set<string>();
    
    for (let i = 0; i < history.length; i++) {
      if (usedIds.has(history[i].id)) continue;
      
      const currentItem = history[i];
      let group = [currentItem];
      usedIds.add(currentItem.id);
      
      // Find similar items
      for (let j = i + 1; j < history.length; j++) {
        if (usedIds.has(history[j].id)) continue;
        
        if (areTermsSimilar(currentItem.term, history[j].term)) {
          group.push(history[j]);
          usedIds.add(history[j].id);
        }
      }
      
      // Merge similar items
      if (group.length > 1) {
        // Sort by search count and recency
        group.sort((a, b) => {
          if (b.searchCount !== a.searchCount) {
            return b.searchCount - a.searchCount;
          }
          return b.timestamp - a.timestamp;
        });
        
        // Use the most popular/recent term
        const bestTerm = group[0];
        const mergedItem: SearchHistoryItem = {
          ...bestTerm,
          term: bestTerm.term,
          searchCount: group.reduce((sum, item) => sum + item.searchCount, 0),
          timestamp: Math.max(...group.map(item => item.timestamp))
        };
        grouped.push(mergedItem);
      } else {
        grouped.push(currentItem);
      }
    }
    
    // Sort by recency
    return grouped.sort((a, b) => b.timestamp - a.timestamp);
  };

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      performSearch(searchTerm);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setSearchTerm("");
    setSearchResults([]);
    setKeywordResults([]);
    
    console.log("Clicked result:", result);
    
    switch (result.type) {
      case 'member':
        const memberPublicUid = result.data.public_uid;
        navigate(memberPublicUid ? `/members/${memberPublicUid}` : `/members/${result.data.id}`);
        break;
        
      case 'affiliate':
        const affiliatePublicUid = result.data.public_uid;
        navigate(affiliatePublicUid ? `/affiliates/${affiliatePublicUid}/members` : `/affiliates/${result.data.id}/members`);
        break;
        
      case 'document':
        // Use the new modal for document viewing
        handleDocumentClick(result);
        break;
        
      case 'link':
        if (result.data.url) {
          if (result.data.url.startsWith('http://') || result.data.url.startsWith('https://')) {
            window.open(result.data.url, '_blank', 'noopener noreferrer');
          } else {
            navigate(result.data.url);
          }
        } else {
          navigate(`/links/${result.data.id}`);
        }
        break;
        
      case 'national_information':
        navigate(`/national-information/${result.data.id}`);
        break;
        
      default:
        console.warn("Unknown result type:", result.type);
    }
  };

  const handleKeywordClick = (suggestion: SearchSuggestion) => {
    setIsOpen(false);
    setSearchTerm("");
    setSearchResults([]);
    setKeywordResults([]);
    
    if (suggestion.route) {
      navigate(suggestion.route);
    }
  };

  const handleHistoryClick = (term: string) => {
    setSearchTerm(term);
    performSearch(term);
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  const getResultDisplayName = (result: SearchResult) => {
    const data = result.data;
    
    switch (result.type) {
      case 'member':
        if (data.name) return data.name;
        if (data.first_name || data.last_name) {
          return `${data.first_name || ''} ${data.last_name || ''}`.trim();
        }
        return 'Unknown Member';
        
      case 'affiliate':
        return data.name || data.affiliate_name || 'Unknown Affiliate';
        
      case 'document':
        return data.title || data.name || 'Unknown Document';
        
      case 'link':
        return data.title || data.name || 'Unknown Link';
        
      case 'national_information':
        return data.title || data.name || 'Unknown Information';
        
      default:
        return 'Unknown';
    }
  };

  const getResultDetails = (result: SearchResult) => {
    const data = result.data;
    
    switch (result.type) {
      case 'member':
        return {
          id: data.member_id || 'Member',
          subtitle: `${data.affiliate_name || ''} • ${data.city || ''}, ${data.state || ''}`.trim(),
        };
        
      case 'affiliate':
        return {
          id: data.affiliate_type || 'Affiliate',
          subtitle: `${data.member_count || 0} members • ${data.city || ''}, ${data.state || ''}`.trim(),
        };
        
      case 'document':
        const documentCategoryGroup = data.category_group?.toLowerCase();
        const pageName = documentCategoryGroup === 'research' ? 'Research' : 
                        documentCategoryGroup === 'governance' ? 'Governance' : 'Document';
        
        return {
          id: pageName,
          subtitle: `${data.category || ''} • ${data.affiliate_name || ''}`.trim(),
        };
        
      case 'link':
        let domain = '';
        if (data.url) {
          try {
            domain = new URL(data.url).hostname;
          } catch (e) {
            domain = 'External link';
          }
        }
        return {
          id: data.category || 'Link',
          subtitle: `${data.affiliate_name || 'National'} • ${domain}`,
        };
        
      case 'national_information':
        const type = data.info_type ? data.info_type.charAt(0).toUpperCase() + data.info_type.slice(1) : 'Info';
        const date = data.published_at ? new Date(data.published_at).toLocaleDateString() : '';
        return {
          id: type,
          subtitle: `${data.category || ''} • ${date}`.trim(),
        };
        
      default:
        return { id: '', subtitle: '' };
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'member': return <Users size={14} />;
      case 'affiliate': return <Building size={14} />;
      case 'document': return <FileText size={14} />;
      case 'link': return <LinkIcon size={14} />;
      case 'national_information': return <Info size={14} />;
      default: return <Globe size={14} />;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'member': return 'text-blue-600';
      case 'affiliate': return 'text-green-600';
      case 'document': return 'text-purple-600';
      case 'link': return 'text-orange-600';
      case 'national_information': return 'text-indigo-600';
      default: return 'text-gray-600';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'member': return 'bg-blue-100 text-blue-800';
      case 'affiliate': return 'bg-green-100 text-green-800';
      case 'document': return 'bg-purple-100 text-purple-800';
      case 'link': return 'bg-orange-100 text-orange-800';
      case 'national_information': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case 'member': return 'Member';
      case 'affiliate': return 'Affiliate';
      case 'document': return 'Document';
      case 'link': return 'Link';
      case 'national_information': return 'National Info';
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const renderDatabaseResults = () => {
    if (searchResults.length === 0) return null;

    return (
      <>
        <div className="px-3 py-2">
          <div className="text-xs font-medium text-gray-700">
            {searchResults.length} results found
          </div>
        </div>
        
        <div className="py-1">
          {searchResults.map((result, index) => {
            const displayName = getResultDisplayName(result);
            const details = getResultDetails(result);
            const typeDisplay = getTypeDisplayName(result.type);
            
            return (
              <div
                key={`${result.type}-${result.data.id || index}`}
                className="flex items-start gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors group"
              >
                <div 
                  className={`flex-shrink-0 mt-1 ${getIconColor(result.type)}`}
                  onClick={() => handleResultClick(result)}
                >
                  {getIconForType(result.type)}
                </div>
                
                <div 
                  className="flex-1 min-w-0"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${getTypeBadgeColor(result.type)}`}>
                      {typeDisplay}
                    </span>
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {displayName}
                    </div>
                  </div>
                  
                  {details.subtitle && (
                    <div className="text-xs text-gray-600 mt-1 truncate">
                      {details.subtitle}
                    </div>
                  )}
                  
                  {result.type === 'link' && result.data.url && (
                    <div className="text-xs text-blue-600 mt-1 truncate">
                      {result.data.url.length > 40 
                        ? result.data.url.substring(0, 40) + '...' 
                        : result.data.url}
                    </div>
                  )}
                  
                  {result.type === 'national_information' && result.data.content_preview && (
                    <div className="text-xs text-gray-500 mt-1 truncate">
                      {result.data.content_preview}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {result.type === 'document' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDocumentClick(result);
                      }}
                      className="hidden group-hover:flex items-center gap-1 px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                      title="View document"
                    >
                      <Eye size={10} />
                      View
                    </button>
                  )}
                  <div 
                    onClick={() => handleResultClick(result)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <ExternalLink size={12} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  const renderKeywordSuggestions = () => {
    if (keywordResults.length === 0) return null;

    return (
      <div className="border-t border-gray-100">
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Zap size={12} />
            <span>Quick Access</span>
          </div>
        </div>
        
        <div className="py-1">
          {keywordResults.map((suggestion) => (
            <div
              key={suggestion.id}
              onClick={() => handleKeywordClick(suggestion)}
              className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="text-blue-500">
                {suggestion.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">
                  {suggestion.text}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {suggestion.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Get grouped history for display
  const displayHistory = groupSimilarTerms(searchHistory).slice(0, 5);

  return (
    <div ref={searchRef} className="relative flex-1 max-w-md">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search members, affiliates, documents, links, info..."
          className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors"
        />
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm("");
              setSearchResults([]);
              setKeywordResults([]);
              setError(null);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute z-60 w-full mt-1 bg-white rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {/* Show history when search is empty */}
          {searchTerm.length === 0 && displayHistory.length > 0 && (
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <History size={12} />
                  <span>Recent Searches</span>
                </div>
                <button
                  onClick={clearSearchHistory}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Clear all
                </button>
              </div>
              {displayHistory.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleHistoryClick(item.term)}
                  className="flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-50 rounded transition-colors"
                >
                  <Clock size={12} className="text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-900 truncate">
                      {item.term}
                      {item.searchCount > 1 && (
                        <span className="ml-2 text-xs text-gray-400">
                          ({item.searchCount} searches)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.resultCount} results • {new Date(item.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchHistory(prev => prev.filter(h => h.id !== item.id));
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="p-4">
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-sm text-gray-600">Searching...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="p-4 text-center">
              <X size={20} className="mx-auto mb-2 text-red-400" />
              <p className="text-sm text-gray-600">Search error: {error}</p>
              <p className="text-xs text-gray-500 mt-1">Please try again</p>
            </div>
          )}

          {/* Database Results with Keyword Suggestions */}
          {!loading && !error && searchTerm.length >= 2 && (
            <>
              {renderDatabaseResults()}
              {renderKeywordSuggestions()}
              
              {searchResults.length === 0 && keywordResults.length === 0 && (
                <div className="p-4 text-center">
                  <Search size={20} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-600">No results found for "{searchTerm}"</p>
                  <p className="text-xs text-gray-500 mt-1">Try different keywords</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={documentModalOpen}
        onClose={() => setDocumentModalOpen(false)}
        documentData={selectedDocument}
        documentId={selectedDocumentId}
      />
    </div>
  );
};

export default UniversalSearch;