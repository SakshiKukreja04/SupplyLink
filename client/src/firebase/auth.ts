import { 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User,
  UserCredential
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "./config";

export interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'supplier' | 'vendor';
  phone?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  createdAt: Date;
  lastLoginAt: Date;
}

// Google Sign In
export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error) {
    console.error("Google sign in error:", error);
    throw error;
  }
};

// Email/Password Sign Up
export const signUpWithEmail = async (
  email: string, 
  password: string, 
  userData: Partial<UserData>
): Promise<UserCredential> => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user document in Firestore
    const userDoc = {
      uid: result.user.uid,
      email: result.user.email,
      displayName: userData.displayName || result.user.displayName || email.split('@')[0],
      photoURL: result.user.photoURL,
      role: userData.role,
      phone: userData.phone,
      location: userData.location,
      createdAt: new Date(),
      lastLoginAt: new Date()
    };

    await setDoc(doc(db, "users", result.user.uid), userDoc);
    
    return result;
  } catch (error) {
    console.error("Email sign up error:", error);
    throw error;
  }
};

// Email/Password Sign In
export const signInWithEmail = async (email: string, password: string): Promise<UserCredential> => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    
    // Update last login time
    await updateDoc(doc(db, "users", result.user.uid), {
      lastLoginAt: new Date()
    });
    
    return result;
  } catch (error) {
    console.error("Email sign in error:", error);
    throw error;
  }
};

// Sign Out
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
  }
};

// Get User Data from Firestore
export const getUserData = async (uid: string): Promise<UserData | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastLoginAt: data.lastLoginAt?.toDate() || new Date(),
      } as UserData;
    }
    return null;
  } catch (error) {
    console.error("Get user data error:", error);
    return null;
  }
};

// Update User Location
export const updateUserLocation = async (uid: string, latitude: number, longitude: number, address?: string): Promise<void> => {
  try {
    await updateDoc(doc(db, "users", uid), {
      location: {
        latitude,
        longitude,
        address
      }
    });
  } catch (error) {
    console.error("Update user location error:", error);
    throw error;
  }
};

// Auth State Observer
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Handle Google Sign In with role selection
export const handleGoogleSignIn = async (role: 'supplier' | 'vendor'): Promise<UserData> => {
  try {
    const result = await signInWithGoogle();
    const user = result.user;
    
    // Check if user already exists in Firestore
    const existingUser = await getUserData(user.uid);
    
    if (!existingUser) {
      // Create new user document
      const userDoc = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0],
        photoURL: user.photoURL,
        role: role,
        createdAt: new Date(),
        lastLoginAt: new Date()
      };
      
      await setDoc(doc(db, "users", user.uid), userDoc);
      return userDoc as UserData;
    } else {
      // Update last login time
      await updateDoc(doc(db, "users", user.uid), {
        lastLoginAt: new Date()
      });
      
      return existingUser;
    }
  } catch (error) {
    console.error("Google sign in with role error:", error);
    throw error;
  }
};

// Get current location
export const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
}; 