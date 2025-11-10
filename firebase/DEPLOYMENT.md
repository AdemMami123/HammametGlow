# Firebase Deployment Guide

## Prerequisites

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

## Deploy Security Rules

### Deploy Everything (Rules + Indexes)
```bash
firebase deploy
```

### Deploy Only Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Deploy Only Storage Rules
```bash
firebase deploy --only storage
```

### Deploy Only Indexes
```bash
firebase deploy --only firestore:indexes
```

## Initialize Firebase in Your Project (If Not Done)

```bash
firebase init
```

Select:
- ☑ Firestore
- ☑ Storage

Choose:
- Use existing project: `hammametup`
- Firestore rules file: `firebase/firestore.rules`
- Firestore indexes file: `firebase/firestore.indexes.json`
- Storage rules file: `firebase/storage.rules`

## Test Rules Locally

```bash
firebase emulators:start
```

This will start local emulators for:
- Firestore (port 8080)
- Storage (port 9199)
- Auth (port 9099)

## Manual Deployment Steps

1. **Ensure you're in the project root:**
```bash
cd c:\Users\ademm\OneDrive\Desktop\Personal Projects\hammametup
```

2. **Deploy all Firebase rules and indexes:**
```bash
firebase deploy
```

3. **Verify deployment:**
   - Go to Firebase Console
   - Check Firestore → Rules tab
   - Check Storage → Rules tab
   - Check Firestore → Indexes tab

## Troubleshooting

### "Project not found"
```bash
firebase use hammametup
```

### "Permission denied"
```bash
firebase login --reauth
```

### Verify current project
```bash
firebase projects:list
firebase use
```

## Security Rules Summary

### Firestore Rules:
- ✅ Users: Read (authenticated), Create (self), Update (self/admin), Delete (admin)
- ✅ Challenges: Read (public), Create (authenticated), Update (creator/admin), Delete (creator/admin)
- ✅ Submissions: Read/Write (authenticated), Update (owner/admin)
- ✅ Badges: Read (authenticated), Write (admin only)
- ✅ Notifications: Read/Write (owner only)
- ✅ Business: Read (public), Write (owner/admin)
- ✅ Reports: Read (admin), Create (authenticated), Update/Delete (admin)

### Storage Rules:
- ✅ Challenge images: Read (public), Write (authenticated, 10MB limit)
- ✅ Submission images: Read (authenticated), Write (authenticated, 10MB limit)
- ✅ Avatars: Read (public), Write (owner only, 10MB limit)
- ✅ Business images: Read (public), Write (authenticated, 10MB limit)

### Indexes Created:
- ✅ Challenges: status + createdAt, category + createdAt, status + category + createdAt
- ✅ Submissions: userId + createdAt, challengeId + createdAt, status + createdAt
- ✅ Badges: userId + createdAt
- ✅ Notifications: userId + read + createdAt, userId + createdAt
- ✅ Users: points DESC, role + createdAt

## Next Steps

After deployment:
1. Test authentication flows
2. Test challenge creation
3. Test submission uploads
4. Verify security rules are working
5. Check indexes are being used in queries
