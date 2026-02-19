// src/components/layout/Header/Header.tsx
import React from 'react';
import UserMenu from './UserMenu';
import { useAuth } from '../../../contexts/AuthContext';
export default function Header() {
  const { accessToken } = useAuth();
  
  return (
<header className="bg-white border-b border-gray-300">
  <div className="flex items-center justify-between px-6 py-3">
    <div className="flex items-right">
      <h1 className="text-xl font-bold text-gray-900">Organization Portal</h1>
    </div>
    <div className="flex items-center space-x-4">
      <UserMenu />
    </div>
  </div>
</header>

  );
}