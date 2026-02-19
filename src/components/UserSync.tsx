// src/components/UserSync.tsx
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRefreshUser } from '../hooks/useRefreshUser';

export default function UserSync() {
  const { session, userType } = useAuth();
  const { refreshUser } = useRefreshUser();

  useEffect(() => {
    // Refresh user metadata when component mounts
    // This ensures we have the latest roles after login
    if (session) {
      const refresh = async () => {
        await refreshUser();
      };
      refresh();
    }
  }, [session, refreshUser]);

  return null; // This component doesn't render anything
}