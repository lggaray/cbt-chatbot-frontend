# Implementation Plan: Dynamic Chat Interactions

This document outlines the step-by-step implementation plan for updating the Check-in and CBT therapy pages to fetch initial messages from the backend and handle next-step options dynamically.

## Overview

The updates focus on enhancing the chat interfaces in both the Check-in and CBT therapy pages to:
1. Fetch initial bot messages from the backend instead of using hardcoded messages
2. Implement next-step options in the chat windows based on backend responses
3. Maintain the existing light-mode design using the custom Tailwind theme and shadcn/ui components

## Step 1: Update the API Client

Update the Chat API methods to support optional message parameters for initial messages.

```typescript
// src/lib/api.ts
export const chatAPI = {
  sendCheckInMessage: async (message: string | undefined, userId: number, sessionId: string | null) => {
    // Implementation
  },
  sendCBTMessage: async (message: string | undefined, userId: number, sessionId: string | null) => {
    // Implementation
  }
};
```

## Step 2: Update the Check-in Page

### 2.1 Modify Initial Message Fetching

Replace the hardcoded initial message with a backend API call:

```typescript
// Initial bot message
useEffect(() => {
  const fetchInitialMessage = async () => {
    if (isAuthenticated && user) {
      try {
        setLoading(true);
        const response = await chatAPI.sendCheckInMessage(undefined, user.id, null);
        
        const botMessage: Message = {
          id: 'welcome',
          content: response.response,
          sender: 'bot',
          timestamp: new Date(),
        };
        
        setMessages([botMessage]);
        setSessionId(response.session_id);
        
        if (response.next_steps && response.next_steps.length > 0) {
          setNextSteps(response.next_steps.map((step: string, index: number) => ({
            id: `step-${index}`,
            label: step,
            action: `Start ${step}`
          })));
        }
      } catch (error) {
        console.error('Error fetching initial message:', error);
        toast.error('Failed to start check-in. Please try again.');
        
        // Fallback to a default message if the API call fails
        setMessages([{
          id: 'welcome-fallback',
          content: `Hello${user.name ? `, ${user.name}` : ''}! Welcome to your check-in. How are you feeling today?`,
          sender: 'bot',
          timestamp: new Date(),
        }]);
      } finally {
        setLoading(false);
      }
    }
  };
  
  fetchInitialMessage();
}, [isAuthenticated, user]);
```

### 2.2 Update Message Handling

Modify the message handling to process next steps from the backend:

```typescript
const handleSendMessage = async () => {
  if (!input.trim() || loading || !user?.id) return;

  // Create user message
  const userMessage: Message = {
    id: Date.now().toString(),
    content: input,
    sender: 'user',
    timestamp: new Date(),
  };

  setMessages((prev) => [...prev, userMessage]);
  setInput('');
  setLoading(true);
  setNextSteps([]);

  try {
    const response = await chatAPI.sendCheckInMessage(input, user.id, sessionId);
    
    // Create bot message
    const botMessage: Message = {
      id: Date.now().toString(),
      content: response.response,
      sender: 'bot',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, botMessage]);
    setSessionId(response.session_id);
    
    // Process next steps if available
    if (response.next_steps && response.next_steps.length > 0) {
      setNextSteps(response.next_steps.map((step: string, index: number) => ({
        id: `step-${index}`,
        label: step,
        action: `Start ${step}`
      })));
    }
  } catch (error) {
    console.error('Error sending message:', error);
    toast.error('Failed to send message. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

### 2.3 Implement Next Step Selection

Add a handler for next step selection:

```typescript
const handleNextStep = async (step: NextStep) => {
  if (loading || !user?.id) return;
  
  setLoading(true);
  setNextSteps([]);
  
  try {
    const response = await chatAPI.sendCheckInMessage(step.action, user.id, sessionId);
    
    const botMessage: Message = {
      id: Date.now().toString(),
      content: response.response,
      sender: 'bot',
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, botMessage]);
    
    if (response.next_steps && response.next_steps.length > 0) {
      setNextSteps(response.next_steps.map((step: string, index: number) => ({
        id: `step-${index}`,
        label: step,
        action: `Start ${step}`
      })));
    }
  } catch (error) {
    console.error('Error selecting next step:', error);
    toast.error('Failed to process your selection. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

### 2.4 Update UI to Display Next Steps

Add UI components to display next steps:

```tsx
{/* Next Steps Options */}
{nextSteps.length > 0 && (
  <div className="flex flex-col space-y-2 my-4">
    <p className="text-sm text-muted-foreground">Choose an option:</p>
    <div className="flex flex-wrap gap-2">
      {nextSteps.map((step) => (
        <Button
          key={step.id}
          variant="outline"
          onClick={() => handleNextStep(step)}
          disabled={loading}
        >
          {step.label}
        </Button>
      ))}
    </div>
  </div>
)}
```

## Step 3: Update the CBT Therapy Page

Apply similar changes to the CBT therapy page as done for the Check-in page:

### 3.1 Add NextStep Interface

```typescript
interface NextStep {
  id: string;
  label: string;
  action: string;
}
```

### 3.2 Add State for Next Steps

```typescript
const [nextSteps, setNextSteps] = useState<NextStep[]>([]);
```

### 3.3 Implement Initial Message Fetching, Message Handling, and Next Step Selection

Follow the same pattern as the Check-in page implementation.

## Step 4: Testing

1. Test initial message fetching on both pages
2. Test sending messages and receiving responses
3. Test next step selection and handling
4. Verify error handling and fallback messages
5. Test session persistence

## Step 5: Documentation

Update the FRONTEND_README.md to document the changes:

1. Update the Check-in Page section to include dynamic initial messages and next steps
2. Update the CBT Therapy Page section to include dynamic initial messages and next steps
3. Update the API Integration section to reflect the updated API methods

## Conclusion

These updates enhance the chat interfaces by making them more dynamic and responsive to backend data. The implementation maintains the existing design principles while adding new functionality for a more interactive user experience. 