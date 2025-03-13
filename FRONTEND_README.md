# CBT Chatbot Frontend

A modern, responsive web application for a Cognitive Behavioral Therapy (CBT) chatbot that helps users manage their mental health through guided conversations, assessments, and therapeutic exercises.

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Pages and Components](#pages-and-components)
- [API Integration](#api-integration)
- [Authentication](#authentication)
- [State Management](#state-management)
- [UI/UX Design](#uiux-design)
- [Getting Started](#getting-started)
- [Development Guidelines](#development-guidelines)

## Overview

The CBT Chatbot Frontend provides a user-friendly interface for interacting with the CBT Chatbot backend. It offers features such as:

- User authentication (registration, login, profile management)
- Interactive check-in sessions for mental health assessment
- Guided CBT therapy sessions
- Inspirational quotes browsing
- User profile management
- Responsive design for desktop and mobile devices
- Access to automatically generated session summaries

## Technology Stack

- **Framework**: Next.js 14 (React framework with App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Notifications**: Sonner toast notifications
- **Authentication**: JWT-based with token refresh

## Project Structure

```
cbt-chatbot-frontend/
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── check-in/         # Check-in chat interface
│   │   ├── cbt/              # CBT therapy interface
│   │   ├── home/             # User dashboard
│   │   ├── login/            # Login page
│   │   ├── profile/          # User profile management
│   │   ├── quotes/           # Quotes browsing page
│   │   ├── register/         # User registration/onboarding
│   │   ├── sessions/         # Chat session history and summaries
│   │   ├── layout.tsx        # Root layout with providers
│   │   └── page.tsx          # Landing page
│   ├── components/           # Reusable UI components
│   │   ├── ui/               # shadcn/ui components
│   │   └── navigation.tsx    # Navigation bar component
│   ├── lib/                  # Utility functions and services
│   │   ├── api.ts            # API client with Axios
│   │   ├── auth-context.tsx  # Authentication context provider
│   │   └── chat-context.tsx  # Chat context provider for session management
│   └── styles/               # Global styles
├── public/                   # Static assets
├── tailwind.config.js        # Tailwind CSS configuration
└── package.json              # Project dependencies
```

## Pages and Components

### Landing Page (`/`)

The landing page serves as the entry point for new users, providing an overview of the CBT Chatbot application and its benefits.

**Features:**
- Introduction to the CBT Chatbot
- Sample conversation demonstration
- Feature highlights
- Call-to-action buttons for sign-up and login

### Authentication Pages

#### Login Page (`/login`)

**Features:**
- Email and password login form
- Error handling for invalid credentials
- "Remember me" functionality
- Link to registration page
- Redirect to home page after successful login

#### Registration Page (`/register`)

**Features:**
- Multi-step onboarding process:
  1. Disclaimer and terms acceptance
  2. Personal information collection (name)
  3. Gender selection
  4. Age input
  5. Account creation (email, password, check-in frequency)
- Form validation
- Progress indicators
- Redirect to home page after successful registration

### Home Page (`/home`)

The home page serves as the user dashboard after login, displaying personalized information and navigation options.

**Features:**
- Welcome message with user's name
- Check-in countdown timer based on user's frequency preference
- Daily inspirational quote with author attribution
- Quick access to CBT therapy sessions
- Navigation to other sections of the application
- Access to recent chat session summaries

### Check-in Page

The Check-in page (`/app/check-in/page.tsx`) provides an interactive chat interface for users to check in on their mental well-being. Key features include:

- **Dynamic Initial Messages**: The page fetches the initial welcome message from the backend when loaded, providing personalized greetings based on user data.
- **Real-time Chat Interface**: Users can send messages and receive responses from the chatbot.
- **Next Steps Options**: The interface displays clickable options based on the backend's suggested next steps, allowing for guided conversations.
- **Session Management**: The page maintains a session ID to ensure conversation continuity between visits.
- **Session Persistence**: Chat history and session state are preserved when navigating away and returning to the page.
- **New Chat Button**: Users can start a fresh check-in session at any time while preserving their history.
- **Automatic Session Summarization**: When starting a new chat, the previous non-clinical session is automatically summarized and marked as inactive.
- **Error Handling**: Includes fallback messages and error notifications if API calls fail.
- **Exit Confirmation**: Prompts users before leaving the check-in session to prevent accidental data loss.
- **Survey Mode**: Allows users to take standardized mental health questionnaires (PHQ-4, GAD-7, PHQ-9, etc.) through a modal dialog:
  - **Questionnaire Selection**: Users can choose from available questionnaires with descriptive icons.
  - **Step-by-Step Questions**: Questions are presented one at a time with multiple-choice answers.
  - **Progress Tracking**: Shows the current question number and progress bar.
  - **Results Summary**: Displays the final score, severity level, and interpretation upon completion.
  - **Separation from Chat**: Survey interactions are contained within the modal, keeping the main chat window focused on conversational interactions.

### CBT Therapy Page

The CBT Therapy page (`/app/cbt/page.tsx`) offers guided cognitive behavioral therapy sessions through an interactive chat interface. Key features include:

- **Dynamic Initial Messages**: The page fetches the initial welcome message from the backend when loaded, providing personalized therapy session starters.
- **Interactive Therapy Sessions**: Users can engage in structured CBT exercises through the chat interface.
- **Next Steps Options**: The interface displays clickable therapy options based on the backend's suggested next steps, allowing for guided therapy sessions.
- **Session Management**: The page maintains a session ID to ensure therapy session continuity between visits.
- **Session Persistence**: Therapy progress and chat history are preserved when navigating away and returning to the page.
- **New Chat Button**: Users can start a fresh therapy session at any time while preserving their history.
- **Error Handling**: Includes fallback messages and error notifications if API calls fail.
- **Exit Confirmation**: Prompts users before leaving the therapy session to prevent accidental progress loss.

### Profile Page (`/profile`)

The profile page allows users to view and update their personal information and preferences.

**Features:**
- Display of user information
- Form for updating profile details
- Password change functionality
- Account settings management
- Session history

### Sessions Page (`/sessions`)

The sessions page displays a history of the user's chat sessions with automatically generated summaries.

**Features:**
- List of past chat sessions with dates and modes
- Filtering options for session mode (non-clinical, clinical) and status (active, inactive)
- Session summaries for completed non-clinical sessions
- Option to continue an active session
- Option to manually generate a summary for any session

### Quotes Page (`/quotes`)

The quotes page displays a collection of inspirational quotes that users can browse and copy.

**Features:**
- Grid display of quotes with author attribution
- Pagination with "Load More" functionality
- Quote categories
- Copy to clipboard functionality
- Navigation back to home page

## API Integration

The frontend integrates with the backend API using Axios. The API client (`/lib/api.ts`) is structured into several modules:

### Authentication API

```typescript
export const authAPI = {
  register: async (userData: any) => { ... },
  login: async (email: string, password: string) => { ... },
  logout: async () => { ... }
};
```

### Home API

```typescript
export const homeAPI = {
  getHomeData: async () => { ... }
};
```

### Chat API

The Chat API module handles all chat-related interactions:

- `sendCheckInMessage(message?: string, userId: number, sessionId: string | null)`: Sends a user message during a check-in session or initiates a new session if no message is provided. Returns the bot's response, session ID, and any next steps.
- `sendCBTMessage(message?: string, userId: number, sessionId: string | null)`: Sends a user message during a CBT therapy session or initiates a new session if no message is provided. Returns the bot's response, session ID, and any next steps.
- `getUserSessions(userId: number, mode?: string, isActive?: boolean)`: Retrieves a list of chat sessions for a user with optional filtering by mode and active status.
- `generateSessionSummary(sessionId: number)`: Generates a summary for a specific chat session.

### User API

```typescript
export const userAPI = {
  getCurrentUser: async () => { ... },
  updateProfile: async (userData: any) => { ... }
};
```

### Quotes API

```typescript
export const quotesAPI = {
  getRandomQuote: async () => { ... },
  getQuotes: async (skip = 0, limit = 100) => { ... }
};
```

## Authentication

The application uses JWT-based authentication with access and refresh tokens:

1. **Token Storage**: Access and refresh tokens are stored in localStorage
2. **Token Refresh**: Automatic refresh of access tokens when they expire
3. **Protected Routes**: Routes requiring authentication redirect unauthenticated users to the login page
4. **Auth Context**: React Context API provides authentication state and methods throughout the application
5. **Inactivity Timeout**: Users are automatically logged out after 30 minutes of inactivity to enhance security
6. **Session Cleanup**: On logout, any active non-clinical sessions are automatically summarized

```typescript
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
  resetInactivityTimer: () => {},
  clearChatState: undefined,
  setClearChatState: () => {}
});
```

## State Management

The application uses React's Context API for global state management:

1. **Auth Context**: Manages user authentication state and inactivity timeout
2. **Chat Context**: Manages chat sessions, messages, and next steps for both Check-in and CBT pages
   - **Survey State**: Manages survey-specific state including questionnaire options, current question, possible answers, and results
   - **Session State**: Tracks active and inactive sessions, with different modes (non-clinical, clinical, survey)
3. **Local State**: Component-specific state using React's useState hook
4. **Effect Hooks**: Side effects and data fetching using useEffect

### Chat Context

The Chat Context (`/lib/chat-context.tsx`) provides centralized management of chat sessions:

```typescript
const ChatContext = createContext<ChatContextType>({
  // Check-in state
  checkInSessionId: null,
  checkInMessages: [],
  checkInNextSteps: [],
  checkInLoading: false,
  
  // CBT state
  cbtSessionId: null,
  cbtMessages: [],
  cbtNextSteps: [],
  cbtLoading: false,
  
  // Survey state
  surveyMode: false,
  surveyQuestionnaireOptions: [],
  currentSurveyQuestion: null,
  currentQuestionIndex: null,
  totalQuestions: null,
  possibleAnswers: [],
  currentQuestionnaireId: null,
  surveyResults: null,
  
  // Session state
  sessions: [],
  sessionsLoading: false,
  
  // Actions
  startNewCheckIn: async () => {},
  resumeCheckIn: async () => {},
  sendCheckInMessage: async () => {},
  handleCheckInNextStep: async () => {},
  
  startNewCBT: async () => {},
  resumeCBT: async () => {},
  sendCBTMessage: async () => {},
  handleCBTNextStep: async () => {},
  
  // Survey actions
  startSurvey: async () => {},
  selectQuestionnaire: async () => {},
  answerSurveyQuestion: async () => {},
  closeSurvey: () => {},
  
  // Session actions
  getUserSessions: async () => {},
  generateSessionSummary: async () => {},
  
  clearChatState: () => {}
});
```

Key features of the Chat Context include:
- **Session Persistence**: Chat sessions are stored in localStorage and restored when returning to the application
- **Message History**: Complete message history is maintained for both Check-in and CBT sessions
- **Next Steps Management**: Handles the display and selection of next step options provided by the backend
- **New Chat Functionality**: Provides methods to start fresh chat sessions while preserving history
- **Survey Management**: Handles the survey flow, including questionnaire selection, question navigation, and result display
- **Session Management**: Provides methods to retrieve, filter, and summarize chat sessions
- **Integration with Auth Context**: Chat state is cleared on logout to maintain privacy

## UI/UX Design

The frontend uses a modern, clean design with a focus on usability and accessibility:

1. **Design System**: shadcn/ui components with Tailwind CSS for consistent styling
2. **Responsive Layout**: Mobile-first approach with responsive design for all screen sizes
3. **Accessibility**: Semantic HTML, keyboard navigation, and screen reader support
4. **Notifications**: Toast notifications for user feedback
5. **Loading States**: Clear loading indicators during data fetching
6. **Error Handling**: User-friendly error messages and recovery options

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cbt-chatbot-frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file with the following variables:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development Guidelines

### Code Style

- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Use functional components with hooks
- Implement proper error handling
- Write meaningful comments for complex logic

### Component Structure

- Create reusable components in the `components` directory
- Use shadcn/ui components when possible
- Implement responsive design for all components
- Ensure accessibility compliance

### API Integration

- Use the API client in `src/lib/api.ts` for all backend communication
- Handle loading states and errors appropriately
- Implement proper error recovery mechanisms
- Use TypeScript interfaces for API responses

### Authentication

- Use the AuthContext for authentication-related functionality
- Protect routes that require authentication
- Handle token refresh and expiration gracefully
- Provide clear feedback for authentication errors

### Chat Session Management

- Use the ChatContext for managing chat sessions and message history
- Implement session persistence using localStorage
- Handle session restoration when users return to the application
- Provide clear UI for starting new chat sessions
- Ensure proper cleanup of chat state on logout
- Display session summaries in a user-friendly format

### Testing

- Write unit tests for critical components and utilities
- Implement integration tests for user flows
- Test responsive behavior across different screen sizes
- Verify accessibility compliance 