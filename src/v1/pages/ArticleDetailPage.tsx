import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  User,
  FileText,
  Download,
  File,
  ChevronLeft,
  ExternalLink,
  Eye,
  EyeOff,
  ChevronDown,
  Clock,
  Users,
  ChevronRight,
  ArrowLeft,
  List,
  Settings,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { nationalInformation } from '../api/nationalInformation';
import Badge from '../components/ui/Badge';
import PdfViewer from '../components/ui/PdfViewer';
import VideoPlayer from '../components/ui/VideoPlayer'; // Import VideoPlayer
import RoleGuard from '../components/RoleGuard';
import { Roles } from '../constants/roles';
import {
  formatFileSize,
  getFileType,
  isImageFile,
  isVideoFile,
  isDocumentFile,
  isPdfFile,
  truncateFilename,
} from '../src/utils/fileUtils';

interface PdfFile {
  id: number | string;
  url: string;
  name: string;
  size?: number;
  type?: string;
  title?: string;
}

interface VideoFile {
  id: number | string;
  url: string;
  name: string;
  size?: number;
  type?: string;
  thumbnail?: string;
}

export default function ArticleDetailPage() {
  const { public_uid } = useParams<{ public_uid: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showRelatedInfo, setShowRelatedInfo] = useState(true);
  const [showMoreMedia, setShowMoreMedia] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<PdfFile | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null);
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
  const [hasLoggedView, setHasLoggedView] = useState(false);
  const [isBlurred, setIsBlurred] = useState(false);

  // Share functionality
  const handleShare = async () => {
    const shareData = {
      title: article?.title,
      text: article?.content.replace(/<[^>]*>/g, '').substring(0, 200),
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      } catch (err) {
        console.log('Failed to copy:', err);
      }
    }
  };

  // Helper function to get reader count
  const getReaderCount = (articleItem: any): number | undefined => {
    return articleItem?.reader_count ?? articleItem?.view_count;
  };

  // Update the mutation to use the new API
  const logViewMutation = useMutation({
    mutationFn: (articleId: number) => 
      nationalInformation.logView({
        auditable_type: 'App\\Models\\NationalInformation',
        auditable_id: articleId,
        action: 'view'
      }),
    onSuccess: () => {
      console.log('View logged successfully');
      queryClient.invalidateQueries({ queryKey: ['national-information-detail', public_uid] });
    },
    onError: (error) => {
      console.error('Failed to log view:', error);
    }
  });

  // Simplified query
  const { data: article, isLoading: isLoadingArticle, error } = useQuery({
    queryKey: ['national-information-detail', public_uid],
    queryFn: () => nationalInformation.show(public_uid!),
    enabled: !!public_uid,
  });

  // Check if article is draft or archived
  useEffect(() => {
    if (article) {
      setIsBlurred(article.status === 'draft' || article.status === 'archived');
    }
  }, [article]);

  // Throttle the view logging - Only log for published articles
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const logViewOnce = async () => {
      // Only log views for published articles
      if (article && article.status === 'published' && !hasLoggedView && mounted) {
        try {
          // Use localStorage to track viewed articles
          const viewedArticles = JSON.parse(localStorage.getItem('viewedArticles') || '{}');
          const articleKey = `article_${article.id}`;
          const today = new Date().toDateString();
          
          // Check if already viewed today
          if (viewedArticles[articleKey] !== today) {
            // Log the view with delay to prevent spamming
            timeoutId = setTimeout(async () => {
              try {
                await logViewMutation.mutateAsync(article.id);
              } catch (err) {
                console.error('Failed to log view:', err);
              }
              
              if (mounted) {
                // Update localStorage
                viewedArticles[articleKey] = today;
                localStorage.setItem('viewedArticles', JSON.stringify(viewedArticles));
                setHasLoggedView(true);
              }
            }, 1000); // 1 second delay
          } else {
            setHasLoggedView(true);
          }
        } catch (error) {
          console.error('Failed to log view:', error);
          setHasLoggedView(true);
        }
      }
    };

    logViewOnce();

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [article, hasLoggedView, logViewMutation]);

  // Clean up unused queries
  const { data: relatedData } = useQuery({
    queryKey: ['national-information-related', article?.id, article?.type],
    queryFn: () => nationalInformation.list({
      page: 1,
      per_page: 10,
      type: article?.type || '',
      status: 'published',
      sort_by: 'published_at',
      sort_order: 'desc',
    }),
    enabled: !!article && article.status === 'published',
  });

  const { data: readAlsoData } = useQuery({
    queryKey: ['national-information-read-also', article?.id, article?.category],
    queryFn: () => nationalInformation.list({
      page: 1,
      per_page: 5,
      category: article?.category || '',
      status: 'published',
      sort_by: 'published_at',
      sort_order: 'desc',
    }),
    enabled: !!article?.category && article.status === 'published',
  });

  // Get filtered articles
  const relatedArticles = relatedData?.items?.filter((item: any) => item.id !== article?.id).slice(0, 3) || [];
  const readAlsoArticles = readAlsoData?.items?.filter((item: any) => item.id !== article?.id).slice(0, 2) || [];

  // Handle video opening
  const handleVideoOpen = (video: any) => {
    setSelectedVideo({
      id: video.id,
      url: video.file_url,
      name: video.file_name,
      size: video.file_size,
      type: 'Video',
    });
    setIsVideoPlayerOpen(true);
  };

  if (isLoadingArticle) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container px-4 py-8 mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-8"></div>
            <div className="h-64 bg-gray-200 rounded mb-8"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.log('Error in rendering:', error);
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container px-4 py-8 mx-auto">
          <div className="text-center">
            <FileText className="w-16 h-16 mx-auto text-gray-400" />
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Error Loading Article</h1>
            <p className="mt-2 text-gray-600">Error: {(error as Error).message}</p>
            <button
              onClick={() => navigate('/national-information')}
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <ChevronLeft size={14} />
              Back to List
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container px-4 py-8 mx-auto">
          <div className="text-center">
            <FileText className="w-16 h-16 mx-auto text-gray-400" />
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Article not found</h1>
            <p className="mt-2 text-gray-600">The article you're looking for doesn't exist or has been removed.</p>
            <button
              onClick={() => navigate('/national-information')}
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <ChevronLeft size={14} />
              Back to List
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Group attachments by type
  const allAttachments = article.attachments || [];
  
  // Separate PDF and non-PDF documents
  const pdfAttachments = allAttachments.filter((att: any) => 
    isPdfFile(att.file_name)
  ) || [];

  const nonPdfAttachments = allAttachments.filter((att: any) => 
    isDocumentFile(att.file_name) && !isPdfFile(att.file_name)
  ) || [];

  const otherAttachments = allAttachments.filter((att: any) => 
    !isImageFile(att.file_name) && 
    !isVideoFile(att.file_name) && 
    !isDocumentFile(att.file_name)
  ) || [];

  const imageAttachments = allAttachments.filter((att: any) => 
    isImageFile(att.file_name)
  ) || [];

  const videoAttachments = allAttachments.filter((att: any) => 
    isVideoFile(att.file_name)
  ) || [];

  // All media (images and videos combined)
  const allMedia = [...imageAttachments, ...videoAttachments];
  const displayedMedia = showMoreMedia ? allMedia : allMedia.slice(0, 1);

  // Handle PDF viewing
  const handlePdfOpen = (pdf: any) => {
    setSelectedPdf({
      id: pdf.id,
      url: pdf.file_url,
      name: pdf.file_name,
      size: pdf.file_size,
      type: 'PDF Document',
      title: article.title,
    });
    setIsPdfViewerOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Blur Overlay for draft/archived articles */}
      {isBlurred && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white/90 rounded-xl p-8 max-w-md text-center shadow-2xl border border-white/20">
            <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {article.status === 'draft' ? 'Draft Article' : 'Archived Article'}
            </h3>
            <p className="text-gray-600 mb-6">
              {article.status === 'draft' 
                ? 'This article is still in draft mode and is not available for public viewing.' 
                : 'This article has been archived and is no longer available for public viewing.'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/national-information')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Back to List
              </button>
              <RoleGuard roles={[Roles.NATIONAL_ADMINISTRATOR]}>
                <button
                  onClick={() => navigate('/information')}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Manage Articles
                </button>
              </RoleGuard>
            </div>
          </div>
        </div>
      )}

      {/* Article Header - UPDATED with Role-based navigation buttons */}
      <div className="">
        <div className="container px-4 py-3 mx-auto">
          <div className="flex items-center justify-between">
            {/* LEFT SIDE: View List Button (for all users) */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <button
                  onClick={() => navigate('/national-information')}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200"
                  title="Back to View List"
                >
                  <ArrowLeft size={14} />
                  <span className="hidden sm:inline">View List</span>
                  <span className="sm:hidden">List</span>
                </button>
                
                {/* Tooltip on hover */}
                <div className="absolute left-0 z-10 hidden mt-2 group-hover:block">
                  <div className="px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg">
                    Go to National Information List
                  </div>
                </div>
              </div>
              
              <Badge 
                variant={
                  article.status === 'published' ? 'success' : 
                  article.status === 'draft' ? 'warning' : 'gray'
                }
                size="sm"
              >
                {article.status === 'published' ? 'Published' : 
                 article.status === 'draft' ? 'Draft' : 'Archived'} • {article.category || 'General'}
              </Badge>
              
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
                <User className="w-3 h-3" />
                <span>{article.author}</span>
                <span className="text-gray-400">•</span>
                <button
                  onClick={handleShare}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  title="Share"
                  disabled={isBlurred}
                >
                  <ExternalLink size={14} className={`${isBlurred ? 'text-gray-300' : 'text-gray-500'}`} />
                </button>
              </div>
            </div>

            {/* RIGHT SIDE: Management Button (for specific roles) */}
            <div className="flex items-center gap-3">
              {/* Sidebar toggle button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                disabled={isBlurred}
              >
                {sidebarOpen ? (
                  <>
                    <ChevronRight size={16} />
                    <span className="hidden sm:inline">Collapse</span>
                  </>
                ) : (
                  <>
                    <ChevronLeft size={16} />
                    <span className="hidden sm:inline">Expand</span>
                  </>
                )}
              </button>

              {/* Management Button - Only for specific roles */}
              <RoleGuard
                roles={[
                  Roles.NATIONAL_ADMINISTRATOR,
                  Roles.ORG_EXECUTIVE_COMMITEE,
                  Roles.ORG_RESEARCH_COMMITEE,
                ]}
              >
                <div className="relative group">
                  <button
                    onClick={() => navigate('/information')}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    title="Go to Information Management"
                  >
                    <Settings size={16} />
                    <span className="hidden sm:inline">Manage</span>
                    <span className="sm:hidden">Manage</span>
                  </button>
                  
                  {/* Tooltip on hover */}
                  <div className="absolute right-0 z-10 hidden mt-2 group-hover:block">
                    <div className="px-2 py-1 text-xs text-white bg-blue-800 rounded shadow-lg">
                      Go to Information Management
                    </div>
                  </div>
                </div>
              </RoleGuard>
            </div>
          </div>

          {/* Mobile buttons */}
          <div className="flex items-center justify-between mt-2 md:hidden">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-3 h-3" />
                <span>{article.author}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/national-information')}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                title="Go to View List"
              >
                <List size={16} className="text-gray-500" />
              </button>
              
              <RoleGuard
                roles={[
                  Roles.NATIONAL_ADMINISTRATOR,
                  Roles.ORG_EXECUTIVE_COMMITEE,
                  Roles.ORG_RESEARCH_COMMITEE,
                ]}
              >
                <button
                  onClick={() => navigate('/information')}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                  title="Go to Management"
                >
                  <Settings size={16} className="text-gray-500" />
                </button>
              </RoleGuard>
              
              <button
                onClick={handleShare}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                title="Share"
                disabled={isBlurred}
              >
                <ExternalLink size={16} className={`${isBlurred ? 'text-gray-300' : 'text-gray-500'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 mx-auto">
        <div className="flex gap-6">
          {/* Main Content */}
          <div className={`${sidebarOpen ? 'lg:w-7/12 xl:w-3/4' : 'w-full'}`}>
            {/* Article Title and Meta */}
            <div className="mb-8">
              <h1 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
                {article.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {article.published_at 
                    ? format(new Date(article.published_at), 'MMM dd, yyyy')
                    : 'Not published'
                  }
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {article.published_at 
                    ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true })
                    : ''
                  }
                </div>
                {/* Add reader count - Only show for published articles */}
                {article.status === 'published' && getReaderCount(article) !== undefined && (
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{getReaderCount(article)} reader{getReaderCount(article) !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Media Section with "Show More" */}
            {allMedia.length > 0 && (
              <div className="mb-8">
                <div className="space-y-4">
                  {displayedMedia.map((media: any, index: number) => (
                    <div key={media.id} className="relative overflow-hidden rounded-lg bg-gray-100">
                      {isImageFile(media.file_name) ? (
                        <div className="relative">
                          <img
                            src={media.file_url || ''}
                            alt={`${article.title} - Media ${index + 1}`}
                            className={`object-contain w-full max-h-[500px] ${isBlurred ? 'filter blur-lg' : ''}`}
                            onError={(e) => {
                              const parent = (e.target as HTMLImageElement).parentElement;
                              if (parent) {
                                parent.innerHTML = `
                                  <div class="flex flex-col items-center justify-center w-full h-64">
                                    <div class="w-16 h-16 text-gray-400 mb-4">🖼️</div>
                                    <p class="text-gray-500">Media not available</p>
                                  </div>
                                `;
                              }
                            }}
                            loading="lazy"
                          />
                          {isBlurred && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                              <div className="text-center">
                                <Lock className="w-8 h-8 text-white mx-auto mb-2" />
                                <p className="text-white text-sm">Content hidden</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="relative bg-gray-900 aspect-video">
                          {isBlurred ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                              <div className="text-center">
                                <Lock className="w-12 h-12 text-white mx-auto mb-3" />
                                <p className="text-white">Video content is hidden</p>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="relative">
                                  <div className="absolute inset-0 bg-black rounded-full opacity-40 blur-sm" />
                                  <div className="relative z-10 w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                                    <div className="ml-2 w-0 h-0 border-t-4 border-b-4 border-l-6 border-transparent border-l-gray-900" />
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => handleVideoOpen(media)}
                                className="absolute inset-0 flex items-center justify-center w-full h-full hover:bg-black/10 transition-colors group"
                              >
                                <div className="relative">
                                  <div className="absolute inset-0 bg-white rounded-full opacity-0 group-hover:opacity-40 blur-lg transition-opacity" />
                                  <div className="relative z-10 w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                                    <div className="ml-3 w-0 h-0 border-t-6 border-b-6 border-l-8 border-transparent border-l-blue-600" />
                                  </div>
                                </div>
                              </button>
                              <div className="absolute bottom-4 right-4 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                Click to play
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {allMedia.length > 1 && (
                    <button
                      onClick={() => setShowMoreMedia(!showMoreMedia)}
                      className="flex items-center justify-center w-full py-3 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200"
                      disabled={isBlurred}
                    >
                      {showMoreMedia ? 'Show Less' : `Show More Media (${allMedia.length - 1} more)`}
                      <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showMoreMedia ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Article Content */}
            <article className="mb-8 relative">
              {isBlurred && (
                <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
                  <div className="text-center p-8">
                    <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-700 mb-2">
                      Content Not Available
                    </h3>
                    <p className="text-gray-600 max-w-md">
                      This article is {article.status === 'draft' ? 'in draft mode' : 'archived'} and 
                      the content is not available for public viewing.
                    </p>
                  </div>
                </div>
              )}
              <div className={`prose prose-lg max-w-none ${isBlurred ? 'filter blur-sm' : ''}`}>
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: article.content.replace(/\n/g, '<br>') 
                  }}
                  className="text-gray-700"
                />
              </div>
            </article>

            {/* Attachments Section - Hide for draft/archived articles */}
            {!isBlurred && (pdfAttachments.length > 0 || nonPdfAttachments.length > 0 || otherAttachments.length > 0) && (
              <div className="mt-8">
                <h3 className="mb-4 text-xl font-bold text-gray-900">Downloads</h3>
                
                {/* PDF Files - With View button */}
                {pdfAttachments.length > 0 && (
                  <div className="mb-4">
                    <div className="space-y-2">
                      {pdfAttachments.map((pdf: any) => (
                        <div
                          key={pdf.id}
                          className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer"
                          onClick={() => handlePdfOpen(pdf)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded bg-red-100 text-red-600">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{pdf.file_name}</p>
                              <p className="text-sm text-gray-500">
                                {formatFileSize(pdf.file_size || 0)} • PDF Document
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePdfOpen(pdf);
                              }}
                              className="px-3 py-1 text-sm text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                            >
                              View
                            </button>
                            <a
                              href={pdf.file_url}
                              download
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <Download className="w-5 h-5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Non-PDF Documents - No View button, just download */}
                {nonPdfAttachments.length > 0 && (
                  <div className="mb-4">
                    <div className="space-y-2">
                      {nonPdfAttachments.map((doc: any) => (
                        <a
                          key={doc.id}
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded ${
                              getFileType(doc.file_name).includes('Word')
                                ? 'bg-blue-100 text-blue-600'
                                : getFileType(doc.file_name).includes('Excel')
                                ? 'bg-green-100 text-green-600'
                                : getFileType(doc.file_name).includes('PowerPoint')
                                ? 'bg-orange-100 text-orange-600'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{doc.file_name}</p>
                              <p className="text-sm text-gray-500">
                                {formatFileSize(doc.file_size || 0)} • {getFileType(doc.file_name)}
                              </p>
                            </div>
                          </div>
                          <Download className="w-5 h-5 text-gray-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Files */}
                {otherAttachments.length > 0 && (
                  <div>
                    <h4 className="mb-3 text-sm font-medium text-gray-700">Other Files</h4>
                    <div className="space-y-2">
                      {otherAttachments.map((file: any) => (
                        <a
                          key={file.id}
                          href={file.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 text-sm bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <File className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-900">{truncateFilename(file.file_name, 40)}</span>
                          </div>
                          <Download className="w-4 h-4 text-gray-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* "Read Also" Section - Only show for published articles */}
            {!isBlurred && readAlsoArticles.length > 0 && (
              <div className="mt-12 pt-8 border-t border-gray-200">
                <h3 className="mb-8 text-2xl font-bold text-gray-900">Read Also</h3>
                <div className="space-y-8">
                  {readAlsoArticles.map((related: any) => {
                    const relatedImage = related.attachments?.find((att: any) => 
                      isImageFile(att.file_name)
                    );
                    const contentPreview = related.content?.replace(/<[^>]*>/g, '').substring(0, 200) || '';
                    const readerCount = getReaderCount(related);
                    
                    return (
                      <div
                        key={related.public_uid}
                        onClick={() => navigate(`/national-information/${related.public_uid}`)}
                        className="group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-blue-200"
                      >
                        {/* Title and Meta */}
                        <div className="p-6">
                          <div className="flex flex-wrap items-center gap-3 mb-4">
                            <Badge variant="primary" size="sm">
                              {related.category || 'General'}
                            </Badge>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {related.published_at 
                                  ? format(new Date(related.published_at), 'MMM dd, yyyy')
                                  : 'Recently'
                                }
                              </span>
                            </div>
                            {/* Add reader count to related articles */}
                            {readerCount !== undefined && (
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Users className="w-3 h-3" />
                                <span>{readerCount}</span>
                              </div>
                            )}
                          </div>
                          
                          <h4 className="mb-4 text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600">
                            {related.title}
                          </h4>
                          
                          {/* Media Preview (Image or Video) */}
                          {relatedImage && (
                            <div className="mb-6 overflow-hidden rounded-lg">
                              <img
                                src={relatedImage.file_url || ''}
                                alt={related.title}
                                className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                                loading="lazy"
                              />
                            </div>
                          )}
                          
                          {/* Content Preview with Gradient */}
                          <div className="relative">
                            <div className="relative max-h-32 overflow-hidden">
                              <p className="text-gray-600 leading-relaxed">
                                {contentPreview}...
                              </p>
                              {/* Gradient overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none"></div>
                            </div>
                            
                            {/* Read More Button */}
                            <div className="mt-6 flex justify-center">
                              <button className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group-hover:shadow-sm">
                                <span>Read More</span>
                                <svg 
                                  className="w-4 h-4 transition-transform group-hover:translate-x-1" 
                                  fill="none" 
                                  viewBox="0 0 24 24" 
                                  stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar with Related Information - Hide for draft/archived articles */}
          {!isBlurred && sidebarOpen && (
            <div className="hidden lg:block w-5/12 xl:w-1/4">
              <div className="sticky top-20">
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                  {/* Sidebar Header with Toggle */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h3 className="font-bold text-gray-900">Related Information</h3>
                    <button
                      onClick={() => setShowRelatedInfo(!showRelatedInfo)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      title={showRelatedInfo ? 'Hide' : 'Show'}
                    >
                      {showRelatedInfo ? <EyeOff className="w-4 h-4 text-gray-600" /> : <Eye className="w-4 h-4 text-gray-600" />}
                    </button>
                  </div>
                  
                  {showRelatedInfo && (
                    <div className="p-4">
                      {relatedArticles.length > 0 ? (
                        <div className="space-y-3">
                          {relatedArticles.map((related: any) => {
                            const relatedImage = related.attachments?.find((att: any) => 
                              isImageFile(att.file_name)
                            );
                            const readerCount = getReaderCount(related);
                            
                            return (
                              <div
                                key={related.public_uid}
                                onClick={() => navigate(`/national-information/${related.public_uid}`)}
                                className="group cursor-pointer"
                              >
                                <div className="flex gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                  {relatedImage ? (
                                    <div className="flex-shrink-0 w-16 h-16 overflow-hidden rounded">
                                      <img
                                        src={relatedImage.file_url || ''}
                                        alt={related.title}
                                        className="object-cover w-full h-full"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                          const parent = (e.target as HTMLImageElement).parentElement;
                                          if (parent) {
                                            parent.className = "flex-shrink-0 w-16 h-16 bg-gray-100 rounded flex items-center justify-center";
                                            parent.innerHTML = '<div class="w-6 h-6 text-gray-400">📄</div>';
                                          }
                                        }}
                                        loading="lazy"
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                                      <div className="w-6 h-6 text-gray-400">📄</div>
                                    </div>
                                  )}
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1 mb-1">
                                      <span className="text-xs font-medium text-gray-500 capitalize">
                                        {related.type}
                                      </span>
                                      {/* Add reader count to sidebar */}
                                      {readerCount !== undefined && (
                                        <div className="flex items-center gap-1 ml-2 text-xs text-gray-400">
                                          <Users className="w-3 h-3" />
                                          <span>{readerCount}</span>
                                        </div>
                                      )}
                                    </div>
                                    <p className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600">
                                      {related.title}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                      <span>{format(new Date(related.published_at || related.created_at), 'MMM dd')}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-6 text-center text-gray-500">
                          <div className="w-8 h-8 mx-auto mb-2">📄</div>
                          <p className="text-sm">No related articles found</p>
                        </div>
                      )}

                      {/* Article Info */}
                      <div className="pt-4 mt-4 border-t border-gray-200">
                        <h4 className="mb-3 text-sm font-medium text-gray-900">Article Info</h4>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span>Published: {format(new Date(article.published_at || article.created_at), 'MMM dd, yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span>Updated: {format(new Date(article.updated_at), 'MMM dd, yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="w-3 h-3 text-gray-400" />
                            <span>Files: {article.attachments?.length || 0}</span>
                          </div>
                          {/* Add reader count to article info */}
                          {article.status === 'published' && getReaderCount(article) !== undefined && (
                            <div className="flex items-center gap-2">
                              <Users className="w-3 h-3 text-gray-400" />
                              <span>Readers: {getReaderCount(article)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {selectedPdf && (
        <PdfViewer
          pdf={selectedPdf}
          isOpen={isPdfViewerOpen}
          onClose={() => {
            setIsPdfViewerOpen(false);
            setSelectedPdf(null);
          }}
        />
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayer
          video={selectedVideo}
          isOpen={isVideoPlayerOpen}
          onClose={() => {
            setIsVideoPlayerOpen(false);
            setSelectedVideo(null);
          }}
          autoPlay={true}
        />
      )}
    </div>
  );
}