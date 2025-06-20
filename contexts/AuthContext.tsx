'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; userNotFound?: boolean }>;
  signup: (email: string, password: string, name: string, company?: string) => Promise<{ success: boolean; error?: string; userExists?: boolean }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for stored auth data on mount
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        // Clear invalid data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
    
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string; userNotFound?: boolean }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Login response not ok:', response.status, errorText);
        
        // Try to parse as JSON, fallback to text
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: `Server error: ${response.status}` };
        }
        
        return { 
          success: false, 
          error: errorData.error || `Server error: ${response.status}`,
          userNotFound: errorData.userNotFound 
        };
      }

      const data = await response.json();

      if (data.user && data.token) {
        setUser(data.user);
        setToken(data.token);
        
        // Store in localStorage
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        
        return { success: true };
      }
      
      return { 
        success: false, 
        error: data.error || 'Login failed',
        userNotFound: data.userNotFound 
      };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: 'Network error. Please check your connection and try again.' 
      };
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string, company?: string): Promise<{ success: boolean; error?: string; userExists?: boolean }> => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, company }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Signup response not ok:', response.status, errorText);
        
        // Try to parse as JSON, fallback to text
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: `Server error: ${response.status}` };
        }
        
        return { 
          success: false, 
          error: errorData.error || `Server error: ${response.status}`,
          userExists: errorData.userExists 
        };
      }

      const data = await response.json();

      if (data.user && data.token) {
        setUser(data.user);
        setToken(data.token);
        
        // Store in localStorage
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        
        return { success: true };
      }
      
      return { 
        success: false, 
        error: data.error || 'Signup failed',
        userExists: data.userExists 
      };
    } catch (error) {
      console.error('Signup error:', error);
      return { 
        success: false, 
        error: 'Network error. Please check your connection and try again.' 
      };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    router.push('/');
  }, [router]);

  const contextValue = useMemo(() => ({
    user,
    token,
    login,
    signup,
    logout,
    loading,
  }), [user, token, login, signup, logout, loading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}