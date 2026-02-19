// components/ui/ClickableAvatar.tsx
import React, { useState } from 'react';

interface ClickableAvatarProps {
  imageUrl?: string | null; // Accept string or null
  alt: string;
  fallbackText: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'circle' | 'square';
  bgColor?: string;
  fallbackIcon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const ClickableAvatar: React.FC<ClickableAvatarProps> = ({
  imageUrl,
  alt,
  fallbackText,
  size = 'md',
  variant = 'circle',
  bgColor = 'blue',
  fallbackIcon,
  onClick,
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    sm: 'w-8 h-8 min-w-8 text-xs',
    md: 'w-12 h-12 min-w-12 text-base',
    lg: 'w-16 h-16 min-w-16 text-lg'
  };

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    gray: 'bg-gray-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500'
  };

  const roundedClass = variant === 'circle' ? 'rounded-full' : 'rounded-lg';

  const handleClick = () => {
    if (onClick) onClick();
  };

  const showFallback = !imageUrl || imageError;

  return (
    <div
      onClick={handleClick}
      className={`relative flex-shrink-0 overflow-hidden ${roundedClass} ${sizeClasses[size]} ${colorClasses[bgColor as keyof typeof colorClasses] || 'bg-blue-500'} transition-transform hover:scale-105 ${className} ${onClick ? 'cursor-pointer' : ''}`}
      title={alt}
    >
      {!showFallback ? (
        <div className="relative w-full h-full">
          <img
            src={imageUrl} // This is now string | null, but null won't reach here due to showFallback check
            alt={alt}
            className={`absolute inset-0 w-full h-full ${variant === 'circle' ? 'rounded-full' : 'rounded-lg'}`}
            style={{
              objectFit: 'cover',
              objectPosition: 'center'
            }}
            onError={() => setImageError(true)}
            onLoad={() => setImageError(false)}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center w-full h-full text-white">
          {fallbackIcon ? fallbackIcon : fallbackText}
        </div>
      )}
    </div>
  );
};

export default ClickableAvatar;