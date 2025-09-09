
import React, { useState } from 'react';

interface LoginProps {
  onGoogleSignIn: () => void;
  error: string | null;
  isLoading: boolean;
}

const Login: React.FC<LoginProps> = ({ onGoogleSignIn, error, isLoading }) => {
  return (
    <div className="w-full max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg text-center mt-10">
      <img 
        src="/logo.png" 
        alt="CampusCares Logo" 
        className="mx-auto mb-4 h-16 w-16 object-contain"
      />
      <h1 className="text-3xl font-bold text-cornell-red mb-2">CampusCares</h1>
      <p className="text-gray-600 mb-6">Your hub for making a difference in Ithaca.</p>
      
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Welcome Back</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        
                <button
          onClick={onGoogleSignIn}
          disabled={isLoading}
          className="w-full bg-white border-2 border-gray-300 text-cornell-red font-semibold py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cornell-red"></div>
              Signing in...
            </>
          ) : (
            <>
             
              Sign in with Cornell email
            </>
          )}
        </button>
        
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>
        
        <button
          onClick={onGoogleSignIn}
          disabled={isLoading}
          className="w-full bg-cornell-red text-white font-bold py-3 px-4 rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create New Account
        </button>
        

        
        <p className="text-xs text-gray-500 mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
        
        <p className="text-sm text-gray-600 mt-4">
          Not a student? Reach out to <a href="mailto:team@campuscares.us" className="text-cornell-red hover:underline">team@campuscares.us</a>.
        </p>
      </div>
    </div>
  );
};

export default Login;
