import React, { useState } from 'react';
import { auth } from '../firebase-config';
import { genderOptions, academicLevelOptions } from '../types';

interface RegisterProps {
  onRegister: (
    firstName: string,
    lastName: string,
    phone: string,
    gender: string,
    graduationYear: string,
    academicLevel: string,
    major: string,
    birthday: string,
    car_seats: number
  ) => void;
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
  const [major, setMajor] = useState('');
  const [birthday, setBirthday] = useState('');
  const [hasCar, setHasCar] = useState<string>('');
  const [carSeats, setCarSeats] = useState<number>(0);

  const firebaseUser = auth.currentUser;
  const userEmail = firebaseUser?.email || '';

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      return; // Form validation will show required messages
    }

    // Validate car ownership question
    if (hasCar === '') {
      return; // User must answer the car question
    }

    // Set car_seats based on user's answer
    const finalCarSeats = hasCar === 'yes' ? carSeats : 0;

    onRegister(
      firstName.trim(),
      lastName.trim(),
      phone.trim(),
      gender,
      graduationYear.trim(),
      academicLevel.trim(),
      major.trim(),
      birthday.trim(),
      finalCarSeats
    );
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg text-center mt-10">
      <h1 className="text-3xl font-bold text-cornell-red mb-2">CampusCares</h1>
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
          placeholder="First Name *"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cornell-red focus:outline-none transition"
          required
        />

        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last Name *"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cornell-red focus:outline-none transition"
          required
        />

        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone Number *"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cornell-red focus:outline-none transition"
          required
          pattern="[0-9]{10,}"
          title="Please enter a valid phone number (10+ digits)"
        />

        {/* <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cornell-red focus:outline-none transition"
        >
          <option value="">Select Gender (Optional)</option>
          {genderOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={graduationYear}
          onChange={(e) => setGraduationYear(e.target.value)}
          placeholder="Graduation Year (e.g., 2025)"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cornell-red focus:outline-none transition"
          pattern="[0-9]{4}"
          title="Please enter a 4-digit year"
        />

        <select
          value={academicLevel}
          onChange={(e) => setAcademicLevel(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cornell-red focus:outline-none transition"
        >
          <option value="">Select Academic Level</option>
          {academicLevelOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={major}
          onChange={(e) => setMajor(e.target.value)}
          placeholder="Major/Field of Study (Optional)"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cornell-red focus:outline-none transition"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
            Birth Date *
          </label>
          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cornell-red focus:outline-none transition"
            required
            title="Please enter your birth date"
          />
        </div> */}

        {/* Car Ownership Question */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
            Do you have a car on campus? *
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="hasCar"
                value="yes"
                checked={hasCar === 'yes'}
                onChange={(e) => setHasCar(e.target.value)}
                className="mr-2 text-cornell-red focus:ring-cornell-red"
                required
              />
              Yes
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="hasCar"
                value="no"
                checked={hasCar === 'no'}
                onChange={(e) => setHasCar(e.target.value)}
                className="mr-2 text-cornell-red focus:ring-cornell-red"
                required
              />
              No
            </label>
          </div>
        </div>

        {/* Car Seats Input - Only show if user has a car */}
        {hasCar === 'yes' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
              How many seats do you have? *
            </label>
            <input
              type="text"
              value={carSeats === 0 ? '' : carSeats}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  setCarSeats(0);
                } else {
                  const numValue = parseInt(value);
                  if (!isNaN(numValue) && numValue >= 1 && numValue <= 15) {
                    setCarSeats(numValue);
                  }
                }
              }}
              onBlur={(e) => {
                const value = parseInt(e.target.value);
                if (isNaN(value) || value < 1) {
                  setCarSeats(1);
                } else if (value > 15) {
                  setCarSeats(15);
                }
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cornell-red focus:outline-none transition"
              required
              placeholder="Enter number of seats"
            />
            <p className="text-xs text-gray-500 mt-1 text-left">Minimum: 1, Maximum: 15</p>
          </div>
        )}

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
