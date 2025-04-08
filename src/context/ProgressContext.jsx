import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { 
  recordProgress, 
  getUserProgress, 
  getUserProgressSummary, 
  getUserRecentActivity 
} from '../services/supabaseClient';

const ProgressContext = createContext();

export const useProgress = () => useContext(ProgressContext);

export const ProgressProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [progressData, setProgressData] = useState({});
  const [progressSummary, setProgressSummary] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Cache for progress data to prevent excessive API calls
  const progressCache = useRef({});
  // Timestamp for cache expiration (15 minutes - increased from 5 minutes)
  const cacheExpiration = 15 * 60 * 1000;
  // Flag to track if initial data has been loaded
  const initialDataLoaded = useRef(false);
  
  // Clear cache when user changes
  useEffect(() => {
    progressCache.current = {};
    initialDataLoaded.current = false;
  }, [user?.id]);
  
  // Load progress data on mount and auth state changes
  useEffect(() => {
    loadProgressData();
  }, [user?.id, isAuthenticated]);
  
  // Load progress data from Supabase
  const loadProgressData = async () => {
    if (!isAuthenticated || !user) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Get the Supabase user ID
      const supabaseUserId = user.supabaseUserId || 
        localStorage.getItem(`supabase_uid_${user.uid}`);
      
      if (!supabaseUserId) {
        console.error('No Supabase user ID found for current user in loadProgressData');
        setError('User ID not found. Please log out and log in again.');
        return;
      }
      
      console.log('Loading progress data with Supabase ID:', supabaseUserId);
      
      // Get progress summary
      const summary = await getUserProgressSummary(supabaseUserId);
      setProgressSummary(summary);
      
      // Get recent activity
      const recent = await getUserRecentActivity(supabaseUserId, 10);
      setRecentActivity(recent);
      
      // Clear any existing errors
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error loading progress data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Record user progress for a question
  const recordUserProgress = async (progressData) => {
    if (!isAuthenticated || !user) {
      console.warn('Cannot record progress: User not authenticated');
      return null;
    }

    try {
      setLoading(true);
      
      // Get the Supabase user ID
      const supabaseUserId = user.supabaseUserId || 
        localStorage.getItem(`supabase_uid_${user.uid}`);
      
      if (!supabaseUserId) {
        console.error('No Supabase user ID found for current user');
        setError('User ID not found. Please log out and log in again.');
        return null;
      }
      
      console.log('Recording progress with Supabase ID:', supabaseUserId);
      
      // Add user ID to progress data
      const data = {
        ...progressData,
        userId: supabaseUserId,
        firebaseUid: user.uid // Include the Firebase UID as well
      };
      
      // Record progress in Supabase
      const result = await recordProgress(data);
      
      // Clear the entire cache to ensure fresh data on next fetch
      progressCache.current = {};
      
      // Refresh progress data immediately
      await refreshProgressData();
      
      return result;
    } catch (err) {
      console.error('Error in recordUserProgress:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get progress for a specific exam, subject, and chapter
  const getProgress = useCallback(async (examType, subject, chapter = null) => {
    if (!isAuthenticated || !user) {
      console.warn('Cannot get progress: User not authenticated');
      return [];
    }

    try {
      // Get the Supabase user ID
      const supabaseUserId = user.supabaseUserId || 
        localStorage.getItem(`supabase_uid_${user.uid}`);
      
      if (!supabaseUserId) {
        console.error('No Supabase user ID found for current user in getProgress');
        throw new Error('User ID not found. Please log out and log in again.');
      }
      
      // Create a cache key based on the parameters
      const cacheKey = `${examType}|${subject}|${chapter || ''}`;
      
      // Check if we have cached data that's not expired
      if (progressCache.current[cacheKey] && 
          progressCache.current[cacheKey].timestamp > Date.now() - cacheExpiration) {
        console.log('Using cached progress data for', cacheKey);
        return progressCache.current[cacheKey].data;
      }
      
      // If not in cache or expired, fetch from API
      setLoading(true);
      
      // Add a small delay to prevent rapid successive API calls
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const data = await getUserProgress(supabaseUserId, examType, subject, chapter);
      
      // Store in cache with timestamp
      progressCache.current[cacheKey] = {
        data,
        timestamp: Date.now()
      };
      
      return data;
    } catch (err) {
      setError(err.message);
      // Return empty array on error to prevent further errors
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated]);

  // Refresh all progress data with debouncing to prevent excessive API calls
  const lastRefreshTime = useRef(0);
  const refreshProgressData = useCallback(async () => {
    if (!isAuthenticated || !user) {
      return;
    }

    // Implement debouncing - prevent refreshing more than once every 5 seconds
    const now = Date.now();
    if (now - lastRefreshTime.current < 5000) {
      console.log('Skipping refresh - too soon since last refresh');
      return;
    }

    lastRefreshTime.current = now;
    console.log('Refreshing progress data at', new Date().toISOString());

    try {
      setLoading(true);
      
      // Get the Supabase user ID
      const supabaseUserId = user.supabaseUserId || 
        localStorage.getItem(`supabase_uid_${user.uid}`);
      
      if (!supabaseUserId) {
        console.error('No Supabase user ID found for current user in refreshProgressData');
        setError('User ID not found. Please log out and log in again.');
        return { summary: {}, recent: [] };
      }
      
      console.log('Refreshing progress data with Supabase ID:', supabaseUserId);
      
      // Clear the entire cache
      progressCache.current = {};
      
      // Reload summary and recent activity
      const summary = await getUserProgressSummary(supabaseUserId);
      const recent = await getUserRecentActivity(supabaseUserId, 10);
      
      setProgressSummary(summary);
      setRecentActivity(recent);
      
      // Force a state update to trigger re-renders in components using this context
      setProgressData(prevData => ({...prevData, lastUpdated: now}));
      
      return { summary, recent };
    } catch (err) {
      console.error('Error refreshing progress data:', err);
      setError(err.message);
      return { summary: {}, recent: [] }; // Return empty data instead of throwing
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]); // Only depend on authentication state and user

  // Calculate completion percentage for a specific exam, subject, and chapter
  const getCompletionPercentage = useCallback((examType, subject, chapter = null) => {
    if (!progressSummary || !progressSummary[examType]) {
      return 0;
    }
    
    if (!subject) {
      // Return overall percentage for the exam
      return progressSummary[examType].total > 0
        ? (progressSummary[examType].correct / progressSummary[examType].total) * 100
        : 0;
    }
    
    if (!progressSummary[examType].subjects[subject]) {
      return 0;
    }
    
    if (!chapter) {
      // Return percentage for the subject
      return progressSummary[examType].subjects[subject].total > 0
        ? (progressSummary[examType].subjects[subject].correct / progressSummary[examType].subjects[subject].total) * 100
        : 0;
    }
    
    if (!progressSummary[examType].subjects[subject].chapters[chapter]) {
      return 0;
    }
    
    // Return percentage for the chapter
    return progressSummary[examType].subjects[subject].chapters[chapter].total > 0
      ? (progressSummary[examType].subjects[subject].chapters[chapter].correct / progressSummary[examType].subjects[subject].chapters[chapter].total) * 100
      : 0;
  }, [progressSummary]);

  // Check if a question has been answered correctly
  const isQuestionCorrect = useCallback((questionId) => {
    if (!isAuthenticated || !user) {
      // Check localStorage for non-authenticated users
      const existingAnswers = JSON.parse(localStorage.getItem('question_answers') || '[]');
      const answer = existingAnswers.find(a => a.questionId === questionId);
      return answer ? answer.isCorrect : null;
    }
    
    // For authenticated users, check all cached progress data
    for (const key in progressCache.current) {
      const questionProgress = progressCache.current[key].data.find(p => p.question_id === questionId);
      if (questionProgress) {
        return questionProgress.is_correct;
      }
    }
    
    return null;
  }, [isAuthenticated, user?.id]);

  return (
    <ProgressContext.Provider
      value={{
        progressData,
        progressSummary,
        recentActivity,
        loading,
        error,
        recordUserProgress,
        getProgress,
        refreshProgressData,
        getCompletionPercentage,
        isQuestionCorrect
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
};
