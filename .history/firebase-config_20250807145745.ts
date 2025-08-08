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

const firebaseConfig = {
  apiKey: "AIzaSyC5UWjB0GTpC8WwvlWYCSRJIvzDUPgJjwc",
  authDomain: "campuscares-94b93.firebaseapp.com",
  projectId: "campuscares-94b93",
  storageBucket: "campuscares-94b93.firebasestorage.app",
  messagingSenderId: "640519159185",
  appId: "1:640519159185:web:2ad46a1766ca7422aaee30",
  measurementId: "G-3KL9VPX0Y4"
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

    console.log('Firebase user:', user);
    
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