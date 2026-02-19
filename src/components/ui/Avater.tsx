import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface AvatarProps {
  imageUrl?: string | null;
  alt: string;
  fallbackText: string;
  size?: "sm" | "md" | "lg" | "xl" | "xxl" | "xxxl";
  variant?: "circle" | "square";
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  imageUrl,
  alt,
  fallbackText,
  size = "md",
  variant = "circle",
  className = "",
}) => {
  const [imageError, setImageError] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const sizeClasses = {
    sm: "w-8 h-8 min-w-8 text-xs",
    md: "w-10 h-10 min-w-10 text-sm",
    lg: "w-12 h-12 min-w-12 text-base",
    xl: "w-14 h-14 min-w-12 text-base",
    xxl: "w-16 h-16 min-w-12 text-base",
    xxxl: "w-24 h-24 min-w-12 text-base",
  };

  const roundedClass = variant === "circle" ? "rounded-full" : "rounded-lg";
  const showFallback = !imageUrl || imageError;
  const canPreview = imageUrl && !imageError;

  // Generate initials from fallbackText
  const getInitials = (text: string): string => {
    const words = text.trim().split(/\s+/);
    if (words.length === 0) return "";
    if (words.length === 1) return words[0].charAt(0).toUpperCase();

    const firstLetter = words[0].charAt(0).toUpperCase();
    const lastLetter = words[words.length - 1].charAt(0).toUpperCase();
    return firstLetter + lastLetter;
  };

  const initials = getInitials(fallbackText);

  const handleClick = () => {
    if (canPreview) {
      setShowPreview(true);
    }
  };

  return (
    <>
      <div
        onClick={handleClick}
        className={`relative flex-shrink-0 overflow-hidden ${roundedClass} ${sizeClasses[size]} bg-gray-200 border border-gray-300 ${canPreview ? "cursor-pointer hover:opacity-80 transition-opacity" : ""} ${className}`}
        title={alt}
      >
        {!showFallback ? (
          <img
            src={imageUrl}
            alt={alt}
            className={`w-full h-full object-cover object-center ${roundedClass}`}
            onError={() => setImageError(true)}
            onLoad={() => setImageError(false)}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full font-medium text-gray-600">
            {initials}
          </div>
        )}
      </div>

      {showPreview &&
        canPreview &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowPreview(false)}
          >
            <div className="relative max-w-4xl max-h-[90vh] p-4">
              <button
                onClick={() => setShowPreview(false)}
                className="absolute right-0 p-2 text-white transition-colors -top-10 hover:text-gray-300"
                aria-label="Close preview"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={imageUrl}
                alt={alt}
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default Avatar;
