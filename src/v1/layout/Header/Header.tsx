// src/components/layout/Header/Header.tsx
import React, { useState, useEffect } from "react";
import UserMenu from "./UserMenu";
import { useAuth } from "../../../contexts/AuthContext";
import { Moon, Sun, Menu, Search } from "lucide-react";
import UniversalSearch from "@v1/components/UniversalSearch";
import RoleGuard from "@v1/components/RoleGuard";
import { Committees, Roles } from "@v1/constants/roles";

export default function Header() {
  const { accessToken } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsSearchExpanded(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    const storedDarkMode = localStorage.getItem("darkMode");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (storedDarkMode !== null) {
      setDarkMode(storedDarkMode === "true");
    } else if (prefersDark) {
      setDarkMode(true);
    }
  }, []);

  // Toggle dark mode and update localStorage
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", newDarkMode.toString());

    // Update data-theme attribute on html element
    if (newDarkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      document.documentElement.classList.remove("dark");
    }
  };

  // Apply dark mode on initial load
  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.classList.add("dark");
    }
  }, [darkMode]);

  return (
    <header className="bg-white border-b border-gray-300 dark:bg-gray-800 dark:border-gray-700">
      {/* Mobile: Collapsed header */}
      {isMobile ? (
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Logo and menu button */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {}}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Menu"
              >
                <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <img
                src="https://organization.org/wp-content/uploads/Organization-logo-round_500-400x400.png"
                alt="Organization Logo"
                className="w-7 h-7"
              />
              <div className="flex flex-col">
                <h1 className="text-xs font-bold text-gray-900 dark:text-white">
                  Organization Portal
                </h1>
              </div>
            </div>

            {/* Right: Search toggle and user menu */}
            <div className="flex items-center space-x-2">
              <RoleGuard
                roles={[
                  Roles.NATIONAL_ADMINISTRATOR,
                  Roles.Organization_EXECUTIVE_COMMITEE,
                  ...Committees.EXECUTIVE_COMMITTEE,
                  ...Committees.REGIONAL_DIRECTORS,
                ]}
              >
                <button
                  onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                  className="p-1.5 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </RoleGuard>

              <button
                onClick={toggleDarkMode}
                className="p-1.5 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label={
                  darkMode ? "Switch to light mode" : "Switch to dark mode"
                }
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" />
                )}
              </button>

              <div className="ml-1">
                <UserMenu />
              </div>
            </div>
          </div>

          {/* Expanded search bar for mobile */}
          <RoleGuard
            roles={[
              Roles.NATIONAL_ADMINISTRATOR,
              Roles.Organization_EXECUTIVE_COMMITEE,
              ...Committees.EXECUTIVE_COMMITTEE,
              ...Committees.REGIONAL_DIRECTORS,
            ]}
          >
            {isSearchExpanded && (
              <div className="mt-3 transition-all duration-300" style={{
                animation: 'slideDown 0.3s ease-out'
              }}>
                <UniversalSearch />
              </div>
            )}
          </RoleGuard>
        </div>
      ) : (
        /* Desktop: Full header */
        <div className="flex items-center justify-between px-6 py-3">
          {/* Left section: Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <img
                src="https://organization.org/wp-content/uploads/Organization-logo-round_500-400x400.png"
                alt="Organization Logo"
                className="w-8 h-8"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-bold text-gray-900 dark:text-white">
                Organization Portal
              </h1>
              <span className="text-xs text-gray-500 dark:text-gray-400 hidden lg:inline">
                Organization
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 lg:hidden">
                Organization
              </span>
            </div>
          </div>

          {/* Middle section: Universal Search */}
          <RoleGuard
            roles={[
              Roles.NATIONAL_ADMINISTRATOR,
              Roles.Organization_EXECUTIVE_COMMITEE,
              ...Committees.EXECUTIVE_COMMITTEE,
              ...Committees.REGIONAL_DIRECTORS,
            ]}
          >
            <div className="flex-1 max-w-2xl mx-4 lg:mx-6">
              <UniversalSearch />
            </div>
          </RoleGuard>

          {/* Right section: Dark mode toggle and User menu */}
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label={
                darkMode ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>

            <UserMenu />
          </div>
        </div>
      )}

      {/* Add CSS animation via style tag */}
      <style>
        {`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </header>
  );
}