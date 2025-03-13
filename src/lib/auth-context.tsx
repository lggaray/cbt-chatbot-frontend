'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, userAPI } from './api';
import { useRouter } from 'next/navigation';

// Define types
interface User {
  id: number;
  name: string | null;
  email: string;
  age: number | null;
  gender: string | null;
  check_in_frequency: number;
  is_active: boolean;
  is_admin: boolean;
  last_check_in: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<void>;
  resetInactivityTimer: () => void;
  clearChatState?: () => void; // Optional function to clear chat state
  setClearChatState: (fn: () => void) => void; // Function to set the clearChatState function
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Inactivity timeout in milliseconds (30 minutes)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

// Create a provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null);
  const [clearChatState, setClearChatState] = useState<(() => void) | undefined>(undefined);
  const router = useRouter();

  // Function to reset the inactivity timer
  const resetInactivityTimer = () => {
    // Clear any existing timer
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }
    
    // Only set a new timer if the user is authenticated
    if (user) {
      const timer = setTimeout(() => {
        console.log('User inactive for 30 minutes, logging out');
        logout();
      }, INACTIVITY_TIMEOUT);
      
      setInactivityTimer(timer);
    }
  };
  
  // Set up event listeners for user activity
  useEffect(() => {
    if (user) {
      // Reset the timer when the user is active
      const handleActivity = () => {
        resetInactivityTimer();
      };
      
      // Add event listeners for user activity
      window.addEventListener('mousemove', handleActivity);
      window.addEventListener('keypress', handleActivity);
      window.addEventListener('click', handleActivity);
      window.addEventListener('scroll', handleActivity);
      
      // Initial timer setup
      resetInactivityTimer();
      
      // Clean up event listeners on unmount
      return () => {
        window.removeEventListener('mousemove', handleActivity);
        window.removeEventListener('keypress', handleActivity);
        window.removeEventListener('click', handleActivity);
        window.removeEventListener('scroll', handleActivity);
        
        if (inactivityTimer) {
          clearTimeout(inactivityTimer);
        }
      };
    }
  }, [user]);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      try {
        const userData = await userAPI.getCurrentUser();
        setUser(userData);
        resetInactivityTimer();
      } catch (error) {
        // Token is invalid or expired
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      await authAPI.login(email, password);
      const userData = await userAPI.getCurrentUser();
      setUser(userData);
      resetInactivityTimer();
      router.push('/home');
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    
    try {
      await authAPI.logout();
      setUser(null);
      
      // Clear the inactivity timer
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        setInactivityTimer(null);
      }
      
      // Clear chat state if the function is available
      if (clearChatState) {
        clearChatState();
      }
      
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData: any) => {
    setIsLoading(true);
    
    try {
      const newUser = await authAPI.register(userData);
      await authAPI.login(userData.email, userData.password);
      setUser(newUser);
      resetInactivityTimer();
      router.push('/home');
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    resetInactivityTimer,
    clearChatState,
    setClearChatState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Create a hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Create a higher-order component to protect routes
export const withAuth = (Component: React.ComponentType) => {
  const WithAuth: React.FC = (props) => {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    
    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push('/login');
      }
    }, [isAuthenticated, isLoading, router]);
    
    if (isLoading) {
      return <div>Loading...</div>;
    }
    
    if (!isAuthenticated) {
      return null;
    }
    
    return <Component {...props} />;
  };
  
  return WithAuth;
}; 