import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api';

// Async thunks for API calls
export const fetchProperties = createAsyncThunk(
  'property/fetchProperties',
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      
      const response = await fetch(`${API_BASE_URL}/properties`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error?.message || 'Failed to fetch properties');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const createProperty = createAsyncThunk(
  'property/createProperty',
  async (propertyData, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      
      const response = await fetch(`${API_BASE_URL}/properties`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(propertyData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error?.message || 'Failed to create property');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const updateProperty = createAsyncThunk(
  'property/updateProperty',
  async ({ id, ...propertyData }, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      
      const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(propertyData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error?.message || 'Failed to update property');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const deleteProperty = createAsyncThunk(
  'property/deleteProperty',
  async (id, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      
      const response = await fetch(`${API_BASE_URL}/properties/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error?.message || 'Failed to delete property');
      }

      return id;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

const initialState = {
  properties: [],
  selectedProperty: null,
  loading: false,
  error: null,
  lastFetch: null
};

const propertySlice = createSlice({
  name: 'property',
  initialState,
  reducers: {
    selectProperty: (state, action) => {
      const property = state.properties.find(p => p.id === action.payload);
      if (property) {
        state.selectedProperty = property;
        localStorage.setItem('selectedPropertyId', property.id);
      }
    },
    setSelectedProperty: (state, action) => {
      // Set property directly (for demo mode)
      state.selectedProperty = action.payload;
      if (action.payload?.id) {
        localStorage.setItem('selectedPropertyId', action.payload.id);
      }
    },
    clearSelectedProperty: (state) => {
      state.selectedProperty = null;
      localStorage.removeItem('selectedPropertyId');
    },
    clearError: (state) => {
      state.error = null;
    },
    clearProperties: (state) => {
      state.properties = [];
      state.selectedProperty = null;
    },
    // Auto-select property from localStorage or first property
    autoSelectProperty: (state) => {
      if (state.properties.length > 0 && !state.selectedProperty) {
        const savedPropertyId = localStorage.getItem('selectedPropertyId');
        let propertyToSelect = null;
        
        if (savedPropertyId) {
          propertyToSelect = state.properties.find(p => p.id === savedPropertyId);
        }
        
        // If saved property not found, select first property
        if (!propertyToSelect) {
          propertyToSelect = state.properties[0];
        }
        
        if (propertyToSelect) {
          state.selectedProperty = propertyToSelect;
          localStorage.setItem('selectedPropertyId', propertyToSelect.id);
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Properties
      .addCase(fetchProperties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProperties.fulfilled, (state, action) => {
        state.loading = false;
        state.properties = action.payload;
        state.lastFetch = new Date().toISOString();
        state.error = null;
        
        // Auto-select property if none selected
        if (action.payload.length > 0 && !state.selectedProperty) {
          const savedPropertyId = localStorage.getItem('selectedPropertyId');
          let propertyToSelect = null;
          
          if (savedPropertyId) {
            propertyToSelect = action.payload.find(p => p.id === savedPropertyId);
          }
          
          // If saved property not found, select first property
          if (!propertyToSelect) {
            propertyToSelect = action.payload[0];
          }
          
          if (propertyToSelect) {
            state.selectedProperty = propertyToSelect;
            localStorage.setItem('selectedPropertyId', propertyToSelect.id);
          }
        }
      })
      .addCase(fetchProperties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create Property
      .addCase(createProperty.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProperty.fulfilled, (state, action) => {
        state.loading = false;
        state.properties.push(action.payload);
        
        // Auto-select the newly created property if no property is selected
        if (!state.selectedProperty) {
          state.selectedProperty = action.payload;
          localStorage.setItem('selectedPropertyId', action.payload.id);
        }
        
        state.error = null;
      })
      .addCase(createProperty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Property
      .addCase(updateProperty.fulfilled, (state, action) => {
        const index = state.properties.findIndex(property => property.id === action.payload.id);
        if (index !== -1) {
          state.properties[index] = action.payload;
          
          // Update selected property if it's the one being updated
          if (state.selectedProperty?.id === action.payload.id) {
            state.selectedProperty = action.payload;
          }
        }
        state.error = null;
      })
      .addCase(updateProperty.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Delete Property
      .addCase(deleteProperty.fulfilled, (state, action) => {
        state.properties = state.properties.filter(property => property.id !== action.payload);
        
        // Clear selected property if it was deleted
        if (state.selectedProperty?.id === action.payload) {
          state.selectedProperty = null;
          localStorage.removeItem('selectedPropertyId');
          
          // Auto-select first remaining property
          if (state.properties.length > 0) {
            state.selectedProperty = state.properties[0];
            localStorage.setItem('selectedPropertyId', state.properties[0].id);
          }
        }
        
        state.error = null;
      })
      .addCase(deleteProperty.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { 
  selectProperty,
  setSelectedProperty, 
  clearSelectedProperty, 
  clearError, 
  clearProperties, 
  autoSelectProperty 
} = propertySlice.actions;

export default propertySlice.reducer; 