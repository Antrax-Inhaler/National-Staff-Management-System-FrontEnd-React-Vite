// src/hooks/useUserRoles.ts - UPDATED
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

export const useUserRoles = () => {
  const { session } = useAuth();
  const [roles, setRoles] = useState<string[]>([]);
  const [affiliate_id, setAffiliateId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserMetadata = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      try {
        // Force refresh the session to get latest metadata
        const { data: { session: freshSession }, error: refreshError } = 
          await supabase.auth.refreshSession();
        
        if (refreshError) {
          throw refreshError;
        }

        if (freshSession?.user) {
          const userMetadata = freshSession.user.user_metadata || {};
          const userRoles = userMetadata.roles || [];
          const userAffiliateId = userMetadata.affiliate_id || null;

          setRoles(userRoles);
          setAffiliateId(userAffiliateId);
        }
      } catch (err) {
        console.error('Error fetching user metadata:', err);
        setError('Failed to load user roles');
        
        // Fallback to current session metadata
        const fallbackMetadata = session.user.user_metadata || {};
        setRoles(fallbackMetadata.roles || []);
        setAffiliateId(fallbackMetadata.affiliate_id || null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserMetadata();
  }, [session]);

  return { roles, affiliate_id, loading, error };
};