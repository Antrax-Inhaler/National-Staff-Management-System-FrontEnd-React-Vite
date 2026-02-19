import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { AlertTriangle, LogOut } from "lucide-react";

export default function UserMenu() {
  const { userRole } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await supabase.auth.signOut();
      // Force page reload to clear all state
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      // Show error message to user
      alert("Failed to logout. Please try again.");
      setIsLoggingOut(false);
    } finally {
      setShowLogoutModal(false);
    }
  };

  const openLogoutModal = () => {
    setShowLogoutModal(true);
  };

  const closeLogoutModal = () => {
    if (!isLoggingOut) {
      setShowLogoutModal(false);
    }
  };

  return (
    <>
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center w-10 h-10 mr-3 bg-red-100 rounded-full">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirm Logout</h3>
                <p className="text-sm text-gray-500">Sign out from ORG Portal</p>
              </div>
            </div>
            
            <p className="mb-6 text-gray-600">
              Are you sure you want to logout? You'll need to sign in again to access your account.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeLogoutModal}
                disabled={isLoggingOut}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Logging out...
                  </>
                ) : (
                  <>
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Menu */}
      <div className="flex items-center space-x-3">
        <div className="text-sm text-gray-700">
          Welcome, <span className="font-medium">{userRole?.display_name || "User"}</span>
        </div>
        <button
          onClick={openLogoutModal}
          className="px-3 py-2 text-sm font-medium transition bg-gray-100 rounded-md hover:bg-gray-200 flex items-center"
        >
          Logout
        </button>
      </div>
    </>
  );
}