import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api';

// Async thunks for API calls
export const fetchTenants = createAsyncThunk(
  'tenants/fetchTenants',
  async ({ propertyId, bedId, status } = {}, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const url = new URL(`${API_BASE_URL}/tenants`);
      
      if (propertyId) url.searchParams.append('propertyId', propertyId);
      if (bedId) url.searchParams.append('bedId', bedId);
      if (status) url.searchParams.append('status', status);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error?.message || 'Failed to fetch tenants');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const createTenant = createAsyncThunk(
  'tenants/createTenant',
  async (tenantData, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      
      const response = await fetch(`${API_BASE_URL}/tenants`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tenantData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error?.message || 'Failed to create tenant');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const updateTenant = createAsyncThunk(
  'tenants/updateTenant',
  async ({ id, ...tenantData }, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      
      const response = await fetch(`${API_BASE_URL}/tenants/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tenantData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error?.message || 'Failed to update tenant');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const deleteTenant = createAsyncThunk(
  'tenants/deleteTenant',
  async (tenantId, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      
      const response = await fetch(`${API_BASE_URL}/tenants/${tenantId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error?.message || 'Failed to delete tenant');
      }

      return tenantId;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const vacateTenant = createAsyncThunk(
  'tenants/vacateTenant',
  async ({ id, leavingDate, reason }, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      
      const response = await fetch(`${API_BASE_URL}/tenants/${id}/vacate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leavingDate, reason }),
      });

      const data = await response.json();
      console.log('🔧 Vacate tenant API response:', data);

      if (!response.ok) {
        return rejectWithValue(data.error?.message || 'Failed to vacate tenant');
      }

      return data.data; // Return the data object which contains tenant info
    } catch (error) {
      console.error('🔧 Vacate tenant error:', error);
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const assignTenantToBed = createAsyncThunk(
  'tenants/assignTenantToBed',
  async ({ tenantId, bedId }, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      
      const response = await fetch(`${API_BASE_URL}/tenants/${tenantId}/assign-bed`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bedId }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error?.message || 'Failed to assign tenant to bed');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

const initialState = {
  tenants: [],
  loading: false,
  error: null
};

const tenantsSlice = createSlice({
  name: 'tenants',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearTenants: (state) => {
      state.tenants = [];
    },
    // Real-time update actions
    updateTenantRealtime: (state, action) => {
      const index = state.tenants.findIndex(tenant => tenant.id === action.payload.id);
      if (index !== -1) {
        state.tenants[index] = { ...state.tenants[index], ...action.payload };
      }
    },
    addTenantRealtime: (state, action) => {
      const existingIndex = state.tenants.findIndex(tenant => tenant.id === action.payload.id);
      if (existingIndex === -1) {
        state.tenants.unshift(action.payload); // Add to beginning for recent items first
      }
    },
    removeTenantRealtime: (state, action) => {
      state.tenants = state.tenants.filter(tenant => tenant.id !== action.payload);
    },
    updateTenantStatus: (state, action) => {
      const { id, status, leavingDate } = action.payload;
      const tenantIndex = state.tenants.findIndex(tenant => tenant.id === id);
      
      if (tenantIndex !== -1) {
        state.tenants[tenantIndex] = {
          ...state.tenants[tenantIndex],
          status,
          ...(leavingDate && { leavingDate }),
          ...(status === 'VACATED' && { isActive: false })
        };
      }
    },
    // Bulk operations for performance
    updateMultipleTenants: (state, action) => {
      const updates = action.payload;
      updates.forEach(update => {
        const tenantIndex = state.tenants.findIndex(tenant => tenant.id === update.id);
        if (tenantIndex !== -1) {
          state.tenants[tenantIndex] = { ...state.tenants[tenantIndex], ...update };
        }
      });
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Tenants
      .addCase(fetchTenants.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTenants.fulfilled, (state, action) => {
        state.loading = false;
        state.tenants = action.payload;
        state.error = null;
      })
      .addCase(fetchTenants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create Tenant
      .addCase(createTenant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTenant.fulfilled, (state, action) => {
        state.loading = false;
        state.tenants.push(action.payload);
        state.error = null;
      })
      .addCase(createTenant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Tenant
      .addCase(updateTenant.fulfilled, (state, action) => {
        const index = state.tenants.findIndex(tenant => tenant.id === action.payload.id);
        if (index !== -1) {
          state.tenants[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateTenant.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Delete Tenant
      .addCase(deleteTenant.fulfilled, (state, action) => {
        state.tenants = state.tenants.filter(tenant => tenant.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteTenant.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Assign Tenant to Bed
      .addCase(assignTenantToBed.fulfilled, (state, action) => {
        const index = state.tenants.findIndex(tenant => tenant.id === action.payload.id);
        if (index !== -1) {
          state.tenants[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(assignTenantToBed.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Vacate Tenant
      .addCase(vacateTenant.fulfilled, (state, action) => {
        const tenantData = action.payload.tenant; // Backend returns { data: { tenant: {...} } }
        const index = state.tenants.findIndex(tenant => tenant.id === tenantData.id);
        if (index !== -1) {
          // Update the tenant with new status and leaving date
          state.tenants[index] = {
            ...state.tenants[index],
            ...tenantData,
            status: 'VACATED',
            leavingDate: tenantData.leavingDate
          };
        }
        state.error = null;
      })
      .addCase(vacateTenant.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { 
  clearError, 
  clearTenants, 
  updateTenantRealtime, 
  addTenantRealtime, 
  removeTenantRealtime, 
  updateTenantStatus, 
  updateMultipleTenants 
} = tenantsSlice.actions;
export default tenantsSlice.reducer; 