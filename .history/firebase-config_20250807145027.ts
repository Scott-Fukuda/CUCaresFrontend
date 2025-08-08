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

export const firebaseConfig = {
  apiKey: ,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: 'campuscares-94b93' ,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: '1:640519159185:web:2ad46a1766ca7422aaee30',
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
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
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