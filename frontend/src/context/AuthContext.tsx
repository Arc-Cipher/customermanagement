import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { UserInfo } from '../types/auth';
import { getMe } from '../api/auth';
import { setCredentials } from '../api/credentials';

export interface AuthContextType {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<UserInfo>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'supermart_auth';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    setCredentials(null);
    sessionStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      setCredentials(saved);
      getMe()
        .then((userData) => {
          if (userData && userData.active) {
            setUser(userData);
          } else {
            logout();
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [logout]);

  const login = useCallback(async (username: string, password: string): Promise<UserInfo> => {
    const b64 = btoa(`${username}:${password}`);
    setCredentials(b64);
    sessionStorage.setItem(STORAGE_KEY, b64);

    try {
      const userData = await getMe();
      if (!userData.active) {
        throw new Error('This account has been deactivated. Please contact an administrator.');
      }
      setUser(userData);
      return userData;
    } catch (error) {
      logout();
      throw error;
    }
  }, [logout]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user && user.active,
      isLoading,
      login,
      logout,
    }),
    [user, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
