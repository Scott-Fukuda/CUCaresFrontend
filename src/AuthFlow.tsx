import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import HomePage from './pages/HomePage';
import { User } from './types';
import AboutUsPage from './pages/AboutUs';
import HomeHeader from './components/HomeHeader';
import OpportunitiesPage from './pages/OpportunitiesPage';
import { Opportunity, MultiOpp, Organization, SignUp } from './types';

interface AuthFlowProps {
  handleGoogleSignIn: () => void;
  isLoading: boolean;
  handleRegister: (firstName: string, lastName: string, phone: string, gender: string, graduationYear: string, academicLevel: string, major: string, birthday: string, car_seats: number) => void;
  authError: string | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  opportunities: Opportunity[];
  multiopp: MultiOpp[];
  students: User[];
  organizations: Organization[];
  signups: SignUp[];
}

const AuthFlow: React.FC<AuthFlowProps> = ({
  handleGoogleSignIn,
  handleRegister,
  authError,
  isLoading,
  setCurrentUser,
  opportunities,
  multiopp,
  students,
  organizations,
  signups
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getRedirectState = () => {
    const existingState = location.state as { from?: { pathname: string; search?: string; hash?: string } } | null;
    if (existingState?.from) {
      return existingState;
    }
    return {
      from: {
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
      },
    };
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <div>
      <Routes>
        <Route path="/" element={
          <div>
            <HomeHeader />
            <div style={{ paddingTop: '60px' }}>
              <HomePage />
            </div>
          </div>
        } />
        <Route path="/login" element={
          <Login
            onGoogleSignIn={handleGoogleSignIn}
            error={authError}
            isLoading={isLoading}
            setCurrentUser={setCurrentUser}
            mode={'login'}
          />}
        />
        <Route path="/sign-up" element={
          <Login
            onGoogleSignIn={handleGoogleSignIn}
            error={authError}
            isLoading={isLoading}
            setCurrentUser={setCurrentUser}
            mode={'sign-up'}
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
          <div >
            <HomeHeader />
            <div style={{ paddingTop: '60px' }}>
              <AboutUsPage />
            </div>
          </div>
        } />
        <Route path="/opportunities" element={
          <div >
            <HomeHeader />
            <div style={{ padding: '100px 50px' }}>
              <OpportunitiesPage
                multiopps={multiopp}
                opportunities={opportunities}
                students={students}
                allOrgs={organizations}
                signups={signups}
                currentUser={null}
              />
            </div>
          </div>
        } />
        <Route path="*" element={<Navigate to="/" state={getRedirectState()} replace />} />
      </Routes>
    </div>
  );
};

export default AuthFlow;
