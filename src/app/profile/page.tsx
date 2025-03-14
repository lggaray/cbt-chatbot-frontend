'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { userAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { authAPI } from '@/lib/api';

// Custom Select component
const Select = ({ value, onValueChange, children }: { value: string; onValueChange: (value: string) => void; children: React.ReactNode }) => {
  return (
    <div className="relative">
      <select 
        value={value} 
        onChange={(e) => onValueChange(e.target.value)}
        className="w-full p-2 border border-border rounded-md bg-background text-foreground"
      >
        {children}
      </select>
    </div>
  );
};

const SelectItem = ({ value, children }: { value: string; children: React.ReactNode }) => (
  <option value={value}>{children}</option>
);

// Helper function to convert check-in frequency values to labels
const getCheckInFrequencyLabel = (frequency: string): string => {
  switch (frequency) {
    case '1':
      return 'Daily';
    case '7':
      return 'Weekly';
    case '14':
      return 'Bi-weekly';
    case '30':
      return 'Monthly';
    default:
      return 'Weekly'; // Default to weekly if unknown
  }
};

interface UserProfile {
  id: string;
  name: string;
  email: string;
  gender: string;
  age: number;
  checkInFrequency: string;
  joinDate: string;
  completedSessions: number;
}

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    age: '',
    checkInFrequency: '7', // Default to weekly
  });
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (isAuthenticated && user) {
        try {
          setLoading(true);
          
          // Try to refresh the token first to ensure we have a valid one
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            try {
              const refreshResponse = await authAPI.refreshToken(refreshToken);
              if (refreshResponse) {
                localStorage.setItem('access_token', refreshResponse.access_token);
                localStorage.setItem('refresh_token', refreshResponse.refresh_token);
              }
            } catch (refreshError) {
              // Continue with current token if refresh fails
            }
          }
          
          // Using getCurrentUser instead of getUserProfile
          const data = await userAPI.getCurrentUser();
          
          // Validate the data before using it
          if (!data || !data.id) {
            throw new Error('Invalid user data received');
          }
          
          const profileData: UserProfile = {
            id: data.id || '',
            name: data.name || '',
            email: data.email || '',
            gender: data.gender || 'prefer-not-to-say',
            age: data.age || 0,
            checkInFrequency: data.check_in_frequency ? data.check_in_frequency.toString() : '7',
            joinDate: data.joinDate || new Date().toISOString(),
            completedSessions: data.completedSessions || 0
          };
          setProfile(profileData);
          setFormData({
            name: profileData.name,
            gender: profileData.gender,
            age: profileData.age !== undefined ? profileData.age.toString() : '',
            checkInFrequency: profileData.checkInFrequency,
          });
        } catch (error) {
          console.error('Error fetching profile:', error);
          toast.error('Failed to load profile data');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProfile();
  }, [isAuthenticated, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // Convert age to number and prepare update data
      const updateData = {
        name: formData.name,
        gender: formData.gender,
        age: formData.age ? parseInt(formData.age) : undefined,
        check_in_frequency: formData.checkInFrequency ? parseInt(formData.checkInFrequency) : 7 // Default to weekly
      };
      
      // Call the API to update the profile
      const updatedData = await userAPI.updateProfile(updateData);
      
      // Update the local profile state with the response data
      if (updatedData) {
        const updatedProfile: UserProfile = {
          ...profile!,
          name: updatedData.name || '',
          gender: updatedData.gender || 'prefer-not-to-say',
          age: updatedData.age || 0,
          checkInFrequency: updatedData.check_in_frequency ? updatedData.check_in_frequency.toString() : '7',
        };
        setProfile(updatedProfile);
      }
      
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        gender: profile.gender || 'prefer-not-to-say',
        age: profile.age !== undefined ? profile.age.toString() : '',
        checkInFrequency: profile.checkInFrequency || '7',
      });
    }
    setEditing(false);
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading...</h2>
          <p className="text-muted-foreground">Please wait while we load your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Title */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <p className="text-muted-foreground">View and manage your personal information</p>
      </div>

      {/* Profile Content */}
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>View and manage your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile && (
              <>
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Personal Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Name</label>
                      {editing ? (
                        <Input
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Your name"
                        />
                      ) : (
                        <p className="text-foreground p-2 border border-border rounded-md">{profile.name}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <p className="text-foreground p-2 border border-border rounded-md">{profile.email}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Gender</label>
                      {editing ? (
                        <Select
                          value={formData.gender}
                          onValueChange={(value: string) => handleSelectChange('gender', value)}
                        >
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="non-binary">Non-binary</SelectItem>
                          <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                        </Select>
                      ) : (
                        <p className="text-foreground p-2 border border-border rounded-md">
                          {profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Age</label>
                      {editing ? (
                        <Input
                          name="age"
                          type="number"
                          value={formData.age}
                          onChange={handleInputChange}
                          placeholder="Your age"
                          min="13"
                          max="120"
                        />
                      ) : (
                        <p className="text-foreground p-2 border border-border rounded-md">{profile.age}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Check-in Frequency</label>
                      {editing ? (
                        <Select
                          value={formData.checkInFrequency}
                          onValueChange={(value: string) => handleSelectChange('checkInFrequency', value)}
                        >
                          <SelectItem value="1">Daily</SelectItem>
                          <SelectItem value="7">Weekly</SelectItem>
                          <SelectItem value="14">Bi-weekly</SelectItem>
                          <SelectItem value="30">Monthly</SelectItem>
                        </Select>
                      ) : (
                        <p className="text-foreground p-2 border border-border rounded-md">
                          {getCheckInFrequencyLabel(profile.checkInFrequency)}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Member Since</label>
                      <p className="text-foreground p-2 border border-border rounded-md">
                        {new Date(profile.joinDate).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Completed Sessions</label>
                      <p className="text-foreground p-2 border border-border rounded-md">{profile.completedSessions}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            {editing ? (
              <>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => router.push('/home')}>
                  Back
                </Button>
                <Button onClick={() => setEditing(true)}>Edit Profile</Button>
              </>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 