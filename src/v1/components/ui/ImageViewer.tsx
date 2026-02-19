// src/components/ui/ImageViewer.tsx
import React, { useState, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface ImageViewerProps {
  images: Array<{
    id: number | string;
    url: string;
    name: string;
  }>;
  currentIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageViewer({
  images,
  currentIndex = 0,
  isOpen,
  onClose,
}: ImageViewerProps) {
  const [currentIdx, setCurrentIdx] = useState(currentIndex);
  const [isLoading, setIsLoading] = useState(true);

  const currentImage = images[currentIdx];

  const handlePrevious = useCallback(() => {
    setCurrentIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setIsLoading(true);
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setIsLoading(true);
  }, [images.length]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case 'Escape':
          onClose();
          break;
      }
    },
    [isOpen, handlePrevious, handleNext, onClose]
  );

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen || !currentImage) return null;

  return (
    // Custom Modal with shadow backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative z-10 max-w-[90vw] max-h-[90vh]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <X size={24} />
        </button>

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1 bg-black/50 text-white text-sm rounded-full">
            {currentIdx + 1} / {images.length}
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="w-full h-96 bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse rounded-lg" />
        )}

        {/* Image */}
        <img
          src={currentImage.url}
          alt={currentImage.name}
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          onLoad={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
}