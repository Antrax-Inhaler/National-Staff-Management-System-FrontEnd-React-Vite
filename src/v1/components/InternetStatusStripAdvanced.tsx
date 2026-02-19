// components/InternetStatusStripSimple.tsx
import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, X } from 'lucide-react';

const InternetStatusStripSimple = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [showOnlineToast, setShowOnlineToast] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsVisible(false);
      setShowOnlineToast(true);
      
      // Hide online toast after 3 seconds
      setTimeout(() => setShowOnlineToast(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsVisible(true);
      setShowOnlineToast(false);
    };

    // Set initial state
    setIsVisible(!navigator.onLine);

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't show anything if we're online and not showing the reconnect toast
  if (!isVisible && !showOnlineToast) return null;

  const handleClose = () => {
    setIsVisible(false);
    setShowOnlineToast(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Online Reconnected Toast */}
      {showOnlineToast && (
        <div className="animate-slide-up mb-4 mx-4">
          <div className="flex items-center justify-between bg-gray-800 text-gray-100 rounded-lg shadow-lg px-4 py-3 max-w-md mx-auto">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center">
                <Wifi size={16} className="text-green-400" />
              </div>
              <span className="text-sm">Connection restored</span>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-100 transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Offline Strip */}
      {isVisible && (
        <div className="bg-gray-900 border-t border-gray-700">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 flex items-center justify-center">
                  <WifiOff size={18} className="text-red-400" />
                </div>
                <div className="text-sm text-gray-100">
                  <span className="font-medium">You're offline</span>
                  <span className="ml-2 text-gray-400">Check your connection</span>
                </div>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors px-3 py-1.5"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternetStatusStripSimple;