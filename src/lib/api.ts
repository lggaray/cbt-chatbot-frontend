'use client';

import axios from 'axios';

// Define interfaces to replace any types
export interface UserRegistrationData {
  name: string;
  email: string;
  password: string;
  age?: number;
  gender?: string;
  check_in_frequency?: number;
}

export interface UserProfileUpdateData {
  name?: string;
  email?: string;
  age?: number;
  gender?: string;
  check_in_frequency?: number;
}

export interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  check_in_reminders: boolean;
  cbt_session_reminders: boolean;
}

// Use environment variable for API URL with fallback to localhost for development
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Log the API URL for debugging
console.log('API Base URL:', API_BASE_URL);

// Create an Axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Changed to false to avoid CORS preflight issues
  timeout: 10000,
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url} with auth token`);
    } else {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url} without auth token`);
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  async (error) => {
    console.error('API Response Error:', error.response?.status, error.config?.url, error.message);
    
    const originalRequest = error.config;
    
    // If the error is 401 and we haven't already tried to refresh the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('Token expired, attempting to refresh...');
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          console.error('No refresh token available');
          // No refresh token available, redirect to login
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        console.log('Attempting to refresh token');
        // Try to refresh the token using our configured api instance
        const response = await api.post('/auth/refresh', {
          refresh_token: refreshToken,
        });
        
        console.log('Token refresh successful');
        const { access_token, refresh_token } = response.data;
        
        // Store the new tokens
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        
        // Update the authorization header
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        
        console.log('Retrying original request');
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // If refresh fails, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  register: async (userData: UserRegistrationData) => {
    console.log('API: Registering user', userData.email);
    const response = await api.post('/auth/register', userData);
    console.log('API: Registration successful');
    return response.data;
  },
  
  login: async (email: string, password: string) => {
    console.log('API: Attempting login for', email);
    
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    
    try {
      // Use our configured api instance instead of raw axios
      const response = await api.post('/auth/token', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      console.log('API: Login successful, received tokens');
      const { access_token, refresh_token } = response.data;
      
      // Store tokens in localStorage
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      
      return response.data;
    } catch (error) {
      console.error('API: Login failed', error);
      throw error;
    }
  },
  
  logout: async () => {
    console.log('API: Attempting logout');
    const refreshToken = localStorage.getItem('refresh_token');
    
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refresh_token: refreshToken });
        console.log('API: Logout successful');
      } else {
        console.log('API: No refresh token found, skipping server logout');
      }
    } catch (error) {
      console.error('API: Logout failed', error);
    } finally {
      // Clear tokens regardless of API response
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  },
};

// Home API
export const homeAPI = {
  getHomeData: async () => {
    const response = await api.get('/home');
    return response.data;
  },
};

// Chat API
export const chatAPI = {
  sendCheckInMessage: async (message: string | undefined, sessionId: string | null, mode: string = 'non-clinical') => {
    const response = await api.post('/chat/check-in', {
      message: message ?? '',
      session_id: sessionId,
      mode: mode,
    });
    return response.data;
  },
  
  sendCBTMessage: async (message: string | undefined, sessionId: string | null) => {
    const response = await api.post('/chat/cbt', {
      message: message ?? '',
      session_id: sessionId,
      mode: 'cbt',
    });
    return response.data;
  },
  
  // Survey-specific functions
  startSurvey: async (sessionId: string | null) => {
    return await chatAPI.sendCheckInMessage(undefined, sessionId, 'survey');
  },
  
  selectQuestionnaire: async (questionnaireId: string, sessionId: string | null) => {
    const message = `select_questionnaire:${questionnaireId}`;
    return await chatAPI.sendCheckInMessage(message, sessionId, 'survey');
  },
  
  answerSurveyQuestion: async (questionnaireId: string, questionIndex: number, answerScore: number, sessionId: string | null) => {
    const message = `answer:${questionnaireId}|${questionIndex}|${answerScore}`;
    return await chatAPI.sendCheckInMessage(message, sessionId, 'survey');
  },
};

// User API
export const userAPI = {
  getCurrentUser: async () => {
    console.log('API: Fetching current user data');
    try {
      const response = await api.get('/users/me');
      console.log('API: User data fetched successfully', response.data);
      return response.data;
    } catch (error) {
      console.error('API: Failed to fetch user data', error);
      throw error;
    }
  },
  
  updateProfile: async (userData: UserProfileUpdateData) => {
    console.log('API: Updating user profile', userData);
    try {
      const response = await api.put('/users/me', userData);
      console.log('API: Profile updated successfully', response.data);
      return response.data;
    } catch (error) {
      console.error('API: Failed to update profile', error);
      throw error;
    }
  },
  
  // New method for user notification preferences
  getNotificationPreferences: async () => {
    const response = await api.get('/users/notification-preferences');
    return response.data;
  },
  
  // New method for updating user notification preferences
  updateNotificationPreferences: async (preferences: NotificationPreferences) => {
    const response = await api.put('/users/notification-preferences', preferences);
    return response.data;
  },
};

// Journal API
export const journalAPI = {
  // Create a new journal entry
  createEntry: async (entryData: { entry_text: string; image_url?: string }) => {
    const response = await api.post('/journal', entryData);
    return response.data;
  },
  
  // Get all journal entries for the current user
  getEntries: async (skip = 0, limit = 10) => {
    const response = await api.get(`/journal?skip=${skip}&limit=${limit}`);
    return response.data;
  },
  
  // Get a specific journal entry by ID
  getEntry: async (entryId: number) => {
    const response = await api.get(`/journal/${entryId}`);
    return response.data;
  },
  
  // Delete a journal entry
  deleteEntry: async (entryId: number) => {
    await api.delete(`/journal/${entryId}`);
  },
  
  // Generate a summary for a journal entry
  generateSummary: async (entryId: number) => {
    const response = await api.post(`/journal/${entryId}/summary`);
    return response.data;
  },
};

// Mood Log API
export const moodAPI = {
  // Create a new mood log
  createLog: async (logData: { mood_rating: number; notes?: string }) => {
    const response = await api.post('/mood', logData);
    return response.data;
  },
  
  // Get all mood logs for the current user
  getLogs: async (skip = 0, limit = 10) => {
    const response = await api.get(`/mood?skip=${skip}&limit=${limit}`);
    return response.data;
  },
  
  // Get a specific mood log by ID
  getLog: async (logId: number) => {
    const response = await api.get(`/mood/${logId}`);
    return response.data;
  },
  
  // Delete a mood log
  deleteLog: async (logId: number) => {
    await api.delete(`/mood/${logId}`);
  },
};

// Quotes API
export const quotesAPI = {
    // Get a random quote
  getRandomQuote: async () => {
    const response = await api.get('/quotes/random');
    return response.data;
  },
  
  getQuotes: async (skip = 0, limit = 100) => {
    const response = await api.get(`/quotes?skip=${skip}&limit=${limit}`);
    return response.data;
  },
};

export default api; 