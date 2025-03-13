'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { homeAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface HomeData {
  userId: string;
  name: string;
  lastCheckIn: string | null;
  checkInFrequency: string;
  quote: {
    text: string;
    author: string;
    category: string;
    id: number;
    created_at: string;
  } | null;
}

export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<string | null>(null);
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch home data
  useEffect(() => {
    const fetchHomeData = async () => {
      if (isAuthenticated && user) {
        try {
          setLoading(true);
          // Using getHomeData without parameters as per the API definition
          const data = await homeAPI.getHomeData();
          setHomeData(data);
        } catch (error) {
          console.error('Error fetching home data:', error);
          toast.error('Failed to load home data');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchHomeData();
  }, [isAuthenticated, user]);

  // Calculate countdown to next check-in
  useEffect(() => {
    if (homeData && homeData.lastCheckIn) {
      const calculateCountdown = () => {
        const lastCheckIn = new Date(homeData.lastCheckIn!);
        const frequency = homeData.checkInFrequency;
        
        const nextCheckIn = new Date(lastCheckIn); // Change to 'let' if you want to modify the original date
        
        switch (frequency) {
          case 'daily':
            nextCheckIn.setDate(lastCheckIn.getDate() + 1);
            break;
          case 'weekly':
            nextCheckIn.setDate(lastCheckIn.getDate() + 7);
            break;
          case 'biweekly':
            nextCheckIn.setDate(lastCheckIn.getDate() + 14);
            break;
          case 'monthly':
            nextCheckIn.setMonth(lastCheckIn.getMonth() + 1);
            break;
          default:
            nextCheckIn.setDate(lastCheckIn.getDate() + 1);
        }
        
        const now = new Date();
        const diffTime = nextCheckIn.getTime() - now.getTime();
        
        if (diffTime <= 0) {
          return 'Now';
        }
        
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
        
        if (diffDays > 0) {
          return `${diffDays}d ${diffHours}h`;
        } else if (diffHours > 0) {
          return `${diffHours}h ${diffMinutes}m`;
        } else {
          return `${diffMinutes}m`;
        }
      };
      
      const countdownInterval = setInterval(() => {
        setCountdown(calculateCountdown());
      }, 60000); // Update every minute
      
      setCountdown(calculateCountdown());
      
      return () => clearInterval(countdownInterval);
    } else {
      setCountdown(null);
    }
  }, [homeData]);

  if (isLoading || loading) {
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
    <div className="container mx-auto py-8 px-4">
      {/* Welcome Section */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Welcome{homeData?.name ? `, ${homeData.name}` : ''}!</h1>
        <p className="text-muted-foreground">How are you feeling today?</p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Check-in Card */}
        <Card>
          <CardHeader>
            <CardTitle>Next Check-in</CardTitle>
            <CardDescription>
              {homeData?.lastCheckIn 
                ? 'Your next scheduled check-in' 
                : 'You haven\'t checked in yet'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {homeData?.lastCheckIn ? (
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">{countdown || 'Now'}</div>
                <p className="text-sm text-muted-foreground">
                  {homeData.checkInFrequency.charAt(0).toUpperCase() + homeData.checkInFrequency.slice(1)} check-ins
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="mb-2">Complete your first check-in to start tracking your progress</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push('/check-in')}>
              {homeData?.lastCheckIn && countdown === 'Now' ? 'Check-in Now' : 'Start Check-in'}
            </Button>
          </CardFooter>
        </Card>

        {/* Quote Card */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Inspiration</CardTitle>
            <CardDescription>A thought for your day</CardDescription>
          </CardHeader>
          <CardContent>
            <blockquote className="border-l-4 border-primary pl-4 italic">
              {homeData?.quote ? (
                <>
                  <p className="mb-2">{homeData.quote.text}</p>
                  <footer className="text-sm text-muted-foreground">— {homeData.quote.author}</footer>
                </>
              ) : (
                "Your thoughts become your reality. Choose positive ones today."
              )}
            </blockquote>
          </CardContent>
          <CardFooter className="flex justify-center gap-2">
          </CardFooter>
        </Card>

        {/* CBT Therapy Card */}
        <Card>
          <CardHeader>
            <CardTitle>CBT Therapy</CardTitle>
            <CardDescription>Start a new therapy session</CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Cognitive Behavioral Therapy can help you identify and challenge negative thought patterns.
              Start a session to work through your thoughts with guidance.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push('/cbt')}>
              Start CBT Session
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} CBT Chatbot. All rights reserved.</p>
      </footer>
    </div>
  );
} 