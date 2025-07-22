import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Async thunks for API calls
export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async ({ propertyId } = {}, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const token = state.auth.token;
      
      // Check if data was fetched recently (within last 30 seconds)
      const lastFetch = state.dashboard.lastFetch.stats;
      if (lastFetch && Date.now() - new Date(lastFetch).getTime() < 30000) {
        return state.dashboard.stats; // Return cached data
      }

      const url = new URL(`${API_BASE_URL}/dashboard/stats`);
      if (propertyId) url.searchParams.append('propertyId', propertyId);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          return rejectWithValue('Too many requests. Please wait a moment and try again.');
        }
        return rejectWithValue(data.error?.message || 'Failed to fetch dashboard stats');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchRecentActivities = createAsyncThunk(
  'dashboard/fetchActivities',
  async ({ propertyId, limit = 20 } = {}, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const url = new URL(`${API_BASE_URL}/dashboard/activities`);
      if (propertyId) url.searchParams.append('propertyId', propertyId);
      if (limit) url.searchParams.append('limit', limit.toString());

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error?.message || 'Failed to fetch activities');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchOccupancyTrends = createAsyncThunk(
  'dashboard/fetchOccupancyTrends',
  async ({ propertyId, months = 6 } = {}, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const url = new URL(`${API_BASE_URL}/dashboard/occupancy-trends`);
      if (propertyId) url.searchParams.append('propertyId', propertyId);
      if (months) url.searchParams.append('months', months.toString());

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error?.message || 'Failed to fetch occupancy trends');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchRevenueTrends = createAsyncThunk(
  'dashboard/fetchRevenueTrends',
  async ({ propertyId, months = 6 } = {}, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const url = new URL(`${API_BASE_URL}/dashboard/revenue-trends`);
      if (propertyId) url.searchParams.append('propertyId', propertyId);
      if (months) url.searchParams.append('months', months.toString());

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error?.message || 'Failed to fetch revenue trends');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchUserDashboardSettings = createAsyncThunk(
  'dashboard/fetchUserSettings',
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      
      const response = await fetch(`${API_BASE_URL}/dashboard/user-settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error?.message || 'Failed to fetch user settings');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const updateUserDashboardSettings = createAsyncThunk(
  'dashboard/updateUserSettings',
  async (settings, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      
      const response = await fetch(`${API_BASE_URL}/dashboard/user-settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error?.message || 'Failed to update user settings');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Batch fetch all dashboard data in one action to reduce API calls
export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchDashboardData',
  async ({ propertyId } = {}, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const token = state.auth.token;
      
      // Check if data was fetched recently (within last 30 seconds)
      const lastFetch = state.dashboard.lastFetch.stats;
      if (lastFetch && Date.now() - new Date(lastFetch).getTime() < 30000) {
        return {
          stats: state.dashboard.stats,
          activities: state.dashboard.recentActivities,
          settings: state.dashboard.userSettings
        };
      }

      // Batch multiple API calls
      const baseUrl = API_BASE_URL;
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const statsUrl = new URL(`${baseUrl}/dashboard/stats`);
      const activitiesUrl = new URL(`${baseUrl}/dashboard/activities`);
      if (propertyId) {
        statsUrl.searchParams.append('propertyId', propertyId);
        activitiesUrl.searchParams.append('propertyId', propertyId);
      }
      activitiesUrl.searchParams.append('limit', '20');

      const [statsResponse, activitiesResponse, settingsResponse] = await Promise.all([
        fetch(statsUrl, { headers }),
        fetch(activitiesUrl, { headers }),
        fetch(`${baseUrl}/dashboard/user-settings`, { headers })
      ]);

      // Check for rate limiting
      if (statsResponse.status === 429 || activitiesResponse.status === 429 || settingsResponse.status === 429) {
        return rejectWithValue('Too many requests. Please wait a moment and try again.');
      }

      const [statsData, activitiesData, settingsData] = await Promise.all([
        statsResponse.json(),
        activitiesResponse.json(),
        settingsResponse.json()
      ]);

      if (!statsResponse.ok) {
        return rejectWithValue(statsData.error?.message || 'Failed to fetch dashboard stats');
      }
      if (!activitiesResponse.ok) {
        return rejectWithValue(activitiesData.error?.message || 'Failed to fetch activities');
      }
      if (!settingsResponse.ok) {
        return rejectWithValue(settingsData.error?.message || 'Failed to fetch settings');
      }

      return {
        stats: statsData.data,
        activities: activitiesData.data,
        settings: settingsData.data
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

const initialState = {
  stats: {
    rooms: {
      total: 0,
      occupied: 0,
      available: 0,
      maintenance: 0
    },
    beds: {
      total: 0,
      occupied: 0,
      available: 0,
      occupancyRate: 0
    },
    tenants: {
      total: 0,
      active: 0
    },
    properties: {
      total: 0
    },
    revenue: {
      monthlyRevenue: 0,
      paidPayments: 0,
      pendingAmount: 0,
      pendingPayments: 0,
      overduePayments: 0
    }
  },
  recentActivities: [],
  occupancyTrends: [],
  revenueTrends: [],
  userSettings: {
    theme: 'light',
    defaultView: 'cards',
    showNotifications: true,
    autoRefresh: false,
    refreshInterval: 30,
    defaultProperty: null,
    favoriteCharts: ['occupancy', 'revenue'],
    compactMode: false,
    dashboardLayout: {
      stats: true,
      activities: true,
      charts: true,
      quickActions: true
    }
  },
  loading: {
    stats: false,
    activities: false,
    trends: false,
    settings: false
  },
  error: null,
  lastFetch: {
    stats: null,
    activities: null,
    trends: null
  }
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addActivity: (state, action) => {
      const newActivity = {
        id: `manual-${Date.now()}`,
        timestamp: new Date().toISOString(),
        ...action.payload
      };
      state.recentActivities.unshift(newActivity);
      // Keep only last 50 activities
      state.recentActivities = state.recentActivities.slice(0, 50);
    },
    updateLocalStats: (state, action) => {
      state.stats = { ...state.stats, ...action.payload };
    },
    setSelectedProperty: (state, action) => {
      state.userSettings.defaultProperty = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Batch Dashboard Data
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading.stats = true;
        state.loading.activities = true;
        state.loading.settings = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading.stats = false;
        state.loading.activities = false;
        state.loading.settings = false;
        state.stats = action.payload.stats;
        state.recentActivities = action.payload.activities;
        state.userSettings = action.payload.settings;
        state.lastFetch.stats = new Date().toISOString();
        state.lastFetch.activities = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading.stats = false;
        state.loading.activities = false;
        state.loading.settings = false;
        state.error = action.payload;
      })

      // Fetch Dashboard Stats
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading.stats = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading.stats = false;
        state.stats = action.payload;
        state.lastFetch.stats = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading.stats = false;
        state.error = action.payload;
      })
      
      // Fetch Recent Activities
      .addCase(fetchRecentActivities.pending, (state) => {
        state.loading.activities = true;
      })
      .addCase(fetchRecentActivities.fulfilled, (state, action) => {
        state.loading.activities = false;
        state.recentActivities = action.payload;
        state.lastFetch.activities = new Date().toISOString();
      })
      .addCase(fetchRecentActivities.rejected, (state, action) => {
        state.loading.activities = false;
        state.error = action.payload;
      })
      
      // Fetch Occupancy Trends
      .addCase(fetchOccupancyTrends.pending, (state) => {
        state.loading.trends = true;
      })
      .addCase(fetchOccupancyTrends.fulfilled, (state, action) => {
        state.loading.trends = false;
        state.occupancyTrends = action.payload;
        state.lastFetch.trends = new Date().toISOString();
      })
      .addCase(fetchOccupancyTrends.rejected, (state, action) => {
        state.loading.trends = false;
        state.error = action.payload;
      })
      
      // Fetch Revenue Trends
      .addCase(fetchRevenueTrends.fulfilled, (state, action) => {
        state.revenueTrends = action.payload;
      })
      
      // Fetch User Dashboard Settings
      .addCase(fetchUserDashboardSettings.pending, (state) => {
        state.loading.settings = true;
      })
      .addCase(fetchUserDashboardSettings.fulfilled, (state, action) => {
        state.loading.settings = false;
        state.userSettings = { ...state.userSettings, ...action.payload };
      })
      .addCase(fetchUserDashboardSettings.rejected, (state, action) => {
        state.loading.settings = false;
        state.error = action.payload;
      })
      
      // Update User Dashboard Settings
      .addCase(updateUserDashboardSettings.fulfilled, (state, action) => {
        state.userSettings = { ...state.userSettings, ...action.payload };
      });
  },
});

export const {
  clearError,
  addActivity,
  updateLocalStats,
  setSelectedProperty
} = dashboardSlice.actions;

export default dashboardSlice.reducer; 