/**
 * Firebase authentication service
 */
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendEmailVerification,
  applyActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset
} from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
};

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingFields = requiredFields.filter(field => !firebaseConfig[field]);
  
  if (missingFields.length > 0) {
    console.error('Missing Firebase configuration fields:', missingFields);
    return false;
  }
  return true;
};

// Initialize Firebase
let auth = null;
let googleProvider = null;
let app = null;

const initializeFirebase = () => {
  if (!validateFirebaseConfig()) {
    console.error('Firebase configuration validation failed');
    return false;
  }

  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    return true;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return false;
  }
};

// Initialize Firebase on module load
initializeFirebase();

// Export Firebase instances
export { auth, googleProvider };

/**
 * Register a new user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {string} displayName - User's display name
 * @returns {Promise} - Promise with user credential
 */
export const registerWithEmailAndPassword = async (email, password, displayName) => {
  try {
    if (!auth) {
      throw new Error('Authentication service is not initialized. Please check your configuration.');
    }

    // Validate email format
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Please enter a valid email address.');
    }

    // Validate password strength
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    // Validate display name
    if (!displayName || displayName.trim().length === 0) {
      throw new Error('Display name is required.');
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    try {
      // Update the user's profile with display name
      await updateProfile(userCredential.user, { displayName });
      
      // Send email verification
      await sendEmailVerification(userCredential.user, {
        url: `${window.location.origin}/auth?mode=verify`
      });
    } catch (profileError) {
      // If profile update or email verification fails, delete the user account
      await userCredential.user.delete();
      throw new Error('Failed to complete registration. Please try again.');
    }

    return userCredential;
  } catch (error) {
    console.error('Registration error:', error);
    let errorMessage = 'An error occurred during registration.';

    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'This email is already registered. Please use a different email or try signing in.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Please enter a valid email address.';
        break;
      case 'auth/operation-not-allowed':
        errorMessage = 'Email/password registration is not enabled. Please contact support.';
        break;
      case 'auth/weak-password':
        errorMessage = 'Password must be at least 6 characters long.';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Network error. Please check your internet connection and try again.';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Too many attempts. Please try again later.';
        break;
      default:
        if (error.message) {
          errorMessage = error.message;
        }
    }

    throw new Error(errorMessage);
  }
};

/**
 * Sign in a user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise} - Promise with user credential
 */
export const signInWithEmail = async (email, password) => {
  try {
    if (!auth) {
      throw new Error('Authentication service is not initialized. Please check your configuration.');
    }
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    if (!userCredential.user.emailVerified) {
      await signOut(auth);
      throw new Error('Please verify your email before signing in. Check your inbox for the verification link.');
    }
    return userCredential;
  } catch (error) {
    let errorMessage = 'Invalid login credentials.';
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'Email address not found.';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password.';
    }
    throw new Error(errorMessage);
  }
};

/**
 * Sign in with Google
 * @returns {Promise} - Promise with user credential
 */
export const signInWithGoogle = async () => {
  try {
    if (!auth || !googleProvider) {
      throw new Error('Authentication service is not initialized. Please check your configuration.');
    }
    return await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

/**
 * Sign out the current user
 * @returns {Promise} - Promise that resolves when sign out is complete
 */
export const logOut = async () => {
  try {
    if (!auth) {
      throw new Error('Authentication service is not initialized. Please check your configuration.');
    }
    await signOut(auth);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_current_tab');
    localStorage.removeItem('auth_timestamp');
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

/**
 * Send a password reset email
 * @param {string} email - User's email
 * @returns {Promise} - Promise that resolves when email is sent
 */
export const resetPassword = async (email) => {
  try {
    if (!auth) {
      throw new Error('Authentication service is not initialized. Please check your configuration.');
    }
    await sendPasswordResetEmail(auth, email, {
      url: `${window.location.origin}/auth?mode=reset_password`
    });
  } catch (error) {
    let errorMessage = 'Error sending password reset email.';
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email address.';
    }
    throw new Error(errorMessage);
  }
};

/**
 * Verify email action code
 * @param {string} actionCode - The action code from email link
 * @returns {Promise} - Promise that resolves when email is verified
 */
export const verifyEmail = async (actionCode) => {
  try {
    if (!auth) {
      throw new Error('Authentication service is not initialized. Please check your configuration.');
    }
    await applyActionCode(auth, actionCode);
  } catch (error) {
    let errorMessage = 'Error verifying email.';
    if (error.code === 'auth/invalid-action-code') {
      errorMessage = 'The verification link is invalid or has expired.';
    }
    throw new Error(errorMessage);
  }
};

/**
 * Complete password reset
 * @param {string} actionCode - The action code from email link
 * @param {string} newPassword - The new password
 * @returns {Promise} - Promise that resolves when password is reset
 */
export const completePasswordReset = async (actionCode, newPassword) => {
  try {
    if (!auth) {
      throw new Error('Authentication service is not initialized. Please check your configuration.');
    }
    // Verify the password reset code is valid
    await verifyPasswordResetCode(auth, actionCode);
    // Confirm the password reset
    await confirmPasswordReset(auth, actionCode, newPassword);
  } catch (error) {
    let errorMessage = 'Error resetting password.';
    if (error.code === 'auth/invalid-action-code') {
      errorMessage = 'The password reset link is invalid or has expired.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password must be at least 6 characters long.';
    }
    throw new Error(errorMessage);
  }
};

/**
 * Subscribe to auth state changes
 * @param {Function} callback - Callback function to handle auth state changes
 * @returns {Function} - Unsubscribe function
 */
export const subscribeToAuthChanges = (callback) => {
  if (!auth) {
    console.error('Authentication service is not initialized. Auth state changes will not be monitored.');
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

/**
 * Get the current authenticated user
 * @returns {Object|null} - Current user or null if not authenticated
 */
export const getCurrentUser = () => {
  if (!auth) {
    console.error('Authentication service is not initialized.');
    return null;
  }
  return auth.currentUser;
};

export { onAuthStateChanged };