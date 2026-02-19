// src/pages/help/HelpVideos.tsx
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient, useIsFetching } from "@tanstack/react-query";
import {
  Play,
  Clock,
  Eye,
  Calendar,
  List,
  Folder,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  LoaderCircle,
  Video,
  Filter,
  RefreshCcw,
  LayoutGrid,
  Rows3,
} from "lucide-react";
import { helpVideos } from "@v1/api/helpVideos";
import type { HelpVideo } from "@v1/types/helpVideos";
import Badge from "@v1/components/ui/Badge";
import SearchInput from "@v1/components/ui/SearchInput";
import RoleGuard from "@v1/components/RoleGuard";
import { National_Roles, Committees, Roles } from "@v1/constants/roles";
import ConfirmationPopUp from "@v1/components/ui/ConfirmationPopUp";
import Modal from "@v1/components/ui/Modal";
import { useAuth } from "@v1/contexts/AuthContext";
import toast from "react-hot-toast";
import { ActionButton } from "@v1/components/ui/ActionButton";
import UploadVideoModal from "@v1/components/help-videos/UploadVideoModal";
import EditVideoModal from "@v1/components/help-videos/EditVideoModal";
import { useSearchParams, useNavigate } from "react-router-dom";
import type { Column } from "@v1/components/ui/DataTable";
import DataTable from "@v1/components/ui/tables/DataTable";
import type { PaginatedData } from "@v1/types";
import { simpleFormatDate } from "@v1/helpers/simpleDateUtils";

interface HelpVideoFilters {
  category: string;
  search: string;
  page: number;
  per_page: number;
  sort_by: string;
  sort_order: string;
}

// Utility function to extract video thumbnail from URL
const extractVideoThumbnail = (videoUrl: string): string | null => {
  if (!videoUrl) return null;
  
  try {
    // For YouTube URLs
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      const videoId = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId[1]}/hqdefault.jpg`;
      }
    }
    
    // For Vimeo URLs
    if (videoUrl.includes('vimeo.com')) {
      const videoId = videoUrl.match(/vimeo\.com\/(\d+)/);
      if (videoId) {
        return `https://vumbnail.com/${videoId[1]}.jpg`;
      }
    }
    
    // For signed URLs or local videos, return null (use fallback)
    return null;
  } catch (error) {
    console.error('Error extracting thumbnail:', error);
    return null;
  }
};

// Component to calculate duration from video URL
const VideoDuration = ({ videoUrl, duration }: { videoUrl: string; duration?: string | null }) => {
  const [calculatedDuration, setCalculatedDuration] = useState<string | null>(null);

  useEffect(() => {
    const formatDuration = (dur: string | number | null): string => {
      if (!dur) return '--:--';
      
      // If duration is already in HH:MM:SS or MM:SS format
      if (typeof dur === 'string' && dur.includes(':')) {
        return dur;
      }
      
      // If duration is in seconds (number or string)
      const totalSeconds = typeof dur === 'string' ? parseInt(dur) : dur;
      if (isNaN(totalSeconds)) return '--:--';
      
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    if (duration) {
      // Use provided duration if available
      setCalculatedDuration(formatDuration(duration));
    } else {
      setCalculatedDuration('--:--');
    }
  }, [videoUrl, duration]);

  return <span>{calculatedDuration || '--:--'}</span>;
};

// DataTable columns
const columns: Column<HelpVideo>[] = [
  {
    key: "title",
    header: "Title",
    accessor: (row: HelpVideo) => (
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0 w-24">
          <div className="relative overflow-hidden bg-gray-100 rounded aspect-video">
            {row.thumbnail_url || row.thumbnail ? (
              <img
                src={row.thumbnail_url || row.thumbnail}
                alt={row.title}
                className="object-cover w-full h-full"
                crossOrigin="anonymous"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  // Show fallback div by default if img fails
                  const parent = target.parentElement;
                  if (parent) {
                    const fallback = parent.querySelector('.thumbnail-fallback');
                    if (fallback) {
                      (fallback as HTMLElement).style.display = 'flex';
                    }
                  }
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 thumbnail-fallback">
                <Video className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
        </div>
        <div className="min-w-0">
          <div className="font-medium text-gray-900 line-clamp-1">{row.title}</div>
          <div className="text-xs text-gray-500 line-clamp-2">{row.description}</div>
        </div>
      </div>
    ),
  },
  {
    key: "category",
    header: "Category",
    accessor: (row: HelpVideo) => (
      <Badge variant="gray" size="sm">
        {row.category}
      </Badge>
    ),
  },
  {
    key: "views",
    header: "Views",
    accessor: (row: HelpVideo) => (
      <div className="flex items-center gap-1">
        <Eye size={14} className="text-gray-400" />
        <span>{row.view_count}</span>
      </div>
    ),
  },
  {
    key: "duration",
    header: "Duration",
    accessor: (row: HelpVideo) => (
      <VideoDuration videoUrl={row.video_url} duration={row.duration} />
    ),
  },
  {
    key: "created_at",
    header: "Upload Date",
    accessor: (row: HelpVideo) => simpleFormatDate(row.created_at),
  },
];

// Card component for HelpVideo
const VideoCard = ({
  video,
  onPlay,
  onEdit,
  onDelete,
  isDeleting,
  deleteId,
  canEdit,
  canDelete,
}: {
  video: HelpVideo;
  onPlay: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  deleteId: number | null;
  canEdit: boolean;
  canDelete: boolean;
}) => {
  const thumbnailUrl = video.thumbnail_url || video.thumbnail || 
    extractVideoThumbnail(video.video_url);

  return (
    <div className="flex flex-col h-full p-3 transition-all duration-200 bg-white border border-gray-200 rounded-lg hover:shadow-sm hover:border-blue-200">
      {/* Video Thumbnail */}
      <div 
        className="relative mb-3 overflow-hidden bg-gray-100 rounded-lg cursor-pointer aspect-video group"
        onClick={onPlay}
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={video.title}
            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
            crossOrigin="anonymous"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                const fallback = parent.querySelector('.video-thumbnail-fallback');
                if (fallback) {
                  (fallback as HTMLElement).style.display = 'flex';
                }
              }
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 video-thumbnail-fallback">
            <Video className="w-12 h-12 text-gray-400" />
          </div>
        )}
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center transition-opacity opacity-0 bg-black/30 group-hover:opacity-100">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/90">
            <Play className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        
        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 text-xs font-medium text-white bg-black/70 rounded">
          <VideoDuration videoUrl={video.video_url} duration={video.duration} />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1">
        {/* Title and Actions */}
        <div className="mb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 
              className="flex-1 text-sm font-medium text-gray-900 cursor-pointer line-clamp-2 hover:text-blue-600"
              onClick={onPlay}
              title={video.title}
            >
              {video.title}
            </h3>
            
            {/* Action buttons */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={onPlay}
                className="p-1 text-gray-600 transition-colors rounded hover:bg-blue-50 hover:text-blue-600"
                title="Play video"
              >
                <Play className="w-3 h-3" />
              </button>
              
              {canEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="p-1 text-gray-600 transition-colors rounded hover:bg-blue-50 hover:text-blue-600"
                  title="Edit video"
                >
                  <Edit className="w-3 h-3" />
                </button>
              )}
              
              {canDelete && (
                <ConfirmationPopUp
                  message={`Are you sure you want to delete "${video.title}"?`}
                  onConfirm={onDelete}
                >
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 text-gray-600 transition-colors rounded hover:bg-red-50 hover:text-red-600"
                    title="Delete video"
                  >
                    {isDeleting && deleteId === video.id ? (
                      <LoaderCircle className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                  </button>
                </ConfirmationPopUp>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="mb-3 text-xs text-gray-600 line-clamp-2">
          {video.description}
        </p>

        {/* Metadata */}
        <div className="pt-3 mt-auto border-t border-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant="gray" size="sm">
              {video.category}
            </Badge>
            
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Eye size={12} />
                <span>{video.view_count}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar size={12} />
                <span>{simpleFormatDate(video.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function HelpVideos() {
  const { userRole } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get video parameter from URL
  const modalVideoUid = searchParams.get('video');
  
  // Initialize filters from URL parameters
  const initialFilters: HelpVideoFilters = {
    category: searchParams.get('category') || "All",
    search: searchParams.get('search') || "",
    page: parseInt(searchParams.get('page') || '1'),
    per_page: parseInt(searchParams.get('per_page') || '12'),
    sort_by: searchParams.get('sort_by') || "created_at",
    sort_order: searchParams.get('sort_order') || "desc",
  };
  
  const [filters, setFilters] = useState<HelpVideoFilters>(initialFilters);
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  
  const [selectedVideo, setSelectedVideo] = useState<HelpVideo | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<HelpVideo | null>(null);
  const [videoToDelete, setVideoToDelete] = useState<HelpVideo | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  // Get fetching state
  const isFetchingVideos = useIsFetching({ queryKey: ["help-videos", filters] }) > 0;
  const isFetchingStats = useIsFetching({ queryKey: ["help-videos-statistics"] }) > 0;
  const isFetchingOptions = useIsFetching({ queryKey: ["help-videos-options"] }) > 0;
  const isAnyFetching = isFetchingVideos || isFetchingStats || isFetchingOptions;

  // Fetch options (categories)
  const { data: options } = useQuery({
    queryKey: ["help-videos-options"],
    queryFn: () => helpVideos.getOptions(),
    enabled: !!userRole,
  });

  // Update categories when options are loaded
  useEffect(() => {
    if (options?.success && options.data.categories) {
      setCategories(['All', ...options.data.categories]);
    }
  }, [options]);

  // Fetch videos function for DataTable
  const fetchVideos = async (): Promise<PaginatedData<HelpVideo>> => {
    const response = await helpVideos.getAll({
      ...filters,
      category: filters.category === 'All' ? 'all' : filters.category
    });

    return {
      items: response.data.data || [],
      current_page: response.data.current_page || 1,
      last_page: response.data.last_page || 1,
      per_page: response.data.per_page || filters.per_page,
      total: response.data.total || 0,
    };
  };

  // Fetch statistics
  const { data: statistics } = useQuery({
    queryKey: ["help-videos-statistics"],
    queryFn: () => helpVideos.getStatistics(),
    enabled: !!userRole,
  });

  // Load video for modal if URL has video parameter
  useEffect(() => {
    const loadVideoForModal = async () => {
      if (modalVideoUid) {
        try {
          const response = await helpVideos.getByUid(modalVideoUid);
          if (response.success) {
            setSelectedVideo(response.data);
            
            // Increment view count
            incrementViewsMutation.mutate(response.data.id);
          } else {
            // If video not found, remove the parameter
            const params = new URLSearchParams(searchParams);
            params.delete('video');
            setSearchParams(params);
          }
        } catch (error) {
          console.error('Failed to load video for modal:', error);
          toast.error('Failed to load video');
          // Remove invalid parameter
          const params = new URLSearchParams(searchParams);
          params.delete('video');
          setSearchParams(params);
        }
      }
    };

    loadVideoForModal();
  }, [modalVideoUid, searchParams, setSearchParams]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.category !== "All") params.set('category', filters.category);
    if (filters.search) params.set('search', filters.search);
    if (filters.page > 1) params.set('page', filters.page.toString());
    if (filters.per_page !== 12) params.set('per_page', filters.per_page.toString());
    if (filters.sort_by !== "created_at") params.set('sort_by', filters.sort_by);
    if (filters.sort_order !== "desc") params.set('sort_order', filters.sort_order);
    
    // Preserve video parameter if it exists
    if (modalVideoUid) {
      params.set('video', modalVideoUid);
    }
    
    setSearchParams(params, { replace: true });
  }, [filters, modalVideoUid, setSearchParams]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => helpVideos.delete(id),
    onSuccess: (_, id) => {
      toast.success("Video deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["help-videos"] });
      queryClient.invalidateQueries({ queryKey: ["help-videos-statistics"] });
      setVideoToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete video");
      setVideoToDelete(null);
    }
  });

  // Increment views mutation
  const incrementViewsMutation = useMutation({
    mutationFn: (id: number) => helpVideos.incrementViews(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["help-videos"] });
      queryClient.invalidateQueries({ queryKey: ["help-videos-statistics"] });
    }
  });

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }));
  };

  const handleCategoryChange = (category: string) => {
    setFilters(prev => ({ ...prev, category, page: 1 }));
  };

  const handlePlayVideo = async (video: HelpVideo) => {
    setSelectedVideo(video);
    
    // Set video parameter in URL
    const params = new URLSearchParams(searchParams);
    params.set('video', video.public_uid);
    navigate(`?${params.toString()}`, { replace: true });
    
    // Increment view count
    incrementViewsMutation.mutate(video.id);
  };

  const handleCloseModal = () => {
    setSelectedVideo(null);
    // Remove video parameter from URL when modal is closed
    const params = new URLSearchParams(searchParams);
    params.delete('video');
    navigate(`?${params.toString()}`, { replace: true });
  };

  const handleEditVideo = (video: HelpVideo) => {
    setEditingVideo(video);
    setShowEditModal(true);
  };

  const handleDeleteVideo = (video: HelpVideo) => {
    setVideoToDelete(video);
    deleteMutation.mutate(video.id);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["help-videos"] });
    queryClient.invalidateQueries({ queryKey: ["help-videos-statistics"] });
    queryClient.invalidateQueries({ queryKey: ["help-videos-options"] });
  };

  const formatDate = (dateString: string) => {
    return simpleFormatDate(dateString);
  };

  // Check user permissions
  const canEdit = National_Roles.some((role) => userRole?.roles?.includes(role)) || 
                  Committees.EXECUTIVE_COMMITTEE.some((role) => userRole?.roles?.includes(role));
  
  const canDelete = userRole?.roles?.includes(Roles.NATIONAL_ADMINISTRATOR);
  const canCreate = National_Roles.some((role) => userRole?.roles?.includes(role));

  const queryKey = ["help-videos", filters];

  // Determine if modal should be open
  const isModalOpen = Boolean(selectedVideo);

  // Render actions for DataTable
  const renderActions = (video: HelpVideo) => (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handlePlayVideo(video)}
        className="p-1 text-gray-600 transition-colors rounded hover:bg-blue-50 hover:text-blue-600"
        title="Play video"
      >
        <Play className="w-3 h-3" />
      </button>
      
      {canEdit && (
        <button
          onClick={() => handleEditVideo(video)}
          className="p-1 text-gray-600 transition-colors rounded hover:bg-blue-50 hover:text-blue-600"
          title="Edit video"
        >
          <Edit className="w-3 h-3" />
        </button>
      )}
      
      {canDelete && (
        <ConfirmationPopUp
          message={`Are you sure you want to delete "${video.title}"?`}
          onConfirm={() => handleDeleteVideo(video)}
        >
          <button
            className="p-1 text-gray-600 transition-colors rounded hover:bg-red-50 hover:text-red-600"
            title="Delete video"
          >
            {deleteMutation.isPending && videoToDelete?.id === video.id ? (
              <LoaderCircle className="w-3 h-3 animate-spin" />
            ) : (
              <Trash2 className="w-3 h-3" />
            )}
          </button>
        </ConfirmationPopUp>
      )}
    </div>
  );

  // Render card view
  const renderCard = (video: HelpVideo, idx: number) => (
    <div
      key={video.id}
      className="h-full transition-all duration-200 animate-fadeIn"
      style={{ animationDelay: `${idx * 50}ms` }}
    >
      <VideoCard
        video={video}
        onPlay={() => handlePlayVideo(video)}
        onEdit={() => handleEditVideo(video)}
        onDelete={() => handleDeleteVideo(video)}
        isDeleting={deleteMutation.isPending}
        deleteId={videoToDelete?.id || null}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </div>
  );

  return (
    <div className="flex flex-col flex-1 p-3 bg-white rounded-lg shadow md:p-4">
      {/* Header */}
      <div className="flex flex-col gap-3 mb-3">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
          <header className="md:flex-1">
            <h1 className="text-xl font-bold text-gray-900">Help Videos</h1>
            <p className="mt-1 text-xs text-gray-600">
              Video walkthroughs and tutorials for using the system
            </p>
          </header>
          
          <div className="flex items-center gap-2">
            <ActionButton
              onClick={handleRefresh}
              label="Refresh"
              icon={RefreshCcw}
              iconSize={14}
              loading={isAnyFetching}
              buttonClassName="px-3 py-1.5 text-xs"
            />
            <RoleGuard roles={National_Roles}>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <Plus size={14} />
                Add Video
              </button>
            </RoleGuard>
          </div>
        </div>

        {/* Statistics */}
        {statistics?.success && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-3 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Play className="w-5 h-5 text-blue-600 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Videos</p>
                  <p className="text-xl font-semibold sm:text-2xl">{statistics.data.total_videos}</p>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Eye className="w-5 h-5 text-green-600 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Views</p>
                  <p className="text-xl font-semibold sm:text-2xl">{statistics.data.total_views}</p>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Folder className="w-5 h-5 text-purple-600 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Categories</p>
                  <p className="text-xl font-semibold sm:text-2xl">{statistics.data.categories?.length || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-orange-600 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Most Viewed</p>
                  <p className="text-base font-semibold truncate sm:text-lg">
                    {statistics.data.most_viewed?.[0]?.title?.substring(0, 20) || 'N/A'}...
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="flex flex-wrap items-center gap-2 lg:flex-1">
            {/* Category Filter with dropdown for mobile */}
            <div className="relative flex items-center gap-2">
              <Filter size={14} className="text-gray-500" />
              <select
                value={filters.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent md:hidden"
                disabled={!categories.length}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              
              {/* Desktop category buttons */}
              <div className="flex-wrap hidden gap-2 md:flex">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`px-3 py-1.5 text-xs rounded-full ${
                      filters.category === category 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="inline-flex items-center gap-0 px-1 py-1 bg-white border border-gray-300 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode("card")}
                disabled={isAnyFetching}
                title="Card view"
                className={`
                  inline-flex items-center justify-center
                  px-3 py-1.5 text-xs
                  rounded-md transition-all
                  ${
                    viewMode === "card"
                      ? "bg-gray-900 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }
                  ${isAnyFetching ? "opacity-50 cursor-not-allowed" : ""}
                `}
              >
                <LayoutGrid size={14} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                disabled={isAnyFetching}
                title="Table view"
                className={`
                  inline-flex items-center justify-center
                  px-3 py-1.5 text-xs
                  rounded-md transition-all
                  ${
                    viewMode === "table"
                      ? "bg-gray-900 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }
                  ${isAnyFetching ? "opacity-50 cursor-not-allowed" : ""}
                `}
              >
                <Rows3 size={14} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="lg:w-64">
            <SearchInput
              placeholder="Search videos..."
              value={filters.search}
              onChange={handleSearchChange}
              showClear
            />
          </div>
        </div>
      </div>

      {/* Videos - Using DataTable with toggleable views */}
      <div className="flex-1">
        <DataTable<HelpVideo>
          columns={columns}
          view={viewMode}
          queryKey={queryKey}
          queryFn={fetchVideos}
          renderActions={renderActions}
          renderCard={renderCard}
        />
      </div>

      {/* Video Player Modal */}
      {isModalOpen && selectedVideo && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={selectedVideo.title}
          size="xl"
        >
          <div className="p-4">
            {selectedVideo.video_url ? (
              <div className="overflow-hidden bg-black rounded-lg aspect-video">
                <video
                  src={selectedVideo.video_url}
                  controls
                  className="w-full h-full"
                  autoPlay
                  onError={(e) => {
                    const videoElement = e.target as HTMLVideoElement;
                    console.error('Video playback error:', videoElement.error);
                    toast.error('Failed to play video. The file may be corrupted or unsupported.');
                  }}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : (
              <div className="flex items-center justify-center bg-gray-100 rounded-lg aspect-video">
                <p className="text-gray-500">Video unavailable</p>
              </div>
            )}
            
            <div className="mt-4">
              <p className="text-sm text-gray-600">{selectedVideo.description}</p>
              
              <div className="flex flex-wrap items-center gap-4 pt-4 mt-4 border-t">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Folder size={14} />
                  <span>{selectedVideo.category}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock size={14} />
                  <span>
                    <VideoDuration videoUrl={selectedVideo.video_url} duration={selectedVideo.duration} />
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Eye size={14} />
                  <span>{selectedVideo.view_count} views</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Calendar size={14} />
                  <span>Posted {formatDate(selectedVideo.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Video Modal */}
      {showCreateModal && (
        <UploadVideoModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries({ queryKey: ["help-videos"] });
            queryClient.invalidateQueries({ queryKey: ["help-videos-options"] });
          }}
        />
      )}

      {/* Edit Video Modal */}
      {showEditModal && editingVideo && (
        <EditVideoModal
          video={editingVideo}
          onClose={() => {
            setShowEditModal(false);
            setEditingVideo(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setEditingVideo(null);
            queryClient.invalidateQueries({ queryKey: ["help-videos"] });
          }}
        />
      )}
    </div>
  );
}