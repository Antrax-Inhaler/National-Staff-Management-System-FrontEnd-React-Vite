// lib/sessionUtils.ts
import { supabase } from "./supabase";

export async function validateSession(): Promise<boolean> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return false;
    }
    
    // Check if token is expired
    const isExpired = session.expires_at ? session.expires_at * 1000 < Date.now() : false;
    
    if (isExpired) {
      console.log('Session expired, refreshing...');
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      return !refreshError && !!refreshedSession;
    }
    
    return true;
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
}

export async function ensureValidSession(): Promise<void> {
  const isValid = await validateSession();
  if (!isValid) {
    throw new Error('Invalid or expired session');
  }
}