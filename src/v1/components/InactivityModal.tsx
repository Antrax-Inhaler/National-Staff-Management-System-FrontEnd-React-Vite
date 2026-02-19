// src/components/InactivityModal.tsx
import { useEffect } from 'react';
import { LogOut, Clock } from 'lucide-react';

interface InactivityModalProps {
  isOpen: boolean;
  timeLeft: number;
  onContinue: () => void;
  onLogout: () => void;
}

export default function InactivityModal({
  isOpen,
  timeLeft,
  onContinue,
  onLogout
}: InactivityModalProps) {
  // Auto logout when time reaches 0
  useEffect(() => {
    if (isOpen && timeLeft <= 0) {
      onLogout();
    }
  }, [isOpen, timeLeft, onLogout]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Session About to Expire
            </h3>
            <p className="text-sm text-gray-600">
              Your session will expire due to inactivity
            </p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Time remaining:</span>
            <span className="text-sm font-bold text-red-600">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-red-500 h-2 rounded-full transition-all duration-1000"
              style={{
                width: `${(timeLeft / 60) * 100}%`
              }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onContinue}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Continue Session
          </button>
          <button
            onClick={onLogout}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            Log Out Now
          </button>
        </div>

        <div className="mt-4 text-center">
          <img
            src="https://organization.org/wp-content/uploads/Organization-logo-round_500-400x400.png"
            alt="Organization Logo"
            className="w-12 h-12 mx-auto opacity-50"
          />
          <p className="text-xs text-gray-500 mt-2">
            Organization
          </p>
        </div>
      </div>
    </div>
  );
}