# Hammametup Backend API

Backend server for the Hammametup tourism gamification platform built with Express.js, TypeScript, Firebase, and Socket.io.

## ✅ Backend Recreation Complete!

Your backend folder has been successfully recreated with all files and structure restored.

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── firebase-admin.ts    # Firebase Admin SDK configuration
│   │   ├── redis.ts             # Upstash Redis configuration
│   │   └── cloudinary.ts        # Cloudinary media upload configuration
│   ├── middleware/
│   │   ├── auth.ts              # Firebase authentication middleware
│   │   ├── rateLimiter.ts       # API rate limiting middleware
│   │   └── errorHandler.ts      # Error handling middleware
│   ├── routes/
│   │   ├── auth.routes.ts       # Authentication endpoints
│   │   ├── challenges.routes.ts # Challenge management endpoints
│   │   ├── submissions.routes.ts # Submission endpoints
│   │   ├── leaderboard.routes.ts # Leaderboard endpoints
│   │   └── users.routes.ts      # User profile endpoints
│   ├── services/
│   │   ├── firebase.service.ts  # Firebase database operations
│   │   ├── cache.service.ts     # Redis caching operations
│   │   ├── cloudinary.service.ts # Image upload operations
│   │   └── gamification.service.ts # Points, badges, and achievements
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   ├── socket.ts                # Socket.io real-time events
│   └── server.ts                # Express app entry point
├── .env                         # Environment variables
├── .gitignore
├── package.json
└── tsconfig.json
```

## 📦 Dependencies Installed

All 442 packages have been successfully installed, including:
- ✅ Express.js 4.18.2
- ✅ TypeScript 5.3.3
- ✅ Firebase Admin SDK 12.0.0
- ✅ Socket.io 4.6.1
- ✅ Upstash Redis 1.28.0
- ✅ Cloudinary 1.41.3
- ✅ And all other dependencies

## ⚙️ Setup Instructions

### 1. Configure Firebase Admin SDK (REQUIRED)

The server needs your actual Firebase private key to run. Here's how to get it:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **hammametup**
3. Click on ⚙️ Project Settings
4. Go to **Service Accounts** tab
5. Click **"Generate new private key"**
6. Download the JSON file
7. Open the JSON file and copy the `private_key` value
8. Open `backend/.env` file
9. Uncomment the `FIREBASE_PRIVATE_KEY` line and replace with your key:

```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_KEY_HERE\n-----END PRIVATE KEY-----"
```

**Important:** Keep the quotes and `\n` characters as-is!

### 2. Configure Cloudinary (REQUIRED for image uploads)

Update `CLOUDINARY_CLOUD_NAME` in `.env`:

```env
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
```

Get your cloud name from [Cloudinary Dashboard](https://cloudinary.com/console)

### 3. Configure Upstash Redis (OPTIONAL - for caching)

For better performance, set up Redis caching:

1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Copy the REST URL and Token
4. Update in `.env`:

```env
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

**Note:** The server will work without Redis, but without caching.

## 🚀 Running the Server

### Development Mode
```bash
cd backend
npm run dev
```

### Production Build
```bash
cd backend
npm run build
npm start
```

## 📡 API Endpoints

Once running on `http://localhost:5000`:

### Health Check
- `GET /health` - Server health status

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Challenges
- `GET /api/challenges` - Get all challenges
- `GET /api/challenges/:id` - Get challenge by ID
- `POST /api/challenges` - Create challenge (admin/business only)
- `PUT /api/challenges/:id` - Update challenge
- `DELETE /api/challenges/:id` - Delete challenge
- `POST /api/challenges/:id/participate` - Participate in challenge

### Submissions
- `POST /api/submissions` - Submit challenge entry
- `GET /api/submissions/challenge/:challengeId` - Get submissions for challenge
- `GET /api/submissions/user/:userId` - Get user's submissions
- `PATCH /api/submissions/:id/status` - Update submission status

### Leaderboard
- `GET /api/leaderboard/global` - Global leaderboard
- `GET /api/leaderboard/challenge/:challengeId` - Challenge leaderboard
- `GET /api/leaderboard/user/:userId/rank` - User rank

### Users
- `GET /api/users/:id` - Get user profile
- `GET /api/users/:id/badges` - Get user badges
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user (admin only)

## 🔌 Socket.io Events

Real-time events on `ws://localhost:5000`:

### Client → Server
- `join:challenge` - Join challenge room
- `leave:challenge` - Leave challenge room
- `join:leaderboard` - Join leaderboard room
- `notification:read` - Mark notification as read

### Server → Client
- `notification:new` - New notification
- `challenge:update` - Challenge updated
- `submission:new` - New submission
- `leaderboard:update` - Leaderboard updated
- `badge:earned` - Badge earned
- `points:awarded` - Points awarded

## 🔒 Environment Variables

```env
# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Firebase (REQUIRED)
FIREBASE_PROJECT_ID=hammametup
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@hammametup.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="YOUR_PRIVATE_KEY_HERE"

# Cloudinary (REQUIRED)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=599166385256219
CLOUDINARY_API_SECRET=qU8QmTBglazuXc1skK4BboasB3w

# Redis (OPTIONAL)
UPSTASH_REDIS_REST_URL=your_url
UPSTASH_REDIS_REST_TOKEN=your_token
```

## 🛠️ Development Scripts

```bash
npm run dev      # Start development server with hot reload
npm run build    # Compile TypeScript to JavaScript
npm start        # Run compiled production code
npm run lint     # Run ESLint
```

## 📝 Next Steps

1. **Add your Firebase private key** to `.env` file (CRITICAL)
2. **Add your Cloudinary cloud name** to `.env` file
3. (Optional) Set up Upstash Redis for caching
4. Run `npm run dev` to start the server
5. Test the `/health` endpoint to verify it's running
6. Connect your frontend to `http://localhost:5000`

## ⚠️ Current Status

- ✅ All files recreated
- ✅ All dependencies installed (442 packages)
- ⚠️ **Waiting for Firebase private key** (server won't fully start without it)
- ⚠️ Cloudinary cloud name needed
- ⚠️ Redis optional (server works without it)

## 🐛 Troubleshooting

### Server won't start
- Make sure you've added your Firebase private key to `.env`
- Check that the private key is properly formatted with `\n` characters
- Verify all required environment variables are set

### Image uploads fail
- Add your Cloudinary cloud name to `.env`
- Verify your Cloudinary API credentials

### Caching doesn't work
- This is expected if you haven't set up Upstash Redis
- The server will log: "⚠️ Redis not configured"
- Server still works, just without caching

## 📚 Additional Resources

- [Firebase Admin SDK Docs](https://firebase.google.com/docs/admin/setup)
- [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [Upstash Redis](https://docs.upstash.com/redis)

---

**Backend recreation complete!** 🎉

Just add your Firebase private key to get started!
