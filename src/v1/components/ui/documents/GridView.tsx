import React, { useEffect, useState } from 'react'
import type { Affiliate } from '../../../pages/affiliate/Members';
import type { Paginated } from '../DataTable';
import { AlertTriangle, Download, Eye, FileText } from 'lucide-react';
import Badge from '../Badge';
import type { Document } from '../../../pages/affiliate/Documents';

function GridView({ 
  fetchDocuments,
  onViewPDF, 
  onDownload, 
  onEdit, 
  onDelete, 
  onViewDetails,
  userAffiliate,
  selectedFolder
}: { 
  fetchDocuments: (page: number, perPage: number | "All") => Promise<Paginated<Document>>;
  onViewPDF: (doc: Document) => void;
  onDownload: (id: number) => void;
  onEdit: (doc: Document) => void;
  onDelete: (id: number) => void;
  onViewDetails: (doc: Document) => void;
  userAffiliate: Affiliate | null;
  selectedFolder: number | null;
}) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchDocuments(1, 100);
        setDocuments(result.items);
      } catch (error: any) {
        console.error('Failed to load documents for grid view:', error);
        setError(error.message || 'Failed to load documents');
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, [fetchDocuments]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'contract': return 'primary';
      case 'arbitration': return 'danger';
      case 'mou': return 'success';
      case 'bylaws': return 'warning';
      case 'research': return 'info';
      case 'general': return 'gray';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
        <h3 className="mb-2 text-lg font-medium text-gray-900">Error Loading Documents</h3>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="py-12 text-center">
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="mb-2 text-lg font-medium text-gray-900">No Documents Found</h3>
        <p className="text-gray-600">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="p-4 transition-shadow bg-white border border-gray-200 rounded-lg hover:shadow-md"
        >
          <div className="flex items-start justify-between mb-3">
            <FileText className="flex-shrink-0 w-8 h-8 text-red-500" />
            <div className="flex gap-1">
              <button
                onClick={() => onViewPDF(doc)}
                className="p-1 text-blue-600 rounded hover:text-blue-800 hover:bg-blue-50"
                title="View PDF"
              >
                <Eye size={14} />
              </button>
              <button
                onClick={() => onDownload(doc.id)}
                className="p-1 text-green-600 rounded hover:text-green-800 hover:bg-green-50"
                title="Download"
              >
                <Download size={14} />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <h3
              className="text-sm font-medium text-gray-900 line-clamp-2"
              title={doc.title}
            >
              {doc.title}
            </h3>

            <div className="flex flex-wrap gap-1">
              <Badge
                variant={getTypeColor(doc.type)}
                size="sm"
                className="capitalize"
              >
                {doc.type}
              </Badge>
              {doc.is_archived && (
                <Badge variant="warning" size="sm">
                  Archived
                </Badge>
              )}
            </div>

            <div className="space-y-1 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Size:</span>
                <span>{formatFileSize(doc.file_size)}</span>
              </div>
              <div className="flex justify-between">
                <span>Uploaded:</span>
                <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
              </div>
              {doc.affiliate && (
                <div className="flex justify-between">
                  <span>Affiliate:</span>
                  <span className="ml-2 truncate">{doc.affiliate.name}</span>
                </div>
              )}
            </div>

            <div className="flex gap-1 pt-2 border-t">
              <button
                onClick={() => onViewDetails(doc)}
                className="flex-1 px-2 py-1 text-xs text-gray-600 rounded hover:text-gray-800 hover:bg-gray-50"
              >
                Details
              </button>
              {doc.affiliate?.id === userAffiliate?.id && (
                <>
                  <button
                    onClick={() => onEdit(doc)}
                    className="flex-1 px-2 py-1 text-xs text-orange-600 rounded hover:text-orange-800 hover:bg-orange-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(doc.id)}
                    className="flex-1 px-2 py-1 text-xs text-red-600 rounded hover:text-red-800 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default GridView