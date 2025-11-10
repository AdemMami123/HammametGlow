# Hammamet Tourism Challenge Platform - Copilot Prompts Guide

## Project Overview
**Application:** Hammamet Tourism Challenge Platform
**Purpose:** Gamified civic engagement app for tourism and infrastructure enhancement
**Stack:** Next.js 14, Express.js, Firebase, Redis, Cloudinary, Tailwind CSS v3.3, shadcn/ui, Framer Motion

---

## PHASE 0: PROJECT SETUP & INITIALIZATION

### Prompt 1: Next.js Frontend Project Creation
```
Create a Next.js 14 project with the following setup:
- Use App Router (not Pages Router)
- Include TypeScript with strict mode
- Set up Tailwind CSS v3.3
- Install and configure shadcn/ui
- Install the following packages:
  * react-hook-form
  * zod
  * zustand
  * framer-motion
  * axios
  * next-pwa
  * firebase (latest)
  * socket.io-client
  * react-hot-toast
  * recharts
  * react-leaflet

Create the following folder structure:
- app/
  - (auth)/
  - (dashboard)/
  - api/
  - layout.tsx
- components/
  - ui/
  - challenges/
  - leaderboard/
  - shared/
- lib/
  - firebase.ts
  - redis.ts
  - utils.ts
  - validations/
- hooks/
- store/
- public/

Set up environment variables template (.env.local.example) with all Firebase and API endpoints.
Initialize Git repository and create initial commit.

DO NOT CODE, JUST CHAT WITH ME about this structure first.
```

### Prompt 2: Express Backend Project Creation
```
Create a Node.js Express project structure with TypeScript:

Setup Requirements:
- Node.js 18+
- Express.js latest
- TypeScript configuration
- Environment variables with dotenv
- Port 5000

Install dependencies:
- express
- firebase-admin
- redis (or @upstash/redis)
- socket.io
- axios
- cors
- helmet
- express-rate-limit
- zod
- cloudinary
- multer
- jsonwebtoken

Create folder structure:
- src/
  - config/
    - firebase-admin.ts
    - redis.ts
    - cloudinary.ts
  - middleware/
    - auth.ts
    - rateLimiter.ts
    - errorHandler.ts
  - routes/
    - auth.routes.ts
    - challenges.routes.ts
    - submissions.routes.ts
    - leaderboard.routes.ts
    - users.routes.ts
  - controllers/
  - services/
    - firebase.service.ts
    - cache.service.ts
    - cloudinary.service.ts
    - gamification.service.ts
  - utils/
  - types/
  - socket.ts
  - server.ts

Create .env.example with all required environment variables.
Generate TypeScript tsconfig.json with strict mode enabled.

Wait for my approval before implementing.
```

### Prompt 3: Firebase & External Services Configuration
```
I need you to explain the configuration needed for:

1. Firebase Project Setup:
   - Authentication (Google + Email/Password)
   - Firestore Database
   - Storage Bucket
   - Required collections and security rules

2. Redis Configuration:
   - Connection string (Upstash recommended for serverless)
   - Cache key naming patterns
   - TTL strategies

3. Cloudinary Setup:
   - Account creation
   - Upload presets
   - Transformation configurations
   - Image optimization settings

Before you provide solutions, please outline what I need to do step by step and wait for my approval.
```

---

## SPRINT 1: AUTHENTICATION & USER MANAGEMENT

### Prompt 4: Firebase Client Configuration (Frontend)
```
Create lib/firebase.ts to initialize Firebase client with:

Features:
- Initialize Firebase app with config from environment variables
- Export auth instance (Firebase Authentication)
- Export db instance (Firestore)
- Export storage instance (Firebase Storage)
- Prevent re-initialization on hot reload
- Export Google authentication provider

Include TypeScript interfaces for:
- User profile type
- Authentication state type

Add error handling for initialization failures.

The code should work with Next.js 14 App Router.
```

### Prompt 5: Firebase Admin Configuration (Backend)
```
Create src/config/firebase-admin.ts for Express backend:

Purpose:
- Initialize Firebase Admin SDK with service account credentials
- Export adminAuth for authentication operations
- Export adminDb for Firestore database operations
- Export adminStorage for storage operations
- Prevent re-initialization

Requirements:
- Use environment variables for credentials
- Handle private key newline characters properly
- Include error handling
- Log initialization status

Add TypeScript types for exported services.
```

### Prompt 6: Authentication Middleware (Backend)
```
Create src/middleware/auth.ts middleware for Express:

Functionality:
- Verify Firebase ID tokens from Authorization header
- Check Bearer token format
- Attach user data to request object (uid, email, role)
- Return 401 error for invalid/missing tokens
- Include error logging

Create AuthRequest interface extending Express Request with optional user field.

Handle edge cases:
- Expired tokens
- Invalid signatures
- Missing headers
- Malformed tokens
```

### Prompt 7: User Registration Endpoint
```
Create backend route POST /api/auth/register:

Validation:
- Email format validation with Zod
- Password strength requirements
- Username availability check

Logic:
- Create Firebase Auth user
- Create user document in Firestore with:
  * uid (Firebase UID)
  * email
  * username
  * role (default: 'citizen')
  * points (default: 0)
  * level (default: 1)
  * badges (default: [])
  * createdAt timestamp
  * location
  * profileImage (default: null)
- Cache user data in Redis
- Return user data with success message

Error Handling:
- Email already exists
- Username already exists
- Invalid input
- Firebase errors

Include try-catch and proper error responses.
```

### Prompt 8: User Login Endpoint
```
Create backend route POST /api/auth/login:

Process:
1. Verify Firebase credentials (handled by Firebase client)
2. Generate Firebase ID token (client-side, not backend)
3. Backend receives token and verifies it
4. Retrieve user data from Firestore
5. Cache user session in Redis
6. Return user data with token

Response should include:
- uid
- email
- role
- points
- level
- displayName
- photoURL

Handle errors:
- Invalid credentials
- User not found
- Token verification failed
```

### Prompt 9: User Profile Page (Frontend)
```
Create app/(dashboard)/profile/page.tsx component:

Features:
- Display current user information
- Show user statistics (challenges completed, points, level)
- Display user avatar from Cloudinary
- Edit profile button
- Show badges earned
- Logout button

Use:
- Zustand store for user state
- React Hook Form for profile editing
- shadcn/ui components
- Framer Motion for animations

Include loading states while fetching user data.
Show error toast if profile loading fails.
```

### Prompt 10: Protected Routes Setup (Frontend)
```
Create middleware.ts for Next.js route protection:

Purpose:
- Check if user has valid Firebase token in cookies/localStorage
- Redirect unauthenticated users to /login
- Allow public routes (/, /login, /register)
- Protect dashboard routes (/dashboard/*)

Configuration:
- Match all routes except static files and images
- Check authentication status from Firebase client
- Handle session persistence

Include TypeScript types for middleware request/response.
```

---

## SPRINT 2: CHALLENGE MANAGEMENT

### Prompt 11: Firestore Challenge Collections Schema
```
I'm setting up Firestore collections for challenges. Here's what I need:

Challenges Collection:
- id: string (auto-generated)
- title: string
- description: string
- category: 'cleanliness' | 'infrastructure' | 'culture' | 'hospitality'
- type: 'individual' | 'team'
- creatorUid: string
- status: 'active' | 'completed' | 'archived'
- pointsReward: number
- startDate: Timestamp
- endDate: Timestamp
- location: GeoPoint + locationName
- participants: string[] (UIDs)
- maxParticipants: number
- mediaUrls: string[] (Cloudinary URLs)
- verificationRequired: boolean
- sponsorId: string | null
- createdAt: Timestamp
- updatedAt: Timestamp

Before creating the structure and security rules, explain:
1. How to query challenges by location efficiently
2. How to handle large participant arrays
3. Recommended indexes for filtering and searching

Wait for my approval before proceeding.
```

### Prompt 12: Challenge CRUD API Endpoints (Backend)
```
Create routes/challenges.routes.ts with these endpoints:

POST /api/challenges
- Create new challenge
- Authenticate user (middleware)
- Validate input with Zod schema
- Upload media to Cloudinary if provided
- Store in Firestore
- Cache in Redis
- Return created challenge

GET /api/challenges
- List all active challenges
- Support filters: category, location (radius), status, dateRange
- Implement pagination (limit, offset)
- Cache results in Redis (TTL: 5 minutes)
- Sort by: newest, popular, ending soon

GET /api/challenges/:id
- Get single challenge details
- Include participant list
- Cache in Redis (TTL: 10 minutes)

PUT /api/challenges/:id
- Update challenge (creator only)
- Validate ownership
- Update cache

DELETE /api/challenges/:id
- Delete challenge (creator/admin only)
- Invalidate cache

Include proper error handling and authentication.
```

### Prompt 13: Challenge Creation Form (Frontend)
```
Create components/challenges/ChallengeForm.tsx component:

Multi-step form with:
Step 1: Challenge Details
- Title input (React Hook Form)
- Description textarea
- Category selector (radio buttons)
- Challenge type (individual/team)
- Points reward input
- Duration (start/end dates)

Step 2: Location & Media
- Map component for location selection (react-leaflet)
- Show selected location name
- Image upload with preview (multiple images)
- Upload to Cloudinary on submit

Step 3: Review & Submit
- Show all entered information
- Display uploaded images
- Submit button
- Cancel button

Use:
- React Hook Form + Zod validation
- shadcn/ui components (Input, Button, Select, Textarea)
- Framer Motion for step transitions
- React Hot Toast for notifications
- Loading state during submission

Validation rules:
- Title: required, min 10 chars
- Description: required, min 30 chars
- Points: number > 0
- Dates: start < end, end > now
```

### Prompt 14: Challenges Listing Page (Frontend)
```
Create app/(dashboard)/challenges/page.tsx:

Features:
- Display challenge cards in a grid
- Filter sidebar:
  * Category filter (checkboxes)
  * Status filter (active/completed/archived)
  * Date range picker
  * Sort options (newest, popular, ending soon)
  * Search input

Challenge Card Component:
- Challenge title and description (truncated)
- Challenge image (from mediaUrls)
- Category badge
- Location
- Participant count
- Days remaining
- Points reward
- "View Details" / "Join Challenge" button

Layout:
- Responsive grid (1 col mobile, 2 cols tablet, 3 cols desktop)
- Infinite scroll pagination
- Loading skeleton cards while fetching
- Empty state message

Use:
- Next.js Image component for optimization
- Framer Motion for card animations
- Zustand for filter state
- axios for API calls
- react-hot-toast for notifications
```

### Prompt 15: Challenge Detail Page (Frontend)
```
Create app/(dashboard)/challenges/[id]/page.tsx:

Content Sections:
1. Hero Section:
   - Challenge image carousel (Framer Motion)
   - Challenge title and category badge
   - Creator name and avatar
   - Points reward highlighted

2. Challenge Information:
   - Full description
   - Location on interactive map (react-leaflet)
   - Start and end dates (countdown timer)
   - Challenge type and status

3. Statistics:
   - Total participants count
   - Submissions received
   - Approvals rate

4. Participants:
   - Grid of participant avatars
   - Show first 6, "View all" button

5. Action Section:
   - "Join Challenge" button (if not joined)
   - "View My Submission" button (if submitted)
   - Share button with social media links

Use:
- Next.js Image for image optimization
- Framer Motion for animations
- Leaflet for map
- shadcn/ui components
- Loading state
- Error handling
```

---

## SPRINT 3: SUBMISSION & VERIFICATION

### Prompt 16: Submissions Firestore Collection
```
Design submissions collection in Firestore:

Submissions Document Structure:
- id: string
- challengeId: string (reference)
- userId: string (reference)
- mediaUrls: string[] (Cloudinary URLs)
- description: string
- location: GeoPoint
- timestamp: Timestamp
- status: 'pending' | 'approved' | 'rejected'
- reviewedBy: string | null
- reviewedAt: Timestamp | null
- likes: number
- likedBy: string[] (UIDs)
- comments: array of {
    userId: string
    text: string
    timestamp: Timestamp
  }
- flags: number (for moderation)

Before implementation, explain:
1. How to query submissions by challenge efficiently
2. How to prevent duplicate submissions per user per challenge
3. Indexing strategy for status and timestamp

Wait for approval.
```

### Prompt 17: Submission Creation Endpoint (Backend)
```
Create POST /api/submissions endpoint:

Process:
1. Authenticate user (middleware)
2. Validate challengeId exists and is active
3. Check user hasn't already submitted
4. Upload multiple images to Cloudinary
   - Use multer for file handling
   - Transform images for optimization
5. Extract location from request or use GPS
6. Create submission document in Firestore
7. Increment challenge submission count
8. Award points to user (if auto-approved)
9. Emit Socket.io event for real-time updates
10. Cache invalidation for challenge and user

Validation:
- At least 1 image required
- Max 5 images
- File size limit per image
- Description required (min 20 chars)
- User authentication required

Response:
- Created submission with ID
- Cloudinary URLs of uploaded images
- Status: pending or approved

Handle errors:
- Challenge not found/inactive
- Duplicate submission
- Upload failures
- Invalid user
```

### Prompt 18: Submission Verification Endpoint (Backend)
```
Create PUT /api/submissions/:id/status endpoint:

Features:
- Admin/moderator only (role check)
- Update submission status: pending → approved/rejected
- Add optional rejection reason
- Award/deduct points based on status
- Update user level if applicable
- Emit notification via Socket.io
- Trigger badge check after approval

Request body:
- status: 'approved' | 'rejected'
- reason?: string (for rejection)

Response:
- Updated submission
- New user points
- Message success

Validations:
- Only pending submissions can be reviewed
- Admin/moderator role required
- Submission exists
- Reason provided for rejections

Include logging for audit trail.
```

### Prompt 19: Submission Upload Component (Frontend)
```
Create components/submissions/SubmissionForm.tsx:

Form Steps:

Step 1: Challenge Selection
- Show challenge title
- Show challenge image
- Show point reward
- Show deadline remaining

Step 2: Media Upload
- Camera icon / Upload icon (dual action)
- Drag and drop area
- Image preview grid
- Remove image button
- Progress indicator during upload
- Show file size and count

Step 3: Description
- Textarea for submission description
- Location capture (GPS or manual)
- Show location on small map

Step 4: Review & Submit
- Image carousel review
- Description review
- Confirm submission button
- Loading state during submit

Features:
- Camera integration for mobile (use HTML5 input type="camera")
- Progress bar for uploads
- Real-time file size validation
- Optimistic UI updates
- Error handling with retry option
- Success notification and redirect

Use:
- React Hook Form
- Zod validation
- Framer Motion animations
- shadcn/ui components
- React Hot Toast
```

### Prompt 20: Admin Submission Review Dashboard (Frontend)
```
Create components/admin/SubmissionReview.tsx:

Layout:
- Queue of pending submissions
- Filters: challenge, status, user
- Sorting: newest first, oldest first

Submission Review Card:
1. Submission Images:
   - Image carousel (next/prev buttons)
   - Full-screen lightbox view

2. Details Section:
   - Challenge name (clickable)
   - User name and avatar
   - Submission date and location
   - Description
   - User stats (challenges completed, total points)

3. Action Buttons:
   - Approve button (green)
   - Reject button (red) - opens reason modal
   - Flag for further review button
   - View user profile link

Approve Action:
- Show point reward that will be awarded
- Confirm dialog
- Update UI immediately
- Show next submission

Reject Action:
- Reason dropdown with presets
- Custom reason text area
- Confirm dialog
- Update UI immediately

Use:
- Zustand for queue state
- Framer Motion for animations
- shadcn/ui components
- Loading states
- Real-time updates via Socket.io
```

---

## SPRINT 4: GAMIFICATION ENGINE

### Prompt 21: Points & Levels System (Backend Service)
```
Create services/gamification.service.ts:

Class GamificationService with methods:

1. awardPoints(userId, points, reason)
   - Add points to user
   - Record transaction in Firestore
   - Cache update in Redis
   - Check level up condition
   - Trigger badges check
   - Return new user stats

2. calculateLevelFromPoints(points)
   - Algorithm: each level requires progressively more points
   - Level 1: 0-100 points
   - Level 2: 101-300 points
   - Level 3: 301-700 points
   - Formula: customize based on game balance

3. checkBadgeEligibility(userId)
   - Query all badge criteria
   - Check if user meets conditions
   - Award new badges
   - Emit notification

4. getLeaderboardRanking(userId, type='global')
   - Query Redis sorted set
   - Find user rank
   - Return rank and surrounding users

Point Distribution:
- Challenge completion: 50 points
- Submission approval: 25 points
- Like/engagement: 1 point per 5 likes
- Helpful review: 10 points
- Streak bonus: +5 points per day
- First submission: +10 bonus

Include proper error handling and logging.
```

### Prompt 22: Badges System (Backend Service)
```
Create badges collection and logic in services/gamification.service.ts:

Badge Categories:

1. Completion Badges:
   - First Challenge: 1 challenge completed
   - Challenge Master: 10 completed
   - Challenge Legend: 50 completed
   - Unstoppable: 100 completed

2. Streak Badges:
   - Week Warrior: 7-day active streak
   - Month Achiever: 30-day active streak
   - Year Dedicated: 365-day active streak

3. Category Expertise:
   - Cleanliness Champion: 5 cleanliness challenges
   - Infrastructure Expert: 5 infrastructure challenges
   - Culture Ambassador: 5 culture challenges
   - Hospitality Hero: 5 hospitality challenges

4. Social Badges:
   - First Blood: First submission approved
   - Community Helper: 20 helpful reviews
   - Popular: 100 likes on submissions
   - Influencer: 5 followers

5. Tier Badges (by points):
   - Bronze: 500 points
   - Silver: 2000 points
   - Gold: 5000 points
   - Platinum: 10000 points

Create badge awarding logic with:
- Automatic triggers on events
- Notification system
- Unlock animation data
- Rarity levels (common, rare, epic, legendary)

Include database schema and queries.
```

### Prompt 23: User Dashboard Component (Frontend)
```
Create app/(dashboard)/page.tsx (dashboard landing):

Layout:
1. Header Section:
   - User greeting
   - Current level and XP bar (visual progression to next level)
   - Quick stats: points, rank, challenges completed

2. Statistics Grid:
   - Total points (large number)
   - Current level with next level info
   - Global rank
   - Challenges completed
   - Submissions approved %
   - Days active streak

3. Recent Activity:
   - Last 5 activities (points awarded, badges earned, approvals)
   - Timestamps
   - Icons for each activity type

4. Badges Section:
   - Recently earned badges (grid)
   - "View All Badges" button
   - Locked badges preview (grayed out)

5. Leaderboard Preview:
   - Top 5 users globally
   - User's rank highlighted
   - Quick "View Full Leaderboard" button

Use:
- Recharts for XP bar visualization
- Framer Motion for stat animations
- shadcn/ui cards and components
- Zustand for state management
- Real-time updates via Socket.io for rank changes

Color scheme:
- Level progression: gradient colors
- XP bar: smooth animation on update
```

### Prompt 24: Badges Showcase Component (Frontend)
```
Create components/gamification/BadgesShowcase.tsx:

Display:
- 6x6 grid of badges (36 total on screen)
- Scrollable if more than visible
- Tab navigation: All / Earned / Locked / By Category

Badge Card:
- Large badge icon (animated on hover with Framer Motion)
- Badge name
- Badge description
- For earned: date earned
- For locked: unlock condition (e.g., "50 points needed")
- Rarity indicator (color: bronze/silver/gold/platinum)
- Progress bar for badges with percentage conditions

Interactions:
- Hover: zoom animation + shadow
- Click: show detailed modal
  * Full description
  * How to earn
  * Unlock date (if earned)
  * Rarity stats (how many users have it)

Modal Details:
- Share button (copy to clipboard / social)
- "Work towards this" button (for locked badges)

Use:
- Framer Motion for card animations
- shadcn/ui Dialog for modal
- Grid layout responsive design
- Smooth transitions
```

---

## SPRINT 5: LEADERBOARDS & REAL-TIME FEATURES

### Prompt 25: Redis Leaderboard Implementation (Backend)
```
Create services/cache.service.ts with leaderboard methods:

Class CacheService:

1. updateLeaderboard(userId, points, type='global')
   - Use Redis ZADD to add/update user in sorted set
   - Key format: 'leaderboard:{type}'
   - Score: points (numeric)
   - Member: userId
   - Remove from lower ranks (keep top 1000)

2. getLeaderboard(type, limit=100, offset=0)
   - Query Redis ZRANGE with scores
   - Get rank positions
   - Retrieve user data from cache
   - Return array of {rank, userId, points, userName, avatar}

3. getUserRank(userId, type='global')
   - Query Redis ZREVRANK to find position
   - Return {rank, points, percentile}

4. getLeaderboardAround(userId, radius=5)
   - Get users ranked ±radius around target user
   - Useful for leaderboard detail view

5. invalidateLeaderboard(type)
   - Clear Redis leaderboard cache
   - Used for weekly/monthly resets

6. computeLeaderboardFromScratch(type='global')
   - Query all users from Firestore
   - Sort by points
   - Bulk insert to Redis
   - Set TTL based on type

Leaderboard Types:
- global: all-time, TTL: 1 hour (recompute daily)
- weekly: week-only, TTL: 1 minute (auto-reset Mondays)
- monthly: month-only, TTL: 1 minute (auto-reset 1st)
- category:{cat}: by category, TTL: 2 hours

Redis Key Strategy:
- leaderboard:global → Sorted Set
- leaderboard:weekly → Sorted Set
- leaderboard:monthly → Sorted Set
- leaderboard:category:cleanliness → Sorted Set

Include error handling and fallback queries.
```

### Prompt 26: Socket.io Real-Time Leaderboard Server (Backend)
```
Create src/socket.ts with Socket.io configuration:

Setup:
- Initialize Socket.io server on Express app
- Configure CORS for Next.js frontend
- Set up namespaces for different features

Leaderboard Namespace (/leaderboard):
- on 'subscribe': User subscribes to leaderboard updates
- on 'rank-change': Broadcast rank changes to subscribers
- on 'points-update': Broadcast point updates
- Emit top 100 users every 30 seconds

Events:

1. User joins:
- socket.on('subscribe-leaderboard', (type) => {
    Get current leaderboard
    Emit 'leaderboard-update' with data
  })

2. Points awarded:
- Broadcast 'rank-changed' event to all subscribed clients
- Include user ID, new rank, new points, old rank
- Animate transitions client-side

3. Badge earned:
- Broadcast 'badge-earned' event
- Include user ID, badge name, icon
- Show toast notification

Rooms Strategy:
- Room: 'leaderboard:global'
- Room: 'leaderboard:weekly'
- Room: 'leaderboard:category:{cat}'
- Room: `user:{userId}` for personal notifications

Include error handling and connection limits.
```

### Prompt 27: Leaderboard Page Component (Frontend)
```
Create app/(dashboard)/leaderboard/page.tsx:

Tabs:
1. Global Leaderboard
2. Weekly Leaderboard
3. Monthly Leaderboard
4. Category Leaderboards (Cleanliness, Infrastructure, Culture, Hospitality)

Global/Weekly/Monthly Tab Content:
- Table layout for desktop, card layout for mobile
- Columns: Rank | User Avatar | Username | Points | Change Indicator
- Sort descending by rank
- Highlight current user row
- Show user's percentile (Top X%)

Top 3 Podium View (above table):
- 🥇 1st place (gold)
- 🥈 2nd place (silver)
- 🥉 3rd place (bronze)
- Each with avatar, username, points, badge

User Context Section:
- Current user rank and points
- Difference to next rank (points needed)
- Percentile indicator
- Trend (⬆ rank up, ⬇ rank down, → no change)

Features:
- Real-time rank updates via Socket.io
- Smooth animations for rank changes (Framer Motion)
- Pagination (show 20 per page)
- Search for specific user in leaderboard
- Share your rank button
- Refresh button for manual update
- Responsive design (mobile: simplified view)

Use:
- Framer Motion for rank change animations
- Socket.io client for real-time updates
- Zustand for leaderboard state
- shadcn/ui Table component
- Tailwind CSS for podium styling
```

### Prompt 28: Notification Center Component (Frontend)
```
Create components/notifications/NotificationCenter.tsx:

Notification Types:
1. Challenge Invitation
2. Submission Status (approved/rejected)
3. Badge Earned (with animation)
4. Level Up
5. Rank Change
6. Comment on submission
7. Like on submission
8. New Follower
9. Admin announcement

UI Components:

Notification Bell Icon:
- Badge showing unread count
- Click to open dropdown
- Mark all as read option

Notification Dropdown:
- List of last 10 notifications
- Scrollable area
- Timestamp for each notification
- Icon and message per type
- "View All" link to full notification page

Notification Item:
- Icon (type-specific)
- Title and message
- Time ago (e.g., "2 hours ago")
- Action button if applicable
- Dismiss button

Full Notification Page:
- All notifications with filtering
- Read/Unread status
- Delete notification option
- Organize by date

Features:
- Real-time notifications via Socket.io
- Toast for critical notifications (badges, level up)
- Sound notification option (toggle in settings)
- Notification preferences (which types to show)
- Persist unread status

Use:
- Zustand for notification state
- Socket.io client listener
- React Hot Toast for popups
- Framer Motion for animations
- shadcn/ui Popover/Dropdown
```

---

## SPRINT 6: BUSINESS & SPONSOR FEATURES

### Prompt 29: Business Account Registration (Backend)
```
Create POST /api/business/register endpoint:

Process:
1. Authenticate user
2. Validate business details
3. Create business document in Firestore
4. Create business analytics collection
5. Generate unique business ID
6. Send verification email
7. Return business account data

Request Validation (Zod schema):
- businessName: string, required, min 3 chars
- website: URL format
- description: string, 50-500 chars
- contactEmail: email format
- phone: valid phone number
- address: string
- businessType: enum
- taxId: string (optional)

Business Document Fields:
- id: string (auto)
- ownerUid: string
- businessName: string
- logo: string (Cloudinary URL)
- description: string
- website: string
- contactEmail: string
- phone: string
- address: string
- verified: boolean (default: false)
- sponsoredChallenges: string[] (challenge IDs)
- rewards: array of reward objects
- createdAt: Timestamp
- balance: number (account credits)
- monthlyBudget: number

Create validation workflow:
- Email verification link
- Admin approval process
- Set to verified once complete

Response:
- Business profile object
- Welcome message
- Next steps (setup rewards, sponsor challenge)
```

### Prompt 30: Sponsored Challenge Creation (Backend)
```
Create POST /api/business/:businessId/sponsored-challenges endpoint:

Process:
1. Verify business ownership
2. Check business is verified
3. Validate challenge data
4. Create sponsored challenge document
5. Link to sponsor
6. Deduct cost from business account
7. Set approval pending
8. Return challenge data

Request Body:
- title, description, category, type (same as regular challenges)
- sponsorshipTier: 'bronze' | 'silver' | 'gold'
- visibilityLevel: 'featured' | 'promoted' | 'standard'
- rewards: array of {
    title: string
    description: string
    pointsCost: number
    available: number
  }

Sponsorship Tiers:
- Bronze: $99/month, 1 featured challenge, basic analytics
- Silver: $299/month, 3 featured challenges, advanced analytics
- Gold: $699/month, unlimited challenges, premium analytics

Document Structure:
- All regular challenge fields +
- sponsorId: string
- sponsorshipTier: string
- sponsorLogo: string (from business)
- verifiedSponsor: boolean
- rewards: array
- budget: number
- status: 'pending-approval' | 'active' | 'completed'

Validation:
- Business has sufficient balance
- Tier matches account
- Rewards valid
- Challenge data valid

Response:
- Created challenge object
- Approval timeline
- Analytics setup info
```

### Prompt 31: Business Analytics Dashboard (Backend)
```
Create GET /api/business/:businessId/analytics endpoint:

Time Periods:
- Today
- This Week
- This Month
- This Year
- Custom date range

Analytics Data Returned:

Challenge Metrics:
- Sponsored challenges created
- Total participants
- Participation rate
- Trending challenges
- Most popular category

Reward Metrics:
- Rewards created
- Rewards redeemed
- Top redeeming rewards
- Redemption rate
- Points distributed

Engagement Metrics:
- Average submissions per challenge
- Approval rate
- User engagement score
- Repeat participant rate

ROI Metrics:
- Cost per participant
- Cost per engagement
- Brand mentions/shares
- User reach

User Demographics:
- Top locations of participants
- Age range (if available)
- Skill level distribution
- Repeat vs new users

Response Format (JSON):
{
  "period": "this_month",
  "metrics": {
    "challenges": {...},
    "rewards": {...},
    "engagement": {...},
    "roi": {...},
    "demographics": {...}
  },
  "trends": [...],
  "comparison": {...} (vs previous period)
}

Include caching strategy (Redis TTL: 1 hour).
```

### Prompt 32: Business Dashboard Frontend (Frontend)
```
Create app/(business)/dashboard/page.tsx:

Layout:

Header:
- Business logo and name
- Verification badge
- Tier badge (Bronze/Silver/Gold)
- Account balance
- Upgrade button

Navigation Tabs:
- Overview
- Challenges
- Rewards
- Analytics
- Settings

Overview Tab:
- Key metrics cards (challenges, participants, rewards redeemed)
- Recent activity feed
- Top performing challenges

Challenges Tab:
- List of all sponsored challenges
- Status indicators (pending, active, completed)
- Performance metrics per challenge
- Create new challenge button
- Edit/duplicate/delete options
- Publish to featured button

Rewards Tab:
- All rewards created
- Redemption count
- Create new reward button
- Edit/delete options
- Reorder drag-and-drop

Analytics Tab:
- Date range picker
- Multiple chart visualizations:
  * Participant trend (line chart)
  * Reward redemptions (bar chart)
  * Demographics (pie chart)
  * ROI metrics (cards)
- Export report button (CSV/PDF)
- Comparison with previous period

Settings Tab:
- Edit business profile
- Upload logo
- Payment methods
- Notification preferences
- Team members (future)
- API keys (future)

Use:
- Recharts for visualizations
- Framer Motion for transitions
- shadcn/ui components
- Zustand for state
- Date picker for date ranges
- Export functionality
```

---

## SPRINT 7: PERFORMANCE & PWA

### Prompt 33: Next.js Performance Optimization
```
Optimize Next.js application for production:

Image Optimization:
- Configure next/image for all images
- Set loading="lazy" for below-fold images
- Use placeholder blur images
- Set responsive sizes
- Use WebP format with fallback
- Optimize Cloudinary image URLs with transformations

Bundle Analysis:
- Install @next/bundle-analyzer
- Analyze bundle size
- Identify large packages
- Implement code splitting strategy

Code Splitting:
- Dynamic imports for heavy components
- Suspense boundaries with fallbacks
- Route-based code splitting

Caching Strategy:
- Configure ISR (Incremental Static Regeneration) for challenges list (revalidate: 60)
- Static generation for leaderboard preview (revalidate: 30)
- Dynamic rendering for user-specific pages

Font Optimization:
- Use next/font for Google Fonts
- Preload critical fonts
- Reduce font file size

CSS & JS Minification:
- Tailwind CSS purging configured
- Production build optimization enabled

Monitoring:
- Add Web Vitals monitoring
- Track LCP, FID, CLS
- Set up performance budgets

Before implementing, confirm you understand the strategy.
```

### Prompt 34: Service Worker & PWA Setup
```
Set up Progressive Web App (PWA) for offline functionality:

Install next-pwa package and configure in next.config.js:
- Manifest.json with app metadata
- Service worker caching strategies
- Install prompt handling
- Icon configurations

Caching Strategies:

Network First (API calls):
- Try network first
- Fall back to cache
- Update cache in background
- Routes: /api/*

Cache First (Static assets):
- Use cache first
- Fall back to network
- Routes: /_next/static/*, /public/*

Stale While Revalidate (HTML/Images):
- Serve stale from cache immediately
- Update in background
- Routes: /, /dashboard/*

Offline Handling:
- Offline page for navigation errors
- Show offline indicator UI
- Queue submissions when offline
- Sync when back online

Service Worker Features:
- Background sync for submissions
- Push notifications (optional)
- Periodic sync for updates (optional)

Testing:
- Test offline mode in DevTools
- Verify service worker registration
- Test all caching strategies

Include PWA manifest configuration.
```

### Prompt 35: Redis Caching Strategy for Next.js (Frontend)
```
I need to implement caching in Next.js with Redis integration:

Explain:
1. How to use Redis as cache handler for Next.js ISR
2. Cache key patterns for different data types
3. TTL strategies for each data type:
   - User profiles (15 min)
   - Challenges list (5 min)
   - Single challenge (10 min)
   - Leaderboard (1 min)
   - User stats (5 min)
   - Submissions (10 min)

4. Cache invalidation strategy:
   - When to clear cache
   - How to handle stale data
   - Fallback behavior

5. Handling cache misses and race conditions

Suggest best practices for Upstash Redis (serverless) integration with Next.js.

Wait for my approval before implementing.
```

---

## SPRINT 8: ADMIN PANEL & MODERATION

### Prompt 36: Admin Dashboard Structure (Frontend)
```
Create app/admin/page.tsx and admin dashboard layout:

Navigation (Sidebar):
- Dashboard (overview)
- Users
- Challenges
- Submissions
- Reports
- Moderation Queue
- Analytics
- Settings
- Logout

Dashboard Overview Tab:
Key Metrics Cards:
- Total users
- Active challenges
- Pending submissions
- Flagged content
- System health

Charts:
- User growth (line chart)
- Challenge completion rate (bar chart)
- Submission approval rate (pie chart)
- Hourly active users (area chart)

Recent Activities:
- Last 10 system events
- New users
- New challenges
- New submissions
- Flags/reports

System Status:
- Server status
- Database connection
- Cache (Redis) status
- API health
- Cloudinary status

Users Tab:
- User list (paginated)
- Search and filters:
  * By role (citizen, business, admin, tourist)
  * By registration date
  * By status (active, banned, suspended)
- User details modal:
  * Profile info
  * Statistics
  * Ban/warn/delete options
  * View activity log

Challenges Tab:
- All challenges list
- Filters: status, category, creator, date
- Actions: approve, reject, feature, remove
- Edit/view details modal

Submissions Tab:
- Verification queue (pending submissions)
- Approve/reject actions with reason
- Bulk operations (approve multiple)
- Flagged submissions
- User filter

Reports Tab:
- User reports on content/users
- Report details modal
- Resolution options: dismiss, warn user, remove content, ban user
- Report status tracking

Use:
- shadcn/ui components
- Recharts for analytics
- Zustand for state
- Framer Motion for transitions
- Real-time updates via Socket.io
```

### Prompt 37: User Management Endpoints (Backend)
```
Create backend admin endpoints for user management:

GET /api/admin/users
- List all users with pagination
- Filters: role, status, joinDate range
- Search by email/username
- Return: uid, email, username, role, points, level, status, joinDate

GET /api/admin/users/:uid
- Full user details
- Statistics: challenges created, completed, submissions approved
- Activity log (last 10 actions)
- Account status and warnings
- Referenced collections (challenges, submissions)

PUT /api/admin/users/:uid/role
- Update user role
- Request: new role
- Audit log entry

PUT /api/admin/users/:uid/status
- Ban/unban user
- Suspend user
- Status options: active, suspended, banned
- Request: status, reason, duration
- Notify user via email

DELETE /api/admin/users/:uid
- Soft delete user (keep data)
- Option for hard delete (remove all data)
- Audit log entry
- Cascade behavior for user's content

POST /api/admin/users/:uid/warn
- Issue warning to user
- Send warning email
- Track warnings
- Auto-ban after X warnings

GET /api/admin/users/:uid/activity
- User's activity log
- All actions (logins, challenges, submissions, etc.)
- Timestamps and details

Include proper authorization checks and audit logging.
```

### Prompt 38: Content Moderation Endpoints (Backend)
```
Create backend moderation endpoints:

GET /api/admin/moderation/queue
- All flagged content (submissions, challenges, comments)
- Status: pending, reviewed, resolved
- Filters: type, priority, flaggedDate
- Sorting: newest, by reporter count
- Return: limited details for queue view

GET /api/admin/moderation/flags/:contentId
- Get all flags on specific content
- Reporter details (count, reasons)
- Flag history
- Similar content review

PUT /api/admin/moderation/flags/:flagId/resolve
- Update flag status
- Action taken: dismiss, warn, remove, ban
- Admin notes
- Audit log

DELETE /api/admin/moderation/content/:contentId
- Remove flagged content
- Type: submission, challenge, comment
- Notify creator (if applicable)
- Log action

POST /api/admin/moderation/content/:contentId/warn
- Send warning to creator
- Reason
- Auto-suspend after threshold

GET /api/admin/moderation/reports
- User reports on other users/content
- Status: open, investigating, resolved
- Priority levels
- Bulk actions available

POST /api/admin/moderation/batch
- Bulk approve/reject submissions
- Bulk remove content
- Bulk apply actions to multiple items

Include audit trail for all moderation actions.
```

---

## SPRINT 9-10: TESTING & DEPLOYMENT

### Prompt 39: Unit Tests Setup (Backend)
```
I need unit tests for backend services. Here's what to test:

GamificationService:
- awardPoints function
  * Points added correctly
  * Level up triggered at threshold
  * Cache updated
- calculateLevelFromPoints
  * Correct level for point values
  * Edge cases (0, 100, 5000, etc.)
- checkBadgeEligibility
  * Badge awarded when criteria met
  * No duplicate badges
  * Correct badge assigned

AuthService:
- Firebase token verification
- User creation in Firestore
- Session creation in Redis
- Error handling for invalid credentials

ChallengeService:
- Create challenge with validation
- Update challenge
- Delete challenge
- Query challenges with filters
- Geolocation queries

Test Framework:
- Use Jest
- Mock Firebase Admin SDK
- Mock Redis client
- Test data fixtures
- Achieve 80%+ coverage

Structure:
- tests/unit/services/
- tests/fixtures/
- Mock files for external dependencies

Before implementing, outline the test structure.
```

### Prompt 40: Integration Tests Setup (Frontend)
```
Create E2E tests using Playwright for critical user journeys:

Test Scenarios:

1. Authentication Flow:
   - Register new user
   - Login with credentials
   - Social login (Google)
   - Profile setup

2. Challenge Creation:
   - User creates challenge
   - Fill all form fields
   - Upload images
   - Submit challenge
   - Verify in database

3. Challenge Participation:
   - Browse challenges
   - Filter and search
   - View challenge detail
   - Join challenge
   - Verify participant list updated

4. Submission Flow:
   - User submits challenge completion
   - Upload images
   - Add description
   - Submit
   - Check submission status

5. Admin Verification:
   - Admin reviews submissions
   - Approve submission
   - User receives points
   - Check leaderboard updated

6. Gamification:
   - User earns points
   - Check dashboard points updated
   - Verify level up
   - Check badge earned notification

Configuration:
- Use Playwright fixture setup
- Setup test database (Firebase Emulator)
- Setup test Redis
- Setup test Cloudinary (mock)
- Parallel test execution

Test Data:
- Seed users
- Seed challenges
- Setup test accounts

Reports:
- HTML report generation
- Screenshot on failure
- Video recording of failures

Wait for my approval before starting implementation.
```

### Prompt 41: Deployment Preparation
```
I need deployment configuration for:

Frontend (Next.js on Vercel):
- Vercel project setup
- Environment variables configuration
- Build optimization settings
- Automatic deployments from Git
- Preview deployments for PRs
- Custom domain setup
- SSL certificate

Backend (Express on Railway/Render):
- Railway or Render project setup
- Environment variables
- Build process configuration
- Automatic deployments
- Health check endpoint
- Scaling configuration
- Database backups (Firebase + Redis)

Firebase:
- Production Firebase project
- Firestore indexes optimization
- Security rules finalization
- Backup strategy

Redis (Upstash):
- Production instance
- Backup and recovery
- Monitoring setup

Cloudinary:
- Production account
- Upload presets
- Transformation settings

Monitoring & Logging:
- Error tracking (Sentry)
- Performance monitoring (Vercel Analytics, Datadog)
- Logging service (LogRocket for frontend, backend logs to Cloudinary or AWS)
- Uptime monitoring (StatusPage)

Before proceeding, explain what needs to be done step by step.
```

---

## GENERAL COPILOT TIPS FOR THIS PROJECT

### Prompt Structure Template
```
When asking for code implementations, follow this structure:

1. **CONTEXT**: Brief description of what we're building
   "We're building a gamified civic engagement platform for Hammamet tourism"

2. **SPECIFIC REQUIREMENT**: What exactly you need
   "Create a backend endpoint for challenge creation"

3. **TECHNICAL DETAILS**: Framework, patterns, technologies
   - Framework: Express.js
   - Database: Firebase Firestore
   - Language: TypeScript

4. **ACCEPTANCE CRITERIA**: What success looks like
   - Input validation with Zod
   - Points calculation logic
   - Cache invalidation
   - Error handling

5. **CONSTRAINTS**: Limitations or dependencies
   - Must integrate with Redis
   - Use existing authentication middleware
   - Follow existing error handling pattern

6. **NEXT STEP**: What happens after this task
   "After this, we'll create the frontend component that calls this endpoint"
```

### Iterative Refinement Prompts
```
Use these follow-up prompts to refine code:

- "Make it more performant by implementing caching strategy"
- "Add comprehensive error handling for edge cases"
- "Include TypeScript types and interfaces"
- "Add validation for all inputs using Zod"
- "Break this into smaller, more maintainable functions"
- "Add real-time updates using Socket.io"
- "Ensure this works with our Firebase setup"
- "Optimize this query to reduce database calls"
- "Add unit tests for this function"
- "Make the UI more interactive with Framer Motion animations"
```

### Approval-Before-Implementation
```
For complex features, use this flow:

1. Ask Copilot to explain the approach first:
   "Before you write code, explain step-by-step how you would implement X"

2. Wait for the explanation

3. Ask for approval:
   "Does this approach work for our architecture?"

4. Then request implementation:
   "Now implement this solution following our code style and patterns"

This prevents wasted time on implementations that don't fit your needs.
```

---

## Common Follow-Up Prompts During Development

### Performance Issues
```
"This query is slow. Show me how to optimize it with:
- Proper Firestore indexes
- Redis caching strategy
- Pagination implementation
- Query result limiting"
```

### Real-Time Features
```
"I need this feature to update in real-time across all users:
1. Explain the Socket.io event flow
2. Show the backend event emitter
3. Show the frontend listener and state update
4. Include error handling and reconnection logic"
```

### Gamification Balance
```
"Review the point values and level progression:
- Are they balanced?
- Do they encourage engagement?
- Are there exploitable combinations?
- Suggest adjustments based on typical user behavior"
```

### Bug Fixing
```
"This feature isn't working as expected. Help me debug:
1. Explain what should happen
2. Show me the most likely causes
3. Add logging to track the issue
4. Propose a fix with test cases"
```

---

This prompt guide provides structured instructions for building the entire Hammamet Tourism Challenge Platform. Start with Sprint 0 prompts and progress sequentially, using the iterative refinement approach for best results.
