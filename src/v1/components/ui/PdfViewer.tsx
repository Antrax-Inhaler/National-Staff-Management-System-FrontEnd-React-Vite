// src/components/ui/PdfViewer.tsx (ultra-minimalist)
import React, { useState } from 'react';
import { X, ExternalLink, Loader2 } from 'lucide-react';

interface PdfViewerProps {
  pdf: {
    id: number | string;
    url: string;
    name: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function PdfViewer({
  pdf,
  isOpen,
  onClose,
}: PdfViewerProps) {
  const [isLoading, setIsLoading] = useState(true);

  const handleOpenNewTab = () => {
    window.open(pdf.url, '_blank');
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === 'Escape') onClose();
  };

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen || !pdf) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-6xl h-[90vh] bg-white rounded-lg overflow-hidden shadow-2xl">
        {/* Simple Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded"
            >
              <X size={20} />
            </button>
            <span className="text-sm truncate">
              {pdf.name}
            </span>
          </div>

          <button
            onClick={handleOpenNewTab}
            className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-100 rounded"
            title="Open in new tab"
          >
            <ExternalLink size={16} />
            <span>Open</span>
          </button>
        </div>

        {/* PDF Content */}
        <div className="h-full">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p className="text-sm">Loading PDF...</p>
              </div>
            </div>
          )}

          <div className="h-full">
            <iframe
              src={pdf.url}
              className="w-full h-full border-0"
              title={pdf.name}
              onLoad={() => setIsLoading(false)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}