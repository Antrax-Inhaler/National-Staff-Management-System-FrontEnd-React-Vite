// src/components/ui/ImageModal.tsx
import React from "react";
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface ImageModalProps {
  imageUrl: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageModal({ imageUrl, alt, isOpen, onClose }: ImageModalProps) {
  const [scale, setScale] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      // Reset transformations when closing
      setScale(1);
      setRotation(0);
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-4xl max-h-[90vh] w-full mx-4">
        {/* Controls */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            onClick={handleZoomIn}
            className="p-2 text-white bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={20} />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 text-white bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={20} />
          </button>
          <button
            onClick={handleRotate}
            className="p-2 text-white bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
            title="Rotate"
          >
            <RotateCcw size={20} />
          </button>
          <button
            onClick={handleReset}
            className="p-2 text-white bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
            title="Reset"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="p-2 text-white bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Image */}
        <div className="flex items-center justify-center h-full">
          <img
            src={imageUrl}
            alt={alt}
            className="max-w-full max-h-[80vh] object-contain transition-transform duration-200"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
            }}
          />
        </div>

        {/* Image info */}
        <div className="absolute bottom-4 left-4 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full">
          {alt}
        </div>

        {/* Zoom level indicator */}
        <div className="absolute bottom-4 right-4 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full">
          {Math.round(scale * 100)}%
        </div>
      </div>
    </div>
  );
}