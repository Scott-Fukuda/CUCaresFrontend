// Firebase configuration for Google authentication
// Real Firebase project configuration for CampusCares

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, User as FirebaseAuthUser, onAuthStateChanged as fbOnAuthStateChanged, setPersistence, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence } from 'firebase/auth';

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
  // Try to use localStorage for persistence so auth state survives reloads/tabs.
  // Fall back to sessionStorage, then to in-memory if storage is unavailable.
  try {
    await setPersistence(auth, browserLocalPersistence);
    //console.log('Firebase auth persistence set to browserLocalPersistence (localStorage)');
    return;
  } catch (localErr) {
    console.warn('browserLocalPersistence failed, trying browserSessionPersistence', localErr);
    try {
      await setPersistence(auth, browserSessionPersistence);
      //console.log('Firebase auth persistence set to browserSessionPersistence (sessionStorage)');
      return;
    } catch (sessionErr) {
      console.warn('browserSessionPersistence failed, falling back to inMemoryPersistence', sessionErr);
      try {
        await setPersistence(auth, inMemoryPersistence);
        //console.log('Firebase auth persistence set to inMemoryPersistence (no persistence)');
        return;
      } catch (memoryErr) {
        console.error('Failed to set any Firebase auth persistence', memoryErr);
        // Let caller know something went wrong by rethrowing the last error
        throw memoryErr;
      }
    }
  }
};

// Convert Firebase User to our FirebaseUser interface (handles null safety)
const mapFirebaseUser = (user: FirebaseAuthUser | null): FirebaseUser | null => {
  if (!user) return null;
  return {
    email: user.email || '',
    displayName: user.displayName || '',
    uid: user.uid,
    getIdToken: () => user.getIdToken()
  };
};

/**
 * Subscribe to Firebase auth state changes. Returns the unsubscribe function.
 * Callback receives our `FirebaseUser | null` type.
 */
export const onAuthStateChanged = (cb: (user: FirebaseUser | null) => void) => {
  return fbOnAuthStateChanged(auth, (user) => {
    cb(mapFirebaseUser(user));
  });
};

/**
 * Returns a promise that resolves with the current user (or null) once
 * Firebase has finished initializing the auth state. Useful for one-off checks.
 */
export const getCurrentUser = (): Promise<FirebaseUser | null> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = fbOnAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(mapFirebaseUser(user));
      },
      (err) => {
        unsubscribe();
        reject(err);
      }
    );
  });
};

export const signInWithGoogle = async (): Promise<FirebaseUser> => {
  try {
    //console.log('Signing in with Google');
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
    // Handle missing sessionStorage / initial state case
    if (
      error.message?.includes("Unable to process request due to missing initial state") ||
      error.code === "auth/argument-error" || // sometimes Firebase throws this instead
      error.code === "auth/no-auth-event"
    ) {
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      throw new Error("There was an error with your browser's session storage, please try logging in again.");
    } else if (error.code === "auth/popup-closed-by-user") {
      throw new Error("You closed the login popup. Please try logging in again.");
    } else if (
      // Common Firebase/browser popup error codes/messages
      error.code === 'auth/popup-blocked' ||
      error.code === 'auth/popup-blocked-by-browser' ||
      error.code === 'auth/popup-blocked-by-user' ||
      (typeof error.message === 'string' && /popup(\s|-)?blocked/i.test(error.message)) ||
      (typeof error.message === 'string' && /blocked a popup/i.test(error.message))
    ) {
      console.error('Popup blocked during sign-in:', error);
      throw new Error(
        "The sign-in popup was blocked by your browser. Please try again. " +
        "If pop-ups continue to be blocked, allow pop-ups for this site in your browser settings, or try signing in using a different browser."
      );
    }
    console.error("Firebase sign-in error:", error);
    throw new Error("Sign-in failed. Please try again.");
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    //console.log('User signed out successfully');
  } catch (error: any) {
    console.error('Firebase sign-out error:', error);
    throw new Error(error.message || 'Sign-out failed');
  }
};

// Export auth instance for other uses if needed
export { auth }; 