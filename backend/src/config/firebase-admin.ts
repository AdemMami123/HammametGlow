import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Try to load service account from a file pointed to by FIREBASE_SERVICE_ACCOUNT_PATH
const loadServiceAccountFromFile = (): any | null => {
  const p = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!p) return null;
  try {
    const full = path.isAbsolute(p) ? p : path.join(process.cwd(), p);
    const raw = fs.readFileSync(full, 'utf8');
    return JSON.parse(raw);
  } catch (err: any) {
    console.warn('Could not read Firebase service account file at', p, err?.message || err);
    return null;
  }
};

// Try to build service account from env vars (FIREBASE_PRIVATE_KEY)
const loadServiceAccountFromEnv = (): any | null => {
  if (!process.env.FIREBASE_PRIVATE_KEY) return null;
  return {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_URL,
    universe_domain: 'googleapis.com',
  };
};

const fileCred = loadServiceAccountFromFile();
const envCred = loadServiceAccountFromEnv();
const serviceAccount = fileCred || envCred;

// TypeScript types for exported services
export type AdminAuth = admin.auth.Auth;
export type AdminDb = admin.firestore.Firestore;
export type AdminStorage = admin.storage.Storage;

// Exports (create safe fallbacks to avoid runtime crashes when creds are missing)
let adminAuth: admin.auth.Auth;
let adminDb: admin.firestore.Firestore;
let adminStorage: admin.storage.Storage;

// Prevent re-initialization check
if (admin.apps.length > 0) {
  console.log('♻️  Firebase Admin already initialized, using existing instance');
  adminAuth = admin.auth();
  adminDb = admin.firestore();
  adminStorage = admin.storage();
} else if (serviceAccount && serviceAccount.private_key && serviceAccount.client_email) {
  try {
    // Initialize Firebase Admin SDK
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
    
    console.log('✅ Firebase Admin initialized successfully');
    console.log(`   Project ID: ${serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID}`);
    console.log(`   Service Account: ${serviceAccount.client_email}`);

    // Initialize services
    adminAuth = admin.auth();
    adminDb = admin.firestore();
    adminStorage = admin.storage();
    
    console.log('✅ Firebase Admin services ready: Auth, Firestore, Storage');
  } catch (error: any) {
    console.error('❌ Firebase Admin initialization failed:', error.message);
    console.error('   Error details:', error);
    
    // Create mock instances to prevent crashes
    adminAuth = {} as admin.auth.Auth;
    adminDb = {} as admin.firestore.Firestore;
    adminStorage = {} as admin.storage.Storage;
    
    throw new Error(`Firebase Admin initialization failed: ${error.message}`);
  }
} else {
  console.error('❌ Firebase Admin SDK not initialized - missing service account credentials');
  console.error('   Required: FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_PRIVATE_KEY');
  console.error('   Set FIREBASE_SERVICE_ACCOUNT_PATH in .env to a local service account JSON file');
  console.error('   OR set FIREBASE_PRIVATE_KEY and related env vars');
  
  // Provide graceful fallbacks so app doesn't crash in environments without creds
  adminAuth = {} as admin.auth.Auth;
  adminDb = {} as admin.firestore.Firestore;
  adminStorage = {} as admin.storage.Storage;
}

// Export Firebase Admin services
export { adminAuth, adminDb, adminStorage };

// Export the admin instance for direct SDK access
export default admin;
