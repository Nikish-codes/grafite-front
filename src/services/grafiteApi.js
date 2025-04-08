import axios from 'axios';

const BASE_URL = 'https://api.grafite.in';

// Create axios instance with retry capability
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Increased to 30 seconds timeout
});

// Add response interceptor for retry logic
api.interceptors.response.use(null, async (error) => {
  const { config, response } = error;
  
  // Only retry on 429 (rate limit) errors
  if (response && response.status === 429) {
    // If we haven't set a retry count yet, initialize it
    config.__retryCount = config.__retryCount || 0;
    
    // Maximum number of retries
    const maxRetries = 3;
    
    // Check if we've maxed out retries
    if (config.__retryCount < maxRetries) {
      // Increase retry count
      config.__retryCount += 1;
      
      // Calculate delay with exponential backoff (1s, 2s, 4s)
      const delayMs = 1000 * Math.pow(2, config.__retryCount - 1);
      
      console.log(`Rate limit exceeded. Retrying request (${config.__retryCount}/${maxRetries}) after ${delayMs}ms delay...`);
      
      // Create a new promise to handle the delay
      return new Promise(resolve => {
        setTimeout(() => resolve(axios(config)), delayMs);
      });
    }
  }
  
  // If we've exhausted retries or it's not a 429 error, continue with error
  return Promise.reject(error);
});

// Helper function to handle API errors
const handleApiError = (error, endpoint) => {
  if (error.response) {
    // The request was made and the server responded with a status code outside of 2xx
    if (error.response.status === 500 && endpoint === '/questions') {
      console.error('Error: The /questions query was likely not specific enough. Add more filters.');
      throw new Error('Query too broad. Please add more specific filters.');
    } else if (error.response.status === 404) {
      console.error('Resource not found.');
      throw new Error('Resource not found.');
    } else if (error.response.status === 422) {
      console.error('Invalid parameter format.');
      throw new Error('Invalid parameter format.');
    } else {
      console.error(`Error ${error.response.status}: ${error.response.data}`);
      throw error;
    }
  } else if (error.request) {
    // The request was made but no response was received
    console.error('No response received from server.');
    throw new Error('No response received from server. Please check your connection.');
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error('Error setting up request:', error.message);
    throw error;
  }
};

/**
 * Get all available modules
 * @returns {Promise<Array<string>>} Array of module names
 */
export const getModules = async () => {
  try {
    const response = await api.get('/modules');
    return response.data.modules || [];
  } catch (error) {
    handleApiError(error, '/modules');
  }
};

/**
 * Get chapters, optionally filtered by module
 * @param {string|null} moduleName - Optional module name to filter chapters
 * @returns {Promise<Array<string>>} Array of chapter names
 */
export const getChapters = async (moduleName = null) => {
  try {
    const params = moduleName ? { module_name: moduleName } : {};
    const response = await api.get('/chapters', { params });
    return response.data.chapters || [];
  } catch (error) {
    handleApiError(error, '/chapters');
  }
};

/**
 * Get all available tags
 * @returns {Promise<Array<string>>} Array of tags
 */
export const getTags = async () => {
  try {
    const response = await api.get('/tags');
    return response.data.tags || [];
  } catch (error) {
    handleApiError(error, '/tags');
  }
};

/**
 * Get questions with filtering and pagination
 * IMPORTANT: You must provide sufficient filters to avoid 500 errors.
 * At minimum, include module_name AND either type OR level.
 * 
 * @param {Object} options - Query parameters
 * @returns {Promise<Object>} Paginated question data
 */
export const getQuestions = async ({
  questionId = null,
  moduleName = null,
  chapterName = null,
  type = null,
  level = null,
  minLevel = null,
  maxLevel = null,
  tags = null,
  search = null,
  page = 1,
  perPage = 10,
  sortBy = 'question_ID',
  sortOrder = 'asc',
  noFilters = false, // New parameter to bypass minimum filter requirements
} = {}) => {
  try {
    // Build params object, filtering out null/undefined values
    const params = Object.entries({
      question_id: questionId,
      module_name: moduleName,
      chapter_name: chapterName,
      type,
      level,
      min_level: minLevel,
      max_level: maxLevel,
      tags,
      search,
      page,
      per_page: perPage,
      sort_by: sortBy,
      sort_order: sortOrder,
    }).reduce((acc, [key, value]) => {
      if (value !== null && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});

    // Ensure we have sufficient filters to avoid 500 errors
    // Skip this check if noFilters is true
    if (!noFilters && (!moduleName || (!type && !level))) {
      console.warn('Warning: Insufficient filters for /questions. API may return 500 error.');
    }

    const response = await api.get('/questions', { params });
    return {
      total: response.data.total || 0,
      page: response.data.page || 1,
      perPage: response.data.per_page || 10,
      totalPages: response.data.total_pages || 1,
      data: response.data.data || [],
    };
  } catch (error) {
    handleApiError(error, '/questions');
  }
};

/**
 * Get a specific question by ID
 * @param {string} questionId - Question ID to fetch
 * @returns {Promise<Object>} Question data
 */
export const getQuestionById = async (questionId) => {
  try {
    if (!questionId) {
      throw new Error('Question ID is required');
    }
    const response = await api.get(`/question/${questionId}`);
    return response.data;
  } catch (error) {
    handleApiError(error, '/question');
  }
};

/**
 * Check API health
 * @returns {Promise<Object>} Health status
 */
export const checkApiHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    handleApiError(error, '/health');
  }
};

/**
 * Get JEE ADV questions with proper filtering
 * @param {Object} params - Additional parameters for filtering
 * @returns {Promise<Object>} Paginated question data
 */
export const getJeeAdvQuestions = async (params = {}) => {
  // Ensure we have the minimum required filters to avoid 500 errors
  const defaultParams = {
    moduleName: 'JEE_ADV_PHY', // Using the exact module name from the API
    type: params.type || 'multipleCorrect', // Default to a specific type if not provided
  };

  return getQuestions({
    ...defaultParams,
    ...params,
  });
};

/**
 * Get BITSAT questions with proper filtering
 * @param {Object} params - Additional parameters for filtering
 * @returns {Promise<Object>} Paginated question data
 */
export const getBitsatQuestions = async (params = {}) => {
  // Ensure we have the minimum required filters to avoid 500 errors
  const defaultParams = {
    moduleName: 'BITSAT_CHEM', // Using the exact module name from the API
    type: params.type || 'singleCorrect', // Default to a specific type if not provided
  };

  return getQuestions({
    ...defaultParams,
    ...params,
  });
};

/**
 * Get exam-specific questions based on exam type
 * @param {string} examType - The type of exam (e.g., 'jee-adv-booster', 'bitsat-prep')
 * @param {Object} params - Additional parameters for filtering
 * @returns {Promise<Object>} Paginated question data or a message for unsupported types
 */
export const getExamQuestions = async (examType, params = {}) => {
  let moduleParams = {};
  let supported = true;
  
  // Extract moduleName from params if provided
  const providedModuleName = params.moduleName;
  
  switch(examType) {
    case 'jee-adv-booster':
      // Only apply default moduleName if not already provided
      moduleParams = {
        moduleName: providedModuleName || 'JEE_ADV_PHY',
      };
      // Only add these filters if the user is explicitly filtering
      if (params.type) moduleParams.type = params.type;
      if (params.level) moduleParams.level = params.level;
      break;
    case 'bitsat-prep':
      moduleParams = {
        moduleName: providedModuleName || 'BITSAT_CHEM',
      };
      if (params.type) moduleParams.type = params.type;
      if (params.level) moduleParams.level = params.level;
      break;
    case 'wbjee':
      moduleParams = {
        moduleName: providedModuleName || 'WBJEE_MATH',
      };
      if (params.type) moduleParams.type = params.type;
      if (params.level) moduleParams.level = params.level;
      break;
    case 'jee-mains-500':
    case 'jee-mains-250':
    case 'mains-2025':
      // These exam types are supported in the UI but not yet in the API
      supported = false;
      return { 
        comingSoon: true, 
        message: `${examType} content is coming soon. We're working hard to add this material.`,
        questions: [],
        pagination: { total: 0, page: 1, perPage: 10, totalPages: 0 }
      };
    default:
      // Complete fallback for unexpected exam types
      supported = false;
      return { 
        comingSoon: true, 
        message: `Exam type "${examType}" not supported yet. Check back soon!`,
        questions: [],
        pagination: { total: 0, page: 1, perPage: 10, totalPages: 0 }
      };
  }
  
  if (supported) {
    return getQuestions({
      ...moduleParams,
      ...params,
      // Use the provided perPage value or default to 48
      perPage: params.perPage || 48, 
      // Use noFilters=true to bypass filter requirements when no specific filters are set
      // This allows showing all questions for a chapter without automatic filtering
      noFilters: !params.type && !params.level && !params.minLevel && !params.maxLevel,
    });
  }
};