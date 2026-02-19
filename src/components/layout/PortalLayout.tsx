// src/components/layout/PortalLayout.tsx
import React from 'react';
import Header from './Header/Header';
import Sidebar from './Sidebar/Sidebar';
import { useAuth } from '../../contexts/AuthContext';

interface PortalLayoutProps {
  children: React.ReactNode;
}

export default function PortalLayout({ children }: PortalLayoutProps) {
  const { userType } = useAuth();

  if (!userType) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 lg:ml-0"> {/* Adjusted for collapsed sidebar */}
        <Header />
          {children}
      </div>
    </div>
  );
}