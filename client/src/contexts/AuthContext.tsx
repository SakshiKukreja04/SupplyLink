import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  FirebaseUser
} from '@/firebase/firebase';

export type UserRole = 'supplier' | 'vendor';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  phone?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  signup: (email: string, password: string, userData: Omit<User, 'id' | 'email'>) => Promise<void>;
  loginWithGoogle: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateUserData: (userData: User) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Fetch user data from backend API
  const fetchUserData = async (uid: string): Promise<User | null> => {
    try {
      const response = await fetch(`${API_URL}/api/user/profile/${uid}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const userData = await response.json();
      return userData.user; // Extract user from response
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  // Save user data to backend API
  const saveUserData = async (uid: string, userData: Omit<User, 'id'>) => {
    try {
      const response = await fetch(`${API_URL}/api/user/profile/${uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // First, try to get user data from localStorage as fallback
          const cachedUser = localStorage.getItem(`user_${firebaseUser.uid}`);
          let cachedUserData: User | null = null;
          
          if (cachedUser) {
            try {
              cachedUserData = JSON.parse(cachedUser);
              console.log('Found cached user data:', cachedUserData);
            } catch (e) {
              console.error('Error parsing cached user data:', e);
            }
          }

          // Fetch user data from backend API
          const userData = await fetchUserData(firebaseUser.uid);
          
          if (userData) {
            // Cache the user data
            localStorage.setItem(`user_${firebaseUser.uid}`, JSON.stringify(userData));
            setUser(userData);
            console.log('User data loaded from backend:', userData);
          } else if (cachedUserData) {
            // Use cached data if backend fetch fails
            setUser(cachedUserData);
            console.log('Using cached user data:', cachedUserData);
          } else {
            // If no backend data and no cache, create basic user object
            const basicUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: 'vendor', // Default role
              name: firebaseUser.displayName || undefined,
            };
            setUser(basicUser);
            console.log('Created basic user data:', basicUser);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          
          // Try to use cached data as last resort
          const cachedUser = localStorage.getItem(`user_${firebaseUser.uid}`);
          if (cachedUser) {
            try {
              const cachedUserData = JSON.parse(cachedUser);
              setUser(cachedUserData);
              console.log('Using cached user data after error:', cachedUserData);
            } catch (e) {
              console.error('Error parsing cached user data:', e);
              // Create basic user as last resort
              const basicUser: User = {
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                role: 'vendor',
                name: firebaseUser.displayName || undefined,
              };
              setUser(basicUser);
            }
          } else {
            // Create basic user as last resort
            const basicUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: 'vendor',
              name: firebaseUser.displayName || undefined,
            };
            setUser(basicUser);
          }
        }
      } else {
        setUser(null);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string, role: UserRole) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Fetch user data from backend API
      const userData = await fetchUserData(firebaseUser.uid);
      if (userData) {
        // Cache the user data
        localStorage.setItem(`user_${firebaseUser.uid}`, JSON.stringify(userData));
        setUser(userData);
      } else {
        // Create basic user data if not in backend
        const basicUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || email,
          role,
          name: firebaseUser.displayName || undefined,
        };
        // Cache the basic user data
        localStorage.setItem(`user_${firebaseUser.uid}`, JSON.stringify(basicUser));
        setUser(basicUser);
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const signup = async (email: string, password: string, userData: Omit<User, 'id' | 'email'>) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      const newUser: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || email,
        ...userData,
      };
      
      // Save user data to backend API
      console.log('Saving user data to backend:', {
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
        phone: newUser.phone,
        location: newUser.location,
      });
      
      await saveUserData(firebaseUser.uid, {
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
        phone: newUser.phone,
        location: newUser.location,
      });
      
      // Cache the user data
      localStorage.setItem(`user_${firebaseUser.uid}`, JSON.stringify(newUser));
      setUser(newUser);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const loginWithGoogle = async (role: UserRole) => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      // Check if user exists in backend
      const userData = await fetchUserData(firebaseUser.uid);
      if (userData) {
        // Cache the user data
        localStorage.setItem(`user_${firebaseUser.uid}`, JSON.stringify(userData));
        setUser(userData);
      } else {
        // Create new user data for Google sign-in
        const newUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          role,
          name: firebaseUser.displayName || 'User',
        };
        
        // For vendors, we need phone number - skip Google signup for vendors
        if (role === 'vendor') {
          throw new Error('Vendors must use email signup to provide phone number');
        }
        
        // Save user data to backend
        await saveUserData(firebaseUser.uid, {
          email: newUser.email,
          role: newUser.role,
          name: newUser.name,
          phone: newUser.phone || '',
          location: newUser.location,
        });
        
        // Cache the user data
        localStorage.setItem(`user_${firebaseUser.uid}`, JSON.stringify(newUser));
        setUser(newUser);
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const logout = async () => {
    try {
      // Clear cached user data
      if (firebaseUser) {
        localStorage.removeItem(`user_${firebaseUser.uid}`);
      }
      
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const updateUserData = (userData: User) => {
    setUser(userData);
    // Update cached data
    if (firebaseUser) {
      localStorage.setItem(`user_${firebaseUser.uid}`, JSON.stringify(userData));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        login,
        signup,
        loginWithGoogle,
        logout,
        updateUserData,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};