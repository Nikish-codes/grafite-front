/**
 * Utility functions for interacting with localStorage
 */

// Keys for localStorage
const BOOKMARKED_QUESTIONS_KEY = 'grafite_bookmarked_questions';
const USER_ANSWERS_KEY = 'grafite_user_answers';

/**
 * Get all bookmarked questions from localStorage
 * @returns {Object} Object with question IDs as keys and bookmark data as values
 */
export const getBookmarkedQuestions = () => {
  try {
    const bookmarkedQuestions = localStorage.getItem(BOOKMARKED_QUESTIONS_KEY);
    return bookmarkedQuestions ? JSON.parse(bookmarkedQuestions) : {};
  } catch (error) {
    console.error('Error getting bookmarked questions:', error);
    return {};
  }
};

/**
 * Save a bookmarked question to localStorage
 * @param {string} questionId - The ID of the question to bookmark
 * @param {Object} bookmarkData - Data about the bookmarked question
 */
export const saveBookmarkedQuestion = (questionId, bookmarkData) => {
  try {
    const bookmarkedQuestions = getBookmarkedQuestions();
    bookmarkedQuestions[questionId] = bookmarkData;
    localStorage.setItem(BOOKMARKED_QUESTIONS_KEY, JSON.stringify(bookmarkedQuestions));
  } catch (error) {
    console.error('Error saving bookmarked question:', error);
  }
};

/**
 * Remove a bookmarked question from localStorage
 * @param {string} questionId - The ID of the question to remove from bookmarks
 */
export const removeBookmarkedQuestion = (questionId) => {
  try {
    const bookmarkedQuestions = getBookmarkedQuestions();
    delete bookmarkedQuestions[questionId];
    localStorage.setItem(BOOKMARKED_QUESTIONS_KEY, JSON.stringify(bookmarkedQuestions));
  } catch (error) {
    console.error('Error removing bookmarked question:', error);
  }
};

/**
 * Get all user answers from localStorage
 * @returns {Object} Object with question IDs as keys and answer data as values
 */
export const getUserAnswers = () => {
  try {
    const userAnswers = localStorage.getItem(USER_ANSWERS_KEY);
    return userAnswers ? JSON.parse(userAnswers) : {};
  } catch (error) {
    console.error('Error getting user answers:', error);
    return {};
  }
};

/**
 * Save a user answer to localStorage
 * @param {string} questionId - The ID of the question
 * @param {Object} answerData - Data about the user's answer
 */
export const saveUserAnswer = (questionId, answerData) => {
  try {
    const userAnswers = getUserAnswers();
    userAnswers[questionId] = answerData;
    localStorage.setItem(USER_ANSWERS_KEY, JSON.stringify(userAnswers));
  } catch (error) {
    console.error('Error saving user answer:', error);
  }
};