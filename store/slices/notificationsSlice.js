import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api';

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async ({ propertyId, unreadOnly = false, limit = 12 } = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const url = new URL(`${API_BASE_URL}/notifications`);

      if (propertyId) url.searchParams.append('propertyId', propertyId);
      if (unreadOnly) url.searchParams.append('unreadOnly', 'true');
      if (limit) url.searchParams.append('limit', String(limit));

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error?.message || 'Failed to fetch notifications');
      }

      return data.data || [];
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchUnreadNotificationCount = createAsyncThunk(
  'notifications/fetchUnreadNotificationCount',
  async ({ propertyId } = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;
      const url = new URL(`${API_BASE_URL}/notifications/unread-count`);

      if (propertyId) url.searchParams.append('propertyId', propertyId);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error?.message || 'Failed to fetch unread count');
      }

      return data.data?.count || 0;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  'notifications/markNotificationRead',
  async (id, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;

      const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error?.message || 'Failed to mark notification as read');
      }

      return id;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  'notifications/markAllNotificationsRead',
  async ({ propertyId = null } = {}, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;

      const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ propertyId }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error?.message || 'Failed to mark notifications as read');
      }

      return {
        propertyId,
        updated: data.data?.updated || 0,
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

const initialState = {
  items: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearNotifications: (state) => {
      state.items = [];
      state.unreadCount = 0;
      state.error = null;
    },
    prependNotification: (state, action) => {
      const incoming = action.payload;
      const existingIndex = state.items.findIndex((item) => item.id === incoming.id);

      if (existingIndex >= 0) {
        state.items[existingIndex] = {
          ...state.items[existingIndex],
          ...incoming,
        };
        return;
      }

      state.items.unshift(incoming);
      state.items = state.items.slice(0, 20);

      if (!incoming.isRead) {
        state.unreadCount += 1;
      }
    },
    markNotificationReadLocal: (state, action) => {
      const notification = state.items.find((item) => item.id === action.payload);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        notification.readAt = new Date().toISOString();
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.unreadCount = action.payload.filter((item) => !item.isRead).length;
        state.error = null;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchUnreadNotificationCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const notification = state.items.find((item) => item.id === action.payload);
        if (notification && !notification.isRead) {
          notification.isRead = true;
          notification.readAt = new Date().toISOString();
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items = state.items.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt || new Date().toISOString(),
        }));
        state.unreadCount = 0;
      });
  },
});

export const {
  clearNotifications,
  prependNotification,
  markNotificationReadLocal,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
