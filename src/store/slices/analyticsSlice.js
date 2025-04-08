import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  trackUserActivity,
  getUserProgress,
  updateUserProgress,
  getModuleAnalytics,
  getChapterAnalytics,
  getOverallPerformance
} from '../../services/supabaseService';

// Async thunks for analytics operations
export const fetchUserProgress = createAsyncThunk(
  'analytics/fetchUserProgress',
  async (userId, { rejectWithValue }) => {
    try {
      const progress = await getUserProgress(userId);
      return progress;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch user progress');
    }
  }
);

export const updateProgress = createAsyncThunk(
  'analytics/updateProgress',
  async ({ userId, progressData }, { rejectWithValue }) => {
    try {
      const result = await updateUserProgress(userId, progressData);
      return { userId, progressData };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update progress');
    }
  }
);

export const fetchModuleAnalytics = createAsyncThunk(
  'analytics/fetchModuleAnalytics',
  async ({ userId, moduleId }, { rejectWithValue }) => {
    try {
      const analytics = await getModuleAnalytics(userId, moduleId);
      return { moduleId, analytics };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch module analytics');
    }
  }
);

export const fetchChapterAnalytics = createAsyncThunk(
  'analytics/fetchChapterAnalytics',
  async ({ userId, chapterId }, { rejectWithValue }) => {
    try {
      const analytics = await getChapterAnalytics(userId, chapterId);
      return { chapterId, analytics };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch chapter analytics');
    }
  }
);

export const fetchOverallPerformance = createAsyncThunk(
  'analytics/fetchOverallPerformance',
  async (userId, { rejectWithValue }) => {
    try {
      const performance = await getOverallPerformance(userId);
      return performance;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch overall performance');
    }
  }
);

export const logUserActivity = createAsyncThunk(
  'analytics/logUserActivity',
  async ({ userId, eventType, eventData }, { rejectWithValue }) => {
    try {
      await trackUserActivity(userId, eventType, eventData);
      return { userId, eventType, eventData };
    } catch (error) {
      console.error('Failed to log user activity:', error);
      // Don't reject the promise, just log the error
      // This prevents UI disruption if analytics tracking fails
      return { userId, eventType, eventData, error: error.message };
    }
  }
);

const initialState = {
  userProgress: null,
  moduleAnalytics: {},
  chapterAnalytics: {},
  overallPerformance: null,
  recentActivities: [],
  loading: false,
  error: null,
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearAnalyticsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user progress
      .addCase(fetchUserProgress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProgress.fulfilled, (state, action) => {
        state.loading = false;
        state.userProgress = action.payload;
      })
      .addCase(fetchUserProgress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch user progress';
      })
      
      // Update progress
      .addCase(updateProgress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProgress.fulfilled, (state, action) => {
        state.loading = false;
        // Update the progress in state if needed
        if (state.userProgress) {
          state.userProgress = {
            ...state.userProgress,
            ...action.payload.progressData,
          };
        }
      })
      .addCase(updateProgress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update progress';
      })
      
      // Fetch module analytics
      .addCase(fetchModuleAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchModuleAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.moduleAnalytics[action.payload.moduleId] = action.payload.analytics;
      })
      .addCase(fetchModuleAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch module analytics';
      })
      
      // Fetch chapter analytics
      .addCase(fetchChapterAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChapterAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.chapterAnalytics[action.payload.chapterId] = action.payload.analytics;
      })
      .addCase(fetchChapterAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch chapter analytics';
      })
      
      // Fetch overall performance
      .addCase(fetchOverallPerformance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOverallPerformance.fulfilled, (state, action) => {
        state.loading = false;
        state.overallPerformance = action.payload;
      })
      .addCase(fetchOverallPerformance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch overall performance';
      })
      
      // Log user activity
      .addCase(logUserActivity.fulfilled, (state, action) => {
        // Add to recent activities if no error
        if (!action.payload.error) {
          state.recentActivities.unshift({
            type: action.payload.eventType,
            data: action.payload.eventData,
            timestamp: new Date().toISOString(),
          });
          
          // Keep only the 10 most recent activities
          if (state.recentActivities.length > 10) {
            state.recentActivities = state.recentActivities.slice(0, 10);
          }
        }
      });
  },
});

export const { clearAnalyticsError } = analyticsSlice.actions;
export default analyticsSlice.reducer;