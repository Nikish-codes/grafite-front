import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import {
  signOut,
  signInWithGoogle as signInWithGoogleService
} from '../services/authService';
import { auth } from '../services/firebaseConfig';
import { onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { initializeDatabase } from '../services/supabaseService';
import { enhanceUserWithSupabaseId } from '../services/identityService';
import { isMobileDevice } from '../utils/deviceDetection';

// Create the context
const AuthContext = createContext();

// Create a provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Try to get initial user state from localStorage
    const savedUser = localStorage.getItem('auth_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is authenticated on mount and handle auth state changes
  useEffect(() => {
    console.log('Setting up auth state listener...');

    // Check for redirect result first (for mobile authentication)
    const checkRedirectResult = async () => {
      try {
        // This will resolve with the redirect result if coming back from a redirect
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('Detected redirect result, user authenticated via redirect');
          // Initialize database tables when user is authenticated
          await initializeDatabase().catch(err =>
            console.error('Failed to initialize database after redirect:', err)
          );

          // User is already handled by the onAuthStateChanged listener
        }
      } catch (err) {
        console.error('Error processing redirect result:', err);
        setError(err.message);
      }
    };

    // Check for redirect result on mount
    if (isMobileDevice()) {
      checkRedirectResult();
    }

    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser ? 'User logged in' : 'User logged out');
      setLoading(true);
      try {
        if (firebaseUser) {
          // Initialize database tables when user is authenticated
          console.log('Initializing database for authenticated user...');
          await initializeDatabase().catch(err =>
            console.error('Failed to initialize database on auth change:', err)
          );

          // Enhance the Firebase user with Supabase ID
          const enhancedUser = enhanceUserWithSupabaseId(firebaseUser);

          // Save user data to localStorage for persistence
          localStorage.setItem('auth_user', JSON.stringify(enhancedUser));

          // Set user with both Firebase and Supabase info
          setUser(enhancedUser);
        } else {
          // Clear user data from localStorage
          localStorage.removeItem('auth_user');
          setUser(null);
        }
      } catch (err) {
        console.error('Error in auth state change:', err);
        setError(err.message);
        // Clear user data on error
        localStorage.removeItem('auth_user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      console.log('Cleaning up auth state listener...');
      unsubscribe();
    };
  }, []);

  // Handle login with Google
  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);

      // signInWithGoogleService will try redirect first, but may fall back to popup
      // if there are sessionStorage issues
      const result = await signInWithGoogleService();

      // If we get a result, it means we used popup authentication (fallback)
      if (result && result.user) {
        console.log('User authenticated with Google popup in AuthContext');

        // Initialize database on login
        console.log('Initializing database after Google login...');
        await initializeDatabase().catch(err =>
          console.error('Failed to initialize database after Google login:', err)
        );

        // Save to localStorage and state
        localStorage.setItem('auth_user', JSON.stringify(result.user));
        setUser(result.user);

        setLoading(false);
        return result.user;
      }

      // If no result, we're redirecting
      console.log('Redirecting to Google auth...');
      // We don't set loading to false here as we're redirecting away
      return null;
    } catch (err) {
      console.error('Google login error:', err);
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  // Handle user logout
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await signOut();

      // Clear auth user data from localStorage
      localStorage.removeItem('auth_user');

      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Value to be provided by the context
  const value = {
    user,
    loading,
    error,
    loginWithGoogle,
    logout,
    isAuthenticated: !!user,
    getSupabaseUserId: () => user ? user.supabaseUserId : null
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
