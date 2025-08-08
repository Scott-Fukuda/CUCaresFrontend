// Firebase configuration for Google authentication
// Real Firebase project configuration for CampusCares

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, User as FirebaseAuthUser } from 'firebase/auth';

export interface FirebaseUser {
  email: string;
  displayName: string;
  uid: string;
  getIdToken: () => Promise<string>;
}

// Debug: Check if environment variables are loaded
console.log('Firebase Config Debug:', {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? 'LOADED' : 'MISSING',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? 'LOADED' : 'MISSING',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ? 'LOADED' : 'MISSING'
});

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Configure Google provider
provider.setCustomParameters({
  prompt: 'select_account'
});

// Firebase authentication helper functions
export const initializeFirebase = async () => {
  console.log('Firebase initialized with real authentication');
};

export const signInWithGoogle = async (): Promise<FirebaseUser> => {
  try {
    console.log('Starting Google sign-in...');
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    console.log('Google sign-in successful:', user.email);
    
    // Convert Firebase User to our FirebaseUser interface
    const firebaseUser: FirebaseUser = {
      email: user.email || '',
      displayName: user.displayName || '',
      uid: user.uid,
      getIdToken: () => user.getIdToken()
    };
    
    return firebaseUser;
  } catch (error: any) {
    console.error('Firebase sign-in error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    throw new Error(error.message || 'Google sign-in failed');
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    console.log('User signed out successfully');
  } catch (error: any) {
    console.error('Firebase sign-out error:', error);
    throw new Error(error.message || 'Sign-out failed');
  }
};

// Export auth instance for other uses if needed
export { auth }; 