'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useChat, NextStep} from '@/lib/chat-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function CBTPage() {
  const { user, isAuthenticated, isLoading, resetInactivityTimer } = useAuth();
  const { 
    cbtSessionId, 
    cbtMessages, 
    cbtNextSteps, 
    cbtLoading, 
    startNewCBT, 
    resumeCBT, 
    sendCBTMessage, 
    handleCBTNextStep 
  } = useChat();
  
  const [input, setInput] = useState('');
  const [showExitDialog, setShowExitDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Initialize or resume CBT session
  useEffect(() => {
    if (isAuthenticated && user && !cbtLoading) {
      if (cbtSessionId && cbtMessages.length === 0) {
        // We have a session ID but no messages, so resume the session
        resumeCBT();
      } else if (!cbtSessionId) {
        // No session ID, start a new session
        startNewCBT();
      }
    }
  }, [isAuthenticated, user, cbtSessionId, cbtMessages.length, cbtLoading, resumeCBT, startNewCBT]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [cbtMessages, cbtNextSteps]);

  // Reset inactivity timer on user interaction
  const handleUserInteraction = () => {
    resetInactivityTimer();
  };

  const handleSendMessageClick = async () => {
    if (!input.trim() || cbtLoading) return;
    
    handleUserInteraction();
    await sendCBTMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessageClick();
    }
    handleUserInteraction();
  };

  const handleNextStepClick = async (step: NextStep) => {
    handleUserInteraction();
    await handleCBTNextStep(step);
  };

  const handleNewChat = () => {
    handleUserInteraction();
    startNewCBT();
  };

  const handleExit = () => {
    handleUserInteraction();
    setShowExitDialog(true);
  };

  const handleConfirmExit = () => {
    handleUserInteraction();
    setShowExitDialog(false);
    router.push('/home');
  };

  const handleCancelExit = () => {
    handleUserInteraction();
    setShowExitDialog(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading...</h2>
          <p className="text-muted-foreground">Please wait while we load your data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 flex flex-col h-[calc(100vh-64px)]">
      {/* Title and Actions */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">CBT Therapy Session</h1>
          <p className="text-muted-foreground">Let&apos;s work through your thoughts together</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="destructive" 
            onClick={handleNewChat}
            disabled={cbtLoading}
          >
            New Chat
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExit}
          >
            Exit
          </Button>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 flex flex-col overflow-hidden border border-border rounded-lg bg-card">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cbtMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          
          {/* Next Steps Options */}
          {cbtNextSteps.length > 0 && (
            <div className="flex flex-col space-y-2 my-4">
              <p className="text-sm text-muted-foreground">Choose an option:</p>
              <div className="flex flex-wrap gap-2">
                {cbtNextSteps.map((step) => (
                  <Button
                    key={step.id}
                    variant="outline"
                    onClick={() => handleNextStepClick(step)}
                    disabled={cbtLoading}
                  >
                    {step.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={cbtLoading}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessageClick} 
              disabled={!input.trim() || cbtLoading}
            >
              Send
            </Button>
          </div>
        </div>
      </div>

      {/* Exit Dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exit CBT Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to exit? Your progress will be saved, and you can continue later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelExit}>
              Cancel
            </Button>
            <Button onClick={handleConfirmExit}>
              Exit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 