import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarOpen: true,
  toasts: [],
  modals: {},
  theme: 'light'
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
    addToast: (state, action) => {
      const toast = {
        id: Date.now(),
        ...action.payload
      };
      state.toasts.push(toast);
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
    },
    openModal: (state, action) => {
      const { modalId, data } = action.payload;
      state.modals[modalId] = { isOpen: true, data };
    },
    closeModal: (state, action) => {
      const modalId = action.payload;
      if (state.modals[modalId]) {
        state.modals[modalId].isOpen = false;
      }
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    }
  }
});

export const {
  toggleSidebar,
  setSidebarOpen,
  addToast,
  removeToast,
  openModal,
  closeModal,
  setTheme
} = uiSlice.actions;

export default uiSlice.reducer; 