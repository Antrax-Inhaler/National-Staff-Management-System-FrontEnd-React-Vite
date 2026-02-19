// src/contexts/UserInfoContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getUserInfo, type UserInfo, clearUserInfoCache } from '../api/userApi';
import { useAuth } from './AuthContext';

interface UserInfoContextType {
  userInfo: UserInfo | null;
  loading: boolean;
  refreshUserInfo: () => Promise<void>;
}

const UserInfoContext = createContext<UserInfoContextType | undefined>(undefined);

interface UserInfoProviderProps {
  children: ReactNode;
}

export const UserInfoProvider: React.FC<UserInfoProviderProps> = ({ children }) => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  const refreshUserInfo = async () => {
    if (!session) {
      setUserInfo(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userData = await getUserInfo(true); // Force refresh
      setUserInfo(userData);
    } catch (error) {
      console.error('Error refreshing user info:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!session) {
        setUserInfo(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userData = await getUserInfo(); // Use cached if available
        setUserInfo(userData);
      } catch (error) {
        console.error('Error fetching user info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [session]);

  const value = {
    userInfo,
    loading,
    refreshUserInfo,
  };

  return (
    <UserInfoContext.Provider value={value}>
      {children}
    </UserInfoContext.Provider>
  );
};

export const useUserInfo = (): UserInfoContextType => {
  const context = useContext(UserInfoContext);
  if (context === undefined) {
    throw new Error('useUserInfo must be used within a UserInfoProvider');
  }
  return context;
};