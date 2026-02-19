// src/components/layout/Header/UserMenu.tsx
import React from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../contexts/AuthContext';

export default function UserMenu() {
  const { session } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex items-center space-x-3">
      <div className="text-sm text-gray-700">
        Welcome, {session?.user?.email}
      </div>
      <button
        onClick={handleLogout}
        className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-md text-sm font-medium transition"
      >
        Logout
      </button>
    </div>
  );
}