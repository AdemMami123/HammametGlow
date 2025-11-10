'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/store/auth';
import axios from 'axios';

/**
 * Hook to sync Firebase auth state with Zustand store
 * This should be used at the app root level to ensure
 * authentication state is always up-to-date
 */
export function useAuthSync() {
  const { setUser, setLoading, logout } = useAuthStore();

  useEffect(() => {
    setLoading(true);

    // Subscribe to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get ID token
          const idToken = await firebaseUser.getIdToken();

          // Fetch full user data from backend
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
          } else {
            // If backend doesn't have user data, use Firebase data
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
            });
          }
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          // Fallback to Firebase user data
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          });
        }
      } else {
        // User is logged out
        logout();
      }

      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [setUser, setLoading, logout]);
}
