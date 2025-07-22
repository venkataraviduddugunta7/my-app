import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Async thunks for API calls
export const fetchBeds = createAsyncThunk(
  'beds/fetchBeds',
  async ({ propertyId, roomId } = {}, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const url = new URL(`${API_BASE_URL}/beds`);
      if (propertyId) url.searchParams.append('propertyId', propertyId);
      if (roomId) url.searchParams.append('roomId', roomId);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error?.message || 'Failed to fetch beds');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const addBed = createAsyncThunk(
  'beds/addBed',
  async (bedData, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      
      const response = await fetch(`${API_BASE_URL}/beds`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bedData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error?.message || 'Failed to create bed');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const updateBed = createAsyncThunk(
  'beds/updateBed',
  async ({ id, ...bedData }, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      
      const response = await fetch(`${API_BASE_URL}/beds/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bedData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error?.message || 'Failed to update bed');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const deleteBed = createAsyncThunk(
  'beds/deleteBed',
  async (bedId, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      
      const response = await fetch(`${API_BASE_URL}/beds/${bedId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error?.message || 'Failed to delete bed');
      }

      return bedId;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

const initialState = {
  beds: [],
  loading: false,
  error: null
};

const bedsSlice = createSlice({
  name: 'beds',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearBeds: (state) => {
      state.beds = [];
    },
    // Local actions for quick updates (will be synced with server)
    assignTenantToBed: (state, action) => {
      const { bedId, tenantId } = action.payload;
      const bedIndex = state.beds.findIndex(bed => bed.id === bedId);
      if (bedIndex !== -1) {
        state.beds[bedIndex].tenantId = tenantId;
        state.beds[bedIndex].status = 'Occupied';
      }
    },
    vacateBed: (state, action) => {
      const bedIndex = state.beds.findIndex(bed => bed.id === action.payload);
      if (bedIndex !== -1) {
        state.beds[bedIndex].tenantId = null;
        state.beds[bedIndex].status = 'Available';
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Beds
      .addCase(fetchBeds.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBeds.fulfilled, (state, action) => {
        state.loading = false;
        state.beds = action.payload;
        state.error = null;
      })
      .addCase(fetchBeds.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Add Bed
      .addCase(addBed.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addBed.fulfilled, (state, action) => {
        state.loading = false;
        state.beds.push(action.payload);
        state.error = null;
      })
      .addCase(addBed.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Bed
      .addCase(updateBed.fulfilled, (state, action) => {
        const index = state.beds.findIndex(bed => bed.id === action.payload.id);
        if (index !== -1) {
          state.beds[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateBed.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Delete Bed
      .addCase(deleteBed.fulfilled, (state, action) => {
        state.beds = state.beds.filter(bed => bed.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteBed.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearError, clearBeds, assignTenantToBed, vacateBed } = bedsSlice.actions;
export default bedsSlice.reducer; 