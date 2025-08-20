import React, { useState } from 'react';
import { auth } from '../firebase-config';
import { genderOptions, academicLevelOptions } from '../types';

interface RegisterProps {
  onRegister: (firstName: string, lastName: string, phone: string, gender: string, graduationYear: string, academicLevel: string) => void;
  onBackToLogin: () => void;
  error: string | null;
  isLoading: boolean;
}

const Register: React.FC<RegisterProps> = ({ onRegister, onBackToLogin, error, isLoading }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [academicLevel, setAcademicLevel] = useState('');

  const firebaseUser = auth.currentUser;
  const userEmail = firebaseUser?.email || '';

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (firstName.trim() && lastName.trim() && phone.trim()) {
      onRegister(firstName.trim(), lastName.trim(), phone.trim());
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg text-center mt-10">
      <h1 className="text-3xl font-bold text-cornell-red mb-2">CU Cares</h1>
      <p className="text-gray-600 mb-6">Complete your registration</p>
      
      <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Create Account</h2>
        
        {/* Display the user's email from Firebase */}
        <div className="bg-gray-50 p-3 rounded-lg border">
          <p className="text-sm text-gray-600">Signing up with:</p>
          <p className="font-semibold text-gray-800">{userEmail}</p>
        </div>
        
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First Name"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cornell-red focus:outline-none transition"
          required
        />
        
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last Name"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cornell-red focus:outline-none transition"
          required
        />
        
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone Number"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cornell-red focus:outline-none transition"
          required
          pattern="[0-9]{10,}"
          title="Please enter a valid phone number (10+ digits)"
        />
        
        {error && <p className="text-red-500 text-sm">{error}</p>}
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-cornell-red text-white font-bold py-3 px-4 rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating Account...' : 'Complete Registration'}
        </button>
        
        <p className="text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <button 
            type="button" 
            onClick={onBackToLogin} 
            className="font-semibold text-cornell-red hover:underline"
          >
            Sign In
          </button>
        </p>
      </form>
    </div>
  );
};

export default Register; 