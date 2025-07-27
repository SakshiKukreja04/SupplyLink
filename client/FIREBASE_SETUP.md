# Firebase Authentication Setup Guide

## Prerequisites
- Firebase project already created and configured
- Firebase SDK already installed (`firebase: ^12.0.0`)

## Firebase Console Setup

### 1. Enable Authentication Methods

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`supplylink-671f6`)
3. Navigate to **Authentication** > **Sign-in method**
4. Enable the following providers:

#### Email/Password Authentication
- Click on **Email/Password**
- Enable **Email/Password** provider
- Click **Save**

#### Google Authentication
- Click on **Google**
- Enable **Google** provider
- Add your authorized domain (localhost for development)
- Configure OAuth consent screen if needed
- Click **Save**

### 2. Configure Authorized Domains

1. In **Authentication** > **Settings** > **Authorized domains**
2. Add your domains:
   - `localhost` (for development)
   - Your production domain when deployed

### 3. Environment Variables (Optional)

For better security, you can move Firebase config to environment variables:

1. Create a `.env` file in the `client` directory:
```env
VITE_FIREBASE_API_KEY=AIzaSyAuFMRI9npwd13jKE9DdM5UGKlfLkM8U68
VITE_FIREBASE_AUTH_DOMAIN=supplylink-671f6.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=supplylink-671f6
VITE_FIREBASE_STORAGE_BUCKET=supplylink-671f6.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=648389357373
VITE_FIREBASE_APP_ID=1:648389357373:web:8ae23a4d38ae922097df54
VITE_FIREBASE_MEASUREMENT_ID=G-S2EP0CLTS7
```

2. Update `src/firebase/firebase.ts` to use environment variables:
```typescript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};
```

## Features Implemented

### ✅ Authentication Methods
- Email/Password sign up and login
- Google sign-in with popup
- Automatic auth state management

### ✅ User Management
- User registration with role selection (supplier/vendor)
- User data persistence in localStorage
- Firebase user state synchronization

### ✅ Route Protection
- PrivateRoute component for protected pages
- Role-based access control
- Automatic redirects for unauthenticated users

### ✅ Error Handling
- Comprehensive error messages
- Toast notifications for success/error states
- Graceful error handling for all auth operations

### ✅ UI/UX Features
- Loading states for all auth operations
- Smooth transitions and animations
- Responsive design with Tailwind CSS
- Toast notifications using react-hot-toast

## Testing the Integration

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test Email/Password Registration:**
   - Go to `/signup`
   - Fill in the form with valid email and password
   - Select a role (supplier or vendor)
   - Submit the form

3. **Test Email/Password Login:**
   - Go to `/login`
   - Use the credentials from step 2
   - Verify successful login and redirect

4. **Test Google Sign-In:**
   - Click "Continue with Google" on either login or signup page
   - Complete Google authentication
   - Verify successful login and redirect

5. **Test Route Protection:**
   - Try accessing `/supplier-dashboard` or `/vendor-dashboard` without login
   - Verify redirect to login page
   - After login, verify access to appropriate dashboard

6. **Test Logout:**
   - Click logout button in header
   - Verify successful logout and redirect to home page

## Troubleshooting

### Common Issues

1. **"Firebase: Error (auth/popup-closed-by-user)"**
   - User closed the Google sign-in popup
   - This is normal behavior, just try again

2. **"Firebase: Error (auth/user-not-found)"**
   - User doesn't exist in Firebase
   - Use signup instead of login

3. **"Firebase: Error (auth/wrong-password)"**
   - Incorrect password
   - Check password or use "Forgot Password" (if implemented)

4. **"Firebase: Error (auth/email-already-in-use)"**
   - Email already registered
   - Use login instead of signup

### Development Tips

- Check browser console for detailed error messages
- Verify Firebase configuration in console
- Ensure all authentication methods are enabled in Firebase console
- Test with different browsers and incognito mode

## Next Steps

Consider implementing these additional features:

1. **Password Reset**
   - Add "Forgot Password" functionality
   - Email verification

2. **Email Verification**
   - Require email verification before full access
   - Resend verification email

3. **Profile Management**
   - User profile editing
   - Avatar upload
   - Additional user information

4. **Social Login Providers**
   - Facebook, Twitter, GitHub integration
   - Phone number authentication

5. **Advanced Security**
   - Two-factor authentication
   - Session management
   - Rate limiting 