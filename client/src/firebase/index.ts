// Export Firebase configuration
export { default as app } from './config';
export { auth, db, googleProvider } from './config';

// Export Firebase authentication services
export {
  signInWithGoogle,
  signUpWithEmail,
  signInWithEmail,
  signOutUser,
  getUserData,
  onAuthStateChange,
  handleGoogleSignIn,
  updateUserLocation,
  getCurrentLocation,
  type UserData
} from './auth'; 