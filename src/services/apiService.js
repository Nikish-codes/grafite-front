/**
 * API service for interacting with the Grafite API
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.grafite.in';

// Default headers for all API requests
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'X-Grafite-Client': 'web-app'
};

/**
 * Get the authentication token for API requests
 * @returns {string|null} - Auth token or null if not authenticated
 */
const getAuthToken = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user?.token || null;
};

/**
 * Generic function to make API requests
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @param {boolean} requiresAuth - Whether the request requires authentication
 * @returns {Promise} - Promise with response data
 */
async function apiRequest(endpoint, options = {}, requiresAuth = true) {
  try {
    const headers = {
      ...DEFAULT_HEADERS,
      ...options.headers,
    };

    // Add auth token if required and available
    if (requiresAuth) {
      const token = getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

/**
 * Get all modules (subjects)
 * @returns {Promise<Array>} - Promise with array of modules
 */
export const getModules = async () => {
  return apiRequest('/modules');
};

/**
 * Get chapters for a specific module
 * @param {string} moduleId - Module ID
 * @returns {Promise<Array>} - Promise with array of chapters
 */
export const getChapters = async (moduleId) => {
  return apiRequest(`/modules/${moduleId}/chapters`);
};

/**
 * Get questions for a specific chapter
 * @param {string} moduleId - Module ID
 * @param {string} chapterId - Chapter ID
 * @returns {Promise<Array>} - Promise with array of questions
 */
export const getQuestions = async (moduleId, chapterId) => {
  return apiRequest(`/modules/${moduleId}/chapters/${chapterId}/questions`);
};

/**
 * Get a specific question
 * @param {string} moduleId - Module ID
 * @param {string} chapterId - Chapter ID
 * @param {string} questionId - Question ID
 * @returns {Promise<Object>} - Promise with question data
 */
export const getQuestion = async (moduleId, chapterId, questionId) => {
  return apiRequest(`/modules/${moduleId}/chapters/${chapterId}/questions/${questionId}`);
};

/**
 * Submit an answer for a question
 * @param {string} moduleId - Module ID
 * @param {string} chapterId - Chapter ID
 * @param {string} questionId - Question ID
 * @param {Object} answerData - Answer data
 * @returns {Promise<Object>} - Promise with submission result
 */
export const submitAnswer = async (moduleId, chapterId, questionId, answerData) => {
  return apiRequest(`/modules/${moduleId}/chapters/${chapterId}/questions/${questionId}/submit`, {
    method: 'POST',
    body: JSON.stringify(answerData),
  });
};

/**
 * Get user's bookmarked questions
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Promise with array of bookmarked questions
 */
export const getBookmarks = async (userId) => {
  return apiRequest(`/users/${userId}/bookmarks`);
};

/**
 * Add a question to bookmarks
 * @param {string} userId - User ID
 * @param {Object} bookmarkData - Bookmark data
 * @returns {Promise<Object>} - Promise with bookmark result
 */
export const addBookmark = async (userId, bookmarkData) => {
  return apiRequest(`/users/${userId}/bookmarks`, {
    method: 'POST',
    body: JSON.stringify(bookmarkData),
  });
};

/**
 * Remove a question from bookmarks
 * @param {string} userId - User ID
 * @param {string} questionId - Question ID
 * @returns {Promise<Object>} - Promise with removal result
 */
export const removeBookmark = async (userId, questionId) => {
  return apiRequest(`/users/${userId}/bookmarks/${questionId}`, {
    method: 'DELETE',
  });
};

/**
 * Get user's progress and analytics
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Promise with user progress data
 */
export const getUserProgress = async (userId) => {
  return apiRequest(`/users/${userId}/progress`);
};