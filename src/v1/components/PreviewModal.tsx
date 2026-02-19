import React, { useState } from 'react';
import { 
  X, Calendar, User, Tag, FileText, Image as ImageIcon, Film, Download, 
  Play, Maximize2, Eye, Users, Clock, ChevronLeft, ExternalLink 
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { NationalInformation, Attachment } from '../api/nationalInformation';
import Badge from '../components/ui/Badge';

interface PreviewModalProps {
  data: NationalInformation | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PreviewModal({ data, isOpen, onClose }: PreviewModalProps) {
  const [selectedMedia, setSelectedMedia] = useState<Attachment | null>(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  if (!isOpen || !data) return null;

  // Helper function to get reader count
  const getReaderCount = (articleItem: any): number | undefined => {
    return articleItem?.reader_count ?? articleItem?.view_count;
  };

  // Separate attachments by type (similar to ArticleDetailPage)
  const allAttachments = data.attachments || [];
  
  const imageAttachments = allAttachments.filter((att: any) => 
    att.file_name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
  ) || [];

  const videoAttachments = allAttachments.filter((att: any) => 
    att.file_name.match(/\.(mp4|mov|avi|wmv|mkv|webm)$/i)
  ) || [];

  const pdfAttachments = allAttachments.filter((att: any) => 
    att.file_name.match(/\.(pdf)$/i)
  ) || [];

  const documentAttachments = allAttachments.filter((att: any) => 
    att.file_name.match(/\.(doc|docx|xls|xlsx|ppt|pptx|txt)$/i)
  ) || [];

  const otherAttachments = allAttachments.filter((att: any) => 
    !att.file_name.match(/\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|wmv|mkv|webm|pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/i)
  ) || [];

  // All media (images and videos combined)
  const allMedia = [...imageAttachments, ...videoAttachments];

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <ImageIcon className="w-5 h-5 text-blue-500" />;
    } else if (['mp4', 'mov', 'avi', 'wmv', 'mkv', 'webm'].includes(extension || '')) {
      return <Film className="w-5 h-5 text-purple-500" />;
    } else if (extension === 'pdf') {
      return <FileText className="w-5 h-5 text-red-500" />;
    } else if (['doc', 'docx'].includes(extension || '')) {
      return <FileText className="w-5 h-5 text-blue-600" />;
    } else if (['xls', 'xlsx'].includes(extension || '')) {
      return <FileText className="w-5 h-5 text-green-600" />;
    } else if (['ppt', 'pptx'].includes(extension || '')) {
      return <FileText className="w-5 h-5 text-orange-600" />;
    } else {
      return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const openMediaModal = (attachment: Attachment) => {
    setSelectedMedia(attachment);
    setIsMediaModalOpen(true);
  };

  const closeMediaModal = () => {
    setIsMediaModalOpen(false);
    setSelectedMedia(null);
  };

  // Share functionality
  const handleShare = async () => {
    const shareData = {
      title: data.title,
      text: data.content.replace(/<[^>]*>/g, '').substring(0, 200),
      url: '#',
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(data.title);
        alert('Title copied to clipboard!');
      } catch (err) {
        console.log('Failed to copy:', err);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
          
          <div className="relative w-full max-w-6xl bg-white rounded-lg shadow-lg">
            {/* Header similar to ArticleDetailPage */}
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={onClose}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    <ChevronLeft size={14} />
                    Close Preview
                  </button>
                  
                  <Badge variant="primary" size="sm">
                    {data.category || 'General'}
                  </Badge>
                  
                  <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-3 h-3" />
                    <span>{data.author}</span>
                    <span className="text-gray-400">•</span>
                    <button
                      onClick={handleShare}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      title="Share"
                    >
                      <ExternalLink size={14} className="text-gray-500" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-1 text-gray-400 hover:text-gray-500"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Mobile author and share */}
              <div className="flex items-center justify-between mt-2 md:hidden">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-3 h-3" />
                  <span>{data.author}</span>
                </div>
                <button
                  onClick={handleShare}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                  title="Share"
                >
                  <ExternalLink size={16} className="text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* Article Title and Meta */}
              <div>
                <h1 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">
                  {data.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {data.published_at 
                      ? format(new Date(data.published_at), 'MMM dd, yyyy')
                      : 'Not published'
                    }
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {data.published_at 
                      ? formatDistanceToNow(new Date(data.published_at), { addSuffix: true })
                      : ''
                    }
                  </div>
                  {getReaderCount(data) !== undefined && (
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{getReaderCount(data)} reader{getReaderCount(data) !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Type, Category, Status Info */}
              <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50 rounded-lg md:grid-cols-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="font-medium capitalize">{data.type}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Category</p>
                    <p className="font-medium capitalize">{data.category}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(data.status)}`}>
                      {data.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Media Section */}
              {allMedia.length > 0 && (
                <div>
                  <h3 className="mb-4 text-lg font-bold text-gray-900">Media</h3>
                  <div className="space-y-4">
                    {allMedia.map((media: any, index: number) => (
                      <div key={media.id} className="relative overflow-hidden rounded-lg bg-gray-100">
                        {media.file_name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img
                            src={media.file_url || ''}
                            alt={`${data.title} - Media ${index + 1}`}
                            className="object-contain w-full max-h-[400px] cursor-pointer"
                            onClick={() => openMediaModal(media)}
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
                          />
                        ) : (
                          <div 
                            className="relative bg-gray-900 aspect-video cursor-pointer"
                            onClick={() => openMediaModal(media)}
                          >
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="relative">
                                <div className="absolute inset-0 bg-black rounded-full opacity-40 blur-sm" />
                                <div className="relative z-10 w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                                  <div className="ml-2 w-0 h-0 border-t-4 border-b-4 border-l-6 border-transparent border-l-gray-900" />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Content */}
              <div>
                <h3 className="mb-4 text-lg font-bold text-gray-900">Content</h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: data.content.replace(/\n/g, '<br>') }}
                  />
                </div>
              </div>

              {/* Attachments Section */}
              {(pdfAttachments.length > 0 || documentAttachments.length > 0 || otherAttachments.length > 0) && (
                <div>
                  <h3 className="mb-4 text-lg font-bold text-gray-900">Attachments</h3>
                  
                  {/* PDF Files */}
                  {pdfAttachments.length > 0 && (
                    <div className="mb-4">
                      <h4 className="mb-2 text-sm font-medium text-gray-700">PDF Documents</h4>
                      <div className="space-y-2">
                        {pdfAttachments.map((pdf: any) => (
                          <div
                            key={pdf.id}
                            className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded bg-red-100 text-red-600">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{pdf.file_name}</p>
                                <p className="text-sm text-gray-500">
                                  {formatFileSize(pdf.file_size)} • PDF Document
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Download className="w-5 h-5 text-gray-400" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Document Files */}
                  {documentAttachments.length > 0 && (
                    <div className="mb-4">
                      <h4 className="mb-2 text-sm font-medium text-gray-700">Documents</h4>
                      <div className="space-y-2">
                        {documentAttachments.map((doc: any) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {getFileIcon(doc.file_name)}
                              <div>
                                <p className="font-medium text-gray-900">{doc.file_name}</p>
                                <p className="text-sm text-gray-500">
                                  {formatFileSize(doc.file_size)} • {doc.file_name.split('.').pop()?.toUpperCase()} Document
                                </p>
                              </div>
                            </div>
                            <Download className="w-5 h-5 text-gray-400" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Other Files */}
                  {otherAttachments.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-sm font-medium text-gray-700">Other Files</h4>
                      <div className="space-y-2">
                        {otherAttachments.map((file: any) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-3 text-sm bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-500" />
                              <span className="font-medium text-gray-900 truncate">{file.file_name}</span>
                            </div>
                            <Download className="w-4 h-4 text-gray-400" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Dates Info */}
              <div className="pt-6 border-t">
                <h4 className="mb-3 text-sm font-medium text-gray-900">Article Info</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span>Created: {format(new Date(data.created_at), 'MMM dd, yyyy hh:mm a')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span>Updated: {format(new Date(data.updated_at), 'MMM dd, yyyy hh:mm a')}</span>
                  </div>
                  {data.published_at && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span>Published: {format(new Date(data.published_at), 'MMM dd, yyyy hh:mm a')}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <FileText className="w-3 h-3 text-gray-400" />
                    <span>Total Attachments: {data.attachments?.length || 0}</span>
                  </div>
                  {getReaderCount(data) !== undefined && (
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3 text-gray-400" />
                      <span>Readers: {getReaderCount(data)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Media Modal */}
      {isMediaModalOpen && selectedMedia && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-opacity-75">
          <div className="relative w-full max-w-4xl max-h-[90vh]">
            <button
              onClick={closeMediaModal}
              className="absolute top-2 right-2 z-10 p-2 text-white bg-black bg-opacity-50 rounded-full hover:bg-opacity-75 transition-colors"
            >
              <X size={24} />
            </button>

            {selectedMedia.file_name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <div className="overflow-hidden rounded-lg">
                <img
                  src={selectedMedia.file_url || ''}
                  alt={selectedMedia.file_name}
                  className="w-full h-auto max-h-[80vh] object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="flex flex-col items-center justify-center w-full h-[80vh] bg-gray-900">
                          <ImageIcon class="w-16 h-16 text-gray-400 mb-4" />
                          <p class="text-gray-300">Failed to load image</p>
                          <p class="text-sm text-gray-400 mt-2">${selectedMedia.file_name}</p>
                        </div>
                      `;
                    }
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-sm font-medium text-white">{selectedMedia.file_name}</p>
                  <p className="text-xs text-gray-300">{formatFileSize(selectedMedia.file_size)}</p>
                </div>
              </div>
            ) : selectedMedia.file_name.match(/\.(mp4|mov|avi|wmv|mkv|webm)$/i) ? (
              <div className="overflow-hidden rounded-lg bg-black">
                <video
                  src={selectedMedia.file_url || ''}
                  controls
                  autoPlay
                  className="w-full h-auto max-h-[80vh]"
                >
                  Your browser does not support the video tag.
                </video>
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-sm font-medium text-white">{selectedMedia.file_name}</p>
                  <p className="text-xs text-gray-300">{formatFileSize(selectedMedia.file_size)}</p>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-white rounded-lg">
                <div className="text-center">
                  {getFileIcon(selectedMedia.file_name)}
                  <p className="mt-4 text-lg font-medium text-gray-900">{selectedMedia.file_name}</p>
                  <p className="mt-2 text-gray-600">{formatFileSize(selectedMedia.file_size)}</p>
                  {selectedMedia.file_url && (
                    <a
                      href={selectedMedia.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                      <Download size={16} />
                      Download File
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}