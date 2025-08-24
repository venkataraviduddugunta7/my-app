import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api';

// Async thunks for API calls
export const fetchFloors = createAsyncThunk(
  'floors/fetchFloors',
  async (propertyId, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      
      const response = await fetch(`${API_BASE_URL}/floors?propertyId=${propertyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error?.message || 'Failed to fetch floors');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const createFloor = createAsyncThunk(
  'floors/createFloor',
  async (floorData, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      
      const response = await fetch(`${API_BASE_URL}/floors`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(floorData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error?.message || 'Failed to create floor');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const updateFloor = createAsyncThunk(
  'floors/updateFloor',
  async ({ id, ...floorData }, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      
      const response = await fetch(`${API_BASE_URL}/floors/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(floorData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error?.message || 'Failed to update floor');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const deleteFloor = createAsyncThunk(
  'floors/deleteFloor',
  async (floorId, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      
      const response = await fetch(`${API_BASE_URL}/floors/${floorId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error?.message || 'Failed to delete floor');
      }

      return floorId;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

const initialState = {
  floors: [],
  loading: false,
  error: null,
  lastFetch: null
};

const floorsSlice = createSlice({
  name: 'floors',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearFloors: (state) => {
      state.floors = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Floors
      .addCase(fetchFloors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFloors.fulfilled, (state, action) => {
        state.loading = false;
        state.floors = action.payload;
        state.lastFetch = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchFloors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create Floor
      .addCase(createFloor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createFloor.fulfilled, (state, action) => {
        state.loading = false;
        state.floors.push(action.payload);
        state.error = null;
      })
      .addCase(createFloor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Floor
      .addCase(updateFloor.fulfilled, (state, action) => {
        const index = state.floors.findIndex(floor => floor.id === action.payload.id);
        if (index !== -1) {
          state.floors[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateFloor.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Delete Floor
      .addCase(deleteFloor.fulfilled, (state, action) => {
        state.floors = state.floors.filter(floor => floor.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteFloor.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearError, clearFloors } = floorsSlice.actions;
export default floorsSlice.reducer; 