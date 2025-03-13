'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { UserRegistrationData } from '@/lib/api'; // Import the interface

// Define the steps in the onboarding process
const STEPS = {
  DISCLAIMER: 0,
  NAME: 1,
  GENDER: 2,
  AGE: 3,
  ACCOUNT: 4,
};

export default function RegisterPage() {
  const { register, isLoading } = useAuth();
  const [step, setStep] = useState(STEPS.DISCLAIMER);
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    age: '',
    email: '',
    password: '',
    check_in_frequency: 7, // Default to weekly check-ins
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return;
    }

    try {
      // Convert age to number if provided and create a properly typed userData object
      const userData: UserRegistrationData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        gender: formData.gender || undefined,
        check_in_frequency: formData.check_in_frequency,
        // Convert age to number if provided, otherwise undefined (not null)
        age: formData.age ? parseInt(formData.age, 10) : undefined,
      };

      await register(userData);
      toast.success('Registration successful!');
    } catch (err: unknown) {
      console.error('Registration error:', err);
      // Type guard to check if err is an Error or has response property
      if (err && typeof err === 'object' && 'response' in err) {
        const errorObj = err as { response?: { data?: { detail?: string } } };
        setError(errorObj.response?.data?.detail || 'Registration failed. Please try again.');
      } else {
        setError('Registration failed. Please try again.');
      }
      toast.error('Registration failed. Please try again.');
    }
  };

  // Render different content based on the current step
  const renderStepContent = () => {
    switch (step) {
      case STEPS.DISCLAIMER:
        return (
          <>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">Disclaimer</CardTitle>
              <CardDescription className="text-center">
                Please read and agree to the following before continuing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-md text-sm">
                <p className="mb-4">
                  This CBT Chatbot is designed to provide cognitive behavioral therapy techniques and support. However, please note:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>This is not a substitute for professional mental health treatment.</li>
                  <li>In case of emergency or crisis, please contact emergency services or a mental health professional immediately.</li>
                  <li>Your data will be stored securely and used only to provide personalized support.</li>
                  <li>You can delete your account and data at any time.</li>
                </ul>
              </div>
              <Button onClick={handleNext} className="w-full">
                I Agree
              </Button>
            </CardContent>
          </>
        );

      case STEPS.NAME:
        return (
          <>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">What&apos;s your name?</CardTitle>
              <CardDescription className="text-center">
                This helps us personalize your experience (optional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  name="name"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={handleChange}
                />
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={handleBack} className="flex-1">
                    Back
                  </Button>
                  <Button onClick={handleSkip} variant="outline" className="flex-1">
                    Skip
                  </Button>
                  <Button onClick={handleNext} className="flex-1">
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        );

      case STEPS.GENDER:
        return (
          <>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">What&apos;s your gender?</CardTitle>
              <CardDescription className="text-center">
                This helps us personalize your experience (optional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full p-2 border border-input rounded-md bg-background"
                >
                  <option value="">Select gender (optional)</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={handleBack} className="flex-1">
                    Back
                  </Button>
                  <Button onClick={handleSkip} variant="outline" className="flex-1">
                    Skip
                  </Button>
                  <Button onClick={handleNext} className="flex-1">
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        );

      case STEPS.AGE:
        return (
          <>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">What&apos;s your age?</CardTitle>
              <CardDescription className="text-center">
                This helps us provide age-appropriate support (optional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  name="age"
                  type="number"
                  min="18"
                  placeholder="Your age (18+)"
                  value={formData.age}
                  onChange={handleChange}
                />
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={handleBack} className="flex-1">
                    Back
                  </Button>
                  <Button onClick={handleSkip} variant="outline" className="flex-1">
                    Skip
                  </Button>
                  <Button onClick={handleNext} className="flex-1">
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        );

      case STEPS.ACCOUNT:
        return (
          <>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">Create your account</CardTitle>
              <CardDescription className="text-center">
                Enter your email and password to complete registration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="check_in_frequency" className="text-sm font-medium">
                    How often would you like to check in?
                  </label>
                  <select
                    id="check_in_frequency"
                    name="check_in_frequency"
                    value={formData.check_in_frequency}
                    onChange={handleChange}
                    className="w-full p-2 border border-input rounded-md bg-background"
                  >
                    <option value={1}>Daily</option>
                    <option value={3}>Every 3 days</option>
                    <option value={7}>Weekly</option>
                    <option value={14}>Every 2 weeks</option>
                    <option value={30}>Monthly</option>
                  </select>
                </div>
                <div className="flex space-x-2">
                  <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? 'Creating account...' : 'Create account'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        {renderStepContent()}
        <CardFooter className="flex justify-center">
          <Link href="/login" className="text-sm text-muted-foreground hover:underline">
            Already have an account? Sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
} 