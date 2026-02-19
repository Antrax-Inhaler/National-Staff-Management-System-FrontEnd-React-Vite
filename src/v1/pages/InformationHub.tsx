import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  User,
  FileText,
  ChevronRight,
  ChevronLeft,
  Filter,
  X,
  Grid,
  List,
  Eye,
  Share2,
  Clock,
  ChevronDown,
  ChevronUp,
  Circle,
  CheckCircle,
  BookOpen,
  Newspaper,
  Bell,
  Shield,
  BarChart3,
  AlertCircle,
  Inbox,
  Mail,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { nationalInformation, type NationalInformation, type Statistics } from '../api/nationalInformation';
import SearchInput from '../components/ui/SearchInput';
import Badge from '../components/ui/Badge';
import { isImageFile } from '../src/utils/fileUtils';
import { toast } from 'react-hot-toast';

interface PaginatedResponse {
  items: NationalInformation[];
  total: number;
  last_page: number;
  current_page: number;
  meta?: {
    total_unread?: number;
    unread_by_type?: Record<string, number>;
    filter_type?: string;
  };
}

// Define static types and categories to avoid errors
const TYPES = ['announcement', 'policy', 'report', 'update', 'news', 'resource', 'event'] as const;
const CATEGORIES = ['general', 'membership', 'events', 'resources', 'policies', 'updates'] as const;

type ArticleType = typeof TYPES[number];
type CategoryType = typeof CATEGORIES[number];

const typeIcons: Record<ArticleType, React.ReactNode> = {
  announcement: <Bell className="w-4 h-4" />,
  policy: <Shield className="w-4 h-4" />,
  report: <BarChart3 className="w-4 h-4" />,
  update: <AlertCircle className="w-4 h-4" />,
  news: <Newspaper className="w-4 h-4" />,
  resource: <BookOpen className="w-4 h-4" />,
  event: <Calendar className="w-4 h-4" />,
};

const typeLabels: Record<ArticleType, string> = {
  announcement: 'Announcement',
  policy: 'Policy',
  report: 'Report',
  update: 'Update',
  news: 'News',
  resource: 'Resource',
  event: 'Event',
};

const typeColors: Record<ArticleType, string> = {
  announcement: 'bg-purple-100 text-purple-800 border border-purple-200',
  policy: 'bg-blue-100 text-blue-800 border border-blue-200',
  report: 'bg-green-100 text-green-800 border border-green-200',
  update: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  news: 'bg-red-100 text-red-800 border border-red-200',
  resource: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
  event: 'bg-pink-100 text-pink-800 border border-pink-200',
};

const defaultImages: Record<ArticleType, string> = {
  announcement: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&auto=format&fit=crop',
  policy: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&auto=format&fit=crop',
  report: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&auto=format&fit=crop',
  news: 'https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?w=400&auto=format&fit=crop',
  resource: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&auto=format&fit=crop',
  event: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&auto=format&fit=crop',
  update: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&auto=format&fit=crop',
};

// Improved share function with navigator.share and fallback
const shareArticle = async (article: NationalInformation) => {
  const shareUrl = `${window.location.origin}/national-information/${article.public_uid}`;
  const title = article.title;
  const text = article.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...';
  
  try {
    if (navigator.share) {
      await navigator.share({
        title,
        text,
        url: shareUrl,
      });
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    }
  } catch (error) {
    if (error instanceof Error && error.name !== 'AbortError') {
      console.error('Share failed:', error);
      toast.error('Failed to share article');
    }
  }
};

export default function NationalInformationView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const initialSearch = searchParams.get('search') || '';
  const initialType = searchParams.get('type')?.split(',') || [];
  const initialCategory = searchParams.get('category')?.split(',') || [];
  const initialView = searchParams.get('view') || 'all'; // 'all' or 'unread'
  
  const [search, setSearch] = useState(initialSearch);
  const [filters, setFilters] = useState<Record<string, string[]>>({
    type: initialType.filter(t => TYPES.includes(t as ArticleType)),
    category: initialCategory.filter(c => CATEGORIES.includes(c as CategoryType)),
  });
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'published_at' | 'title' | 'view_count'>('published_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [currentView, setCurrentView] = useState<'all' | 'unread'>(initialView as 'all' | 'unread');
  
  // Pagination state
  const [page, setPage] = useState(1);
  const perPage = viewMode === 'grid' ? 12 : 20;

  // Update URL parameters on changes
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (search) params.set('search', search);
    if (filters.type.length > 0) params.set('type', filters.type.join(','));
    if (filters.category.length > 0) params.set('category', filters.category.join(','));
    if (currentView !== 'all') params.set('view', currentView);
    
    setSearchParams(params, { replace: true });
  }, [search, filters, currentView, setSearchParams]);

  // Fetch data based on current view
  const fetchData = () => {
    const baseParams = {
      page,
      per_page: perPage,
      search,
      category: filters.category[0] || '',
      sort_by: sortBy,
      sort_order: sortOrder,
    };

    if (currentView === 'unread') {
      // Fetch only unread articles
      return nationalInformation.getUnreadArticles({
        ...baseParams,
        type: filters.type[0] || '', // Optional type filter for unread
      });
    } else {
      // Fetch all articles
      return nationalInformation.list({
        ...baseParams,
        type: filters.type[0] || '',
        status: 'published',
      });
    }
  };

  const { data, isLoading, error, refetch } = useQuery<PaginatedResponse>({
    queryKey: ['national-information', currentView, page, perPage, search, filters, sortBy, sortOrder],
    queryFn: fetchData,
  });

  const { data: stats, error: statsError } = useQuery<Statistics>({
    queryKey: ["national-information-stats"],
    queryFn: () => nationalInformation.statistics(),
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({ type: [], category: [] });
    setSearch('');
    setPage(1);
    if (currentView === 'unread') {
      setCurrentView('all');
    }
  };

  const handleSort = (column: 'published_at' | 'title' | 'view_count') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setPage(1);
  };

  // Handle type filter for unread view
  const handleTypeFilterForUnread = (type: ArticleType) => {
    const unreadCount = getUnreadCount(type);
    if (unreadCount > 0) {
      // Switch to unread view and filter by this type
      setCurrentView('unread');
      setFilters({ type: [type], category: [] });
      setPage(1);
      
      // Update URL
      navigate(`?view=unread&type=${type}`);
    }
  };

  // Handle category filter
  const handleCategoryFilter = (category: CategoryType) => {
    setFilters(prev => {
      const isSelected = prev.category.includes(category);
      if (isSelected) {
        return { ...prev, category: prev.category.filter(c => c !== category) };
      } else {
        return { ...prev, category: [...prev.category, category] };
      }
    });
    setPage(1);
    setShowCategoryDropdown(false);
  };

  // Toggle between all and unread views
  const toggleView = (view: 'all' | 'unread') => {
    setCurrentView(view);
    setPage(1);
    // Reset type filter when switching views unless it's specific unread type
    if (view === 'all') {
      setFilters(prev => ({ ...prev, type: [] }));
    }
  };

  // Get unread counts from stats
  const getUnreadCount = (type: ArticleType): number => {
    if (!stats?.unread_by_type) return 0;
    return stats.unread_by_type[type] || 0;
  };

  // Get total unread count
  const getTotalUnreadCount = (): number => {
    if (!stats?.unread) return 0;
    return stats.unread;
  };

  // Get unread count for current filter (from API response meta)
  const getCurrentUnreadCount = (): number => {
    if (currentView === 'unread' && data?.meta?.total_unread) {
      return data.meta.total_unread;
    }
    return 0;
  };

  // Safe filter count calculation
  const activeFilterCount = (filters?.type?.length || 0) + (filters?.category?.length || 0) + (search ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex flex-col gap-3">
            {/* Title and Stats */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-gray-900">
                  National Information
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Latest announcements, policies, and resources
                </p>
              </div>

              {stats && !statsError && (
                <div className="flex items-center gap-4">
                  <div className="text-sm text-center">
                    <div className="font-semibold text-gray-900">{stats.published || 0}</div>
                    <div className="text-gray-500">Published</div>
                  </div>
                  <div className="text-sm text-center">
                    <div className="font-semibold text-gray-900">{stats.total_views || 0}</div>
                    <div className="text-gray-500">Total Views</div>
                  </div>
                  {/* {getTotalUnreadCount() > 0 && (
                    <button
                      onClick={() => toggleView('unread')}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        currentView === 'unread' 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-purple-100 text-purple-800 border border-purple-200 hover:bg-purple-200'
                      }`}
                    >
                      <Inbox className="w-4 h-4" />
                      <span>{getTotalUnreadCount()} Unread</span>
                    </button>
                  )} */}
                </div>
              )}
            </div>

            {/* View Toggle Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => toggleView('all')}
                className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                  currentView === 'all'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Articles
              </button>
              <button
                onClick={() => toggleView('unread')}
                className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
                  currentView === 'unread'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Mail className="w-4 h-4" />
                Unread Articles
                {getTotalUnreadCount() > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-indigo-500 rounded-full">
                    {getTotalUnreadCount()}
                  </span>
                )}
              </button>
            </div>

            {/* Search Bar and Filter Capsules */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex-1">
                <SearchInput
                  placeholder={`Search ${currentView === 'unread' ? 'unread ' : ''}information...`}
                  value={search}
                  onChange={handleSearch}
                  className="w-full border-gray-300 rounded-lg"
                />
              </div>

              {/* Unread Type Quick Access Buttons */}
              <div className="flex flex-wrap items-center gap-1 md:gap-2">
                {TYPES.map((type) => {
                  const unreadCount = getUnreadCount(type);
                  const isActive = filters.type.includes(type);
                  
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        if (currentView === 'unread' && unreadCount > 0) {
                          handleTypeFilterForUnread(type);
                        } else {
                          // For all view or types with no unread
                          setFilters(prev => {
                            const isSelected = prev.type.includes(type);
                            if (isSelected) {
                              return { ...prev, type: prev.type.filter(t => t !== type) };
                            } else {
                              return { ...prev, type: [...prev.type, type] };
                            }
                          });
                          setPage(1);
                        }
                      }}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                        isActive
                          ? `${typeColors[type]}`
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } ${unreadCount > 0 ? 'ring-1 ring-indigo-500' : ''}`}
                      title={`${unreadCount} unread ${typeLabels[type]}`}
                    >
                      {typeLabels[type]}
                      {unreadCount > 0 && (
                        <span className={`inline-flex items-center justify-center min-w-5 h-5 text-xs rounded-full px-1 ${
                          isActive && currentView === 'unread'
                            ? 'bg-white text-indigo-500 font-bold'
                            : 'bg-indigo-500 text-white font-bold'
                        }`}>
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [col, order] = e.target.value.split('-') as ['published_at' | 'title' | 'view_count', 'asc' | 'desc'];
                      setSortBy(col);
                      setSortOrder(order);
                      setPage(1);
                    }}
                    className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8"
                  >
                    <option value="published_at-desc">Latest First</option>
                    <option value="published_at-asc">Oldest First</option>
                    <option value="title-asc">Title A-Z</option>
                    <option value="title-desc">Title Z-A</option>
                    <option value="view_count-desc">Most Viewed</option>
                    <option value="view_count-asc">Least Viewed</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
                </div>

                {/* Category Filter Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-1"
                  >
                    <Filter size={16} />
                    Category
                    {filters.category.length > 0 && (
                      <span className="ml-1 flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
                        {filters.category.length}
                      </span>
                    )}
                  </button>
                  
                  {showCategoryDropdown && (
                    <div className="absolute right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[120px]">
                      {CATEGORIES.map((category) => (
                        <button
                          key={category}
                          onClick={() => handleCategoryFilter(category)}
                          className={`block w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 ${
                            filters.category.includes(category) 
                              ? 'bg-blue-50 text-blue-700 font-medium' 
                              : 'text-gray-700'
                          }`}
                        >
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Active Filters Display */}
            {activeFilterCount > 0 && (
              <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-100 rounded">
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-xs font-medium text-blue-700">Active:</span>
                  {currentView === 'unread' && (
                    <Badge variant="primary" className="rounded-full">
                      Unread Only
                      <button
                        onClick={() => toggleView('all')}
                        className="ml-0.5 hover:text-indigo-500"
                      >
                        <X size={10} />
                      </button>
                    </Badge>
                  )}
                  {filters.type.map((type) => (
                    <Badge key={type} variant="primary" className="rounded-full">
                      {typeLabels[type as ArticleType] || type}
                      <button
                        onClick={() => setFilters(prev => ({
                          ...prev,
                          type: prev.type.filter(t => t !== type)
                        }))}
                        className="ml-0.5 hover:text-blue-800"
                      >
                        <X size={10} />
                      </button>
                    </Badge>
                  ))}
                  {filters.category.map((category) => (
                    <Badge key={category} variant="success" className="rounded-full">
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                      <button
                        onClick={() => setFilters(prev => ({
                          ...prev,
                          category: prev.category.filter(c => c !== category)
                        }))}
                        className="ml-0.5 hover:text-green-800"
                      >
                        <X size={10} />
                      </button>
                    </Badge>
                  ))}
                  {search && (
                    <Badge variant="gray" className="rounded-full">
                      Search: "{search}"
                      <button
                        onClick={() => setSearch('')}
                        className="ml-0.5 hover:text-gray-800"
                      >
                        <X size={10} />
                      </button>
                    </Badge>
                  )}
                </div>
                <button
                  onClick={handleResetFilters}
                  className="text-xs font-medium text-red-600 hover:text-red-800 whitespace-nowrap"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="px-4 py-6">
        {/* Compact Stats Cards */}
        {stats && !statsError && (
          <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4">
            {(['announcement', 'policy', 'news', 'resource'] as ArticleType[]).map((type) => (
              <CompactStatCard
                key={type}
                title={typeLabels[type]}
                value={stats.by_type?.[type] || 0}
                unreadCount={getUnreadCount(type)}
                icon={typeIcons[type]}
                type={type}
                onClick={() => handleTypeFilterForUnread(type)}
              />
            ))}
          </div>
        )}

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Compact Header */}
          <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  {currentView === 'unread' ? (
                    <>
                      <Mail className="inline w-4 h-4 mr-1 text-purple-600" />
                      Unread Articles
                      {getCurrentUnreadCount() > 0 && (
                        <span className="ml-2 px-2 py-1 text-xs font-bold text-white bg-indigo-500 rounded-full">
                          {getCurrentUnreadCount()} articles
                        </span>
                      )}
                    </>
                  ) : (
                    'All Articles'
                  )}
                </span>
                {data && !error && (
                  <span className="text-xs text-gray-500">
                    (Page {page} of {data.last_page || 1})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1 || isLoading}
                  className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-medium text-gray-700 px-1">
                  {page}/{data?.last_page || 1}
                </span>
                <button
                  onClick={() => setPage(prev => Math.min(data?.last_page || 1, prev + 1))}
                  disabled={page === data?.last_page || isLoading}
                  className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <LoadingSkeleton viewMode={viewMode} />
          ) : error ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load data</h3>
              <p className="text-gray-600 mb-4">Please try again later</p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <GridView articles={data?.items || []} currentView={currentView} />
          ) : (
            <TableView 
              articles={data?.items || []}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
              currentView={currentView}
            />
          )}

          {/* Compact Pagination */}
          {data && data.last_page > 1 && !error && (
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-600">
                  Page {page} of {data.last_page} • {data.total || 0} total articles
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    disabled={page === 1}
                    className="px-2 py-1 text-xs text-gray-700 bg-white border rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(prev => Math.min(data.last_page, prev + 1))}
                    disabled={page === data.last_page}
                    className="px-2 py-1 text-xs text-gray-700 bg-white border rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {!isLoading && !error && (!data?.items || data.items.length === 0) && (
          <div className="py-12 text-center">
            {currentView === 'unread' ? (
              <>
                <Mail className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="mb-2 text-lg font-semibold text-gray-900">No unread articles</h3>
                <p className="text-gray-600 mb-4">
                  You've read all available articles!
                </p>
                <button
                  onClick={() => toggleView('all')}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                >
                  View All Articles
                </button>
              </>
            ) : (
              <>
                <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="mb-2 text-lg font-semibold text-gray-900">No information found</h3>
                <p className="text-gray-600 mb-4">
                  {search ? `No results for "${search}"` : 'No articles available'}
                </p>
                {search && (
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Clear Search
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Enhanced Compact Stat Card Component with clickable unread count
function CompactStatCard({ 
  title, 
  value, 
  unreadCount, 
  icon, 
  type,
  onClick 
}: {
  title: string;
  value: number;
  unreadCount: number;
  icon: React.ReactNode;
  type: ArticleType;
  onClick: () => void;
}) {
  return (
    <div 
      onClick={onClick}
      className={`p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow cursor-pointer ${
        unreadCount > 0 ? 'ring-1 ring-purple-200 hover:ring-purple-300' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${typeColors[type]}`}>
            {icon}
          </div>
          <div>
            <div className="text-xs text-gray-600">{title}</div>
            <div className="text-lg font-bold text-gray-900">{value}</div>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="px-2 py-1 text-xs font-bold text-white bg-indigo-500 rounded-full hover:bg-purple-600 transition-colors"
          >
            {unreadCount} unread
          </button>
        )}
      </div>
    </div>
  );
}

// Grid View Component
function GridView({ articles, currentView }: { articles: NationalInformation[], currentView: 'all' | 'unread' }) {
  return (
    <div className="p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} currentView={currentView} />
        ))}
      </div>
    </div>
  );
}

// Table View Component
function TableView({ articles, sortBy, sortOrder, onSort, currentView }: {
  articles: NationalInformation[];
  sortBy: string;
  sortOrder: string;
  onSort: (column: 'published_at' | 'title' | 'view_count') => void;
  currentView: 'all' | 'unread';
}) {
  const SortIcon = ({ column }: { column: string }) => (
    <button
      onClick={() => onSort(column as any)}
      className="inline-flex items-center ml-1"
    >
      {sortBy === column ? (
        sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
      ) : (
        <div className="flex flex-col -space-y-1">
          <ChevronUp className="w-2.5 h-2.5 text-gray-400" />
          <ChevronDown className="w-2.5 h-2.5 text-gray-400" />
        </div>
      )}
    </button>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
              <div className="flex items-center">
                Type
                <SortIcon column="type" />
              </div>
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
              <div className="flex items-center">
                Title
                <SortIcon column="title" />
              </div>
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
              Category
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
              <div className="flex items-center">
                Published
                <SortIcon column="published_at" />
              </div>
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
              <div className="flex items-center">
                Views
                <SortIcon column="view_count" />
              </div>
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {articles.map((article) => (
            <tr key={article.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded ${typeColors[article.type as ArticleType] || 'bg-gray-100'}`}>
                    {typeIcons[article.type as ArticleType] || <FileText className="w-3 h-3" />}
                  </div>
                  <span className="text-xs font-medium">
                    {typeLabels[article.type as ArticleType] || article.type}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3">
                <Link
                  to={`/national-information/${article.public_uid}`}
                  className="block"
                >
                  <div className="flex items-start gap-2">
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 hover:text-blue-600 truncate flex items-center gap-1">
                        {article.title}
                        {article.is_unread && (
                          <span className="inline-flex items-center">
                            <Circle className="w-2 h-2 text-blue-500 animate-pulse" />
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {article.content.replace(/<[^>]*>/g, '').substring(0, 50)}...
                      </div>
                    </div>
                  </div>
                </Link>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="inline-block px-2 py-1 text-xs text-gray-700 bg-gray-100 rounded">
                  {article.category || 'General'}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-xs text-gray-900">
                  {article.published_at ? format(new Date(article.published_at), 'MMM dd') : '-'}
                </div>
                <div className="text-xs text-gray-500">
                  {article.published_at ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true }) : ''}
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3 text-gray-400" />
                  <span className="font-medium">{article.view_count || 0}</span>
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => shareArticle(article)}
                    className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Share2 className="w-3 h-3" />
                  </button>
                  {article.is_unread ? (
                    <Circle className="w-3 h-3 text-blue-500" />
                  ) : (
                    <CheckCircle className="w-3 h-3 text-gray-400" />
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Article Card Component with opacity gradient for images
function ArticleCard({ article, currentView }: { article: NationalInformation, currentView: 'all' | 'unread' }) {
  const imageAttachments = article.attachments?.filter(att => 
    isImageFile(att.file_name)
  ) || [];

  const defaultImage = defaultImages[article.type as ArticleType] || defaultImages.announcement;

  return (
    <div className="group relative bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow overflow-hidden">
      {/* Unread indicator */}
      {article.is_unread && (
        <div className="absolute top-3 right-3 z-10">
          <div className="relative">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
            <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-75"></div>
          </div>
        </div>
      )}

      {/* Image with opacity gradient overlay */}
      <div className="relative h-40 overflow-hidden bg-gray-100">
        {imageAttachments.length > 0 ? (
          <div className="relative h-full">
            <img
              src={imageAttachments[0].file_url}
              alt={article.title}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = defaultImage;
              }}
            />
            {/* Enhanced opacity gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-white/10"></div>
            {/* Additional radial gradient for better aesthetics */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-black/5 to-transparent"></div>
          </div>
        ) : (
          <div className="relative h-full">
            <img
              src={defaultImage}
              alt={article.title}
              className="object-cover w-full h-full opacity-90"
              loading="lazy"
            />
            {/* Enhanced opacity gradient overlay for default images */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/50 via-transparent to-white/20"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/10 to-transparent"></div>
          </div>
        )}
        {/* Type badge on image with improved visibility */}
        <div className="absolute bottom-2 left-2">
          <span className={`px-2 py-1 text-xs font-medium rounded backdrop-blur-sm bg-white ${
            typeColors[article.type as ArticleType]?.split(' ')[1] || 'text-gray-800'
          }`}>
            {typeLabels[article.type as ArticleType] || article.type}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <User className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-600 truncate max-w-[120px]">{article.author}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Eye className="w-3 h-3" />
            <span>{article.view_count || 0}</span>
          </div>
        </div>

        <h3 className="mb-2 font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600">
          <Link to={`/national-information/${article.public_uid}`}>
            {article.title}
          </Link>
        </h3>

        <p className="mb-3 text-sm text-gray-600 line-clamp-2">
          {article.content.replace(/<[^>]*>/g, '')}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(article.published_at || article.created_at), { addSuffix: true })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => shareArticle(article)}
              className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <Link
              to={`/national-information/${article.public_uid}`}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Read
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading Skeleton Component
function LoadingSkeleton({ viewMode }: { viewMode: 'grid' | 'table' }) {
  if (viewMode === 'grid') {
    return (
      <div className="p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="h-40 bg-gray-200 animate-pulse"></div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-10 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="w-3/4 h-5 mb-2 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-full h-3 mb-1 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-4/5 h-3 mb-3 bg-gray-200 rounded animate-pulse"></div>
                <div className="flex items-center justify-between">
                  <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-12 h-6 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center p-3 bg-gray-50 rounded animate-pulse">
            <div className="w-8 h-8 mr-3 bg-gray-300 rounded"></div>
            <div className="flex-1">
              <div className="w-3/4 h-4 mb-2 bg-gray-300 rounded"></div>
              <div className="w-1/2 h-3 bg-gray-200 rounded"></div>
            </div>
            <div className="w-16 h-6 ml-3 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}