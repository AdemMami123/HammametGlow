import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, Firestore, Timestamp } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// TypeScript interfaces for User Profile and Auth State
export interface UserProfile {
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

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
}

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Validate configuration before initialization
const validateConfig = () => {
  const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'appId'];
  const missingKeys = requiredKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);
  
  if (missingKeys.length > 0) {
    console.error('❌ Firebase configuration error: Missing required keys:', missingKeys);
    console.error('Please set the following environment variables:', 
      missingKeys.map(key => `NEXT_PUBLIC_FIREBASE_${key.toUpperCase()}`).join(', ')
    );
    return false;
  }
  return true;
};

// Initialize Firebase App with error handling
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let googleProvider: GoogleAuthProvider;

try {
  // Validate configuration
  if (!validateConfig()) {
    throw new Error('Firebase configuration is incomplete. Check your environment variables.');
  }

  // Prevent re-initialization on hot reload (Next.js 14 App Router compatible)
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized successfully');
  } else {
    app = getApp();
    console.log('♻️  Using existing Firebase app instance');
  }

  // Initialize Firebase services
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  // Initialize Google Auth Provider
  googleProvider = new GoogleAuthProvider();
  
  // Optional: Configure Google provider with custom parameters
  googleProvider.setCustomParameters({
    prompt: 'select_account', // Always show account selection
  });

  console.log('✅ Firebase services initialized: Auth, Firestore, Storage');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  
  // Create fallback instances to prevent app crashes
  // These will throw errors if used, but won't break the import
  if (typeof window !== 'undefined') {
    console.error('⚠️  Firebase not initialized. Some features will not work.');
  }
  
  throw error; // Re-throw in development to surface the issue
}

// Export Firebase services
export { auth, db, storage, googleProvider };

// Export the app instance as default
export default app;

// Helper function to convert Firebase User to UserProfile
export const mapFirebaseUserToProfile = (firebaseUser: FirebaseUser | null): UserProfile | null => {
  if (!firebaseUser) return null;
  
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
  };
};
