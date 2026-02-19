// src/components/pages/ViewerListModal.tsx
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { 
  X, 
  Users, 
  LoaderCircle, 
  Search,
  MapPin,
  Building2,
  Calendar,
  User,
  RefreshCw,
  Eye,
  Filter,
  ChevronRight,
  Download
} from "lucide-react";
import { nationalInformation } from "../api/nationalInformation";
import Badge from "@v1/components/ui/Badge";
import SearchInput from "@v1/components/ui/SearchInput";
import Modal from "@v1/components/ui/Modal";
import { format } from 'date-fns';

interface ViewerListModalProps {
  isOpen: boolean;
  articleId?: number;
  articleTitle?: string;
  onClose: () => void;
}

interface Viewer {
  user_id: number;
  view_count: number;
  last_viewed_at: string;
  member?: {
    id: number;
    public_uid: string;
    full_name: string;
    first_name?: string;
    last_name?: string;
    profile_photo_url?: string;
    level?: string;
    employment_status?: string;
    city?: string;
    state?: string;
    affiliate_name?: string;
    email?: string;
  };
}

interface ArticleStats {
  total_viewers: number;
  total_views: number;
}

interface ViewerData {
  article: ArticleStats;
  viewers: Viewer[];
}

const ViewerListModal: React.FC<ViewerListModalProps> = ({
  isOpen,
  articleId,
  articleTitle,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredViewers, setFilteredViewers] = useState<Viewer[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const { data: viewerData, isLoading: isLoadingViewers, refetch } = useQuery<ViewerData>({
    queryKey: ["national-information-viewers", articleId],
    queryFn: () => articleId ? nationalInformation.getViewers(articleId) : Promise.resolve({ article: { total_viewers: 0, total_views: 0 }, viewers: [] }),
    enabled: !!articleId && isOpen,
    refetchOnWindowFocus: false,
  });

  // Filter and search viewers
  useEffect(() => {
    if (!viewerData?.viewers) {
      setFilteredViewers([]);
      return;
    }

    let viewers = viewerData.viewers;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      viewers = viewers.filter(viewer =>
        viewer.member?.full_name?.toLowerCase().includes(query) ||
        viewer.member?.first_name?.toLowerCase().includes(query) ||
        viewer.member?.last_name?.toLowerCase().includes(query) ||
        viewer.member?.level?.toLowerCase().includes(query) ||
        viewer.member?.employment_status?.toLowerCase().includes(query) ||
        viewer.member?.city?.toLowerCase().includes(query) ||
        viewer.member?.state?.toLowerCase().includes(query) ||
        viewer.member?.affiliate_name?.toLowerCase().includes(query) ||
        viewer.member?.email?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (activeFilter === "recent") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      viewers = viewers.filter(viewer => 
        new Date(viewer.last_viewed_at) > oneWeekAgo
      );
    } else if (activeFilter === "multiple") {
      viewers = viewers.filter(viewer => viewer.view_count > 1);
    } else if (activeFilter === "professional") {
      viewers = viewers.filter(viewer => viewer.member?.level?.toLowerCase() === "professional");
    } else if (activeFilter === "associate") {
      viewers = viewers.filter(viewer => viewer.member?.level?.toLowerCase() === "associate");
    }

    setFilteredViewers(viewers);
  }, [viewerData, searchQuery, activeFilter]);

  const getLevelBadgeVariant = (level?: string) => {
    switch (level?.toLowerCase()) {
      case "professional": return "primary";
      case "associate": return "success";
      default: return "gray";
    }
  };

  const getEmploymentBadgeVariant = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "full time": return "success";
      case "part time": return "warning";
      default: return "gray";
    }
  };

  // Get initials for avatar
  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "?";
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  // Sort by view count
  const sortByViewCount = () => {
    const sorted = [...filteredViewers].sort((a, b) => b.view_count - a.view_count);
    setFilteredViewers(sorted);
  };

  // Sort by last viewed
  const sortByLastViewed = () => {
    const sorted = [...filteredViewers].sort((a, b) => 
      new Date(b.last_viewed_at).getTime() - new Date(a.last_viewed_at).getTime()
    );
    setFilteredViewers(sorted);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Article Viewers
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
              {viewerData?.article?.total_viewers || 0} viewers
            </span>
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
              {viewerData?.article?.total_views || 0} views
            </span>
            <span className="text-gray-500 truncate max-w-[300px]">
              "{articleTitle}"
            </span>
          </div>
        </div>
      }
      className="max-w-3xl"
    >
      {/* Search and Filters Bar */}
      <div className="p-3 border-b">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <SearchInput
              placeholder="Search viewers..."
              value={searchQuery}
              onChange={setSearchQuery}
              className="flex-1 text-sm"
              size="sm"
            />
          </div>
          
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-xs font-medium text-gray-700 whitespace-nowrap">Filter:</span>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setActiveFilter("all")}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    activeFilter === "all"
                      ? "bg-blue-100 text-blue-700 border border-blue-200"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveFilter("recent")}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    activeFilter === "recent"
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Recent
                </button>
                <button
                  onClick={() => setActiveFilter("multiple")}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    activeFilter === "multiple"
                      ? "bg-purple-100 text-purple-700 border border-purple-200"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Multiple
                </button>
                <button
                  onClick={() => setActiveFilter("professional")}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    activeFilter === "professional"
                      ? "bg-blue-100 text-blue-700 border border-blue-200"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Professional
                </button>
                <button
                  onClick={() => setActiveFilter("associate")}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    activeFilter === "associate"
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Associate
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={sortByViewCount}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                title="Sort by view count"
              >
                <Eye className="w-3 h-3" />
                Views
              </button>
              <button
                onClick={sortByLastViewed}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                title="Sort by last viewed"
              >
                <Calendar className="w-3 h-3" />
                Date
              </button>
              <button
                onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
                className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                title="Toggle view mode"
              >
                {viewMode === "list" ? "Grid" : "List"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-y-auto flex-1 max-h-[60vh]">
        {isLoadingViewers ? (
          <div className="text-center py-8">
            <LoaderCircle className="w-8 h-8 mx-auto animate-spin text-blue-500" />
            <p className="mt-2 text-gray-600 text-sm">Loading viewers...</p>
          </div>
        ) : filteredViewers.length > 0 ? (
          <div className={viewMode === "list" ? "divide-y" : "grid grid-cols-1 md:grid-cols-2 gap-3 p-3"}>
            {filteredViewers.map((viewer, index) => (
              <div 
                key={`${viewer.user_id}-${index}`} 
                className={`p-3 hover:bg-gray-50 transition-colors group ${
                  viewMode === "grid" ? "bg-white border border-gray-200 rounded-lg shadow-sm" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <Link 
                      to={`/members/${viewer.member?.public_uid}`}
                      onClick={onClose}
                      className="block"
                    >
                      {viewer.member?.profile_photo_url ? (
                        <img
                          src={viewer.member.profile_photo_url}
                          alt={viewer.member.full_name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                          <span className="font-bold text-blue-600 text-sm">
                            {getInitials(viewer.member?.first_name, viewer.member?.last_name)}
                          </span>
                        </div>
                      )}
                    </Link>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Name and View Count */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link 
                          to={`/members/${viewer.member?.public_uid}`}
                          onClick={onClose}
                          className="group/member-link"
                        >
                          <h4 className="font-semibold text-gray-900 text-sm group-hover/member-link:text-blue-600 transition-colors truncate">
                            {viewer.member?.full_name || 'Unknown User'}
                          </h4>
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="gray" size="xs">
                            <Eye className="w-2.5 h-2.5 mr-1" />
                            {viewer.view_count} {viewer.view_count === 1 ? 'view' : 'views'}
                          </Badge>
                          {viewer.member?.level && (
                            <Badge 
                              variant={getLevelBadgeVariant(viewer.member.level)} 
                              size="xs"
                            >
                              {viewer.member.level}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {viewMode === "list" && (
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs text-gray-400">#{index + 1}</span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(viewer.last_viewed_at), 'MMM dd, hh:mm a')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Additional Info */}
                    {viewMode === "list" && (
                      <div className="space-y-1">
                        {viewer.member?.affiliate_name && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Building2 className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{viewer.member.affiliate_name}</span>
                          </div>
                        )}
                        
                        {(viewer.member?.city || viewer.member?.state) && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">
                              {[viewer.member.city, viewer.member.state].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {viewMode === "grid" && (
                      <div className="space-y-1">
                        {viewer.member?.affiliate_name && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Building2 className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{viewer.member.affiliate_name}</span>
                          </div>
                        )}
                        
                        {(viewer.member?.city || viewer.member?.state) && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">
                              {[viewer.member.city, viewer.member.state].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          <span>{format(new Date(viewer.last_viewed_at), 'MMM dd, hh:mm a')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
              <Users className="w-6 h-6 text-gray-400" />
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">
              {searchQuery ? 'No matching viewers found' : 'No viewers yet'}
            </h4>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              {searchQuery 
                ? 'Try a different search term.'
                : 'Share the article to get more views!'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-3 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-gray-600">
            <span className="font-medium">{filteredViewers.length}</span> viewer{filteredViewers.length !== 1 ? 's' : ''} shown
            {searchQuery && ` • Searching: "${searchQuery}"`}
            {activeFilter !== "all" && ` • Filter: ${activeFilter}`}
          </div>
          
          <div className="flex items-center gap-2">
           
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ViewerListModal;