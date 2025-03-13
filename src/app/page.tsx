'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-background">

      {/* Main Content */}
      <main className="container mx-auto py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              Your Personal CBT Therapist
            </h2>
            <p className="text-lg text-muted-foreground">
              Our AI-powered Cognitive Behavioral Therapy chatbot helps you identify negative thought patterns and develop healthier thinking habits. Start your journey to better mental well-being today.
            </p>
            <div className="flex space-x-4 pt-4">
              <Link href="/register">
                <Button size="lg" className="font-semibold">Sign up for free</Button>
              </Link>
              <Link href="https://www.apa.org/ptsd-guideline/patients-and-families/cognitive-behavioral" target="_blank">
                <Button size="lg" variant="outline" className="font-semibold">Learn more</Button>
              </Link>
            </div>
          </div>

          {/* Right Column - Chat Preview */}
          <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground text-center mb-4">
                Sample Conversation
              </div>
              
              {/* Bot Message */}
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground mr-3">
                  <span className="text-sm font-semibold">AI</span>
                </div>
                <div className="bg-muted p-3 rounded-lg max-w-[80%]">
                  <p className="text-foreground">Hello! How are you feeling today?</p>
                </div>
              </div>
              
              {/* User Message */}
              <div className="flex items-start justify-end">
                <div className="bg-primary p-3 rounded-lg max-w-[80%]">
                  <p className="text-primary-foreground">I&apos;ve been feeling anxious about my upcoming presentation.</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground ml-3">
                  <span className="text-sm font-semibold">You</span>
                </div>
              </div>
              
              {/* Bot Message */}
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground mr-3">
                  <span className="text-sm font-semibold">AI</span>
                </div>
                <div className="bg-muted p-3 rounded-lg max-w-[80%]">
                  <p className="text-foreground">I understand that presentations can be stressful. Let&apos;s identify what thoughts might be contributing to your anxiety. Sign up to continue this conversation and start your CBT journey.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <Card>
            <CardHeader>
              <CardTitle>Identify Negative Thoughts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Recognize unhelpful thinking patterns. Learn to identify automatic negative thoughts and understand how they affect your emotions and behaviors.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Challenge Distortions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Question and reframe your thoughts. Develop skills to challenge cognitive distortions and replace them with more balanced perspectives.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Track Your Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Monitor your mental well-being. Keep track of your mood and thought patterns over time to see your improvement and identify areas for growth.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-muted py-6 mt-12">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>© {new Date().getFullYear()} CBT Chatbot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
