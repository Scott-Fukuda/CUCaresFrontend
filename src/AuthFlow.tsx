import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { RedirectState, rememberIntendedPath } from './utils/authRedirect';
import Login from './components/Login';
import Register from './components/Register';
import HomePage from './pages/HomePage';
import { User } from './types';
import AboutUsPage from './pages/AboutUs';
import HomeHeader from './components/HomeHeader';
import ExplorePage from './pages/ExplorePage';
import { Opportunity, MultiOpp, Organization, SignUp } from './types';

interface AuthFlowProps {
  handleGoogleSignIn: () => void;
  isLoading: boolean;
  handleRegister: (firstName: string, lastName: string, phone: string, gender: string, graduationYear: string, academicLevel: string, major: string, birthday: string, car_seats: number, subscribed: boolean, heard_about?: string) => void;
  authError: string | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  opportunities: Opportunity[];
  multiopp: MultiOpp[];
  students: User[];
  organizations: Organization[];
  signups: SignUp[];
  oppsLoading: boolean
}

/**
 * Sends a signed-out deep link to the login page, remembering the destination
 * both in router state and in storage — state alone doesn't survive the visitor
 * switching between the login and sign-up pages.
 */
const DeepLinkSignIn: React.FC<{ redirectState: RedirectState }> = ({ redirectState }) => {
  const from = redirectState.from;

  useEffect(() => {
    if (from) rememberIntendedPath(from.pathname, from.search, from.hash);
  }, [from]);

  return <Navigate to="/login" state={redirectState} replace />;
};

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
  signups,
  oppsLoading
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getRedirectState = (): RedirectState => {
    const existingState = location.state as RedirectState | null;
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
              <AboutUsPage currentUser={null} />
            </div>
          </div>
        } />
        <Route path="/explore" element={
          <div >
            <HomeHeader />
            <div style={{ padding: '100px 50px' }}>
              <ExplorePage
                multiopps={multiopp}
                opportunities={opportunities}
                students={students}
                allOrgs={organizations}
                signups={signups}
                oppsLoading={oppsLoading}
              />
            </div>
          </div>
        } />
        {/*
          * A signed-out visitor following a link to a real page — /opportunity/583
          * from a text message, say — lands here. Send them to sign in and hold on
          * to where they were going, rather than dropping them on the home page.
          */}
        <Route path="*" element={<DeepLinkSignIn redirectState={getRedirectState()} />} />
      </Routes>
    </div>
  );
};

export default AuthFlow;
