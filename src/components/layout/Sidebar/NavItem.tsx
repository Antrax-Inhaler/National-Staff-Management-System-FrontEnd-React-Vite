// src/components/layout/Sidebar/NavItem.tsx
import React from "react";
import { Link } from "react-router-dom";

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: string;
  active?: boolean;
  onClick?: () => void;
  collapsed?: boolean;
}

export default function NavItem({
  href,
  icon: Icon,
  label,
  badge,
  active = false,
  onClick,
  collapsed = false
}: NavItemProps) {
  return (
    <Link
      to={href}
      onClick={onClick}
      className={`
        flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200
        ${active
          ? 'bg-indigo-100 text-indigo-700'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }
        relative
      `}
    >
      <div className="relative flex-shrink-0">
        <Icon size={20} className="flex-shrink-0" />
        {badge && collapsed && (
          <span className="
            absolute -top-1 -right-1 flex items-center justify-center 
            bg-red-500 text-white text-xs h-4 w-4 rounded-full
          ">
            {badge.length > 1 ? '+' : badge}
          </span>
        )}
      </div>
      {!collapsed && (
        <div className="ml-3 flex items-center justify-between w-full truncate">
          <span className="truncate">{label}</span>
          {badge && (
            <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full ml-2">
              {badge}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}