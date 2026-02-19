// src/components/help/HelpButton.tsx
import { useState } from "react";
import { HelpCircle, Play } from "lucide-react";
import HelpVideosModal from "./HelpVideosModal";

interface HelpButtonProps {
  category: string;
  pageTitle?: string;
}

function HelpButton({ 
  category, 
  pageTitle = "Help"
}: HelpButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);

  // Handle hover to alternate icons
  const handleMouseEnter = () => {
    setIsHovered(true);
    setShowPlayIcon(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowPlayIcon(false);
  };

  return (
    <>
      <div className="
        fixed z-30 
        top-18 right-0
        /* Tablet and larger screens position */
        sm:bottom-8 sm:right-8 sm:top-auto
        /* Desktop position */
        lg:bottom-12 lg:right-12
      ">
        <div 
          className="flex items-center gap-2"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Text label that appears on hover - hidden on mobile */}
          {isHovered && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-lg border border-gray-200 animate-fadeIn">
              <Play className="w-3.5 h-3.5 text-gray-900" />
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Help Videos
              </span>
            </div>
          )}

          {/* Main floating button - Responsive sizing */}
          <button
            onClick={() => setIsModalOpen(true)}
            onMouseEnter={handleMouseEnter}
            className={`
              relative flex items-center justify-center
              /* Mobile size - EDIT THESE VALUES TO CHANGE SIZE ON SMALL SCREENS */
              w-9 h-9
              /* Tablet size */
              sm:w-11 sm:h-11
              /* Desktop size */
              lg:w-12 lg:h-12
              rounded-full
              bg-gray-900
              text-white shadow-lg
              hover:shadow-xl hover:scale-105
              active:scale-95
              transition-all duration-200
              group
            `}
            title={`${pageTitle} help videos`}
            aria-label="Help videos"
          >
            {/* Animated ring effect on hover - only on larger screens */}
            <div className={`
              absolute inset-0 rounded-full border border-gray-700
              transition-all duration-300
              ${isHovered ? 'opacity-100 scale-110' : 'opacity-0 scale-100'}
              /* Hide on mobile to save space */
              hidden sm:block
            `} />
            
            {/* Alternating icons with transition - Responsive sizing */}
            <div className="
              relative 
              /* Mobile icon size - EDIT TO CHANGE ICON SIZE ON SMALL SCREENS */
              w-4 h-4
              /* Tablet icon size */
              sm:w-4.5 sm:h-4.5
              /* Desktop icon size */
              lg:w-5 lg:h-5
            ">
              <Play
                className={`
                  absolute inset-0 w-full h-full
                  transition-all duration-300
                  ${showPlayIcon ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 rotate-90'}
                `}
              />
              <HelpCircle
                className={`
                  absolute inset-0 w-full h-full
                  transition-all duration-300
                  ${showPlayIcon ? 'opacity-0 scale-50 -rotate-90' : 'opacity-100 scale-100 rotate-0'}
                `}
              />
            </div>
            
            {/* Tooltip for mobile (always visible on hover) */}
            <div className="
              sm:hidden absolute -top-8 left-1/2 -translate-x-1/2
              px-2 py-1 bg-gray-900 text-white text-xs rounded
              opacity-0 group-hover:opacity-100
              transition-opacity duration-200
              whitespace-nowrap pointer-events-none
            ">
              Help Videos
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
            </div>
            
            {/* Tooltip for larger screens (hidden on mobile) */}
            <div className="
              hidden sm:block absolute -top-10 left-1/2 -translate-x-1/2
              px-2 py-1 bg-gray-900 text-white text-xs rounded
              opacity-0 group-hover:opacity-100
              transition-opacity duration-200
              whitespace-nowrap pointer-events-none
            ">
              Help Videos
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
            </div>
          </button>
        </div>
      </div>

      {/* Help Videos Modal */}
      <HelpVideosModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        category={category}
        pageTitle={pageTitle}
      />
    </>
  );
}

export default HelpButton;