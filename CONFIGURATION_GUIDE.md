# Complete Configuration Guide - Hammametup Platform

## 📋 Quick Checklist

- [ ] Firebase Project created
- [ ] Firebase Authentication enabled (Email + Google)
- [ ] Firestore Database created
- [ ] Firestore Collections created
- [ ] Firestore Security Rules applied
- [ ] Firestore Indexes created
- [ ] Firebase Storage enabled
- [ ] Firebase Service Account key downloaded
- [ ] Upstash Redis database created
- [ ] Redis credentials obtained
- [ ] Cloudinary account created
- [ ] Cloudinary upload presets configured
- [ ] All credentials added to `.env` file
- [ ] Backend server tested

---

## 🔥 1. Firebase Configuration

### 1.1 Create Project
1. Visit: https://console.firebase.google.com/
2. Click "Add project"
3. Name: `hammametup`
4. Click "Create project"

### 1.2 Enable Authentication

**Email/Password:**
1. Build → Authentication → Get Started
2. Sign-in method → Email/Password
3. Enable → Save

**Google Sign-In:**
1. Sign-in method → Google
2. Enable → Save
3. Project name: "Hammametup"
4. Support email: (your email)

### 1.3 Create Firestore Database

1. Build → Firestore Database → Create database
2. Mode: **Production mode**
3. Location: **europe-west** (closest to Tunisia)
4. Click "Enable"

### 1.4 Firestore Collections Structure

```
📁 users/
  └─ {userId}/
      ├─ uid: string
      ├─ email: string
      ├─ displayName: string
      ├─ photoURL: string
      ├─ role: 'citizen' | 'business' | 'admin' | 'tourist'
      ├─ points: number (default: 0)
      ├─ totalPoints: number
      ├─ level: number (default: 1)
      ├─ badges: array
      ├─ completedChallenges: array
      ├─ createdAt: timestamp
      └─ updatedAt: timestamp

📁 challenges/
  └─ {challengeId}/
      ├─ title: string
      ├─ description: string
      ├─ category: string
      ├─ difficulty: 'easy' | 'medium' | 'hard'
      ├─ points: number
      ├─ location: { name, address, coordinates: { lat, lng } }
      ├─ imageUrl: string
      ├─ createdBy: string (userId)
      ├─ status: 'draft' | 'active' | 'completed' | 'archived'
      ├─ startDate: timestamp
      ├─ endDate: timestamp
      ├─ currentParticipants: number
      ├─ maxParticipants: number
      └─ createdAt: timestamp

📁 submissions/
  └─ {submissionId}/
      ├─ challengeId: string
      ├─ userId: string
      ├─ status: 'pending' | 'approved' | 'rejected'
      ├─ submissionData: {
      │   ├─ photos: array
      │   ├─ description: string
      │   └─ location: { lat, lng }
      │ }
      ├─ reviewedBy: string (optional)
      ├─ reviewedAt: timestamp (optional)
      ├─ score: number (optional)
      ├─ createdAt: timestamp
      └─ updatedAt: timestamp

📁 badges/
  └─ {badgeId}/
      ├─ userId: string
      ├─ type: string
      ├─ name: string
      ├─ description: string
      ├─ metadata: object
      └─ createdAt: timestamp

📁 notifications/
  └─ {notificationId}/
      ├─ userId: string
      ├─ type: string
      ├─ title: string
      ├─ message: string
      ├─ read: boolean
      ├─ data: object
      └─ createdAt: timestamp
```

### 1.5 Firestore Security Rules

Go to **Firestore Database → Rules** tab:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isSignedIn() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && request.auth.uid == userId;
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }
    
    match /challenges/{challengeId} {
      allow read: if true;
      allow create: if isSignedIn();
      allow update: if isSignedIn() && 
                      (resource.data.createdBy == request.auth.uid || isAdmin());
      allow delete: if isAdmin() || 
                      (isSignedIn() && resource.data.createdBy == request.auth.uid);
    }
    
    match /submissions/{submissionId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isOwner(resource.data.userId) || isAdmin();
      allow delete: if isOwner(resource.data.userId) || isAdmin();
    }
    
    match /badges/{badgeId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }
    
    match /notifications/{notificationId} {
      allow read: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow create: if isAdmin();
      allow update: if isOwner(resource.data.userId);
      allow delete: if isOwner(resource.data.userId);
    }
  }
}
```

Click **"Publish"**

### 1.6 Create Firestore Indexes

Go to **Firestore Database → Indexes** → **Composite** tab:

**Index 1: Challenges by status and date**
- Collection ID: `challenges`
- Fields indexed:
  - `status` (Ascending)
  - `createdAt` (Descending)
- Query scope: Collection

**Index 2: Submissions by user**
- Collection ID: `submissions`
- Fields indexed:
  - `userId` (Ascending)
  - `createdAt` (Descending)

**Index 3: Submissions by challenge**
- Collection ID: `submissions`
- Fields indexed:
  - `challengeId` (Ascending)
  - `createdAt` (Descending)

**Index 4: Submissions by status**
- Collection ID: `submissions`
- Fields indexed:
  - `status` (Ascending)
  - `createdAt` (Descending)

### 1.7 Enable Firebase Storage

1. Build → Storage → Get Started
2. Mode: **Production mode**
3. Location: Same as Firestore
4. Click "Done"

**Storage Rules:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null &&
                     request.resource.size < 10 * 1024 * 1024 &&
                     request.resource.contentType.matches('image/.*');
    }
  }
}
```

### 1.8 Get Service Account Key

1. Project Settings (⚙️) → Service accounts tab
2. Click **"Generate new private key"**
3. Download JSON file
4. Open file and copy the `private_key` value
5. Add to `.env` as `FIREBASE_PRIVATE_KEY`

**Important:** Keep the `\n` characters and quotes!

---

## 📦 2. Upstash Redis Configuration

### 2.1 Create Account
1. Visit: https://console.upstash.com/
2. Sign up with GitHub or Google
3. Verify email

### 2.2 Create Redis Database
1. Click "Create Database"
2. Name: `hammametup-cache`
3. Type: **Regional**
4. Region: **eu-west-1** (Ireland)
5. TLS: **Enabled**
6. Eviction: **allkeys-lru**
7. Click "Create"

### 2.3 Get Credentials
1. Click on your database
2. Scroll to **REST API** section
3. Copy **UPSTASH_REDIS_REST_URL**
4. Copy **UPSTASH_REDIS_REST_TOKEN**
5. Add both to `.env`

### 2.4 Cache Key Patterns (Pre-configured)

```typescript
// User cache
user:{userId}                           // TTL: 1 hour
user:{userId}:badges                    // TTL: 1 hour

// Challenge cache
challenge:{challengeId}                 // TTL: 1 hour
challenges:all                          // TTL: 30 minutes
challenges:category:{categoryName}      // TTL: 30 minutes

// Leaderboard cache (Redis Sorted Sets)
leaderboard:global                      // TTL: 5 minutes
leaderboard:weekly                      // TTL: 1 minute
leaderboard:monthly                     // TTL: 1 minute
leaderboard:challenge:{challengeId}     // TTL: 5 minutes

// Session cache
session:{sessionId}                     // TTL: 24 hours

// Submissions cache
submissions:user:{userId}               // TTL: 30 minutes
submissions:challenge:{challengeId}     // TTL: 30 minutes
```

### 2.5 TTL Strategies (Implemented)

| Cache Type | TTL | Use Case |
|-----------|-----|----------|
| SHORT (5 min) | 300s | Real-time data (leaderboards) |
| MEDIUM (30 min) | 1800s | Semi-static data (challenge lists) |
| LONG (1 hour) | 3600s | Static data (user profiles) |
| DAY (24 hours) | 86400s | Session data |

---

## ☁️ 3. Cloudinary Configuration

### 3.1 Create Account
1. Visit: https://cloudinary.com/users/register/free
2. Sign up (Free tier: 25GB storage, 25GB bandwidth/month)
3. Verify email

### 3.2 Get Credentials
1. Go to Dashboard: https://cloudinary.com/console
2. Copy:
   - **Cloud Name** (e.g., `dxxxxxxx`)
   - **API Key** (your existing: `599166385256219`)
   - **API Secret** (click "Show" to reveal)
3. Add to `.env`

### 3.3 Create Upload Presets

Go to **Settings → Upload → Upload presets**

#### Preset 1: Challenges
- **Preset name:** `hammametup_challenges`
- **Signing mode:** Signed (more secure)
- **Folder:** `hammametup/challenges`
- **Transformations:**
  - Width: 1200, Height: 800
  - Crop: Limit
  - Quality: Auto:good
  - Format: Auto (WebP for supported browsers)

#### Preset 2: Submissions
- **Preset name:** `hammametup_submissions`
- **Folder:** `hammametup/submissions`
- **Transformations:**
  - Width: 1200, Height: 1200
  - Crop: Limit
  - Quality: Auto:good
  - Format: Auto

#### Preset 3: Avatars
- **Preset name:** `hammametup_avatars`
- **Folder:** `hammametup/avatars`
- **Transformations:**
  - Width: 400, Height: 400
  - Crop: Fill
  - Gravity: Face
  - Quality: Auto:good
  - Format: Auto

#### Preset 4: Business Logos
- **Preset name:** `hammametup_business`
- **Folder:** `hammametup/business`
- **Transformations:**
  - Width: 800, Height: 600
  - Crop: Limit
  - Quality: Auto:good
  - Format: Auto

### 3.4 Optimization Settings (Already Configured)

Your backend config already includes:
- ✅ **Auto Format:** Serves WebP for modern browsers, falls back to JPEG/PNG
- ✅ **Auto Quality:** Balances file size vs visual quality
- ✅ **Lazy Loading:** Compatible with Next.js Image component
- ✅ **Responsive:** Transformations for different screen sizes

---

## 🔧 4. Environment Variables Setup

Update `backend/.env` with your actual credentials:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Firebase Admin SDK
FIREBASE_PROJECT_ID=hammametup
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@hammametup.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n<YOUR_ACTUAL_KEY_HERE>\n-----END PRIVATE KEY-----"

# Cloudinary
CLOUDINARY_CLOUD_NAME=<YOUR_CLOUD_NAME>
CLOUDINARY_API_KEY=599166385256219
CLOUDINARY_API_SECRET=<YOUR_API_SECRET>

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://<your-db>.upstash.io
UPSTASH_REDIS_REST_TOKEN=<YOUR_TOKEN>

# JWT (Optional - for custom auth)
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
```

---

## ✅ 5. Testing Checklist

### Test Firebase Connection
```bash
# The server should log:
✅ Firebase Admin initialized successfully
```

### Test Cloudinary Connection
```bash
# Server should log:
✅ Cloudinary connected successfully
```

### Test Redis Connection
```bash
# Server should log either:
✅ Redis client initialized
# or
⚠️  Redis not configured - running without cache
```

### Test Endpoints
```bash
# Health check
curl http://localhost:5000/health

# Should return:
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-11-10T..."
}
```

---

## 🚨 Troubleshooting

### Firebase Issues

**"Service account must contain private_key"**
- Ensure `FIREBASE_PRIVATE_KEY` is uncommented in `.env`
- Keep the quotes around the key
- Don't remove `\n` characters

**"Failed to parse private key"**
- Your key might be invalid - regenerate from Firebase Console
- Check for extra quotes or missing characters

### Cloudinary Issues

**"Failed to connect to Cloudinary"**
- Verify `CLOUDINARY_CLOUD_NAME` is correct (no spaces)
- Check API Secret is correct
- Ensure Cloudinary account is active

### Redis Issues

**"Redis not configured"**
- This is OK! Server works without Redis (just without caching)
- Add Upstash credentials to enable caching
- Caching improves performance but isn't required

---

## 📚 Next Steps

Once all services are configured:

1. ✅ Start backend server: `npm run dev`
2. ✅ Verify all connections in terminal
3. ✅ Test `/health` endpoint
4. ✅ Create your first test user (registration)
5. ✅ Start building frontend features

---

## 🔐 Security Best Practices

1. **Never commit `.env` to Git** (already in `.gitignore`)
2. **Use different Firebase projects** for dev/staging/prod
3. **Rotate API keys** periodically
4. **Enable Firebase App Check** in production
5. **Set up Firestore security rules** properly (already done)
6. **Use HTTPS** in production
7. **Enable 2FA** on all service accounts

---

## 💡 Tips

- **Firebase Free Tier:** 50K reads/day, 20K writes/day, 10GB storage
- **Upstash Free Tier:** 10K commands/day, 256MB storage
- **Cloudinary Free Tier:** 25GB storage, 25GB bandwidth/month
- **Monitor usage** in each service's dashboard
- **Set up billing alerts** to avoid surprises

---

Generated: November 10, 2025
Project: Hammametup Tourism Challenge Platform
