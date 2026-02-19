// src/components/layout/Footer.tsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
          <p className="text-sm text-gray-600">
            © 2024 Organization. All rights reserved.
          </p>
          <div className="flex space-x-4">
            <Link to="/privacy" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Terms
            </Link>
            <Link to="/support" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}