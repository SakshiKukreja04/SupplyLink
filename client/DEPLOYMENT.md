# SupplyLink Frontend Deployment Guide

## Deploying to Vercel

### Prerequisites
1. Vercel account (free at vercel.com)
2. Your backend API URL
3. Firebase project configured

### Step 1: Prepare Environment Variables

Create a `.env.local` file in the `client` directory with your production values:

```env
# Firebase Configuration (use your actual Firebase project values)
VITE_FIREBASE_API_KEY=AIzaSyAuFMRI9npwd13jKE9DdM5UGKlfLkM8U68
VITE_FIREBASE_AUTH_DOMAIN=supplylink-671f6.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=supplylink-671f6
VITE_FIREBASE_STORAGE_BUCKET=supplylink-671f6.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=648389357373
VITE_FIREBASE_APP_ID=1:648389357373:web:8ae23a4d38ae922097df54
VITE_FIREBASE_MEASUREMENT_ID=G-S2EP0CLTS7

# Your Backend API URL (replace with your actual deployed backend URL)
VITE_API_URL=https://your-backend-url.com
```

### Step 2: Deploy to Vercel

#### Option A: Using Vercel CLI
1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy from the client directory:
   ```bash
   cd client
   vercel
   ```

4. Follow the prompts:
   - Set up and deploy: `Y`
   - Which scope: Select your account
   - Link to existing project: `N`
   - Project name: `supplylink-frontend` (or your preferred name)
   - Directory: `./` (current directory)
   - Override settings: `N`

#### Option B: Using Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Set the root directory to `client`
5. Configure environment variables in the Vercel dashboard

### Step 3: Configure Environment Variables in Vercel

1. Go to your project dashboard in Vercel
2. Navigate to Settings > Environment Variables
3. Add all the environment variables from your `.env.local` file
4. Make sure to set them for "Production" environment

### Step 4: Configure Build Settings

Vercel should automatically detect this is a Vite project, but verify these settings:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 5: Deploy Firestore Rules

Make sure your Firestore rules are deployed to Firebase:

```bash
firebase deploy --only firestore:rules
```

### Step 6: Test Your Deployment

1. Visit your Vercel deployment URL
2. Test authentication (Google and Email/Password)
3. Test location access
4. Verify all features work correctly

## Troubleshooting

### Firestore 400 Error
If you're getting Firestore 400 errors:
1. Make sure Firestore is enabled in your Firebase project
2. Verify your Firestore rules are deployed
3. Check that your Firebase config is correct
4. Ensure your domain is added to Firebase Auth authorized domains

### CORS Issues
If you encounter CORS issues with your backend:
1. Add your Vercel domain to your backend's CORS configuration
2. Update the `VITE_API_URL` to point to your deployed backend

### Build Errors
If the build fails:
1. Check that all dependencies are in `package.json`
2. Verify TypeScript compilation
3. Check for any missing environment variables

## Post-Deployment Checklist

- [ ] Authentication works (Google and Email/Password)
- [ ] Location access works
- [ ] Role selection works
- [ ] Protected routes work
- [ ] All animations and UI elements display correctly
- [ ] API calls to backend work
- [ ] Error handling works properly

## Custom Domain (Optional)

1. Go to your Vercel project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Update your Firebase Auth authorized domains
5. Update your backend CORS configuration if needed 