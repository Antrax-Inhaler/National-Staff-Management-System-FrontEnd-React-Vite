// src/components/dashboard/InfoTooltip.tsx
import { type ReactNode, useState, useRef } from "react";
import { HelpCircle } from "lucide-react";

interface InfoTooltipProps {
  content: string;
  children?: ReactNode;
  className?: string;
}

export function InfoTooltip({ content, children, className }: InfoTooltipProps) {
  const [show, setShow] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShow(true), 300);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current);
    setShow(false);
  };

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children || (
        <HelpCircle size={14} className="text-gray-400 hover:text-gray-600 cursor-help" />
      )}
      
      {show && (
        <div className="absolute z-50 w-64 p-3 mt-1 text-sm bg-gray-900 text-white rounded-lg shadow-xl animate-fadeIn">
          <div className="font-medium mb-1">How this is calculated:</div>
          <div className="text-gray-300">{content}</div>
          <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
        </div>
      )}
    </div>
  );
}