// src/api/userApi.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UserInfo {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  member_id: number | null;
}

// Cache implementation
let userInfoCache: UserInfo | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getUserInfo = async (forceRefresh = false): Promise<UserInfo> => {
  // Return cached data if still valid and not forcing refresh
  if (!forceRefresh && userInfoCache && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
    return userInfoCache;
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const token = session.access_token;
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    
    const response = await fetch(`${apiUrl}/api/user/info`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user information');
    }

    const result = await response.json();

    if (result.success) {
      // Update cache
      userInfoCache = result.data;
      cacheTimestamp = Date.now();
      return result.data;
    } else {
      throw new Error(result.message || 'Failed to fetch user information');
    }
  } catch (error) {
    console.error('Error fetching user info:', error);
    throw error;
  }
};

// Function to clear cache (useful for logout)
export const clearUserInfoCache = () => {
  userInfoCache = null;
  cacheTimestamp = 0;
};