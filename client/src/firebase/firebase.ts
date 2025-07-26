// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAuFMRI9npwd13jKE9DdM5UGKlfLkM8U68",
  authDomain: "supplylink-671f6.firebaseapp.com",
  projectId: "supplylink-671f6",
  storageBucket: "supplylink-671f6.appspot.com",
  messagingSenderId: "648389357373",
  appId: "1:648389357373:web:8ae23a4d38ae922097df54",
  measurementId: "G-S2EP0CLTS7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { app, analytics, auth, signInWithEmailAndPassword }

// Example for importing in your Login or Signup component
// import { auth } from '@/firebase/firebase';

// Now you can use `auth` with Firebase Auth methods, e.g.:
// import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";