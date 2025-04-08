/**
 * Identity Service for Grafite
 * 
 * This service handles user identity across Firebase and Supabase
 * ensuring consistent user IDs throughout the application.
 */

import { auth } from './firebaseConfig';
import { v4 as uuidv4 } from 'uuid';

// Key name pattern for storing Supabase IDs in localStorage
const SUPABASE_ID_KEY_PREFIX = 'supabase_uid_';

/**
 * Generate or retrieve the Supabase user ID for a Firebase user
 * @param {string} firebaseUid - Firebase user ID
 * @returns {string} Supabase user ID
 */
export const getOrCreateSupabaseId = (firebaseUid) => {
  if (!firebaseUid) return null;
  
  const storageKey = `${SUPABASE_ID_KEY_PREFIX}${firebaseUid}`;
  
  // Check if we already have a Supabase ID for this Firebase user
  let supabaseId = localStorage.getItem(storageKey);
  
  if (!supabaseId) {
    // Generate a new UUID for this user
    supabaseId = uuidv4();
    
    // Store it for future use
    localStorage.setItem(storageKey, supabaseId);
    
    console.log(`Generated new Supabase ID for Firebase user: ${firebaseUid} -> ${supabaseId}`);
  } else {
    console.log(`Using existing Supabase ID for Firebase user: ${firebaseUid} -> ${supabaseId}`);
  }
  
  return supabaseId;
};

/**
 * Get the Supabase user ID for the currently authenticated Firebase user
 * @returns {string|null} Supabase user ID or null if not authenticated
 */
export const getCurrentSupabaseId = () => {
  try {
    if (!auth.currentUser) return null;
    
    return getOrCreateSupabaseId(auth.currentUser.uid);
  } catch (error) {
    console.error('Error getting current Supabase ID:', error);
    return null;
  }
};

/**
 * Ensure the user object contains a Supabase ID
 * @param {Object} user - Firebase user object
 * @returns {Object} Enhanced user object with supabaseUserId
 */
export const enhanceUserWithSupabaseId = (user) => {
  if (!user) return null;
  
  const supabaseUserId = getOrCreateSupabaseId(user.uid);
  
  return {
    ...user,
    supabaseUserId
  };
};

/**
 * Remove stored Supabase ID for a Firebase user
 * @param {string} firebaseUid - Firebase user ID
 * @returns {boolean} Whether the removal was successful
 */
export const removeSupabaseId = (firebaseUid) => {
  if (!firebaseUid) return false;
  
  const storageKey = `${SUPABASE_ID_KEY_PREFIX}${firebaseUid}`;
  
  try {
    localStorage.removeItem(storageKey);
    return true;
  } catch (error) {
    console.error('Error removing Supabase ID:', error);
    return false;
  }
};

export default {
  getOrCreateSupabaseId,
  getCurrentSupabaseId,
  enhanceUserWithSupabaseId,
  removeSupabaseId
}; 