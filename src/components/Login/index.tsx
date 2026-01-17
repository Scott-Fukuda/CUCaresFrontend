import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginTest } from '../../api';
import { User } from '../../types';
import './index.scss';
import AOS from 'aos';
import 'aos/dist/aos.css';

interface LoginProps {
  onGoogleSignIn: () => void;
  error: string | null;
  isLoading: boolean;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  mode: string
}

const Login: React.FC<LoginProps> = ({ onGoogleSignIn, error, isLoading, setCurrentUser, mode }) => {
  const navigate = useNavigate();
  const env = import.meta.env.VITE_ENV;

  useEffect(() => {
    AOS.init({ duration: 500 });
  }, [])

  useEffect(() => {
    AOS.refresh();
  }, [mode]);

  const handleLoginTest = async (id: number) => {
    try {
      const res = await loginTest(id);

      const data: User = await res.json();
      console.log("Current test user:", data);
      setCurrentUser(data);

      navigate("/");
    } catch (err) {
      console.log('error', err)
    }
  }

  const ver = mode == 'login' ? 'in' : 'up';

  return (
    <div className="login" key={mode}>
      <div className="login-container" data-aos="fade-down">
        <img
          src="/logo.png"
          alt="CampusCares Logo"
          className="login-logo"
        />
        <h1 className="login-title">CampusCares</h1>
        <p className="login-subtitle">Your hub for making a difference in Ithaca.</p>

        <div className="login-content">
          <h2 className="login-welcome">{mode == 'login' ? 'Welcome Back!' : 'Welcome!'}</h2>

          {error && (
            <div className="login-error">
              <p>{error}</p>
            </div>
          )}

          <button
            onClick={onGoogleSignIn}
            disabled={isLoading}
            className="login-button login-button--google"
          >
            {isLoading ? (
              <>
                <div className="login-spinner"></div>
                Signing {ver}...
              </>
            ) : (
              <>
                Sign {ver} with Cornell/IC email
              </>
            )}
          </button>

          {mode == 'login' ? (
            <div className="subq">
              <p>Don't have an account?</p>
              <Link to="/sign-up" className="login-link">
                Sign up
              </Link>
            </div>
          ) : (
            <div className="subq">
              <p>Already have an account?</p>
              <Link to="/login" className="login-link">
                Log in
              </Link>
            </div>
          )
          }

          {env == 'staging' &&
            <div className="login-test-buttons">
              {Array.from({ length: 8 }).map((_, i) =>
                <button
                  key={i + 1}
                  className="login-button login-button--test"
                  onClick={() => handleLoginTest(i + 1)}
                >
                  Sign in with test user {i + 1}
                </button>
              )}
            </div>
          }

          <div className="bottom-info">
            <p className="login-contact">
              Not a student? Reach out to{' '}
              <a href="mailto:team@campuscares.us">
                team@campuscares.us
              </a>
              .
            </p>

            <p className="login-terms">
              By signing {ver}, you agree to our{' '}
              <a
                href="/terms_of_service.pdf"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms of Service and Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
