// src/components/dashboard/ClickableChart.tsx
import { type ReactNode } from "react";
import { ExternalLink } from "lucide-react";

interface ClickableChartProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function ClickableChart({ children, onClick, className = '' }: ClickableChartProps) {
  return (
    <div 
      onClick={onClick}
      className={`relative cursor-pointer group h-full ${className}`}
    >
      {children}
      <div className="absolute inset-0 bg-transparent group-hover:bg-blue-50/30 transition-colors rounded-lg pointer-events-none" />
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <ExternalLink size={12} className="text-blue-600" />
      </div>
    </div>
  );
}