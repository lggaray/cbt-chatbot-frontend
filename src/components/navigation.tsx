'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Custom dropdown components
interface DropdownProps {
  children: React.ReactNode;
}

interface DropdownTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}

interface DropdownContentProps {
  children: React.ReactNode;
  align?: 'start' | 'end';
  open: boolean;
}

interface DropdownItemProps {
  children: React.ReactNode;
  asChild?: boolean;
  onClick?: () => void;
}

const DropdownMenu = ({ children }: DropdownProps) => {
  return <div className="relative">{children}</div>;
};

const DropdownMenuTrigger = ({ children, onClick }: DropdownTriggerProps) => {
  return <div onClick={onClick}>{children}</div>;
};

const DropdownMenuContent = ({ children, align = 'start', open }: DropdownContentProps) => {
  if (!open) return null;
  
  return (
    <div 
      className={`absolute z-50 mt-1 min-w-[8rem] rounded-md border border-border bg-card p-1 shadow-md ${
        align === 'end' ? 'right-0' : 'left-0'
      }`}
    >
      {children}
    </div>
  );
};

const DropdownMenuItem = ({ children, asChild, onClick }: DropdownItemProps) => {
  if (asChild) {
    return <div className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground">{children}</div>;
  }
  
  return (
    <div 
      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
      onClick={onClick}
    >
      {children}
    </div>
  );
};

const DropdownMenuSeparator = () => {
  return <div className="my-1 h-px bg-border" />;
};

export function Navigation() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    }
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className="bg-card border-b border-border">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href={isAuthenticated ? '/home' : '/'} className="text-xl font-bold text-foreground">
              CBT Chatbot
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link href="/home" passHref>
                  <Button variant={isActive('/home') ? 'default' : 'ghost'} size="sm">
                    Home
                  </Button>
                </Link>
                <Link href="/check-in" passHref>
                  <Button variant={isActive('/check-in') ? 'default' : 'ghost'} size="sm">
                    Check-in
                  </Button>
                </Link>
                <Link href="/cbt" passHref>
                  <Button variant={isActive('/cbt') ? 'default' : 'ghost'} size="sm">
                    CBT Session
                  </Button>
                </Link>
                <div ref={dropdownRef}>
                  <DropdownMenu>
                    <DropdownMenuTrigger onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                      <Button variant="outline" size="sm">
                        {user && (user.name || user.email?.split('@')[0]) || 'My Account'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" open={isDropdownOpen}>
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="w-full" onClick={() => setIsDropdownOpen(false)}>
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => {
                        handleLogout();
                        setIsDropdownOpen(false);
                      }}>
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" passHref>
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/register" passHref>
                  <Button variant="default" size="sm">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-foreground"
            >
              {isMenuOpen ? 'Close' : 'Menu'}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pt-4 pb-2 space-y-2">
            {isAuthenticated ? (
              <>
                <Link href="/home" passHref>
                  <Button 
                    variant={isActive('/home') ? 'default' : 'ghost'} 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Home
                  </Button>
                </Link>
                <Link href="/check-in" passHref>
                  <Button 
                    variant={isActive('/check-in') ? 'default' : 'ghost'} 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Check-in
                  </Button>
                </Link>
                <Link href="/cbt" passHref>
                  <Button 
                    variant={isActive('/cbt') ? 'default' : 'ghost'} 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    CBT Session
                  </Button>
                </Link>
                <Link href="/profile" passHref>
                  <Button 
                    variant={isActive('/profile') ? 'default' : 'ghost'} 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Button>
                </Link>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" passHref>
                  <Button 
                    variant={isActive('/login') ? 'default' : 'ghost'} 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Button>
                </Link>
                <Link href="/register" passHref>
                  <Button 
                    variant={isActive('/register') ? 'default' : 'ghost'} 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
} 