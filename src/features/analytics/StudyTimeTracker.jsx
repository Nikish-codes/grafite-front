import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProgress } from '../../store/slices/analyticsSlice';
import useAnalytics from '../../hooks/useAnalytics';

/**
 * Component that tracks user study time and updates analytics
 * This is a hidden component that should be included in the main layout
 */
const StudyTimeTracker = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { trackEvent } = useAnalytics();
  const [studySessionStart, setStudySessionStart] = useState(null);
  
  // Start tracking when component mounts and user is logged in
  useEffect(() => {
    if (user?.uid) {
      // Record session start time
      const startTime = Date.now();
      setStudySessionStart(startTime);
      
      // Track session start event
      trackEvent('study_session_started', {
        timestamp: new Date(startTime).toISOString(),
      });
      
      // Set up interval to update study time every 5 minutes
      const intervalId = setInterval(() => {
        const currentTime = Date.now();
        const timeSpentMinutes = Math.floor((currentTime - startTime) / (1000 * 60));
        
        // Only update if more than 1 minute has passed
        if (timeSpentMinutes > 1) {
          // Update user progress with study time
          dispatch(updateProgress({
            userId: user.uid,
            progressData: {
              last_active: new Date().toISOString(),
              study_time_minutes: timeSpentMinutes,
            },
          }));
        }
      }, 5 * 60 * 1000); // Every 5 minutes
      
      // Clean up function to track total time when unmounting or user logs out
      return () => {
        clearInterval(intervalId);
        
        if (studySessionStart) {
          const endTime = Date.now();
          const totalTimeMinutes = Math.floor((endTime - studySessionStart) / (1000 * 60));
          
          // Only log if they spent more than 1 minute studying
          if (totalTimeMinutes > 1) {
            // Track session end event
            trackEvent('study_session_ended', {
              timestamp: new Date(endTime).toISOString(),
              duration_minutes: totalTimeMinutes,
            });
            
            // Update total study time in user progress
            dispatch(updateProgress({
              userId: user.uid,
              progressData: {
                total_study_minutes: totalTimeMinutes,
                last_session_duration: totalTimeMinutes,
                last_active: new Date(endTime).toISOString(),
              },
            }));
          }
        }
      };
    }
  }, [dispatch, user, trackEvent]);
  
  // This component doesn't render anything visible
  return null;
};

export default StudyTimeTracker;