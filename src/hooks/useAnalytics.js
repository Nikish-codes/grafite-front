import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logUserActivity } from '../store/slices/analyticsSlice';
import { trackUserActivity } from '../services/supabaseService';

/**
 * Custom hook for tracking user activity and analytics
 * @returns {Object} Analytics tracking functions
 */
const useAnalytics = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  /**
   * Track a user activity event
   * @param {string} eventType - Type of event (e.g., 'question_viewed', 'question_answered')
   * @param {Object} eventData - Data associated with the event
   */
  const trackEvent = useCallback(
    (eventType, eventData = {}) => {
      if (!user?.uid) return;

      // The supabaseUserId should be included in the user object
      const supabaseUserId = user.supabaseUserId;
      if (!supabaseUserId) {
        console.warn('No supabaseUserId found for user, skipping analytics tracking');
        return;
      }

      // Track via Redux for state management
      dispatch(
        logUserActivity({
          userId: supabaseUserId, // Use supabaseUserId instead of Firebase uid
          eventType,
          eventData: {
            timestamp: new Date().toISOString(),
            ...eventData,
          },
        })
      );
      
      // No need to pass userId to trackUserActivity as it will get it internally
      trackUserActivity(eventType, {
        timestamp: new Date().toISOString(),
        ...eventData,
      }).catch(error => {
        console.error('Failed to track event directly to Supabase:', error);
        // Non-blocking - we don't want to interrupt user experience if analytics fails
      });
    },
    [dispatch, user]
  );

  /**
   * Track when a user views a question
   * @param {Object} question - Question data
   * @param {string} moduleId - Module ID
   * @param {string} chapterId - Chapter ID
   */
  const trackQuestionView = useCallback(
    (question, moduleId, chapterId) => {
      trackEvent('question_viewed', {
        question_id: question.question_id,
        module_id: moduleId,
        chapter_id: chapterId,
        module_name: question.module_name,
        chapter_name: question.chapter_name,
      });
    },
    [trackEvent]
  );

  /**
   * Track when a user answers a question
   * @param {Object} question - Question data
   * @param {any} userAnswer - User's answer
   * @param {boolean} isCorrect - Whether the answer is correct
   * @param {number} timeSpent - Time spent on the question in seconds
   */
  const trackQuestionAnswer = useCallback(
    (question, userAnswer, isCorrect, timeSpent) => {
      trackEvent('question_answered', {
        question_id: question.question_id,
        module_id: question.module_id,
        chapter_id: question.chapter_id,
        module_name: question.module_name,
        chapter_name: question.chapter_name,
        is_correct: isCorrect,
        time_spent: timeSpent,
        question_type: question.type,
        difficulty_level: question.level,
      });
    },
    [trackEvent]
  );

  /**
   * Track when a user bookmarks a question
   * @param {Object} question - Question data
   * @param {boolean} isBookmarked - Whether the question is being bookmarked or unbookmarked
   */
  const trackBookmark = useCallback(
    (question, isBookmarked) => {
      trackEvent(isBookmarked ? 'question_bookmarked' : 'question_unbookmarked', {
        question_id: question.question_id,
        module_id: question.module_id,
        chapter_id: question.chapter_id,
        module_name: question.module_name,
        chapter_name: question.chapter_name,
      });
    },
    [trackEvent]
  );

  /**
   * Track when a user starts a quiz session
   * @param {string} moduleId - Module ID
   * @param {string} chapterId - Chapter ID (optional)
   * @param {string} quizType - Type of quiz (e.g., 'chapter', 'module', 'custom')
   */
  const trackQuizStart = useCallback(
    (moduleId, chapterId, quizType) => {
      trackEvent('quiz_started', {
        module_id: moduleId,
        chapter_id: chapterId,
        quiz_type: quizType,
      });
    },
    [trackEvent]
  );

  /**
   * Track when a user completes a quiz session
   * @param {string} moduleId - Module ID
   * @param {string} chapterId - Chapter ID (optional)
   * @param {string} quizType - Type of quiz
   * @param {number} score - Quiz score
   * @param {number} totalQuestions - Total number of questions
   * @param {number} timeSpent - Time spent on the quiz in seconds
   */
  const trackQuizComplete = useCallback(
    (moduleId, chapterId, quizType, score, totalQuestions, timeSpent) => {
      trackEvent('quiz_completed', {
        module_id: moduleId,
        chapter_id: chapterId,
        quiz_type: quizType,
        score,
        total_questions: totalQuestions,
        time_spent: timeSpent,
        percentage: Math.round((score / totalQuestions) * 100),
      });
    },
    [trackEvent]
  );

  return {
    trackEvent,
    trackQuestionView,
    trackQuestionAnswer,
    trackBookmark,
    trackQuizStart,
    trackQuizComplete,
  };
};

export default useAnalytics;