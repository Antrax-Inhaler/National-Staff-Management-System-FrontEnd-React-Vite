// src/hooks/useRefreshUser.ts
import { supabase } from '../lib/supabaseClient';

export const useRefreshUser = () => {
  const refreshUser = async () => {
    try {
      // This will trigger a re-fetch of the user with updated metadata
      await supabase.auth.refreshSession();
      return true;
    } catch (error) {
      console.error('Error refreshing user:', error);
      return false;
    }
  };

  return { refreshUser };
};