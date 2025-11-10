'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  MapPin,
  Award,
  TrendingUp,
  Edit,
  LogOut,
  Camera,
  Mail,
  Calendar,
  Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/store/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import axios from 'axios';

// Profile edit form schema
const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters').optional(),
  locationName: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// Badge color mapping
const badgeColors: Record<string, 'default' | 'success' | 'warning' | 'secondary'> = {
  first_challenge: 'success',
  week_warrior: 'warning',
  explorer: 'secondary',
  champion: 'default',
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, setUser, logout, setLoading, setError } = useAuthStore();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || '',
      displayName: user?.displayName || '',
      locationName: user?.location?.locationName || '',
    },
  });

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      try {
        setIsLoadingProfile(true);
        const currentUser = auth.currentUser;

        if (!currentUser) {
          router.push('/login');
          return;
        }

        // Get ID token
        const idToken = await currentUser.getIdToken();

        // Fetch user data from backend
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          }
        );

        if (response.data.success) {
          setUser(response.data.user);
          // Update form defaults
          form.reset({
            username: response.data.user.username || '',
            displayName: response.data.user.displayName || '',
            locationName: response.data.user.location?.locationName || '',
          });
        }
      } catch (error: any) {
        console.error('Failed to load profile:', error);
        toast.error(error.response?.data?.message || 'Failed to load profile');
        setError(error.response?.data?.message || 'Failed to load profile');
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, [isAuthenticated, router, setUser, setError, form]);

  // Handle logout
  const handleLogout = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const idToken = await currentUser.getIdToken();

        // Call backend logout
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          }
        );
      }

      // Sign out from Firebase
      await auth.signOut();
      logout();
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  // Handle profile update
  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsUpdating(true);
      const currentUser = auth.currentUser;

      if (!currentUser) {
        toast.error('Not authenticated');
        return;
      }

      const idToken = await currentUser.getIdToken();

      // Update profile on backend
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`,
        {
          username: data.username,
          displayName: data.displayName,
          location: data.locationName
            ? {
                ...user?.location,
                locationName: data.locationName,
              }
            : user?.location,
        },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      if (response.data.success) {
        setUser(response.data.user);
        toast.success('Profile updated successfully');
        setIsEditDialogOpen(false);
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (user?.displayName) {
      return user.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  if (isLoadingProfile) {
    return (
      <div className="container max-w-4xl mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h1 className="text-3xl font-bold">My Profile</h1>
        <Button variant="destructive" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Info Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'User'} />
                    <AvatarFallback className="text-2xl">{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-0 right-0 rounded-full"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold">{user?.displayName || user?.username}</h2>
                  <p className="text-sm text-muted-foreground">@{user?.username}</p>
                </div>
              </div>

              {/* User Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{user?.email}</span>
                </div>

                {user?.role && (
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="secondary" className="capitalize">
                      {user.role}
                    </Badge>
                  </div>
                )}

                {user?.location?.locationName && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{user.location.locationName}</span>
                  </div>
                )}

                {user?.createdAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* Edit Profile Dialog */}
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                      Update your profile information here.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="john_doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="displayName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Display Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="locationName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input placeholder="Hammamet, Tunisia" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button type="submit" disabled={isUpdating}>
                          {isUpdating ? 'Updating...' : 'Save Changes'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </motion.div>

        {/* Statistics Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Points and Level */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center p-4 bg-primary/10 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-primary mb-2" />
                  <p className="text-2xl font-bold">{user?.points || 0}</p>
                  <p className="text-sm text-muted-foreground">Points</p>
                </div>
                <div className="flex flex-col items-center p-4 bg-secondary/10 rounded-lg">
                  <Award className="h-8 w-8 text-secondary-foreground mb-2" />
                  <p className="text-2xl font-bold">Level {user?.level || 1}</p>
                  <p className="text-sm text-muted-foreground">Current Level</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress to Level {(user?.level || 1) + 1}</span>
                  <span>{user?.points || 0} / {((user?.level || 1) + 1) * 100} pts</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(
                        ((user?.points || 0) / (((user?.level || 1) + 1) * 100)) * 100,
                        100
                      )}%`,
                    }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-primary"
                  />
                </div>
              </div>

              {/* Badges Earned */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Badges Earned ({user?.badges?.length || 0})
                </h3>
                {user?.badges && user.badges.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.badges.map((badge, index) => (
                      <motion.div
                        key={badge}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                      >
                        <Badge
                          variant={badgeColors[badge] || 'default'}
                          className="text-xs px-3 py-1"
                        >
                          {badge.replace(/_/g, ' ').toUpperCase()}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No badges earned yet. Complete challenges to earn badges!
                  </p>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Challenges Completed</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Submissions</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
