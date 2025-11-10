# Firebase Client Usage Guide

## Overview
The `lib/firebase.ts` module provides a fully configured Firebase client for Next.js 14 App Router with:
- ✅ Firebase Authentication (Email/Password + Google Sign-in)
- ✅ Firestore Database
- ✅ Firebase Storage
- ✅ TypeScript interfaces for type safety
- ✅ Error handling and validation
- ✅ Hot reload protection

---

## Exports

### Firebase Services
```typescript
import { auth, db, storage, googleProvider } from '@/lib/firebase';
```

- `auth` - Firebase Authentication instance
- `db` - Firestore Database instance
- `storage` - Firebase Storage instance
- `googleProvider` - Google OAuth provider (pre-configured)

### TypeScript Interfaces
```typescript
import { UserProfile, AuthState } from '@/lib/firebase';
```

**UserProfile**: Complete user profile type
```typescript
interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  username?: string;
  role?: 'citizen' | 'business' | 'admin' | 'tourist';
  points?: number;
  level?: number;
  badges?: string[];
  location?: {
    latitude: number;
    longitude: number;
    locationName?: string;
  };
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
```

**AuthState**: Authentication state management
```typescript
interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
}
```

### Helper Functions
```typescript
import { mapFirebaseUserToProfile } from '@/lib/firebase';
```

---

## Usage Examples

### 1. Email/Password Authentication

**Register a new user:**
```typescript
'use client';

import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';

async function registerUser(email: string, password: string, displayName: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update display name
    await updateProfile(userCredential.user, { displayName });
    
    console.log('User registered:', userCredential.user.uid);
    return userCredential.user;
  } catch (error: any) {
    console.error('Registration error:', error.message);
    throw error;
  }
}
```

**Sign in:**
```typescript
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

async function signIn(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error('Sign in error:', error.message);
    throw error;
  }
}
```

**Sign out:**
```typescript
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

async function logout() {
  try {
    await signOut(auth);
    console.log('User signed out');
  } catch (error: any) {
    console.error('Sign out error:', error.message);
    throw error;
  }
}
```

---

### 2. Google Authentication

```typescript
'use client';

import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    
    // Get user info
    const user = result.user;
    console.log('Google sign-in successful:', user.displayName);
    
    // Optional: Get access token
    // const credential = GoogleAuthProvider.credentialFromResult(result);
    // const token = credential?.accessToken;
    
    return user;
  } catch (error: any) {
    console.error('Google sign-in error:', error.message);
    throw error;
  }
}
```

**Redirect-based Google sign-in (for mobile):**
```typescript
import { signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

// Initiate redirect
async function initiateGoogleSignIn() {
  await signInWithRedirect(auth, googleProvider);
}

// Handle redirect result (call on page load)
async function handleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      console.log('User signed in:', result.user);
      return result.user;
    }
  } catch (error: any) {
    console.error('Redirect error:', error.message);
    throw error;
  }
}
```

---

### 3. Auth State Listener (React Hook)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, mapFirebaseUserToProfile, type UserProfile } from '@/lib/firebase';

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      const profile = mapFirebaseUserToProfile(firebaseUser);
      setUser(profile);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading, isAuthenticated: !!user };
}
```

**Usage in component:**
```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';

export default function Dashboard() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please sign in</div>;

  return (
    <div>
      <h1>Welcome, {user?.displayName}</h1>
      <p>Email: {user?.email}</p>
    </div>
  );
}
```

---

### 4. Firestore Operations

**Read data:**
```typescript
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

async function getChallenges() {
  const challengesRef = collection(db, 'challenges');
  const q = query(challengesRef, where('status', '==', 'active'));
  
  const snapshot = await getDocs(q);
  const challenges = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  return challenges;
}
```

**Write data:**
```typescript
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

async function createUserProfile(uid: string, data: Partial<UserProfile>) {
  const userRef = doc(db, 'users', uid);
  
  await setDoc(userRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
```

**Real-time listener:**
```typescript
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

function listenToUser(uid: string, callback: (user: UserProfile) => void) {
  const userRef = doc(db, 'users', uid);
  
  const unsubscribe = onSnapshot(userRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as UserProfile);
    }
  });
  
  return unsubscribe; // Call this to stop listening
}
```

---

### 5. Firebase Storage

**Upload file:**
```typescript
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

async function uploadImage(file: File, path: string) {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('File uploaded:', downloadURL);
    return downloadURL;
  } catch (error: any) {
    console.error('Upload error:', error.message);
    throw error;
  }
}

// Usage
const file = document.querySelector('input[type="file"]').files[0];
const url = await uploadImage(file, `avatars/${userId}/profile.jpg`);
```

**Upload with progress:**
```typescript
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

function uploadWithProgress(
  file: File, 
  path: string, 
  onProgress: (progress: number) => void
) {
  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise<string>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error) => reject(error),
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
}
```

---

## Environment Variables

Required in `frontend/.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

✅ These are already configured in `frontend/.env.local` for the `hammametup` project.

---

## Error Handling

The Firebase client includes:
- ✅ Configuration validation on initialization
- ✅ Console warnings for missing environment variables
- ✅ Graceful error logging
- ✅ Hot reload protection for Next.js dev server

If Firebase fails to initialize, check the browser console for specific error messages.

---

## Testing

Test Firebase initialization:
```bash
cd frontend
npm run dev
# Check console for: ✅ Firebase app initialized successfully
```

---

## Security Rules

Make sure your Firestore and Storage security rules are deployed:
```bash
firebase deploy --only firestore:rules,storage:rules --project hammametup
```

Rules are located in:
- `firebase/firestore.rules`
- `firebase/storage.rules`

---

## Next Steps

1. ✅ Firebase client configured and ready
2. Create authentication components (login, register forms)
3. Set up auth state management (Zustand store)
4. Create protected route middleware
5. Implement user profile pages

---

For more details, see:
- [Firebase Web Documentation](https://firebase.google.com/docs/web/setup)
- [Next.js 14 App Router](https://nextjs.org/docs/app)
