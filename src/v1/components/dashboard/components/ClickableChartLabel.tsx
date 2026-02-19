// src/components/dashboard/ClickableChartLabel.tsx
import { ExternalLink } from "lucide-react";

interface ClickableChartLabelProps {
  label: string;
  value: number;
  percentage: number;
  filterKey?: string;
  filterValue?: string;
  color: string;
  navigate: (path: string) => void;
  getMembersLink: (filters?: Record<string, string>) => string;
}

export function ClickableChartLabel({
  label,
  value,
  percentage,
  filterKey,
  filterValue,
  color,
  navigate,
  getMembersLink,
}: ClickableChartLabelProps) {
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
      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors group"
    >
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
        <span className="text-sm text-gray-700">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">
          {value.toLocaleString()} ({percentage}%)
        </span>
        <ExternalLink 
          size={10} 
          className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" 
        />
      </div>
    </div>
  );
}