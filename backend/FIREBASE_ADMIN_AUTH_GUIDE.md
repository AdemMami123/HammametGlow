# Backend Firebase Admin & Authentication Documentation

## Overview
The backend uses Firebase Admin SDK for server-side authentication and Firestore operations, with Express middleware for token verification and role-based authorization.

---

## Files

### 1. `src/config/firebase-admin.ts`
**Purpose:** Initialize Firebase Admin SDK with service account credentials

**Features:**
- ✅ Load credentials from JSON file or environment variables
- ✅ Handle private key newline characters properly (`\n` → actual newlines)
- ✅ Prevent re-initialization on hot reload
- ✅ Comprehensive error handling and logging
- ✅ TypeScript types for all exported services
- ✅ Graceful fallbacks to prevent crashes when credentials missing

**Exports:**
```typescript
import { adminAuth, adminDb, adminStorage, AdminAuth, AdminDb, AdminStorage } from '@/config/firebase-admin';
import admin from '@/config/firebase-admin'; // Default export for direct SDK access
```

**Environment Variables:**
```bash
# Option 1: Use service account JSON file (recommended)
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
FIREBASE_STORAGE_BUCKET=hammametup.firebasestorage.app

# Option 2: Use individual environment variables
FIREBASE_PROJECT_ID=hammametup
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@hammametup.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY_ID=abc123...
FIREBASE_CLIENT_ID=123456789...
FIREBASE_CLIENT_X509_URL=https://www.googleapis.com/...
```

**Initialization Logs:**
```
✅ Firebase Admin initialized successfully
   Project ID: hammametup
   Service Account: firebase-adminsdk-xxxxx@hammametup.iam.gserviceaccount.com
✅ Firebase Admin services ready: Auth, Firestore, Storage
```

---

### 2. `src/middleware/auth.ts`
**Purpose:** Express middleware for Firebase token verification and role-based authorization

**Features:**
- ✅ Verify Firebase ID tokens from Authorization header
- ✅ Check Bearer token format
- ✅ Attach user data to `req.user`
- ✅ Handle all edge cases (expired, revoked, malformed tokens)
- ✅ Detailed error logging
- ✅ Role-based authorization helper
- ✅ TypeScript interfaces extending Express Request

**Exports:**
```typescript
import { authMiddleware, requireRole, AuthRequest } from '@/middleware/auth';
```

**AuthRequest Interface:**
```typescript
interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: string;
    emailVerified?: boolean;
    displayName?: string | null;
  };
}
```

---

## Usage Examples

### 1. Protected Routes with Authentication

```typescript
import express from 'express';
import { authMiddleware, AuthRequest } from '@/middleware/auth';

const router = express.Router();

// Protected route - requires authentication
router.get('/profile', authMiddleware, (req: AuthRequest, res) => {
  const { uid, email } = req.user!;
  
  res.json({
    success: true,
    user: { uid, email },
  });
});

export default router;
```

### 2. Role-Based Authorization

```typescript
import { authMiddleware, requireRole, AuthRequest } from '@/middleware/auth';

// Admin-only endpoint
router.delete(
  '/admin/users/:id',
  authMiddleware,
  requireRole('admin'),
  async (req: AuthRequest, res) => {
    // Only admins can access this
    const userId = req.params.id;
    // ... delete user logic
  }
);

// Business or Admin endpoint
router.post(
  '/challenges',
  authMiddleware,
  requireRole('admin', 'business'),
  async (req: AuthRequest, res) => {
    // Admins and business accounts can create challenges
    // ... create challenge logic
  }
);
```

### 3. Firestore Operations

```typescript
import { adminDb } from '@/config/firebase-admin';
import { authMiddleware, AuthRequest } from '@/middleware/auth';

router.get('/challenges', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const snapshot = await adminDb
      .collection('challenges')
      .where('status', '==', 'active')
      .limit(20)
      .get();

    const challenges = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ success: true, challenges });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### 4. Firebase Auth Operations

```typescript
import { adminAuth } from '@/config/firebase-admin';

// Set custom claims (role)
async function setUserRole(uid: string, role: string) {
  await adminAuth.setCustomUserClaims(uid, { role });
  console.log(`User ${uid} role set to ${role}`);
}

// Get user by email
async function getUserByEmail(email: string) {
  const userRecord = await adminAuth.getUserByEmail(email);
  return userRecord;
}

// Delete user
async function deleteUser(uid: string) {
  await adminAuth.deleteUser(uid);
  console.log(`User ${uid} deleted`);
}

// List users with pagination
async function listUsers(maxResults = 100) {
  const listUsersResult = await adminAuth.listUsers(maxResults);
  return listUsersResult.users;
}
```

### 5. Firebase Storage Operations

```typescript
import { adminStorage } from '@/config/firebase-admin';

// Upload file
async function uploadFile(filePath: string, destination: string) {
  const bucket = adminStorage.bucket();
  await bucket.upload(filePath, { destination });
  
  const file = bucket.file(destination);
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: '03-01-2030',
  });
  
  return url;
}

// Delete file
async function deleteFile(path: string) {
  const bucket = adminStorage.bucket();
  await bucket.file(path).delete();
}

// Get download URL
async function getDownloadURL(path: string) {
  const bucket = adminStorage.bucket();
  const file = bucket.file(path);
  
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 3600 * 1000, // 1 hour
  });
  
  return url;
}
```

---

## Error Handling

### Authentication Middleware Errors

| Error Code | HTTP Status | Description | Client Action |
|------------|-------------|-------------|---------------|
| `Unauthorized` | 401 | Missing Authorization header | Include `Authorization: Bearer <token>` |
| `Unauthorized` | 401 | Invalid Bearer format | Check header format |
| `Unauthorized` | 401 | Empty token | Provide valid token |
| `TokenExpired` | 401 | Token expired | Re-authenticate user |
| `TokenRevoked` | 401 | Token revoked | Force user to sign in |
| `InvalidToken` | 401 | Malformed token or invalid signature | Get new token |
| `AuthenticationFailed` | 401 | Generic verification failure | Check token validity |
| `InternalServerError` | 500 | Unexpected error | Retry or contact support |

### Authorization Middleware Errors

| Error Code | HTTP Status | Description | Client Action |
|------------|-------------|-------------|---------------|
| `Unauthorized` | 401 | User not authenticated | Authenticate first |
| `Forbidden` | 403 | Insufficient permissions | User doesn't have required role |

**Error Response Format:**
```json
{
  "success": false,
  "error": "TokenExpired",
  "message": "Authentication token has expired. Please sign in again."
}
```

---

## Testing Authentication

### Manual Testing with cURL

**1. Get a Firebase ID token** (from frontend after sign-in):
```javascript
// In frontend after sign-in:
import { auth } from '@/lib/firebase';

const user = auth.currentUser;
if (user) {
  const token = await user.getIdToken();
  console.log('Token:', token);
}
```

**2. Test protected endpoint:**
```bash
curl -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
     http://localhost:5000/api/profile
```

**3. Test without token (should fail):**
```bash
curl http://localhost:5000/api/profile
# Response: {"success":false,"error":"Unauthorized","message":"Authorization header is required"}
```

**4. Test with invalid token:**
```bash
curl -H "Authorization: Bearer invalid_token_here" \
     http://localhost:5000/api/profile
# Response: {"success":false,"error":"InvalidToken","message":"Invalid token format or signature"}
```

---

## Setting Custom Claims (User Roles)

Custom claims are added to Firebase ID tokens and can be accessed in the middleware.

**Backend - Set user role:**
```typescript
import { adminAuth } from '@/config/firebase-admin';

async function assignRole(uid: string, role: 'citizen' | 'business' | 'admin' | 'tourist') {
  try {
    await adminAuth.setCustomUserClaims(uid, { role });
    console.log(`✅ User ${uid} assigned role: ${role}`);
    
    // Force token refresh on client
    // Client must call: await auth.currentUser.getIdToken(true);
  } catch (error: any) {
    console.error('Failed to set custom claims:', error);
    throw error;
  }
}

// Usage
await assignRole('user123abc', 'admin');
```

**Frontend - Refresh token to get new claims:**
```typescript
import { auth } from '@/lib/firebase';

async function refreshToken() {
  const user = auth.currentUser;
  if (user) {
    // Force token refresh to get updated custom claims
    const token = await user.getIdToken(true); // true = force refresh
    return token;
  }
}
```

---

## Security Best Practices

### 1. **Always use HTTPS in production**
```typescript
// In production, enforce HTTPS
if (process.env.NODE_ENV === 'production' && req.protocol !== 'https') {
  return res.redirect(`https://${req.hostname}${req.url}`);
}
```

### 2. **Token expiration**
- Firebase ID tokens expire after 1 hour
- Frontend should automatically refresh tokens before expiration
- Backend middleware checks for expired tokens

### 3. **Revoke tokens when necessary**
```typescript
import { adminAuth } from '@/config/firebase-admin';

// Revoke all refresh tokens for a user
async function revokeUserTokens(uid: string) {
  await adminAuth.revokeRefreshTokens(uid);
  console.log(`Tokens revoked for user ${uid}`);
}

// Usage: After password change, account compromise, etc.
await revokeUserTokens('user123abc');
```

### 4. **Check token revocation**
```typescript
// Middleware checks revoked tokens automatically with checkRevoked: true
const decodedToken = await adminAuth.verifyIdToken(token, true);
```

### 5. **Environment variable security**
- Never commit `.env` or `firebase-service-account.json`
- Use secrets manager in production (Railway/Render secrets, AWS Secrets Manager, etc.)
- Rotate service account keys periodically

---

## Troubleshooting

### Issue: "Firebase Admin SDK not initialized"
**Cause:** Missing service account credentials

**Solution:**
1. Create service account JSON from Firebase Console
2. Set `FIREBASE_SERVICE_ACCOUNT_PATH` in `.env`
3. Or set individual env vars (FIREBASE_PRIVATE_KEY, etc.)

### Issue: "Failed to parse private key"
**Cause:** Newline characters not handled correctly

**Solution:**
Ensure private key in env has `\n` (literal backslash-n), not actual newlines:
```bash
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----"
```

The code automatically converts `\n` to actual newlines.

### Issue: "Token expired" errors
**Cause:** Firebase ID tokens expire after 1 hour

**Solution:**
Frontend should automatically refresh tokens:
```typescript
// Frontend - Auto refresh before expiration
import { auth } from '@/lib/firebase';

auth.onIdTokenChanged(async (user) => {
  if (user) {
    const token = await user.getIdToken();
    // Store token for API calls
    localStorage.setItem('firebaseToken', token);
  }
});
```

### Issue: "Insufficient permissions" (403)
**Cause:** User doesn't have required role

**Solution:**
1. Check user's custom claims:
```typescript
const user = await adminAuth.getUser(uid);
console.log('Custom claims:', user.customClaims);
```

2. Set role if missing:
```typescript
await adminAuth.setCustomUserClaims(uid, { role: 'admin' });
```

3. Frontend must refresh token to get new claims:
```typescript
await auth.currentUser.getIdToken(true); // force refresh
```

---

## Complete Example: User Registration Endpoint

```typescript
import express from 'express';
import { z } from 'zod';
import { adminAuth, adminDb } from '@/config/firebase-admin';

const router = express.Router();

// Validation schema
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3).max(20),
  displayName: z.string().min(2),
});

router.post('/register', async (req, res) => {
  try {
    // Validate input
    const { email, password, username, displayName } = registerSchema.parse(req.body);

    // Check username availability
    const usernameCheck = await adminDb
      .collection('users')
      .where('username', '==', username)
      .limit(1)
      .get();

    if (!usernameCheck.empty) {
      return res.status(400).json({
        success: false,
        error: 'UsernameExists',
        message: 'Username already taken',
      });
    }

    // Create Firebase Auth user
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
      emailVerified: false,
    });

    // Set custom claims (role)
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'citizen' });

    // Create user document in Firestore
    await adminDb.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      username,
      displayName,
      role: 'citizen',
      points: 0,
      level: 1,
      badges: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Send verification email
    const link = await adminAuth.generateEmailVerificationLink(email);
    // TODO: Send email with link

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        uid: userRecord.uid,
        email,
        username,
        displayName,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);

    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({
        success: false,
        error: 'EmailExists',
        message: 'Email already registered',
      });
    }

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Invalid input',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: 'Registration failed',
    });
  }
});

export default router;
```

---

## Next Steps

1. ✅ Firebase Admin configured and tested
2. ✅ Authentication middleware implemented
3. Create user registration endpoint (see example above)
4. Create user login endpoint (verify token from frontend)
5. Implement role management endpoints
6. Set up Firestore security rules
7. Add rate limiting to auth endpoints
8. Implement password reset flow
9. Add email verification

---

For more information:
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Firebase Auth Custom Claims](https://firebase.google.com/docs/auth/admin/custom-claims)
- [Express TypeScript Guide](https://expressjs.com/en/guide/using-typescript.html)
