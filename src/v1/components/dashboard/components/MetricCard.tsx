// src/components/dashboard/MetricCard.tsx
import { type ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, TrendingUp, TrendingDown, Equal } from "lucide-react";
import { InfoTooltip } from "./InfoTooltip";

interface MetricCardProps {
  title: string;
  value: number;
  icon: ComponentType<{ size?: number; className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'indigo' | 'teal' | 'red' | 'cyan';
  format?: "number" | "percentage";
  trend?: number;
  onClick?: () => void;
  subtitle?: string;
  delay?: number;
  tooltip?: string;
  linkTo?: string;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  color,
  format = "number",
  trend,
  onClick,
  subtitle,
  delay = 0,
  tooltip,
  linkTo,
}: MetricCardProps) {
  const navigate = useNavigate();
  
  const colorClasses = {
    blue: {
      bg: "bg-gradient-to-br from-blue-50 to-white",
      text: "text-blue-700",
      border: "border border-blue-100 hover:border-blue-200 hover:shadow-md",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    green: {
      bg: "bg-gradient-to-br from-green-50 to-white",
      text: "text-green-700",
      border: "border border-green-100 hover:border-green-200 hover:shadow-md",
      iconBg: "bg-green-100",
      iconColor: "text-green-600"
    },
    purple: {
      bg: "bg-gradient-to-br from-purple-50 to-white",
      text: "text-purple-700",
      border: "border border-purple-100 hover:border-purple-200 hover:shadow-md",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600"
    },
    orange: {
      bg: "bg-gradient-to-br from-orange-50 to-white",
      text: "text-orange-700",
      border: "border border-orange-100 hover:border-orange-200 hover:shadow-md",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600"
    },
    indigo: {
      bg: "bg-gradient-to-br from-indigo-50 to-white",
      text: "text-indigo-700",
      border: "border border-indigo-100 hover:border-indigo-200 hover:shadow-md",
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600"
    },
    teal: {
      bg: "bg-gradient-to-br from-teal-50 to-white",
      text: "text-teal-700",
      border: "border border-teal-100 hover:border-teal-200 hover:shadow-md",
      iconBg: "bg-teal-100",
      iconColor: "text-teal-600"
    },
    red: {
      bg: "bg-gradient-to-br from-red-50 to-white",
      text: "text-red-700",
      border: "border border-red-100 hover:border-red-200 hover:shadow-md",
      iconBg: "bg-red-100",
      iconColor: "text-red-600"
    },
    cyan: {
      bg: "bg-gradient-to-br from-cyan-50 to-white",
      text: "text-cyan-700",
      border: "border border-cyan-100 hover:border-cyan-200 hover:shadow-md",
      iconBg: "bg-cyan-100",
      iconColor: "text-cyan-600"
    },
  };
  
  const colorConfig = colorClasses[color];
  
  const formattedValue = format === "percentage"
    ? `${value}%`
    : value.toLocaleString();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (linkTo) {
      navigate(linkTo);
    }
  };

  const TrendIndicator = ({ value }: { value: number }) => {
    if (value > 0) {
      return (
        <div className="flex items-center text-green-600">
          <TrendingUp size={12} />
          <span className="ml-1 text-xs font-medium">{Math.abs(value)}%</span>
        </div>
      );
    } else if (value < 0) {
      return (
        <div className="flex items-center text-red-600">
          <TrendingDown size={12} />
          <span className="ml-1 text-xs font-medium">{Math.abs(value)}%</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-gray-500">
          <Equal size={12} />
          <span className="ml-1 text-xs font-medium">0%</span>
        </div>
      );
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`relative p-4 rounded-lg ${colorConfig.bg} ${colorConfig.border} transition-all duration-300 cursor-pointer group animate-fadeIn`}
      style={{ 
        animationDelay: `${delay}ms`,
        animationFillMode: 'forwards',
        opacity: 1
      }}
    >
      {tooltip && (
        <div className="absolute top-2 right-2">
          <InfoTooltip content={tooltip} />
        </div>
      )}
      
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md shadow-sm ${colorConfig.iconBg}`}>
            <Icon size={14} className={colorConfig.iconColor} />
          </div>
          <span className={`text-xs font-medium opacity-80 ${colorConfig.text}`}>{title}</span>
        </div>
        {trend !== undefined && <TrendIndicator value={trend} />}
      </div>
      
      <div className="text-xl font-bold text-gray-900">{formattedValue}</div>
      
      {subtitle && (
        <div className="mt-1 text-xs text-gray-600">{subtitle}</div>
      )}
      
      {(onClick || linkTo) && (
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ExternalLink size={12} className="text-gray-600" />
        </div>
      )}
    </div>
  );
}