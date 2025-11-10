# 🚨 IMPORTANT: Create Firebase Project First

## You need to create the Firebase project before deployment!

### Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click **"Add project"** or **"Create a project"**
3. **Project name:** `Hammametup` (or `hammametup`)
4. **Project ID:** Make sure it's `hammametup` (you can customize this during creation)
5. Click **"Continue"**
6. **Google Analytics:** Enable it (optional but recommended)
7. Click **"Create project"**
8. Wait for project creation (~30 seconds)
9. Click **"Continue"**

### Step 2: Enable Required Services

Once project is created:

1. **Enable Authentication:**
   - Go to **Build → Authentication**
   - Click **"Get started"**
   - Enable **Email/Password**
   - Enable **Google** sign-in

2. **Enable Firestore:**
   - Go to **Build → Firestore Database**
   - Click **"Create database"**
   - Mode: **Production mode** (we have rules ready)
   - Location: **europe-west** (closest to Tunisia)
   - Click **"Enable"**

3. **Enable Storage:**
   - Go to **Build → Storage**
   - Click **"Get started"**
   - Mode: **Production mode** (we have rules ready)
   - Click **"Done"**

### Step 3: Get Service Account Key

1. Go to **Project Settings** (⚙️ icon)
2. **Service accounts** tab
3. Click **"Generate new private key"**
4. Download the JSON file
5. Open the file and copy the `private_key` value
6. Add it to `backend/.env` as `FIREBASE_PRIVATE_KEY`

### Step 4: Deploy Rules and Indexes

Once the project is created, run:

```bash
# Make sure you're in the project root
cd c:\Users\ademm\OneDrive\Desktop\Personal Projects\hammametup

# Select the project
firebase use hammametup

# Deploy everything
firebase deploy
```

Or deploy individually:

```bash
# Deploy Firestore rules only
firebase deploy --only firestore:rules

# Deploy Storage rules only  
firebase deploy --only storage

# Deploy Firestore indexes only
firebase deploy --only firestore:indexes
```

### Step 5: Verify Deployment

1. Go to Firebase Console
2. Check **Firestore → Rules** tab (should show our custom rules)
3. Check **Storage → Rules** tab (should show our custom rules)
4. Check **Firestore → Indexes** tab (should show composite indexes)

---

## Alternative: Use Existing Project

If you want to use an existing project instead, update `.firebaserc`:

```json
{
  "projects": {
    "default": "your-existing-project-id"
  }
}
```

Then deploy with:
```bash
firebase use your-existing-project-id
firebase deploy
```

---

## After Project Creation

Come back and run:

1. `firebase use hammametup`
2. `firebase deploy`
3. Update `backend/.env` with your Firebase private key
4. Run `npm run test:config` to verify everything
5. Run `npm run dev` to start the backend server

