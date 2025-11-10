# Authentication API Documentation

## Overview
Complete authentication system with registration, login, logout, and user profile endpoints.

---

## Endpoints

### 1. POST /api/auth/register

Register a new user account.

**Rate Limit:** Applied (authLimiter)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "username": "john_doe",
  "location": {
    "latitude": 36.4,
    "longitude": 10.6,
    "locationName": "Hammamet, Tunisia"
  }
}
```

**Validation Rules:**
- **email**: Valid email format (required)
- **password**: 
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
- **username**:
  - 3-20 characters
  - Letters, numbers, and underscores only
  - Must be unique
- **location**: Optional object with latitude (-90 to 90), longitude (-180 to 180), and optional locationName

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "uid": "firebase_user_id",
    "email": "user@example.com",
    "username": "john_doe",
    "role": "citizen",
    "points": 0,
    "level": 1,
    "displayName": "john_doe",
    "photoURL": null
  }
}
```

**Error Responses:**

**400 - Validation Error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "password",
      "message": "Password must contain at least one uppercase letter"
    }
  ]
}
```

**409 - Username Exists:**
```json
{
  "success": false,
  "message": "Username already exists",
  "field": "username"
}
```

**409 - Email Exists:**
```json
{
  "success": false,
  "message": "Email already exists",
  "field": "email"
}
```

**500 - Server Error:**
```json
{
  "success": false,
  "message": "Failed to create user account",
  "error": "error_message"
}
```

**Process Flow:**
1. Validate request body with Zod schema
2. Check username availability in Firestore
3. Create Firebase Auth user
4. Create user document in Firestore with:
   - uid, email, username
   - role: 'citizen' (default)
   - points: 0, level: 1
   - badges: []
   - createdAt/updatedAt timestamps
   - location (if provided)
   - profileImage: null
5. Cache user data in Redis (TTL: 15 min)
6. Return user data

**Error Handling:**
- Email already exists → 409 Conflict
- Username already exists → 409 Conflict
- Invalid input → 400 Bad Request
- Firebase errors → 500 or 409
- Firestore failure → Rollback Auth user creation

---

### 2. POST /api/auth/login

Authenticate user with Firebase ID token.

**Rate Limit:** Applied (authLimiter)

**Request Body:**
```json
{
  "idToken": "firebase_id_token_from_client"
}
```

**Note:** The ID token is generated client-side using Firebase Auth SDK after user signs in with email/password or OAuth provider.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "uid": "firebase_user_id",
    "email": "user@example.com",
    "username": "john_doe",
    "role": "citizen",
    "points": 150,
    "level": 2,
    "displayName": "john_doe",
    "photoURL": null,
    "badges": ["first_challenge", "week_warrior"]
  }
}
```

**Error Responses:**

**400 - Validation Error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "idToken",
      "message": "ID token is required"
    }
  ]
}
```

**401 - Token Expired:**
```json
{
  "success": false,
  "message": "Token expired. Please sign in again.",
  "code": "TOKEN_EXPIRED"
}
```

**401 - Invalid Token:**
```json
{
  "success": false,
  "message": "Invalid credentials",
  "code": "INVALID_TOKEN"
}
```

**404 - User Not Found:**
```json
{
  "success": false,
  "message": "User not found",
  "code": "USER_NOT_FOUND"
}
```

**Process Flow:**
1. Validate request body (idToken required)
2. Verify Firebase ID token
3. Extract uid from decoded token
4. Try to get user from Redis cache
5. If not cached, retrieve from Firestore
6. Cache user data in Redis (TTL: 15 min)
7. Cache user session in Redis (TTL: 24 hours)
8. Return user data

**Caching Strategy:**
- User data: 15 minutes TTL
- Session data: 24 hours TTL

---

### 3. POST /api/auth/logout

Log out current user.

**Authentication:** Required (authMiddleware)

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Error Responses:**

**401 - Unauthorized:**
```json
{
  "success": false,
  "message": "No token provided"
}
```

**Process:**
1. Extract uid from authenticated request
2. Delete session from Redis cache
3. Return success

---

### 4. GET /api/auth/me

Get current user profile.

**Authentication:** Required (authMiddleware)

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "uid": "firebase_user_id",
    "email": "user@example.com",
    "username": "john_doe",
    "role": "citizen",
    "points": 150,
    "level": 2,
    "displayName": "john_doe",
    "photoURL": "https://cloudinary.com/...",
    "badges": ["first_challenge", "week_warrior"],
    "location": {
      "latitude": 36.4,
      "longitude": 10.6,
      "locationName": "Hammamet"
    }
  }
}
```

**Error Responses:**

**401 - Unauthorized:**
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

**404 - User Not Found:**
```json
{
  "success": false,
  "message": "User not found"
}
```

**Process:**
1. Verify authentication via middleware
2. Try Redis cache first
3. Fallback to Firestore if not cached
4. Update Redis cache
5. Return user profile

---

## Client-Side Integration Examples

### Registration Flow (Frontend)

```typescript
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import axios from 'axios';

async function register(email: string, password: string, username: string) {
  try {
    // Step 1: Create Firebase Auth user (client-side)
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Step 2: Call backend to create Firestore profile
    const response = await axios.post('/api/auth/register', {
      email,
      password,
      username,
      location: {
        latitude: 36.4,
        longitude: 10.6,
        locationName: 'Hammamet',
      },
    });

    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
}
```

### Login Flow (Frontend)

```typescript
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import axios from 'axios';

async function login(email: string, password: string) {
  try {
    // Step 1: Sign in with Firebase Auth (client-side)
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Step 2: Get ID token
    const idToken = await userCredential.user.getIdToken();

    // Step 3: Send token to backend
    const response = await axios.post('/api/auth/login', {
      idToken,
    });

    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
}
```

### Logout Flow (Frontend)

```typescript
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import axios from 'axios';

async function logout() {
  try {
    // Get current ID token
    const idToken = await auth.currentUser?.getIdToken();

    // Call backend logout
    await axios.post(
      '/api/auth/logout',
      {},
      {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      }
    );

    // Sign out from Firebase Auth
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}
```

### Get Current User (Frontend)

```typescript
import { auth } from '@/lib/firebase';
import axios from 'axios';

async function getCurrentUser() {
  try {
    const idToken = await auth.currentUser?.getIdToken();

    const response = await axios.get('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    return response.data.user;
  } catch (error: any) {
    if (error.response?.data) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }
}
```

---

## Security Features

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)

### Rate Limiting
- Applied to all auth endpoints
- Prevents brute force attacks
- Configured via authLimiter middleware

### Token Verification
- Firebase ID tokens verified server-side
- Expired tokens rejected with specific error code
- Invalid tokens rejected immediately

### Data Validation
- Zod schema validation for all inputs
- Email format validation
- Username format validation (alphanumeric + underscore only)

### Rollback on Failure
- If Firestore user creation fails, Firebase Auth user is deleted
- Ensures data consistency

### Caching Strategy
- User data cached in Redis (15 min TTL)
- Session data cached (24 hour TTL)
- Reduces database load
- Graceful fallback if Redis unavailable

---

## Error Codes

| Code | Meaning |
|------|---------|
| TOKEN_EXPIRED | Firebase ID token has expired |
| INVALID_TOKEN | Token signature invalid or malformed |
| USER_NOT_FOUND | User document doesn't exist in Firestore |

---

## Testing

### Manual Testing with cURL

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "username": "testuser"
  }'
```

**Login:**
```bash
# First get idToken from Firebase Auth client
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "YOUR_FIREBASE_ID_TOKEN"
  }'
```

**Get Current User:**
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

**Logout:**
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

---

## Next Steps

1. ✅ Registration endpoint implemented
2. ✅ Login endpoint implemented
3. ✅ Logout endpoint implemented
4. ✅ Get current user endpoint implemented
5. TODO: Password reset endpoint
6. TODO: Email verification endpoint
7. TODO: Update profile endpoint
8. TODO: Delete account endpoint

---

For more information, see:
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Zod Validation](https://zod.dev/)
- [Express.js](https://expressjs.com/)
