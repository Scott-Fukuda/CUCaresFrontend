
import React, { useState } from 'react';

interface LoginProps {
  onLogin: (email: string, password: string) => void;
  onRegister: (firstName: string, lastName: string, email: string, password: string) => void;
  error: string | null;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister, error }) => {
  const [isLoginView, setIsLoginView] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && password.trim()) {
      onLogin(email.trim(), password.trim());
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && password.trim() && firstName.trim() && lastName.trim()) {
      onRegister(firstName.trim(), lastName.trim(), email.trim(), password.trim());
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg text-center mt-10">
      <h1 className="text-3xl font-bold text-cornell-red mb-2">Cornell Cares</h1>
      <p className="text-gray-600 mb-6">Your hub for making a difference in Ithaca.</p>
      
      {isLoginView ? (
        <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Sign In</h2>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Cornell Email (@cornell.edu)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cornell-red focus:outline-none transition"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cornell-red focus:outline-none transition"
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-cornell-red text-white font-bold py-3 px-4 rounded-lg hover:bg-red-800 transition-colors"
          >
            Sign In
          </button>
          <p className="text-sm text-gray-500 mt-4">
            Don't have an account?{' '}
            <button type="button" onClick={() => setIsLoginView(false)} className="font-semibold text-cornell-red hover:underline">
              Register now
            </button>
          </p>
        </form>
      ) : (
        <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Create Account</h2>
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
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Cornell Email (@cornell.edu)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cornell-red focus:outline-none transition"
            required
            pattern=".+@cornell\.edu"
            title="Please use a valid @cornell.edu email address."
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cornell-red focus:outline-none transition"
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-cornell-red text-white font-bold py-3 px-4 rounded-lg hover:bg-red-800 transition-colors"
          >
            Register
          </button>
          <p className="text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <button type="button" onClick={() => setIsLoginView(true)} className="font-semibold text-cornell-red hover:underline">
              Sign In
            </button>
          </p>
        </form>
      )}
    </div>
  );
};

export default Login;
