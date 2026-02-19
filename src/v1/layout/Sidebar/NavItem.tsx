// SIMPLEST AND MOST RELIABLE SOLUTION
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
  // Format badge message
  const getBadgeTitle = () => {
    if (!badge) return "";
    const count = parseInt(badge);
    return `Complete ${count} required field${count > 1 ? 's' : ''} in your profile`;
  };

  return (
    <Link
      to={href}
      onClick={onClick}
      className={`
        flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200
        ${active
          ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
        }
        relative group
        ${collapsed ? 'justify-center' : ''}
      `}
    >
      <div className="relative flex-shrink-0">
        <Icon size={20} className="flex-shrink-0" />
        
        {/* BADGE FOR COLLAPSED STATE - ONLY SHOW ON ICON WHEN COLLAPSED */}
        {badge && collapsed && (
          <span 
            className={`
              absolute flex items-center justify-center 
              min-w-[16px] h-4 text-[10px] px-1
              font-medium text-white 
              bg-amber-500 rounded-full
              -top-1 -right-1
              border border-white
              shadow-xs
            `}
            title={getBadgeTitle()}
          >
            {badge.length > 1 ? '+' : badge}
          </span>
        )}
      </div>
      
      {/* LABEL AND BADGE FOR EXPANDED STATE */}
      {!collapsed && (
        <div className="flex items-center justify-between w-full ml-3 truncate">
          <span className="truncate">{label}</span>
          
          {/* BADGE FOR EXPANDED STATE - MAIN DISPLAY (SHOW IN SIDEBAR) */}
          {badge && (
            <span 
              className={`
                bg-amber-100 text-amber-800 text-xs 
                font-medium px-2 py-0.5 rounded-full 
                ml-2 min-w-[20px] text-center
                border border-amber-200
                transition-all duration-200
                ${active ? 'bg-amber-200 text-amber-900' : 'bg-amber-100 text-amber-800'}
                hover:bg-amber-200
              `}
              title={getBadgeTitle()}
            >
              {badge.length > 2 ? badge.substring(0, 2) + '+' : badge}
            </span>
          )}
        </div>
      )}
      
      {/* TOOLTIP FOR COLLAPSED STATE (for the entire nav item) */}
      {collapsed && (
        <div className={`
          absolute left-full ml-2 px-3 py-2 
          bg-gray-900 text-white text-sm 
          rounded-md opacity-0 invisible 
          group-hover:opacity-100 group-hover:visible
          transition-all duration-200
          whitespace-nowrap
          z-50
          shadow-lg
          pointer-events-none
          ${badge ? 'flex items-center gap-2' : ''}
        `}>
          {label}
          {badge && (
            <span className="bg-amber-500 text-white text-xs font-medium px-1.5 py-0.5 rounded-full ml-1">
              {badge}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}