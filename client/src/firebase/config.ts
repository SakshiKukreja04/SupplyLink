// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAuFMRI9npwd13jKE9DdM5UGKlfLkM8U68",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "supplylink-671f6.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "supplylink-671f6",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "supplylink-671f6.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "648389357373",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:648389357373:web:8ae23a4d38ae922097df54",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-S2EP0CLTS7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize Analytics only in production
let analytics = null;
if (import.meta.env.PROD) {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Analytics initialization failed:', error);
  }
}

// Export the app instance
export default app; 