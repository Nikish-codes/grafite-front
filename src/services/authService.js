import { auth, googleProvider } from './firebaseConfig';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { getOrCreateSupabaseId } from './identityService';
import { isMobileDevice } from '../utils/deviceDetection';

/**
 * Sign in with Google
 * @returns {Promise<{user: object}>} The authenticated user
 */
export const signInWithGoogle = async () => {
  try {
    // Check if we have a redirect result first
    try {
      const redirectResult = await getRedirectResult(auth);
      if (redirectResult) {
        // User came back from a redirect
        const supabaseUserId = getOrCreateSupabaseId(redirectResult.user.uid);

        // Add Supabase user ID to the user object
        const enhancedUser = {
          ...redirectResult.user,
          supabaseUserId
        };

        console.log('User authenticated with Google redirect and Supabase ID:', supabaseUserId);

        return { user: enhancedUser };
      }
    } catch (redirectError) {
      // Handle the specific sessionStorage error
      if (redirectError.message && redirectError.message.includes('sessionStorage is inaccessible')) {
        console.warn('SessionStorage issue detected, using alternative authentication method');
        // Fall back to popup for this session
        try {
          const result = await signInWithPopup(auth, googleProvider);
          const supabaseUserId = getOrCreateSupabaseId(result.user.uid);
          const enhancedUser = {
            ...result.user,
            supabaseUserId
          };
          return { user: enhancedUser };
        } catch (popupError) {
          console.error('Popup authentication failed:', popupError);
          throw popupError;
        }
      } else {
        // For other redirect errors, log and continue to try redirect again
        console.error('Error checking redirect result:', redirectError);
      }
    }

    // No redirect result or error occurred, initiate sign-in
    // Use redirect for authentication
    console.log('Using redirect for authentication');
    try {
      // Add a timestamp to localStorage to help with redirect tracking
      localStorage.setItem('auth_redirect_started', Date.now().toString());
      await signInWithRedirect(auth, googleProvider);
      // This function will not return immediately as it redirects
      return null;
    } catch (redirectError) {
      console.error('Redirect authentication failed:', redirectError);

      // If redirect fails, try popup as a fallback
      if (redirectError.message && redirectError.message.includes('sessionStorage is inaccessible')) {
        console.warn('Falling back to popup authentication');
        const result = await signInWithPopup(auth, googleProvider);
        const supabaseUserId = getOrCreateSupabaseId(result.user.uid);
        const enhancedUser = {
          ...result.user,
          supabaseUserId
        };
        return { user: enhancedUser };
      }

      throw redirectError;
    }
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  }
};

/**
 * Sign out the current user
 * @returns {Promise<void>}
 */
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

/**
 * Get current user (synchronous)
 * @returns {object|null} The current user or null if not authenticated
 */
export const getCurrentUser = () => {
  const user = auth.currentUser;

  if (!user) return null;

  // Enhance with Supabase user ID
  const supabaseUserId = getOrCreateSupabaseId(user.uid);

  return {
    ...user,
    supabaseUserId
  };
};

/**
 * Get Supabase user ID for a Firebase user ID
 * @param {string} firebaseUid - Firebase user ID
 * @returns {string|null} - Supabase user ID or null if not found
 */
export const getSupabaseUserId = (firebaseUid) => {
  if (!firebaseUid) return null;

  return getOrCreateSupabaseId(firebaseUid);
};
