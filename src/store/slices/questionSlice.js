import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getBookmarkedQuestions, saveBookmarkedQuestion, removeBookmarkedQuestion, saveUserAnswer } from '../../utils/localStorage';
import { getQuestions, getQuestion, getBookmarks, addBookmark, removeBookmark } from '../../services/apiService';

// Async thunks for API calls
export const fetchQuestions = createAsyncThunk(
  'questions/fetchQuestions',
  async ({ moduleId, chapterId }, { rejectWithValue }) => {
    try {
      // Call the API service to get questions
      const questions = await getQuestions(moduleId, chapterId);
      return questions;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch questions');
    }
  }
);

export const fetchQuestion = createAsyncThunk(
  'questions/fetchQuestion',
  async ({ moduleId, chapterId, questionId }, { rejectWithValue, getState }) => {
    try {
      const { questions } = getState().questions;
      
      // Check if the question is already in the state
      const existingQuestion = questions.find(q => q.question_id === questionId);
      if (existingQuestion) {
        return existingQuestion;
      }
      
      // Call the API service to get a single question
      const question = await getQuestion(moduleId, chapterId, questionId);
      return question;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch question');
    }
  }
);

export const fetchBookmarkedQuestions = createAsyncThunk(
  'questions/fetchBookmarkedQuestions',
  async (userId, { rejectWithValue }) => {
    try {
      // If user is authenticated, get bookmarks from API
      if (userId) {
        const bookmarks = await getBookmarks(userId);
        // Save to localStorage for offline access
        bookmarks.forEach(bookmark => {
          saveBookmarkedQuestion(bookmark.question_id, bookmark);
        });
        return bookmarks.reduce((acc, bookmark) => {
          acc[bookmark.question_id] = bookmark;
          return acc;
        }, {});
      } else {
        // Get bookmarked questions from localStorage for non-authenticated users
        const bookmarkedQuestions = getBookmarkedQuestions();
        return bookmarkedQuestions;
      }
    } catch (error) {
      // Fallback to localStorage if API fails
      const bookmarkedQuestions = getBookmarkedQuestions();
      return bookmarkedQuestions;
    }
  }
);

// Async thunk for adding a bookmark via API
export const addBookmarkThunk = createAsyncThunk(
  'questions/addBookmark',
  async ({ userId, questionData, moduleId, chapterId, moduleName, chapterName }, { rejectWithValue }) => {
    try {
      const questionId = questionData.question_id;
      const bookmarkData = {
        moduleId,
        chapterId,
        moduleName,
        chapterName,
        question_id: questionId,
        question_text: questionData.question.text,
        timestamp: Date.now(),
      };
      
      // If user is authenticated, add bookmark via API
      if (userId) {
        await addBookmark(userId, bookmarkData);
      }
      
      // Always save to localStorage for offline access
      saveBookmarkedQuestion(questionId, bookmarkData);
      
      return { questionId, bookmarkData };
    } catch (error) {
      // Still save to localStorage even if API fails
      const questionId = questionData.question_id;
      const bookmarkData = {
        moduleId,
        chapterId,
        moduleName,
        chapterName,
        question_id: questionId,
        question_text: questionData.question.text,
        timestamp: Date.now(),
      };
      saveBookmarkedQuestion(questionId, bookmarkData);
      
      return { questionId, bookmarkData };
    }
  }
);

// Async thunk for removing a bookmark via API
export const removeBookmarkThunk = createAsyncThunk(
  'questions/removeBookmark',
  async ({ userId, questionId }, { rejectWithValue }) => {
    try {
      // If user is authenticated, remove bookmark via API
      if (userId) {
        await removeBookmark(userId, questionId);
      }
      
      // Always remove from localStorage
      removeBookmarkedQuestion(questionId);
      
      return questionId;
    } catch (error) {
      // Still remove from localStorage even if API fails
      removeBookmarkedQuestion(questionId);
      return questionId;
    }
  }
);

const questionSlice = createSlice({
  name: 'questions',
  initialState: {
    questions: [],
    currentQuestion: null,
    bookmarkedQuestions: {},
    userAnswers: {},
    loading: false,
    error: null,
  },
  reducers: {
    // Local bookmark action (will be replaced by thunk for authenticated users)
    bookmarkQuestion: (state, action) => {
      const { question, moduleId, chapterId, moduleName, chapterName } = action.payload;
      const questionId = question.question_id;
      
      // Add to bookmarked questions
      state.bookmarkedQuestions[questionId] = {
        moduleId,
        chapterId,
        moduleName,
        chapterName,
        question_id: questionId,
        question_text: question.question.text,
        timestamp: Date.now(),
      };
      
      // Save to localStorage
      saveBookmarkedQuestion(questionId, state.bookmarkedQuestions[questionId]);
    },
    // Local remove bookmark action (will be replaced by thunk for authenticated users)
    removeBookmark: (state, action) => {
      const questionId = action.payload;
      
      // Remove from bookmarked questions
      delete state.bookmarkedQuestions[questionId];
      
      // Remove from localStorage
      removeBookmarkedQuestion(questionId);
    },
    submitAnswer: (state, action) => {
      const { questionId, answer, isCorrect } = action.payload;
      
      // Save user answer
      state.userAnswers[questionId] = {
        answer,
        isCorrect,
        timestamp: Date.now(),
      };
      
      // Save to localStorage
      saveUserAnswer(questionId, state.userAnswers[questionId]);
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch questions
      .addCase(fetchQuestions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.loading = false;
        state.questions = action.payload;
      })
      .addCase(fetchQuestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch single question
      .addCase(fetchQuestion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuestion.fulfilled, (state, action) => {
        state.loading = false;
        state.currentQuestion = action.payload;
        
        // Add to questions array if not already present
        if (!state.questions.some(q => q.question_id === action.payload.question_id)) {
          state.questions.push(action.payload);
        }
      })
      .addCase(fetchQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch bookmarked questions
      .addCase(fetchBookmarkedQuestions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookmarkedQuestions.fulfilled, (state, action) => {
        state.loading = false;
        state.bookmarkedQuestions = action.payload;
      })
      .addCase(fetchBookmarkedQuestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add bookmark via API
      .addCase(addBookmarkThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addBookmarkThunk.fulfilled, (state, action) => {
        state.loading = false;
        const { questionId, bookmarkData } = action.payload;
        state.bookmarkedQuestions[questionId] = bookmarkData;
      })
      .addCase(addBookmarkThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Remove bookmark via API
      .addCase(removeBookmarkThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeBookmarkThunk.fulfilled, (state, action) => {
        state.loading = false;
        const questionId = action.payload;
        delete state.bookmarkedQuestions[questionId];
      })
      .addCase(removeBookmarkThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { bookmarkQuestion, removeBookmark: removeBookmarkAction, submitAnswer, setLoading, setError } = questionSlice.actions;

// Note: thunks (fetchQuestions, fetchQuestion, fetchBookmarkedQuestions, addBookmarkThunk, removeBookmarkThunk) 
// are already exported when they are defined with createAsyncThunk

export default questionSlice.reducer;