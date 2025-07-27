// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAuFMRI9npwd13jKE9DdM5UGKlfLkM8U68",
  authDomain: "supplylink-671f6.firebaseapp.com",
  projectId: "supplylink-671f6",
  storageBucket: "supplylink-671f6.firebasestorage.app",
  messagingSenderId: "648389357373",
  appId: "1:648389357373:web:8ae23a4d38ae922097df54",
  measurementId: "G-S2EP0CLTS7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Export the app instance
export default app; 