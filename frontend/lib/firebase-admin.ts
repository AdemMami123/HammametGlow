import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
};

// Initialize Firebase Admin
export function initAdmin() {
  if (getApps().length <= 0) {
    initializeApp(firebaseAdminConfig);
  }
}

// Get Firebase Admin Auth
export function getAdminAuth() {
  initAdmin();
  return getAuth();
}

// Get Firebase Admin Firestore
export function getAdminFirestore() {
  initAdmin();
  return getFirestore();
}
