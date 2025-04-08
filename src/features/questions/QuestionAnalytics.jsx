import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import useAnalytics from '../../hooks/useAnalytics';

/**
 * Component that wraps question components to track analytics
 * This component doesn't render anything visible but tracks user interactions
 */
const QuestionAnalytics = ({ question, moduleId, chapterId, children }) => {
  const { user } = useSelector((state) => state.auth);
  const { trackQuestionView } = useAnalytics();
  const [startTime, setStartTime] = useState(null);
  
  // Track when the question is viewed
  useEffect(() => {
    if (user?.uid && question) {
      // Record the time when the question is first viewed
      setStartTime(Date.now());
      
      // Track the question view event
      trackQuestionView(question, moduleId, chapterId);
      
      // Clean up function to track time spent when unmounting
      return () => {
        // Calculate time spent on the question
        if (startTime) {
          const timeSpent = Math.floor((Date.now() - startTime) / 1000); // in seconds
          
          // Only log if they spent more than 2 seconds on the question
          // to avoid tracking quick scrolling
          if (timeSpent > 2) {
            // You could track time spent here if needed
            // trackTimeSpent(question, timeSpent);
          }
        }
      };
    }
  }, [user, question, moduleId, chapterId, trackQuestionView]);
  
  // Simply render the children components
  return children;
};

export default QuestionAnalytics;