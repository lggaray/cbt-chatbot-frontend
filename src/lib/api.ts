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

// Create an Axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is 401 and we haven't already tried to refresh the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          // No refresh token available, redirect to login
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        // Try to refresh the token using our configured api instance
        const response = await api.post('/auth/refresh', {
          refresh_token: refreshToken,
        });
        
        const { access_token, refresh_token } = response.data;
        
        // Store the new tokens
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        
        // Update the authorization header
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
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
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  login: async (email: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    
    // Use our configured api instance instead of raw axios
    const response = await api.post('/auth/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    const { access_token, refresh_token } = response.data;
    
    // Store tokens in localStorage
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    
    return response.data;
  },
  
  logout: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    
    try {
      await api.post('/auth/logout', { refresh_token: refreshToken });
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
    const response = await api.get('/users/me');
    return response.data;
  },
  
  updateProfile: async (userData: UserProfileUpdateData) => {
    const response = await api.put('/users/me', userData);
    return response.data;
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