'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useChat, NextStep, Message, SurveyQuestionnaireOption, SurveyAnswer, SurveyResult } from '@/lib/chat-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

export default function CheckInPage() {
  const { user, isAuthenticated, isLoading, resetInactivityTimer } = useAuth();
  const { 
    checkInSessionId, 
    checkInMessages, 
    checkInNextSteps, 
    checkInLoading, 
    startNewCheckIn, 
    resumeCheckIn, 
    sendCheckInMessage, 
    handleCheckInNextStep,
    
    // Survey state
    surveyMode,
    surveyQuestionnaireOptions,
    currentSurveyQuestion,
    currentQuestionIndex,
    totalQuestions,
    possibleAnswers,
    currentQuestionnaireId,
    surveyResults,
    
    // Survey actions
    startSurvey,
    selectQuestionnaire,
    answerSurveyQuestion,
    closeSurvey
  } = useChat();
  
  const [input, setInput] = useState('');
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showSurveyDialog, setShowSurveyDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Initialize or resume check-in session
  useEffect(() => {
    if (isAuthenticated && user && !checkInLoading) {
      if (checkInSessionId && checkInMessages.length === 0) {
        // We have a session ID but no messages, so resume the session
        resumeCheckIn();
      } else if (!checkInSessionId) {
        // No session ID, start a new session
        startNewCheckIn();
      }
    }
  }, [isAuthenticated, user, checkInSessionId, checkInMessages.length, checkInLoading, resumeCheckIn, startNewCheckIn]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [checkInMessages, checkInNextSteps]);

  // Reset inactivity timer on user interaction
  const handleUserInteraction = () => {
    resetInactivityTimer();
  };

  const handleSendMessageClick = async () => {
    if (!input.trim() || checkInLoading) return;
    
    handleUserInteraction();
    await sendCheckInMessage(input);
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
    await handleCheckInNextStep(step);
  };

  const handleNewChat = () => {
    handleUserInteraction();
    startNewCheckIn();
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

  // Survey-related handlers
  const handleStartSurvey = async () => {
    handleUserInteraction();
    await startSurvey();
    setShowSurveyDialog(true);
  };

  const handleSelectQuestionnaire = async (questionnaireId: string) => {
    handleUserInteraction();
    await selectQuestionnaire(questionnaireId);
  };

  const handleAnswerQuestion = async (answerScore: number) => {
    handleUserInteraction();
    await answerSurveyQuestion(answerScore);
  };

  const handleCloseSurvey = () => {
    handleUserInteraction();
    closeSurvey();
    setShowSurveyDialog(false);
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
          <h1 className="text-3xl font-bold">Daily Check-in</h1>
          <p className="text-muted-foreground">Let's see how you're doing today</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            onClick={handleStartSurvey}
            disabled={checkInLoading}
          >
            Take a Survey
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleNewChat}
            disabled={checkInLoading}
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
          {checkInMessages.map((message) => (
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
          {checkInNextSteps.length > 0 && (
            <div className="flex flex-col space-y-2 my-4">
              <p className="text-sm text-muted-foreground">Choose an option:</p>
              <div className="flex flex-wrap gap-2">
                {checkInNextSteps.map((step) => (
                  <Button
                    key={step.id}
                    variant="outline"
                    onClick={() => handleNextStepClick(step)}
                    disabled={checkInLoading}
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
              disabled={checkInLoading}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessageClick} 
              disabled={!input.trim() || checkInLoading}
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
            <DialogTitle>Exit Check-in</DialogTitle>
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

      {/* Survey Dialog */}
      <Dialog open={showSurveyDialog} onOpenChange={(open) => {
        if (!open) {
          handleCloseSurvey();
        }
        setShowSurveyDialog(open);
      }}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            {surveyResults ? (
              <DialogTitle>Survey Results</DialogTitle>
            ) : currentQuestionnaireId ? (
              <div className="space-y-2">
                <DialogTitle>
                  {surveyQuestionnaireOptions.find(q => q.id === currentQuestionnaireId)?.name || 'Survey'}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <Progress value={(currentQuestionIndex || 0) / (totalQuestions || 1) * 100} className="h-2" />
                  <span className="text-sm text-muted-foreground">
                    Question {currentQuestionIndex} of {totalQuestions}
                  </span>
                </div>
              </div>
            ) : (
              <DialogTitle>Select a Questionnaire</DialogTitle>
            )}
          </DialogHeader>

          {/* Survey Content */}
          <div className="py-4">
            {/* Survey Results */}
            {surveyResults && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{surveyResults.questionnaire_name} Results</CardTitle>
                    <CardDescription>Your score: {surveyResults.score} out of {surveyResults.max_score}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Severity:</span>
                        <span className="font-semibold">{surveyResults.severity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Condition:</span>
                        <span className="font-semibold">{surveyResults.condition}</span>
                      </div>
                      {surveyResults.interpretation && (
                        <p className="mt-4 text-sm">{surveyResults.interpretation}</p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={handleCloseSurvey} className="w-full">Close</Button>
                  </CardFooter>
                </Card>
              </div>
            )}

            {/* Survey Question */}
            {!surveyResults && currentSurveyQuestion && (
              <div className="space-y-6">
                <p className="text-lg font-medium">{currentSurveyQuestion}</p>
                <p className="text-xs text-muted-foreground">
                {/* Debug: Question Index: {currentQuestionIndex}, Total Questions: {totalQuestions}, 
                  Possible Answers: {possibleAnswers ? possibleAnswers.length : 0}*/}
                </p>
                <div className="space-y-2">
                  {possibleAnswers && possibleAnswers.length > 0 ? (
                    possibleAnswers.map((answer) => (
                      <Button
                        key={answer.score}
                        variant="outline"
                        className="w-full justify-start text-left h-auto py-3 px-4"
                        onClick={() => handleAnswerQuestion(answer.score)}
                        disabled={checkInLoading}
                      >
                        {answer.text}
                      </Button>
                    ))
                  ) : (
                    <p className="text-sm text-red-500">No answer options available. Please try again.</p>
                  )}
                </div>
              </div>
            )}

            {/* Questionnaire Selection */}
            {!surveyResults && !currentSurveyQuestion && (
              <div className="grid gap-4">
                {surveyQuestionnaireOptions.map((option) => (
                  <Button
                    key={option.id}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3 px-4"
                    onClick={() => handleSelectQuestionnaire(option.id)}
                    disabled={checkInLoading}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{option.icon}</span>
                      <div>
                        <div className="font-medium">{option.name}</div>
                        {option.description && (
                          <div className="text-sm text-muted-foreground">{option.description}</div>
                        )}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Dialog Footer */}
          {!surveyResults && !currentSurveyQuestion && (
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseSurvey}>
                Cancel
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 