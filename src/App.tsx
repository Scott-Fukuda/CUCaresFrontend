import React, { useState } from 'react';
import AppContent from './AppContent';
import { BrowserRouter as Router } from 'react-router-dom';
import { signInWithGoogle, FirebaseUser, auth, onAuthStateChanged, signOut, getCurrentUser } from './firebase-config';
import * as api from './api';
import { User } from './types';

const App: React.FC = () => {
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<'login' | 'register' | 'aboutUs'>('login');

  const handleRegister = async (firstName: string, lastName: string, phone: string, gender: string, graduationYear: string, academicLevel: string, major: string, birthday: string, car_seats: number) => {
    setAuthError(null);
    
    // Ensure we have a Firebase user (wait for auth init if necessary) and get an ID token
    try {
      setIsLoading(true);
      const firebaseUser = await getCurrentUser();
      if (!firebaseUser || !firebaseUser.email) {
        setAuthError('No authenticated Firebase user found. Please sign in with Google first.');
        return;
      }
      const token = await firebaseUser.getIdToken(); // token exists even if backend user doesn't

      const email = firebaseUser.email;
      const newUser: User = {
        id: 0,
        name: `${firstName} ${lastName}`,
        email,
        phone,
        interests: [],
        points: 0,
        friendIds: [],
        organizationIds: [],
        profile_image: '',
        admin: false,
        gender: gender || undefined,
        graduationYear,
        academicLevel,
        major,
        birthday,
        car_seats,
        registration_date: api.formatRegistrationDate(),
      };

      // Pass token explicitly so backend can verify and create the app user
      const responseUser = await api.registerUser(newUser, token);
      setCurrentUser(responseUser);
      setAuthView('login'); // or whatever post-register behavior you want
    } catch (e: any) {
      setAuthError(e.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Router>
      <AppContent/>
    </Router>
  )
};


export default App;


