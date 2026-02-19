import React, { useState, useEffect } from "react";
import {
  Home,
  Building2,
  Users,
  FileText,
  Scale,
  BarChart3,
  Mail,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Landmark,
  Link as LinkIcon,
  Settings,
  LogOut,
  UserCog,
  List,
  FileCheck,
  MessageSquare,
  Megaphone,
  Search,
  Key,
  Activity,
  Shield,
  Clock,
  AlertTriangle,
  BookOpen
} from "lucide-react";
import NavItem from "./NavItem";
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../contexts/AuthContext';
import { useLocation } from "react-router-dom";
interface NavGroup {
  title: string;
  items: NavItemProps[];
}
interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: string;
  active?: boolean;
  onClick?: () => void;
  collapsed?: boolean;
}
export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { userType, user } = useAuth();
  const location = useLocation();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowLogoutModal(false);
  };
  const openLogoutModal = () => {
    setShowLogoutModal(true);
  };
  const closeLogoutModal = () => {
    setShowLogoutModal(false);
  };
  const nationalGroups: NavGroup[] = [
    {
      title: "Main",
      items: [
        { href: "/national/dashboard", label: "Dashboard", icon: Home, active: true },
        { href: "/national/affiliates", label: "Affiliate Dashboards", icon: Building2 },
      ]
    },
    {
      title: "Management",
      items: [
        { href: "/national/leader-reports", label: "Leader Reports", icon: UserCog },
        { href: "/national/affiliate-management", label: "Affiliate Management", icon: Building2, badge: "2" },
        { href: "/national/leader-roster", label: "National Leader Roster", icon: Users },
        { href: "/national/member-management", label: "Member Roster", icon: Users },
      ]
    },
    {
      title: "Resources",
      items: [
        { href: "/national/documents", label: "Document Management", icon: FileCheck },
        { href: "/national/information", label: "National Information Management", icon: BookOpen },
        // { href: "/national/events", label: "Events Calendar", icon: Calendar },
        { href: "/national/links", label: "Link Management", icon: LinkIcon },
      ]
    },
    {
      title: "Analytics",
      items: [
        { href: "/national/reports", label: "Event Reports", icon: BarChart3 },
        { href: "/national/analytics", label: "System Analytics", icon: Activity },
      ]
    },
    {
      title: "Committees",
      items: [
        { href: "/national/research", label: "Research Committee", icon: Search },
        { href: "/national/communications", label: "Communications Committee", icon: Megaphone },
      ]
    },
    {
      title: "System",
      items: [
        { href: "/national/permissions", label: "User Permissions", icon: Key, badge: "Update" },
        { href: "/national/settings", label: "Settings", icon: Settings },
        { href: "#", label: "Logout", icon: LogOut, onClick: openLogoutModal },
      ]
    }
  ];
  const affiliateGroups: NavGroup[] = [
    {
      title: "Main",
      items: [
        { href: "/affiliate/dashboard", label: "Dashboard", icon: Home, active: true },
        { href: "/affiliate/profile", label: "My Profile", icon: User },
      ]
    },
    {
      title: "Affiliate Management",
      items: [
        { href: "/affiliate/officers", label: "Officer Roster", icon: Users, badge: "3" },
        { href: "/affiliate/members", label: "Member Roster", icon: List },
      ]
    },
    {
      title: "Resources",
      items: [
        { href: "/affiliate/documents", label: "Bylaws & Documents", icon: FileText },
        // { href: "/affiliate/events", label: "Events Calendar", icon: Calendar },
        { href: "/affiliate/links", label: "Link Directory", icon: LinkIcon },
      ]
    },
    // {
    //   title: "Communication",
    //   items: [
    //     { href: "/affiliate/sms", label: "Bulk SMS", icon: MessageSquare, badge: "5" },
    //     { href: "/affiliate/email", label: "Bulk Email", icon: Mail },
    //   ]
    // },
    // {
    //   title: "Account",
    //   items: [
    //     { href: "/affiliate/settings", label: "Settings", icon: Settings },
    //     { href: "#", label: "Logout", icon: LogOut, onClick: openLogoutModal },
    //   ]
    // }
  ];
  const memberGroups: NavGroup[] = [
    {
      title: "Main",
      items: [
        { href: "/member/dashboard", label: "Dashboard", icon: Home, active: true },
        { href: "/member/profile", label: "My Profile", icon: User },
        // { href: "/member/affiliate", label: "Affiliate Information", icon: Building2 },
      ]
    },
    {
      title: "Resources",
      items: [
        { href: "/member/national", label: "National Information", icon: Landmark, badge: "New" },
         { href: "/member/documents", label: "Bylaws & Documents", icon: FileText },
        // { href: "/member/events", label: "Events Calendar", icon: Calendar },

        { href: "/member/links", label: "Link Directory", icon: LinkIcon },
      ]
    },
    // {
    //   title: "Account",
    //   items: [
    //     { href: "/member/settings", label: "Settings", icon: Settings },
    //     { href: "#", label: "Logout", icon: LogOut, onClick: openLogoutModal },
    //   ]
    // }
  ];
  const getPortalTitle = () => {
    switch (userType) {
      case "national": return "National Admin";
      case "affiliate": return "Affiliate Portal";
      case "member": return "Member Portal";
      default: return "Organization Portal";
    }
  };
  const getNavGroups = () => {
    switch (userType) {
      case "national": return nationalGroups;
      case "affiliate": return affiliateGroups;
      case "member": return memberGroups;
      default: return [];
    }
  };
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };
  const toggleMobileSidebar = () => {
    setMobileOpen(!mobileOpen);
  };
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const navGroups = getNavGroups();
  return (
    <>
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg">
            <div className="flex items-center mb-4">
              <AlertTriangle className="mr-2 text-yellow-500" size={24} />
              <h3 className="text-lg font-semibold">Confirm Logout</h3>
            </div>
            <p className="mb-6 text-gray-600">
              Are you sure you want to logout? You'll need to sign in again to access your account.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeLogoutModal}
                className="px-4 py-2 font-medium text-gray-600 transition-colors rounded-md hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 font-medium text-white transition-colors bg-red-600 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Mobile overlay - changed to backdrop blur */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-white bg-opacity-30 backdrop-blur-sm lg:hidden"
          onClick={toggleMobileSidebar}
        />
      )}
      {/* Sidebar */}
      <div
        className={`
          fixed lg:relative inset-y-0 left-0 z-50
          transform transition-all duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'w-16' : 'w-64'}
          flex flex-col bg-white border-r border-gray-200 h-screen
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-300">
          {!collapsed && (
            <div className="flex items-center transition-opacity duration-300">
              <h2 className="text-lg font-semibold text-gray-900 truncate">{getPortalTitle()}</h2>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="hidden p-1 transition-colors duration-200 rounded hover:bg-gray-100 lg:block"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <button
            onClick={toggleMobileSidebar}
            className="p-1 transition-colors duration-200 rounded hover:bg-gray-100 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>
        {/* User info */}
        <div className="flex items-center p-4 space-x-3 border-b border-gray-300">
          <div className="relative">
            <div className="flex items-center justify-center w-10 h-10 font-medium text-white bg-indigo-500 rounded-full">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 transition-opacity duration-300">
              <div className="font-medium text-gray-900 truncate">{user?.email || 'User'}</div>
              <div className="text-xs text-gray-500 capitalize truncate">{userType}</div>
            </div>
          )}
        </div>
        {/* Navigation */}
        <nav className="flex-1 py-4 space-y-6 overflow-y-auto">
          {navGroups.map((group, index) => (
            <div key={index} className="px-2">
              {!collapsed && group.title && (
                <div className="px-2 py-2 text-xs font-semibold tracking-wider text-gray-500 uppercase truncate transition-opacity duration-300">
                  {group.title}
                </div>
              )}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    badge={item.badge}
                    active={location.pathname.startsWith(item.href)}
                    collapsed={collapsed}
                    onClick={item.onClick || toggleMobileSidebar}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
        {/* Footer */}
        {!collapsed && (
          <div className="p-4 text-xs text-gray-500 transition-opacity duration-300 border-t">
           
            <div className="flex items-center space-x-2">
              <Clock size={14} className="text-gray-400" />
              <span>Last login: Today, 09:42 AM</span>
            </div>
          </div>
        )}
      </div>
      {/* Mobile menu button */}
      <button
        onClick={toggleMobileSidebar}
        className="fixed z-40 p-2 transition-colors duration-200 bg-white rounded-md shadow-md top-4 left-4 lg:hidden"
      >
        <Menu size={20} />
      </button>
    </>
  );
}