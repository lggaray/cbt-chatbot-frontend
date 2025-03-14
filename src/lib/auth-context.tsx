'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { authAPI, userAPI } from './api';
import { useRouter } from 'next/navigation';
import { UserRegistrationData } from './api'; // Import the interface

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
  register: (userData: UserRegistrationData) => Promise<void>;
  resetInactivityTimer: () => void;
  clearChatState?: () => void; // Optional function to clear chat state
  setClearChatState: (fn: () => void) => void; // Function to set the clearChatState function
}

// Create the context
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
  resetInactivityTimer: () => {},
  clearChatState: undefined,
  setClearChatState: () => {}
});

// Create a provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Use a ref instead of state for clearChatState to avoid re-renders
  const clearChatStateRef = useRef<(() => void) | undefined>(undefined);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Function to set the clearChatState ref
  const setClearChatState = useCallback((fn: () => void) => {
    clearChatStateRef.current = fn;
  }, []);

  // Function to reset the inactivity timer
  const resetInactivityTimer = useCallback(() => {
    // Clear existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }

    // Set new timer - log out after 30 minutes of inactivity
    // Only set timer if user is logged in
    if (user) {
      inactivityTimerRef.current = setTimeout(() => {
        // We'll call the logout function directly here
        // This avoids the circular dependency
        (async () => {
          try {
            // Clear chat state if function is provided
            if (clearChatStateRef.current) {
              clearChatStateRef.current();
            }
            
            await authAPI.logout();
          } catch (_) {
            // Ignore errors during logout
          } finally {
            // Clear user data and tokens regardless of API success
            setUser(null);
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
          }
          router.push('/login');
        })();
      }, 30 * 60 * 1000); // 30 minutes
    }
  }, [user, router]);
  
  // Set up activity listeners
  useEffect(() => {
    if (!user) return;
    
    // Set up event listeners for user activity
    const events = ['mousedown', 'keypress', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      resetInactivityTimer();
    };
    
    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });
    
    // Initial timer setup
    resetInactivityTimer();
    
    // Cleanup
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [user, resetInactivityTimer]);

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
      } catch (_) {
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
      console.log('Auth context: Attempting login for', email);
      const response = await authAPI.login(email, password);
      console.log('Auth context: Login successful, received tokens');
      
      // Store tokens in localStorage
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      
      try {
        console.log('Auth context: Fetching user data');
        const userData = await userAPI.getCurrentUser();
        console.log('Auth context: User data fetched successfully');
        setUser(userData);
        router.push('/home');
      } catch (error) {
        console.error('Auth context: Error fetching user data after login', error);
        // Clear tokens if user data fetch fails
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        throw new Error('Failed to fetch user data after login');
      }
    } catch (error) {
      console.error('Auth context: Login failed', error);
      throw error; // Re-throw to be handled by the login page
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    
    try {
      // Clear chat state if function is provided
      if (clearChatStateRef.current) {
        clearChatStateRef.current();
      }
      
      await authAPI.logout();
    } catch (_) {
      // Ignore errors during logout
    } finally {
      // Clear user data and tokens regardless of API success
      setUser(null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setIsLoading(false);
      
      // Clear inactivity timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    }
  };

  // Register function
  const register = async (userData: UserRegistrationData) => {
    setIsLoading(true);
    
    try {
      const newUser = await authAPI.register(userData);
      await authAPI.login(userData.email, userData.password);
      setUser(newUser);
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
    // Use the current value of the ref for the context value
    clearChatState: clearChatStateRef.current,
    setClearChatState
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
    }, [isLoading, isAuthenticated, router]);
    
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