'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { chatAPI } from './api';
import { useAuth } from './auth-context';

// Define interfaces for type safety
interface SurveyAnswer {
  score: number | string;
  text: string;
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

// Define types
export interface NextStep {
  id: string;
  label: string;
  action: string;
}

export interface SurveyQuestionnaireOption {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

export interface SurveyQuestion {
  question_text: string;
  question_id: string;
  index: number;
  total: number;
}

export interface SurveyResult {
  questionnaire_id: string;
  questionnaire_name: string;
  score: number;
  severity: string;
  condition: string;
  max_score: number;
  interpretation?: string;
}

export interface ChatContextType {
  // Check-in chat state
  checkInSessionId: string | null;
  checkInMessages: Message[];
  checkInNextSteps: NextStep[];
  checkInLoading: boolean;
  
  // CBT chat state
  cbtSessionId: string | null;
  cbtMessages: Message[];
  cbtNextSteps: NextStep[];
  cbtLoading: boolean;
  
  // Survey state
  surveyMode: boolean;
  surveyQuestionnaireOptions: SurveyQuestionnaireOption[];
  currentSurveyQuestion: string | null;
  currentQuestionIndex: number | null;
  totalQuestions: number | null;
  possibleAnswers: SurveyAnswer[];
  currentQuestionnaireId: string | null;
  surveyResults: SurveyResult | null;
  
  // Actions
  startNewCheckIn: () => Promise<void>;
  resumeCheckIn: () => Promise<void>;
  sendCheckInMessage: (message: string) => Promise<void>;
  handleCheckInNextStep: (step: NextStep) => Promise<void>;
  
  startNewCBT: () => Promise<void>;
  resumeCBT: () => Promise<void>;
  sendCBTMessage: (message: string) => Promise<void>;
  handleCBTNextStep: (step: NextStep) => Promise<void>;
  
  // Survey actions
  startSurvey: () => Promise<void>;
  selectQuestionnaire: (questionnaireId: string) => Promise<void>;
  answerSurveyQuestion: (answerScore: number | string) => Promise<void>;
  closeSurvey: () => void;
  
  clearChatState: () => void;
}

// Create the context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Create a provider component
export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, setClearChatState } = useAuth();
  
  // Check-in state
  const [checkInSessionId, setCheckInSessionId] = useState<string | null>(null);
  const [checkInMessages, setCheckInMessages] = useState<Message[]>([]);
  const [checkInNextSteps, setCheckInNextSteps] = useState<NextStep[]>([]);
  const [checkInLoading, setCheckInLoading] = useState(false);
  
  // CBT state
  const [cbtSessionId, setCbtSessionId] = useState<string | null>(null);
  const [cbtMessages, setCbtMessages] = useState<Message[]>([]);
  const [cbtNextSteps, setCbtNextSteps] = useState<NextStep[]>([]);
  const [cbtLoading, setCbtLoading] = useState(false);
  
  // Survey state
  const [surveyMode, setSurveyMode] = useState(false);
  const [surveyQuestionnaireOptions, setSurveyQuestionnaireOptions] = useState<SurveyQuestionnaireOption[]>([]);
  const [currentSurveyQuestion, setCurrentSurveyQuestion] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number | null>(null);
  const [totalQuestions, setTotalQuestions] = useState<number | null>(null);
  const [possibleAnswers, setPossibleAnswers] = useState<SurveyAnswer[]>([]);
  const [currentQuestionnaireId, setCurrentQuestionnaireId] = useState<string | null>(null);
  const [surveyResults, setSurveyResults] = useState<SurveyResult | null>(null);
  
  // Load saved session IDs from localStorage on mount
  useEffect(() => {
    if (isAuthenticated) {
      const savedCheckInSessionId = localStorage.getItem('checkInSessionId');
      const savedCbtSessionId = localStorage.getItem('cbtSessionId');
      
      if (savedCheckInSessionId) {
        setCheckInSessionId(savedCheckInSessionId);
      }
      
      if (savedCbtSessionId) {
        setCbtSessionId(savedCbtSessionId);
      }
    }
  }, [isAuthenticated]);
  
  // Save session IDs to localStorage when they change
  useEffect(() => {
    if (checkInSessionId) {
      localStorage.setItem('checkInSessionId', checkInSessionId);
    } else {
      localStorage.removeItem('checkInSessionId');
    }
  }, [checkInSessionId]);
  
  useEffect(() => {
    if (cbtSessionId) {
      localStorage.setItem('cbtSessionId', cbtSessionId);
    } else {
      localStorage.removeItem('cbtSessionId');
    }
  }, [cbtSessionId]);
  
  // Clear all chat state (e.g., on logout)
  const clearChatState = useCallback(() => {
    // Clear check-in state
    setCheckInSessionId(null);
    setCheckInMessages([]);
    setCheckInNextSteps([]);
    
    // Clear CBT state
    setCbtSessionId(null);
    setCbtMessages([]);
    setCbtNextSteps([]);
    
    // Clear survey state
    setSurveyMode(false);
    setSurveyQuestionnaireOptions([]);
    setCurrentSurveyQuestion(null);
    setCurrentQuestionIndex(null);
    setTotalQuestions(null);
    setPossibleAnswers([]);
    setCurrentQuestionnaireId(null);
    setSurveyResults(null);
    
    // Clear localStorage
    localStorage.removeItem('checkInSessionId');
    localStorage.removeItem('cbtSessionId');
  }, []);
  
  // Register the clearChatState function with AuthContext
  // We use a ref to track if we've already registered the function
  const hasRegisteredClearChatState = useRef(false);
  
  useEffect(() => {
    // Only register once to prevent infinite loops
    if (!hasRegisteredClearChatState.current && setClearChatState) {
      setClearChatState(clearChatState);
      hasRegisteredClearChatState.current = true;
    }
  }, [setClearChatState, clearChatState]);
  
  // Start a new check-in session
  const startNewCheckIn = async () => {
    if (!user) return;
    
    setCheckInLoading(true);
    setCheckInSessionId(null);
    setCheckInMessages([]);
    setCheckInNextSteps([]);
    
    try {
      const response = await chatAPI.sendCheckInMessage(undefined, null);
      
      const botMessage: Message = {
        id: 'welcome',
        content: response.response,
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setCheckInMessages([botMessage]);
      setCheckInSessionId(response.session_id);
      
      if (response.next_steps && response.next_steps.length > 0) {
        setCheckInNextSteps(response.next_steps.map((step: string, index: number) => ({
          id: `step-${index}`,
          label: step,
          action: `Start ${step}`
        })));
      }
    } catch (error) {
      console.error('Error starting new check-in session:', error);
    } finally {
      setCheckInLoading(false);
    }
  };
  
  // Resume an existing check-in session
  const resumeCheckIn = async () => {
    if (!user || !checkInSessionId) return;
    
    setCheckInLoading(true);
    
    try {
      const response = await chatAPI.sendCheckInMessage(undefined, checkInSessionId);
      
      const botMessage: Message = {
        id: `resume-${Date.now()}`,
        content: response.response,
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setCheckInMessages((prev) => {
        return prev.length > 0 ? [...prev, botMessage] : [botMessage];
      });
      
      if (response.next_steps && response.next_steps.length > 0) {
        setCheckInNextSteps(response.next_steps.map((step: string, index: number) => ({
          id: `step-${index}`,
          label: step,
          action: `Start ${step}`
        })));
      }
    } catch (error) {
      console.error('Error resuming check-in session:', error);
      // If we can't resume, start a new session
      localStorage.removeItem('checkInSessionId');
      setCheckInSessionId(null);
      startNewCheckIn();
    } finally {
      setCheckInLoading(false);
    }
  };
  
  // Send a message in the check-in chat
  const sendCheckInMessage = async (message: string) => {
    if (!user || !message.trim() || checkInLoading) return;
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: message,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setCheckInMessages((prev) => [...prev, userMessage]);
    setCheckInLoading(true);
    setCheckInNextSteps([]);
    
    try {
      const response = await chatAPI.sendCheckInMessage(message, checkInSessionId);
      
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        content: response.response,
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setCheckInMessages((prev) => [...prev, botMessage]);
      
      if (response.next_steps && response.next_steps.length > 0) {
        setCheckInNextSteps(response.next_steps.map((step: string, index: number) => ({
          id: `step-${index}`,
          label: step,
          action: `Start ${step}`
        })));
      }
    } catch (error) {
      console.error('Error sending check-in message:', error);
    } finally {
      setCheckInLoading(false);
    }
  };
  
  // Handle next step selection in check-in
  const handleCheckInNextStep = async (step: NextStep) => {
    if (!user || checkInLoading) return;
    
    setCheckInLoading(true);
    setCheckInNextSteps([]);
    
    try {
      const response = await chatAPI.sendCheckInMessage(step.action, checkInSessionId);
      
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        content: response.response,
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setCheckInMessages((prev) => [...prev, botMessage]);
      
      if (response.next_steps && response.next_steps.length > 0) {
        setCheckInNextSteps(response.next_steps.map((step: string, index: number) => ({
          id: `step-${index}`,
          label: step,
          action: `Start ${step}`
        })));
      }
    } catch (error) {
      console.error('Error handling check-in next step:', error);
    } finally {
      setCheckInLoading(false);
    }
  };
  
  // Start a new CBT session
  const startNewCBT = async () => {
    if (!user) return;
    
    setCbtLoading(true);
    setCbtSessionId(null);
    setCbtMessages([]);
    setCbtNextSteps([]);
    
    try {
      // Always pass null as session_id to create a new session
      const response = await chatAPI.sendCBTMessage(undefined, null);
      
      const botMessage: Message = {
        id: 'welcome',
        content: response.response,
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setCbtMessages([botMessage]);
      setCbtSessionId(response.session_id);
      
      if (response.next_steps && response.next_steps.length > 0) {
        setCbtNextSteps(response.next_steps.map((step: string, index: number) => ({
          id: `step-${index}`,
          label: step,
          action: `Start ${step}`
        })));
      }
    } catch (error) {
      console.error('Error starting new CBT session:', error);
    } finally {
      setCbtLoading(false);
    }
  };
  
  // Resume an existing CBT session
  const resumeCBT = async () => {
    if (!user || !cbtSessionId) return;
    
    setCbtLoading(true);
    
    try {
      // First try to resume with the existing session ID
      const response = await chatAPI.sendCBTMessage(undefined, cbtSessionId);
      
      const botMessage: Message = {
        id: `resume-${Date.now()}`,
        content: response.response,
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setCbtMessages((prev) => {
        return prev.length > 0 ? [...prev, botMessage] : [botMessage];
      });
      
      if (response.next_steps && response.next_steps.length > 0) {
        setCbtNextSteps(response.next_steps.map((step: string, index: number) => ({
          id: `step-${index}`,
          label: step,
          action: `Start ${step}`
        })));
      }
    } catch (error) {
      console.error('Error resuming CBT session:', error);
      // If we can't resume, clear the session ID and start a new session
      localStorage.removeItem('cbtSessionId');
      setCbtSessionId(null);
      startNewCBT();
    } finally {
      setCbtLoading(false);
    }
  };
  
  // Send a message in the CBT chat
  const sendCBTMessage = async (message: string) => {
    if (!user || !message.trim() || cbtLoading) return;
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: message,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setCbtMessages((prev) => [...prev, userMessage]);
    setCbtLoading(true);
    setCbtNextSteps([]);
    
    try {
      // If we don't have a session ID, create a new one
      if (!cbtSessionId) {
        await startNewCBT();
        // After creating a new session, send the message
        const newResponse = await chatAPI.sendCBTMessage(message, cbtSessionId);
        
        const botMessage: Message = {
          id: `bot-${Date.now()}`,
          content: newResponse.response,
          sender: 'bot',
          timestamp: new Date(),
        };
        
        setCbtMessages((prev) => [...prev, botMessage]);
        
        if (newResponse.next_steps && newResponse.next_steps.length > 0) {
          setCbtNextSteps(newResponse.next_steps.map((step: string, index: number) => ({
            id: `step-${index}`,
            label: step,
            action: `Start ${step}`
          })));
        }
      } else {
        // Use existing session
        const response = await chatAPI.sendCBTMessage(message, cbtSessionId);
        
        const botMessage: Message = {
          id: `bot-${Date.now()}`,
          content: response.response,
          sender: 'bot',
          timestamp: new Date(),
        };
        
        setCbtMessages((prev) => [...prev, botMessage]);
        setCbtSessionId(response.session_id);
        
        if (response.next_steps && response.next_steps.length > 0) {
          setCbtNextSteps(response.next_steps.map((step: string, index: number) => ({
            id: `step-${index}`,
            label: step,
            action: `Start ${step}`
          })));
        }
      }
    } catch (error: any) {
      console.error('Error sending CBT message:', error);
      // If we get an error, try to start a new session
      if (error.response && error.response.status === 500) {
        console.log('Session error detected, starting new session...');
        await startNewCBT();
      }
    } finally {
      setCbtLoading(false);
    }
  };
  
  // Handle next step selection in CBT
  const handleCBTNextStep = async (step: NextStep) => {
    if (!user || cbtLoading) return;
    
    setCbtLoading(true);
    setCbtNextSteps([]);
    
    try {
      const response = await chatAPI.sendCBTMessage(step.action, cbtSessionId);
      
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        content: response.response,
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setCbtMessages((prev) => [...prev, botMessage]);
      
      if (response.next_steps && response.next_steps.length > 0) {
        setCbtNextSteps(response.next_steps.map((step: string, index: number) => ({
          id: `step-${index}`,
          label: step,
          action: `Start ${step}`
        })));
      }
    } catch (error) {
      console.error('Error handling CBT next step:', error);
    } finally {
      setCbtLoading(false);
    }
  };
  
  // Start a survey
  const startSurvey = async () => {
    if (!user) return;
    
    setSurveyMode(true);
    setCheckInLoading(true);
    
    try {
      const response = await chatAPI.startSurvey(checkInSessionId);
      
      setCurrentSurveyQuestion(response.response);
      
      if (response.questionnaire_options) {
        setSurveyQuestionnaireOptions(response.questionnaire_options);
      }
      
      if (response.question_index !== undefined) {
        setCurrentQuestionIndex(response.question_index);
      }
      
      if (response.total_questions !== undefined) {
        setTotalQuestions(response.total_questions);
      }
      
      if (response.possible_answers) {
        setPossibleAnswers(response.possible_answers);
      }
      
      if (response.survey_results) {
        setSurveyResults(response.survey_results);
      }
    } catch (error) {
      console.error('Error starting survey:', error);
      setSurveyMode(false);
    } finally {
      setCheckInLoading(false);
    }
  };
  
  // Select a questionnaire
  const selectQuestionnaire = async (questionnaireId: string) => {
    if (!user || !surveyMode) return;
    
    setCheckInLoading(true);
    setCurrentQuestionnaireId(questionnaireId);
    
    try {
      const response = await chatAPI.selectQuestionnaire(questionnaireId, checkInSessionId);
      
      setCurrentSurveyQuestion(response.response);
      
      if (response.question_index !== undefined) {
        setCurrentQuestionIndex(response.question_index);
      }
      
      if (response.total_questions !== undefined) {
        setTotalQuestions(response.total_questions);
      }
      
      if (response.possible_answers) {
        setPossibleAnswers(response.possible_answers);
      }
    } catch (error) {
      console.error('Error selecting questionnaire:', error);
    } finally {
      setCheckInLoading(false);
    }
  };
  
  // Answer a survey question
  const answerSurveyQuestion = async (answerScore: number | string) => {
    if (!user || !surveyMode || !currentQuestionnaireId || currentQuestionIndex === null) return;
    
    setCheckInLoading(true);
    
    try {
      // Convert string scores to numbers if needed
      const numericScore = typeof answerScore === 'string' ? parseInt(answerScore as string, 10) : answerScore;
      
      const response = await chatAPI.answerSurveyQuestion(
        currentQuestionnaireId,
        currentQuestionIndex,
        numericScore as number,
        checkInSessionId
      );
      
      setCurrentSurveyQuestion(response.response);
      
      if (response.question_index !== undefined) {
        setCurrentQuestionIndex(response.question_index);
      }
      
      if (response.possible_answers) {
        setPossibleAnswers(response.possible_answers);
      }
      
      if (response.survey_results) {
        setSurveyResults(response.survey_results);
      }
    } catch (error) {
      console.error('Error answering survey question:', error);
    } finally {
      setCheckInLoading(false);
    }
  };
  
  const closeSurvey = () => {
    setSurveyMode(false);
    setCurrentSurveyQuestion(null);
    setCurrentQuestionIndex(null);
    setTotalQuestions(null);
    setPossibleAnswers([]);
    setCurrentQuestionnaireId(null);
    setSurveyResults(null);
  };
  
  const value = {
    // Check-in state
    checkInSessionId,
    checkInMessages,
    checkInNextSteps,
    checkInLoading,
    
    // CBT state
    cbtSessionId,
    cbtMessages,
    cbtNextSteps,
    cbtLoading,
    
    // Survey state
    surveyMode,
    surveyQuestionnaireOptions,
    currentSurveyQuestion,
    currentQuestionIndex,
    totalQuestions,
    possibleAnswers,
    currentQuestionnaireId,
    surveyResults,
    
    // Actions
    startNewCheckIn,
    resumeCheckIn,
    sendCheckInMessage,
    handleCheckInNextStep,
    
    startNewCBT,
    resumeCBT,
    sendCBTMessage,
    handleCBTNextStep,
    
    // Survey actions
    startSurvey,
    selectQuestionnaire,
    answerSurveyQuestion,
    closeSurvey,
    
    clearChatState,
  };
  
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// Create a hook to use the chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  
  return context;
}; 