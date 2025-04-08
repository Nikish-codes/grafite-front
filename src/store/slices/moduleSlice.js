import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Mock data for initial development
const mockModules = [
  { id: '1', title: 'Physics', description: 'JEE Advanced Physics' },
  { id: '2', title: 'Chemistry', description: 'JEE Advanced Chemistry' },
  { id: '3', title: 'Mathematics', description: 'JEE Advanced Mathematics' },
  { id: '4', title: 'BITSAT', description: 'BITSAT Preparation' },
];

const mockChapters = {
  '1': [
    { id: '101', title: 'Mechanics', questionCount: 25 },
    { id: '102', title: 'Electromagnetism', questionCount: 20 },
    { id: '103', title: 'Optics', questionCount: 15 },
    { id: '104', title: 'Modern Physics', questionCount: 18 },
  ],
  '2': [
    { id: '201', title: 'Physical Chemistry', questionCount: 22 },
    { id: '202', title: 'Organic Chemistry', questionCount: 28 },
    { id: '203', title: 'Inorganic Chemistry', questionCount: 20 },
  ],
  '3': [
    { id: '301', title: 'Calculus', questionCount: 30 },
    { id: '302', title: 'Algebra', questionCount: 25 },
    { id: '303', title: 'Coordinate Geometry', questionCount: 20 },
    { id: '304', title: 'Trigonometry', questionCount: 15 },
  ],
  '4': [
    { id: '401', title: 'BITSAT Physics', questionCount: 40 },
    { id: '402', title: 'BITSAT Chemistry', questionCount: 40 },
    { id: '403', title: 'BITSAT Mathematics', questionCount: 40 },
    { id: '404', title: 'Logical Reasoning', questionCount: 30 },
    { id: '405', title: 'English Proficiency', questionCount: 25 },
  ],
};

// Async thunks for API calls (using mock data for now)
export const fetchModules = createAsyncThunk(
  'modules/fetchModules',
  async (_, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockModules;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchChapters = createAsyncThunk(
  'modules/fetchChapters',
  async (moduleId, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return { moduleId, chapters: mockChapters[moduleId] || [] };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const moduleSlice = createSlice({
  name: 'modules',
  initialState: {
    modules: [],
    chapters: {},
    currentModule: null,
    currentChapter: null,
    dataSource: 'JEE_ADV', // 'JEE_ADV' or 'BITSAT'
    loading: false,
    error: null,
  },
  reducers: {
    setCurrentModule: (state, action) => {
      state.currentModule = action.payload;
    },
    setCurrentChapter: (state, action) => {
      state.currentChapter = action.payload;
    },
    clearCurrentChapter: (state) => {
      state.currentChapter = null;
    },
    setDataSource: (state, action) => {
      state.dataSource = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch modules
      .addCase(fetchModules.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchModules.fulfilled, (state, action) => {
        state.loading = false;
        state.modules = action.payload;
      })
      .addCase(fetchModules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch chapters
      .addCase(fetchChapters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChapters.fulfilled, (state, action) => {
        state.loading = false;
        state.chapters = {
          ...state.chapters,
          [action.payload.moduleId]: action.payload.chapters,
        };
      })
      .addCase(fetchChapters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setCurrentModule, setCurrentChapter, clearCurrentChapter, setDataSource } = moduleSlice.actions;

export default moduleSlice.reducer;