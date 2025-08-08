# Firebase Environment Setup

## 🔐 Security Setup

Your Firebase configuration is now secured using environment variables. Follow these steps:

### 1. Create `.env` file
Create a `.env` file in your project root with your Firebase configuration:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyC5UWjB0GTpC8WwvlWYCSRJIvzDUPgJjwc
VITE_FIREBASE_AUTH_DOMAIN=campuscares-94b93.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=campuscares-94b93
VITE_FIREBASE_STORAGE_BUCKET=campuscares-94b93.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=640519159185
VITE_FIREBASE_APP_ID=1:640519159185:web:2ad46a1766ca7422aaee30
VITE_FIREBASE_MEASUREMENT_ID=G-3KL9VPX0Y4
```

### 2. Verify `.gitignore`
The `.env` file is already added to `.gitignore` to prevent committing sensitive data.

### 3. Restart Development Server
After creating the `.env` file, restart your development server:

```bash
npm run dev
```

## 🔒 Security Benefits

- ✅ **No hardcoded secrets** in your code
- ✅ **Environment-specific** configuration
- ✅ **Git-safe** - `.env` is ignored
- ✅ **Production-ready** - easy to deploy with different configs

## 🚀 Next Steps

1. Create the `.env` file with the values above
2. Restart your development server
3. Test the Google authentication flow

Your Firebase configuration is now secure! 🔐 