// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  roles: string[];
  affiliateId: number | null;
  loading: boolean;
  userType: 'national' | 'affiliate' | 'member' | null;
  hasRoles: boolean;
  accessToken: string | null;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  
  user: null,
  roles: [],
  affiliateId: null,
  loading: true,
  userType: null,
  hasRoles: false,
accessToken: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasRoles, setHasRoles] = useState(false);
const accessToken = session?.access_token ?? null;

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Check if user has roles in metadata
      if (session?.user?.user_metadata?.roles) {
        setHasRoles(true);
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check if user has roles in metadata
        if (session?.user?.user_metadata?.roles) {
          setHasRoles(true);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Extract roles and affiliate_id from user metadata (if available)
  const roles = user?.user_metadata?.roles || [];
  const affiliateId = user?.user_metadata?.affiliate_id || null;

  // Determine user type
  const userType = (() => {
    if (loading) return null;
    
    const nationalRoles = ['National Administrator', 'Organization Executive Committee', 'Organization Research Committee'];
    const officerRoles = ['President', 'Vice President', 'Secretary', 'Treasurer', 'Grievance Chair', 'Bargaining Chair'];

    if (roles.some((role: string) => nationalRoles.includes(role))) return 'national';
    if (roles.some((role: string) => officerRoles.includes(role))) return 'affiliate';
    if (affiliateId) return 'member';
    
    return null;
  })();

  return (
    <AuthContext.Provider value={{
      session,
      user,
      roles,
      affiliateId,
      loading,
      userType,
      hasRoles, // Add this
      accessToken, 
    }}>
      {children}
    </AuthContext.Provider>
  );
};