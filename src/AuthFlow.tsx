import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import PopupMessage from './components/PopupMessage';
import { User } from './types';
import AboutUsPage from './pages/AboutUs';
import PostRegistrationOrgSetup from './components/PostRegistrationOrgSetup';

interface AuthFlowProps {
  handleGoogleSignIn: () => void;
  isLoading: boolean;
  handleRegister: (firstName: string, lastName: string, phone: string, gender: string, graduationYear: string, academicLevel: string, major: string, birthday: string, car_seats: number) => void;
  authError: string | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthFlow: React.FC<AuthFlowProps> = ({
  handleGoogleSignIn,
  handleRegister,
  authError,
  isLoading,
  setCurrentUser
}) => {
  const navigate = useNavigate();

  const handleShowRegister = () => {
    navigate('/register');
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-start justify-center p-4 bg-light-gray">
      <Routes>
        <Route path="/login" element={
          <Login
            onGoogleSignIn={handleGoogleSignIn}
            error={authError}
            isLoading={isLoading}
            setCurrentUser={setCurrentUser}
          />}
        />
        <Route path="/register" element={
          <Register
            onRegister={handleRegister}
            onBackToLogin={handleBackToLogin}
            error={authError}
            isLoading={isLoading}
          />}
        />
        <Route path="/about-us" element={
          <div className="w-full max-w-6xl mx-auto">
            <div className="mb-6">
              <button
                onClick={handleBackToLogin}
                className="bg-cornell-red text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors"
              >
                ← Back to Login
              </button>
            </div>
            <AboutUsPage />
          </div>
        } />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
};

export default AuthFlow;
