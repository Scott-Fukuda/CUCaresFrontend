# Authentication Setup Guide

## Overview

The application now uses Google authentication with Firebase for secure login. Users can only sign in with their @cornell.edu email addresses.

**Note**: The current implementation includes a simulation mode for development. For production, you'll need to set up real Firebase authentication.

## Current Implementation (Simulation Mode)

The app currently uses a simulated Firebase authentication flow for development purposes:

1. **User clicks "Sign in with Google"** - Simulated Google login popup
2. **App checks email domain** - Only @cornell.edu emails are allowed
3. **Mock token verification** - Simulates backend token verification
4. **User lookup** - Checks if user exists in database
5. **Login or Registration** - If user exists, they're logged in. If not, they're redirected to registration

## Authentication Flow

1. **User clicks "Sign in with Google"** - Firebase shows Google login popup
2. **User enters their NetID@cornell.edu** - Firebase authenticates with Google
3. **App checks email domain** - Only @cornell.edu emails are allowed
4. **Token verification** - Frontend sends Firebase ID token to backend
5. **Backend verification** - Flask verifies token using Firebase Admin SDK
6. **User lookup** - Backend checks if user exists in database
7. **Login or Registration** - If user exists, they're logged in. If not, they're redirected to registration

## Registration Flow

1. **User completes registration form** - Includes first name, last name, email, and phone number
2. **Backend creates user** - User is created with phone number included
3. **User is logged in** - Redirected to profile page

## Development Setup (Current)

The current implementation works without any Firebase setup:

1. Start your backend server
2. Start the frontend with `npm run dev`
3. Click "Sign in with Google" 
4. The app will simulate the authentication flow
5. Use any @cornell.edu email for testing

## Production Setup

### 1. Firebase Configuration

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Google Authentication in Firebase Console
3. Add your web app to the Firebase project
4. Update `firebase-config.ts` with your Firebase configuration:

```typescript
export const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 2. Backend Setup

1. Install Firebase Admin SDK in your Flask backend:
```bash
pip install firebase-admin
```

2. Download your Firebase service account key from Firebase Console
3. Initialize Firebase Admin in your Flask app:

```python
import firebase_admin
from firebase_admin import credentials, auth

# Initialize Firebase Admin
cred = credentials.Certificate('path/to/serviceAccountKey.json')
firebase_admin.initialize_app(cred)

# Create protected endpoint
@app.route('/api/protected', methods=['POST'])
def verify_token():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'No token provided'}), 401
    
    token = auth_header.split('Bearer ')[1]
    
    try:
        # Verify the Firebase token
        decoded_token = auth.verify_id_token(token)
        user_email = decoded_token['email']
        
        # Check if email is @cornell.edu
        if not user_email.endswith('@cornell.edu'):
            return jsonify({'error': 'Only @cornell.edu emails allowed'}), 403
        
        return jsonify({'email': user_email, 'verified': True}), 200
    except Exception as e:
        return jsonify({'error': 'Invalid token'}), 401
```

### 3. Update User Registration Endpoint

Update your user registration endpoint to handle the phone field:

```python
@app.route('/api/users', methods=['POST'])
def register_user():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    phone = data.get('phone')  # New phone field
    
    # Create user with phone number
    new_user = User(
        name=name,
        email=email,
        phone=phone  # Include phone in user creation
    )
    
    # Save to database
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({
        'id': new_user.id,
        'name': new_user.name,
        'email': new_user.email,
        'phone': new_user.phone
    }), 201
```

## Security Features

- **Email Domain Restriction**: Only @cornell.edu emails are allowed
- **Token Verification**: Firebase ID tokens are verified server-side (in production)
- **No Password Storage**: Users authenticate through Google, no passwords stored
- **Phone Number Required**: All new users must provide a phone number

## Testing

To test the authentication flow:

1. Start your backend server
2. Start the frontend with `npm run dev`
3. Click "Sign in with Google"
4. Use a test @cornell.edu email
5. Complete registration if user doesn't exist

## Troubleshooting

- **CORS Issues**: Ensure your backend allows requests from `http://localhost:5173`
- **Token Verification Fails**: Check Firebase Admin SDK configuration (production only)
- **Email Domain Error**: Verify the user is using a @cornell.edu email
- **Registration Fails**: Ensure phone field is included in the request 