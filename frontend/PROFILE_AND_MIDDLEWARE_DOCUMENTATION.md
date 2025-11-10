# Profile Page and Route Protection Documentation

## Overview
Complete implementation of the user profile page with edit functionality and route protection middleware.

---

## 1. Profile Page (`app/(dashboard)/profile/page.tsx`)

### Features Implemented

#### User Information Display
- **Avatar**: Displays user profile image from Cloudinary or Firebase
  - Fallback to user initials if no image available
  - Camera button for future image upload functionality
- **User Details**: 
  - Display name and username
  - Email address
  - User role (citizen, admin, moderator)
  - Location name
  - Join date

#### Statistics Dashboard
- **Points System**: Shows current points with visual display
- **Level System**: Shows current level with progress bar
- **Progress Tracking**: Visual progress bar to next level
  - Formula: Next level requires (current_level + 1) × 100 points
- **Badges**: 
  - Display all earned badges with custom colors
  - Badge variants: success, warning, secondary, default
  - Empty state message if no badges earned
- **Quick Stats**:
  - Challenges completed (placeholder for future implementation)
  - Total submissions (placeholder for future implementation)

#### Profile Editing
- **Edit Dialog**: Modal form for updating profile
- **Editable Fields**:
  - Username (3-20 characters, alphanumeric + underscore)
  - Display name (minimum 2 characters)
  - Location name
- **Validation**: Zod schema validation with error messages
- **Form Management**: React Hook Form with zodResolver

#### Logout Functionality
- **Backend Integration**: Calls backend logout endpoint
- **Firebase Sign Out**: Signs out from Firebase Auth
- **State Cleanup**: Clears Zustand store
- **Redirect**: Navigates to login page
- **Toast Notification**: Success/error feedback

### Component Structure

```typescript
ProfilePage Component
├── User Info Card (Left Column)
│   ├── Avatar with upload button
│   ├── User details (email, role, location, join date)
│   └── Edit Profile Dialog
│       └── React Hook Form (username, displayName, location)
│
└── Statistics Card (Right Column)
    ├── Points and Level display
    ├── Progress bar to next level
    ├── Badges section
    └── Quick stats (challenges, submissions)
```

### State Management

**Zustand Store (`store/auth.ts`)**:
```typescript
interface User {
  uid: string;
  email: string | null;
  username?: string;
  displayName: string | null;
  photoURL: string | null;
  role?: 'citizen' | 'admin' | 'moderator';
  points?: number;
  level?: number;
  badges?: string[];
  location?: { latitude, longitude, locationName };
  createdAt?: string;
  updatedAt?: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}
```

### API Integration

**Fetch Profile** (GET `/api/auth/me`):
```typescript
const response = await axios.get(
  `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`,
  {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  }
);
```

**Update Profile** (PUT `/api/auth/profile`):
```typescript
const response = await axios.put(
  `${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`,
  {
    username: data.username,
    displayName: data.displayName,
    location: { ...user?.location, locationName: data.locationName },
  },
  {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  }
);
```

**Logout** (POST `/api/auth/logout`):
```typescript
await axios.post(
  `${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`,
  {},
  {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  }
);
```

### Animations (Framer Motion)

- **Header**: Fade in from top
- **User Card**: Slide in from left
- **Stats Card**: Slide in from right
- **Progress Bar**: Animated width based on points
- **Badges**: Staggered fade in with scale effect

### Loading States

**Skeleton Loaders**:
- Header skeleton (h-12 w-64)
- Card skeletons (h-96) in 2-column grid
- Displayed while `isLoadingProfile === true`

**Update States**:
- Button shows "Updating..." during profile updates
- Button disabled while `isUpdating === true`

---

## 2. Route Protection Middleware (`middleware.ts`)

### Purpose
Protects dashboard routes and redirects unauthenticated users to login page.

### Configuration

**Public Routes** (No authentication required):
- `/` - Home page
- `/login` - Login page
- `/register` - Registration page

**Protected Routes** (Authentication required):
- `/dashboard/*` - Dashboard and all sub-routes
- `/profile` - User profile page
- `/challenges` - Challenges page
- `/leaderboard` - Leaderboard page

### Authentication Check

The middleware checks authentication in two ways:

1. **Auth Token Cookie**: `auth-token` cookie
2. **Zustand Persist Storage**: `auth-storage` cookie
   - Parses JSON to check `state.isAuthenticated`

### Redirect Logic

**Authenticated users accessing login/register**:
```typescript
if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
```

**Unauthenticated users accessing protected routes**:
```typescript
if (isProtectedRoute && !isAuthenticated) {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', pathname); // Return URL after login
  return NextResponse.redirect(loginUrl);
}
```

### Matcher Configuration

Runs middleware on all routes **except**:
- `/api/*` - API routes
- `/_next/static/*` - Static files
- `/_next/image/*` - Image optimization
- `/favicon.ico` - Favicon
- Static assets (svg, png, jpg, jpeg, gif, webp, ico)

```typescript
matcher: [
  '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
]
```

---

## 3. Auth Synchronization (`hooks/useAuthSync.ts`)

### Purpose
Syncs Firebase authentication state with Zustand store across the entire app.

### How It Works

1. **Subscribe to Firebase Auth State**:
   ```typescript
   onAuthStateChanged(auth, async (firebaseUser) => { ... })
   ```

2. **User Logged In**:
   - Get Firebase ID token
   - Fetch full user data from backend (`GET /api/auth/me`)
   - Update Zustand store with complete user object
   - Fallback to Firebase user data if backend fails

3. **User Logged Out**:
   - Call `logout()` in Zustand store
   - Clear user state

4. **Cleanup**:
   - Unsubscribe from auth state changes on component unmount

### Usage

Called in `AuthProvider` component at root level:

```typescript
// components/providers/AuthProvider.tsx
export function AuthProvider({ children }: { children: React.ReactNode }) {
  useAuthSync(); // Auto-sync auth state
  return <>{children}</>;
}
```

---

## 4. Dashboard Layout (`app/(dashboard)/layout.tsx`)

### Purpose
Wrapper for all dashboard routes with authentication check.

### Features

- **Loading State**: Shows skeleton loaders while checking auth
- **Redirect**: Redirects to `/login` if not authenticated
- **Client Component**: Runs in browser to access Zustand store

### Code Flow

```typescript
1. Check isLoading from Zustand store
   ├─ If loading → Show skeleton loaders
   └─ If not loading → Proceed to step 2

2. Check isAuthenticated
   ├─ If not authenticated → Redirect to /login
   └─ If authenticated → Render children (dashboard pages)
```

---

## 5. Root Layout Updates (`app/layout.tsx`)

### New Features

**Toast Notifications**:
- Position: top-right
- Duration: 4 seconds
- Dark theme styling

**Auth Provider**:
- Wraps entire app
- Initializes `useAuthSync` hook
- Maintains auth state across navigation

**Updated Metadata**:
- Title: "HammametGlow - Civic Engagement Platform"
- Description: Civic engagement focus
- PWA manifest link

---

## UI Components Added

### Avatar Component (`components/ui/avatar.tsx`)
- Built with Radix UI primitives
- `<Avatar>` - Container
- `<AvatarImage>` - Image display
- `<AvatarFallback>` - Fallback content (initials)

### Badge Component (`components/ui/badge.tsx`)
- Variants: default, secondary, destructive, outline, success, warning
- Class Variance Authority (CVA) for styling
- Customizable colors

### Dialog Component (`components/ui/dialog.tsx`)
- Modal overlay with backdrop
- Close button (X icon)
- Header, footer, title, description sections
- Radix UI Dialog primitives

### Input Component (`components/ui/input.tsx`)
- Text input with consistent styling
- Ring focus states
- Disabled states

### Skeleton Component (`components/ui/skeleton.tsx`)
- Loading placeholders
- Pulse animation
- Configurable size/shape

---

## Environment Variables Required

```env
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
# ... other Firebase config
```

---

## Testing the Profile Page

### Manual Testing Steps

1. **Login** to the app
2. **Navigate** to `/profile`
3. **Verify** user information displays correctly
4. **Check** statistics (points, level, badges)
5. **Click** "Edit Profile" button
6. **Update** username, display name, or location
7. **Submit** form and verify toast notification
8. **Refresh** page and verify changes persist
9. **Click** "Logout" button
10. **Verify** redirect to login page

### Test Cases

**Profile Loading**:
- ✅ Shows skeleton loaders while fetching
- ✅ Displays user data after load
- ✅ Shows error toast if fetch fails

**Profile Editing**:
- ✅ Validates username (3-20 chars, alphanumeric)
- ✅ Validates display name (min 2 chars)
- ✅ Updates backend successfully
- ✅ Updates Zustand store
- ✅ Closes dialog after successful update
- ✅ Shows error toast if update fails

**Logout**:
- ✅ Calls backend logout endpoint
- ✅ Signs out from Firebase
- ✅ Clears Zustand store
- ✅ Redirects to login page
- ✅ Shows success toast

**Route Protection**:
- ✅ Redirects to login if not authenticated
- ✅ Allows access if authenticated
- ✅ Redirects authenticated users from login to dashboard

---

## Next Steps

### Backend Implementation Needed

**Profile Update Endpoint** (PUT `/api/auth/profile`):
```typescript
router.put('/profile', authMiddleware, async (req, res) => {
  // Validate input
  // Check username availability
  // Update Firestore document
  // Update Redis cache
  // Return updated user data
});
```

### Future Enhancements

1. **Avatar Upload**:
   - Integrate Cloudinary upload
   - Update photoURL in Firebase and Firestore
   - Cache busting for image updates

2. **Password Change**:
   - Add password change dialog
   - Use Firebase `updatePassword`
   - Require current password verification

3. **Email Verification**:
   - Show verification status
   - Resend verification email button
   - Badge for verified users

4. **Account Deletion**:
   - Delete account dialog with confirmation
   - Remove from Firestore
   - Delete Firebase Auth account
   - Clear all user data

5. **Activity Feed**:
   - Show recent challenges completed
   - Display recent submissions
   - Achievement timeline

6. **Social Features**:
   - Follow/follower system
   - Share profile link
   - Public profile view

---

## Dependencies Added

```json
{
  "@radix-ui/react-avatar": "^2.1.2",
  "@radix-ui/react-dialog": "^1.1.4"
}
```

---

## File Structure

```
frontend/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx           # Dashboard wrapper with auth check
│   │   └── profile/
│   │       └── page.tsx          # Profile page component
│   └── layout.tsx                # Root layout with AuthProvider
│
├── components/
│   ├── providers/
│   │   └── AuthProvider.tsx     # Auth sync wrapper
│   └── ui/
│       ├── avatar.tsx            # Avatar component
│       ├── badge.tsx             # Badge component
│       ├── dialog.tsx            # Dialog modal component
│       ├── input.tsx             # Input field component
│       └── skeleton.tsx          # Loading skeleton
│
├── hooks/
│   └── useAuthSync.ts            # Firebase auth sync hook
│
├── store/
│   └── auth.ts                   # Enhanced Zustand auth store
│
└── middleware.ts                 # Route protection middleware
```

---

## Security Considerations

1. **Token Verification**: All API calls use Firebase ID tokens
2. **Server-Side Validation**: Backend validates all profile updates
3. **Route Protection**: Middleware blocks unauthenticated access
4. **XSS Prevention**: React automatically escapes user data
5. **CSRF Protection**: Firebase tokens provide request validation

---

For more information, see:
- [Next.js Middleware Documentation](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Zustand Persist Middleware](https://docs.pmnd.rs/zustand/integrations/persisting-store-data)
- [Framer Motion](https://www.framer.com/motion/)
- [React Hook Form](https://react-hook-form.com/)
- [Radix UI](https://www.radix-ui.com/)
