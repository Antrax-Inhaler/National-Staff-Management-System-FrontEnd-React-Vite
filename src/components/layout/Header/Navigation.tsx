// src/components/layout/Header/Navigation.tsx
import React from 'react';

export default function Navigation() {
  return (
    <nav className="hidden md:flex space-x-4">
      <a href="/national/dashboard" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
        Dashboard
      </a>
      <a href="/national/members" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
        Members
      </a>
      <a href="/national/contracts" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
        Contracts
      </a>
      <a href="/national/reports" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
        Reports
      </a>
    </nav>
  );
}