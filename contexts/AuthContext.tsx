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

  const verifyAndRefreshToken = useCallback(async () => {
    const storedToken = localStorage.getItem('auth_token');
    console.log('Verifying token from localStorage:', storedToken ? 'Token exists' : 'No token');
    
    if (!storedToken) {
      setLoading(false);
      return;
    }

    try {
      console.log('Making request to /api/auth/me with token');
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${storedToken}`,
        },
      });

      console.log('Auth check response status:', response.status);

      if (response.ok) {
        const { user: refreshedUser, token: refreshedToken } = await response.json();
        console.log('Auth check successful, user:', refreshedUser.email);
        setUser(refreshedUser);
        setToken(refreshedToken);
        localStorage.setItem('auth_token', refreshedToken);
        localStorage.setItem('auth_user', JSON.stringify(refreshedUser));
      } else if (response.status === 401) {
        console.log('Token is invalid or expired, clearing storage');
        // Token is invalid or expired, clear storage but don't redirect immediately
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setUser(null);
        setToken(null);
        // Only redirect if we're on a protected route
        if (window.location.pathname.startsWith('/dashboard')) {
          router.push('/auth/login');
        }
      } else {
        // Other errors - don't logout, just log the error
        console.error('Session verification failed with status:', response.status);
      }
    } catch (error) {
      console.error("Session verification failed", error);
      // Don't logout on network errors, just log the error
      // This prevents redirects due to temporary network issues
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // Initialize from localStorage first
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
    
    // Then verify the token with the server
    verifyAndRefreshToken();
  }, [verifyAndRefreshToken]);

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
    console.log('Logout called - clearing authentication data');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
    setToken(null);
    // Only redirect if we're not already on the home page
    if (window.location.pathname !== '/') {
      router.push('/');
    }
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