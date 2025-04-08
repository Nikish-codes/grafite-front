import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarOpen: false,
  darkMode: localStorage.getItem('darkMode') === 'true',
  currentView: 'grid',
  notifications: [],
  isLoading: false,
  modalOpen: false,
  modalContent: null,
  modalType: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem('darkMode', state.darkMode);
    },
    setDarkMode: (state, action) => {
      state.darkMode = action.payload;
      localStorage.setItem('darkMode', state.darkMode);
    },
    setCurrentView: (state, action) => {
      state.currentView = action.payload;
    },
    addNotification: (state, action) => {
      state.notifications.push({
        id: Date.now(),
        ...action.payload,
        read: false,
      });
    },
    markNotificationAsRead: (state, action) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    setIsLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    openModal: (state, action) => {
      state.modalOpen = true;
      state.modalContent = action.payload.content;
      state.modalType = action.payload.type;
    },
    closeModal: (state) => {
      state.modalOpen = false;
      state.modalContent = null;
      state.modalType = null;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleDarkMode,
  setDarkMode,
  setCurrentView,
  addNotification,
  markNotificationAsRead,
  clearNotifications,
  setIsLoading,
  openModal,
  closeModal,
} = uiSlice.actions;

export default uiSlice.reducer;