import { configureStore } from '@reduxjs/toolkit';
import moduleReducer from './slices/moduleSlice';
import questionReducer from './slices/questionSlice';
import uiReducer from './slices/uiSlice';
import authReducer from './slices/authSlice';
import analyticsReducer from './slices/analyticsSlice';

export const store = configureStore({
  reducer: {
    modules: moduleReducer,
    questions: questionReducer,
    ui: uiReducer,
    auth: authReducer,
    analytics: analyticsReducer,
  },
});

export default store;