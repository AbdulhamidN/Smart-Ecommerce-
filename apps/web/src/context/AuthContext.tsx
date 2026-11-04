import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import apiClient from '../api/client';

export type Role = 'CUSTOMER' | 'SELLER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  seller?: {
    id: string;
    storeName: string;
    status: string;
  } | null;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: 'CUSTOMER' | 'SELLER';
  storeName?: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check current session on mount
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const response = await apiClient.get('/auth/me');
        if (isMounted && response.data?.data?.user) {
          setUser(response.data.data.user);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    if (response.data?.data?.user) {
      setUser(response.data.data.user);
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const response = await apiClient.post('/auth/register', data);
    if (response.data?.data?.user) {
      setUser(response.data.data.user);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
