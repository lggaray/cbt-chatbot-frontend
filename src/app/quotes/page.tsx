'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { quotesAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import Link from 'next/link';

interface Quote {
  id: number;
  text: string;
  author: string;
  category?: string;
  created_at?: string;
}

export default function QuotesPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch quotes
  useEffect(() => {
    const fetchQuotes = async () => {
      if (isAuthenticated) {
        try {
          setLoading(true);
          const data = await quotesAPI.getQuotes(currentPage * limit, limit);
          
          if (data.length < limit) {
            setHasMore(false);
          }
          
          setQuotes(prevQuotes => 
            currentPage === 0 ? data : [...prevQuotes, ...data]
          );
        } catch (error) {
          console.error('Error fetching quotes:', error);
          toast.error('Failed to load quotes');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchQuotes();
  }, [isAuthenticated, currentPage]);

  const loadMoreQuotes = () => {
    setCurrentPage(prev => prev + 1);
  };

  if (isLoading || loading && currentPage === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading Quotes...</h2>
          <p className="text-muted-foreground">Please wait while we load inspirational quotes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Inspirational Quotes</h1>
          <p className="text-muted-foreground">Browse through our collection of motivational quotes</p>
        </div>
        <Button onClick={() => router.push('/home')}>
          Back to Home
        </Button>
      </div>

      {/* Quotes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {quotes.map((quote) => (
          <Card key={quote.id} className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">Quote #{quote.id}</CardTitle>
              <CardDescription>{quote.category || 'Inspirational'}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <blockquote className="border-l-4 border-primary pl-4 italic">
                <p className="mb-2">{quote.text}</p>
                <footer className="text-sm text-muted-foreground">— {quote.author}</footer>
              </blockquote>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(`"${quote.text}" — ${quote.author}`);
                  toast.success('Quote copied to clipboard!');
                }}
              >
                Copy Quote
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center mt-6">
          <Button 
            onClick={loadMoreQuotes} 
            disabled={loading}
            variant="outline"
          >
            {loading ? 'Loading...' : 'Load More Quotes'}
          </Button>
        </div>
      )}

      {quotes.length === 0 && !loading && (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">No quotes found</h3>
          <p className="text-muted-foreground mb-6">We couldn&apos;t find any quotes in our database.</p>
          <Link href="/home">
            <Button>Return to Home</Button>
          </Link>
        </div>
      )}
    </div>
  );
} 