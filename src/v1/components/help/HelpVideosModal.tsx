// src/components/help/HelpVideosModal.tsx
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Play,
  Eye,
  Calendar,
  Video,
  Search,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Clock
} from "lucide-react";
import Modal from "@v1/components/ui/Modal";
import { helpVideos } from "@v1/api/helpVideos";
import type { HelpVideo } from "@v1/types/helpVideos";
import { simpleFormatDate } from "@v1/helpers/simpleDateUtils";
import Badge from "@v1/components/ui/Badge";
import SearchInput from "@v1/components/ui/SearchInput";
import toast from "react-hot-toast";

interface HelpVideosModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: string;
  pageTitle?: string;
}

// Skeleton Loading Components
const VideoInfoSkeleton = () => (
  <div className="px-4 pt-2 pb-1">
    <div className="flex items-start justify-between gap-4 mb-1">
      <div className="flex-1 min-w-0">
        <div className="h-7 bg-gray-200 rounded mb-4 w-3/4 animate-pulse"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse"></div>
        </div>
      </div>
      
      <div className="flex flex-col items-end gap-2 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
      </div>
    </div>
  </div>
);

const VideoPlayerSkeleton = () => (
  <div className="p-1">
    <div className="relative aspect-video bg-gray-300 rounded-lg overflow-hidden shadow-lg animate-pulse">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center">
          <Video className="w-8 h-8 text-gray-300" />
        </div>
      </div>
    </div>
  </div>
);

const RelatedVideosSkeleton = () => (
  <div className="border-t border-gray-200 pt-6 px-4">
    <div className="flex items-center justify-between mb-4">
      <div className="flex-1 min-w-0">
        <div className="h-6 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="w-64">
          <div className="h-9 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-9 bg-gray-200 rounded w-24 animate-pulse"></div>
      </div>
    </div>
    
    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
      {[1, 2, 3].map((i) => (
        <div key={i} className="relative w-full rounded-lg p-3 border border-gray-200 animate-pulse">
          <div className="flex gap-3">
            {/* Thumbnail Skeleton */}
            <div className="relative flex-shrink-0 w-32">
              <div className="relative aspect-video bg-gray-300 rounded overflow-hidden"></div>
            </div>

            {/* Content Skeleton */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-1">
                <div className="flex-1 min-w-0">
                  <div className="h-5 bg-gray-300 rounded mb-2 w-4/5 animate-pulse"></div>
                  <div className="space-y-1 mb-2">
                    <div className="h-3 bg-gray-300 rounded w-full animate-pulse"></div>
                    <div className="h-3 bg-gray-300 rounded w-5/6 animate-pulse"></div>
                  </div>
                </div>
                <div className="h-6 bg-gray-300 rounded w-20 animate-pulse ml-2"></div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex items-center gap-3">
                  <div className="h-4 bg-gray-300 rounded w-16 animate-pulse"></div>
                  <div className="h-4 bg-gray-300 rounded w-20 animate-pulse"></div>
                </div>
                <div className="sm:ml-auto">
                  <div className="h-6 bg-gray-300 rounded w-16 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const FullPageSkeleton = () => (
  <div className="animate-pulse">
    <VideoInfoSkeleton />
    <VideoPlayerSkeleton />
    <RelatedVideosSkeleton />
  </div>
);

// Utility function to extract video thumbnail from URL
const extractVideoThumbnail = (videoUrl: string): string | null => {
  if (!videoUrl) return null;
  
  try {
    // For YouTube URLs
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      const videoId = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId[1]}/mqdefault.jpg`;
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

// Custom hook to get video duration from URL
const useVideoDuration = (videoUrl: string | null) => {
  const [duration, setDuration] = useState<string>('--:--');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchDuration = async () => {
      if (!videoUrl) {
        setDuration('--:--');
        return;
      }

      // For YouTube URLs, we can try to get duration from YouTube API
      if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        try {
          setIsLoading(true);
          const videoId = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
          if (videoId) {
            // Try YouTube oEmbed API first
            const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId[1]}&format=json`);
            if (response.ok) {
              // YouTube oEmbed doesn't provide duration, so we'll use a placeholder
              setDuration('YouTube');
              return;
            }
          }
        } catch (error) {
          console.error('Error fetching YouTube duration:', error);
        } finally {
          setIsLoading(false);
        }
      }

      // For other video URLs, create a video element to get duration
      if (videoUrl && !videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be') && !videoUrl.includes('vimeo.com')) {
        try {
          setIsLoading(true);
          const videoElement = document.createElement('video');
          videoElement.preload = 'metadata';
          
          videoElement.onloadedmetadata = () => {
            const minutes = Math.floor(videoElement.duration / 60);
            const seconds = Math.floor(videoElement.duration % 60);
            setDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
            setIsLoading(false);
            
            // Clean up
            videoElement.src = '';
            videoElement.remove();
          };
          
          videoElement.onerror = () => {
            setDuration('--:--');
            setIsLoading(false);
            
            // Clean up
            videoElement.src = '';
            videoElement.remove();
          };
          
          videoElement.src = videoUrl;
        } catch (error) {
          console.error('Error loading video metadata:', error);
          setDuration('--:--');
          setIsLoading(false);
        }
      } else {
        // For YouTube/Vimeo or unknown URLs, show placeholder
        setDuration('--:--');
      }
    };

    fetchDuration();
  }, [videoUrl]);

  return { duration, isLoading };
};

// Component to display video duration
const VideoDuration = ({ videoUrl }: { videoUrl: string }) => {
  const { duration, isLoading } = useVideoDuration(videoUrl);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <div className="w-3 h-3 bg-gray-300 rounded animate-pulse"></div>
      </div>
    );
  }

  return <span>{duration}</span>;
};

// Related Video Card Component with thumbnail and description
const RelatedVideoCard = ({ 
  video, 
  onClick,
  isActive 
}: { 
  video: HelpVideo; 
  onClick: () => void;
  isActive: boolean;
}) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const maxDescriptionLength = 80;
  const shouldTruncateDescription = video.description && video.description.length > maxDescriptionLength;
  
  const displayDescription = isDescriptionExpanded || !shouldTruncateDescription 
    ? video.description 
    : `${video.description?.substring(0, maxDescriptionLength)}...`;

  // Get thumbnail URL
  const thumbnailUrl = video.thumbnail_url || video.thumbnail || 
    extractVideoThumbnail(video.video_url);

  return (
    <div
      onClick={onClick}
      className={`relative w-full cursor-pointer transition-all group ${
        isActive 
          ? 'ring-2 ring-blue-500 bg-blue-50' 
          : 'hover:bg-gray-50'
      } rounded-lg p-3 border border-gray-200 hover:border-blue-300`}
    >
      <div className="flex gap-3">
        {/* Thumbnail Section */}
        <div className="relative flex-shrink-0 w-32">
          <div className="relative aspect-video bg-gray-100 rounded overflow-hidden">
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
            
            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center transition-opacity bg-black/20 opacity-0 group-hover:opacity-100">
              <div className="flex items-center justify-center w-8 h-8 bg-white/90 rounded-full">
                <Play className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            
            {/* Duration Badge */}
            <div className="absolute bottom-1 right-1 px-1 py-0.5 text-xs font-medium text-white bg-black/70 rounded">
              <VideoDuration videoUrl={video.video_url} />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                {video.title}
              </h4>
              
              {/* Description with read more/less */}
              {video.description && (
                <div className="mb-2">
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {displayDescription}
                  </p>
                  {shouldTruncateDescription && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsDescriptionExpanded(!isDescriptionExpanded);
                      }}
                      className="mt-0.5 text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-0.5"
                    >
                      {isDescriptionExpanded ? (
                        <>
                          <ChevronUp size={10} />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown size={10} />
                          Read more
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {isActive && (
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full flex-shrink-0 ml-2">
                Now Playing
              </span>
            )}
          </div>
          
          {/* Metadata */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-gray-500">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Eye size={10} />
                <span>{video.view_count} views</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar size={10} />
                <span>{simpleFormatDate(video.created_at)}</span>
              </div>
            </div>
            
            <div className="sm:ml-auto">
              <Badge variant={video.category === "General" ? "gray" : "primary"} size="sm">
                {video.category}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Description component with read more/less for main video
const VideoDescription = ({ description, maxLength = 150 }: { description: string; maxLength?: number }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = description && description.length > maxLength;
  
  const displayText = isExpanded || !shouldTruncate 
    ? description 
    : `${description.substring(0, maxLength)}...`;

  return (
    <div>
      <p className="text-gray-600 whitespace-pre-line text-sm">
        {displayText}
      </p>
      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-1 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
        >
          {isExpanded ? (
            <>
              <ChevronUp size={14} />
              Show less
            </>
          ) : (
            <>
              <ChevronDown size={14} />
              Read more
            </>
          )}
        </button>
      )}
    </div>
  );
};

// Component to get duration for main video
const MainVideoDuration = ({ videoRef }: { videoRef: React.RefObject<HTMLVideoElement> }) => {
  const [duration, setDuration] = useState<string>('--:--');

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleLoadedMetadata = () => {
      const minutes = Math.floor(videoElement.duration / 60);
      const seconds = Math.floor(videoElement.duration % 60);
      setDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    const handleError = () => {
      setDuration('--:--');
    };

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('error', handleError);

    // Check if metadata is already loaded
    if (videoElement.duration && !isNaN(videoElement.duration) && videoElement.duration > 0) {
      handleLoadedMetadata();
    }

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('error', handleError);
    };
  }, [videoRef]);

  return (
    <div className="flex items-center gap-1">
      <Clock className="w-4 h-4 text-gray-500" />
      <span className="text-sm text-gray-600">{duration}</span>
    </div>
  );
};

function HelpVideosModal({ 
  isOpen, 
  onClose, 
  category = "General",
  pageTitle = "Help"
}: HelpVideosModalProps) {
  const navigate = useNavigate();
  const [selectedVideo, setSelectedVideo] = useState<HelpVideo | null>(null);
  const [allVideos, setAllVideos] = useState<HelpVideo[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const videoPlayerRef = useRef<HTMLVideoElement>(null);
  const modalTitle = `${category} Help Videos`;

  // Fetch videos - get category-specific videos first, then General videos
  const { data: categoryVideosData, isLoading: isLoadingCategory, isError: isCategoryError } = useQuery({
    queryKey: ["help-videos-by-category", category],
    queryFn: () => helpVideos.getAll({
      category: category === "All" ? "all" : category,
      page: 1,
      per_page: 50,
      sort_by: "created_at",
      sort_order: "desc"
    }),
    enabled: isOpen,
  });

  // Fetch General videos only if category is not General
  const { data: generalVideosData, isLoading: isLoadingGeneral } = useQuery({
    queryKey: ["help-videos-general"],
    queryFn: () => helpVideos.getAll({
      category: "General",
      page: 1,
      per_page: 50,
      sort_by: "created_at",
      sort_order: "desc"
    }),
    enabled: isOpen && category !== "General",
  });

  // Combine videos when data loads
  useEffect(() => {
    if (isOpen) {
      let combinedVideos: HelpVideo[] = [];
      
      // Add category-specific videos first
      if (categoryVideosData?.success && categoryVideosData.data.data?.length > 0) {
        combinedVideos = [...categoryVideosData.data.data];
      }
      
      // Add General videos at the end (only if category is not General)
      if (category !== "General" && generalVideosData?.success && generalVideosData.data.data?.length > 0) {
        const generalVideos = generalVideosData.data.data.filter(
          video => !combinedVideos.some(v => v.id === video.id)
        );
        combinedVideos = [...combinedVideos, ...generalVideos];
      }
      
      setAllVideos(combinedVideos);
      
      // Set first video as selected if available
      if (combinedVideos.length > 0) {
        setSelectedVideo(combinedVideos[0]);
      } else {
        setSelectedVideo(null);
      }
    }
  }, [categoryVideosData, generalVideosData, isOpen, category]);

  // Filter videos based on search
  const filteredVideos = searchQuery.trim() === "" 
    ? allVideos.filter(video => video.id !== selectedVideo?.id)
    : allVideos.filter(video => 
        video.id !== selectedVideo?.id && (
          video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          video.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );

  // Handle video selection
  const handleVideoSelect = (video: HelpVideo) => {
    setSelectedVideo(video);
    
    // Increment view count
    helpVideos.incrementViews(video.id).catch(console.error);
    
    // Restart video if it's already playing
    if (videoPlayerRef.current) {
      videoPlayerRef.current.currentTime = 0;
      videoPlayerRef.current.play().catch(console.error);
    }
  };

  // Handle navigation to manage videos
  const handleManageVideos = () => {
    onClose();
    navigate('/help-videos');
  };

  const isLoading = isLoadingCategory || (category !== "General" && isLoadingGeneral);
  const isError = isCategoryError;
  const hasVideos = allVideos.length > 0;
  const hasCategoryVideos = categoryVideosData?.success && categoryVideosData.data.data?.length > 0;
  const hasOnlyGeneralVideos = !hasCategoryVideos && filteredVideos.length > 0 && 
    filteredVideos.every(video => video.category === "General");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="xl"
      showCloseButton={true}
    >
      <div className="p-1">
        {/* Loading State - Skeleton */}
        {isLoading && (
          <FullPageSkeleton />
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-3">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <p className="text-gray-900 font-medium mb-1">Failed to load videos</p>
            <p className="text-gray-600 text-sm mb-4">Please try again later</p>
          </div>
        )}

        {/* Videos Content */}
        {!isLoading && !isError && selectedVideo && (
          <>
            {/* Video Info at the Top */}
            <div className="px-4 pt-2 pb-1">
              <div className="flex items-start justify-between gap-4 mb-1">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    {selectedVideo.title}
                  </h2>
                </div>
                
                {/* Views, Duration and Date on the right side */}
                <div className="flex flex-col items-end gap-1 text-sm text-gray-600 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{selectedVideo.view_count} views</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MainVideoDuration videoRef={videoPlayerRef} />
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{simpleFormatDate(selectedVideo.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Description below the title */}
              {selectedVideo.description && (
                <VideoDescription description={selectedVideo.description} maxLength={150} />
              )}
            </div>

            {/* Main Video Player */}
            <div className="p-1">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
                {selectedVideo.video_url ? (
                  <video
                    ref={videoPlayerRef}
                    src={selectedVideo.video_url}
                    controls
                    className="w-full h-full"
                    autoPlay
                    poster={selectedVideo.thumbnail_url || selectedVideo.thumbnail || undefined}
                    onError={(e) => {
                      const videoElement = e.target as HTMLVideoElement;
                      console.error('Video playback error:', videoElement.error);
                      toast.error('Failed to play video. The file may be corrupted or unsupported.');
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="aspect-video flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                    <Video className="w-16 h-16 text-gray-400 mb-3" />
                    <p className="text-gray-300 font-medium">Video unavailable</p>
                    <p className="text-gray-400 text-sm mt-1">The video file cannot be loaded</p>
                  </div>
                )}
              </div>
            </div>

            {/* Related Videos Section */}
            <div className="border-t border-gray-200 pt-6 px-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Related Tutorials
                  </h3>
                  <p className="text-sm text-gray-600">
                    {filteredVideos.length} {filteredVideos.length === 1 ? 'video' : 'videos'} available
                  </p>
                </div>
                
                {/* Search and Manage All aligned to the right */}
                <div className="flex items-center gap-4">
                  <div className="w-64">
                    <SearchInput
                      placeholder="Search videos..."
                      value={searchQuery}
                      onChange={setSearchQuery}
                      showClear
                      size="sm"
                    />
                  </div>
                  <button
                    onClick={handleManageVideos}
                    className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors group whitespace-nowrap"
                  >
                    <span>Manage All</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
              
              {/* No videos message or related videos list */}
              {filteredVideos.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium">No videos found</p>
                  <p className="text-gray-500 text-sm mt-1">
                    {searchQuery.trim() === "" 
                      ? "No other videos available" 
                      : `No videos found for "${searchQuery}"`}
                  </p>
                  {searchQuery.trim() !== "" && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {hasOnlyGeneralVideos && category !== "General" && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                      <p className="text-sm text-blue-800">
                        No {category} tutorials found. Showing General tutorials instead.
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {filteredVideos.map(video => (
                      <RelatedVideoCard
                        key={video.id}
                        video={video}
                        onClick={() => handleVideoSelect(video)}
                        isActive={selectedVideo.id === video.id}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* No Videos State */}
        {!isLoading && !isError && !hasVideos && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-6">
              <Video className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No tutorials available yet
            </h3>
            <p className="text-gray-600 mb-6 max-w-md">
              {category === "General" 
                ? "There are no General video tutorials available yet."
                : `There are no ${category} video tutorials available yet.`}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleManageVideos}
                className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
              >
                <ExternalLink size={14} />
                Create Video Walkthroughs
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default HelpVideosModal;