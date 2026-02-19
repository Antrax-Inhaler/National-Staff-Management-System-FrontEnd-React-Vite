// src/components/dashboard/ClickableListItem.tsx
import { type ComponentType } from "react";
import { ExternalLink } from "lucide-react";

interface ClickableListItemProps {
  label: string;
  value: number | string;
  filterKey?: string;
  filterValue?: string;
  icon?: ComponentType<{ size?: number; className?: string }>;
  navigate: (path: string) => void;
  getMembersLink: (filters?: Record<string, string>) => string;
  delay?: number;
}

export function ClickableListItem({
  label,
  value,
  filterKey,
  filterValue,
  icon: Icon,
  navigate,
  getMembersLink,
  delay = 0,
}: ClickableListItemProps) {
  const handleClick = () => {
    if (filterKey && filterValue) {
      const filters: Record<string, string> = {};
      filters[filterKey] = filterValue;
      navigate(getMembersLink(filters));
    }
  };

  return (
    <div
      onClick={handleClick}
      className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors animate-fadeIn group hover:bg-gray-50"
      style={{ 
        animationDelay: `${delay}ms`,
        animationFillMode: 'forwards',
        opacity: 1
      }}
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon size={14} className="text-gray-500" />}
        <span className="text-sm text-gray-700">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-900">{value}</span>
        <ExternalLink 
          size={12} 
          className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" 
        />
      </div>
    </div>
  );
}