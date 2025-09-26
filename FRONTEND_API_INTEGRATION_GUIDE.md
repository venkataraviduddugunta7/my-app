# 🚀 Frontend API Integration Guide

## ✅ **COMPLETED SETUP**

### **Dependencies Installed:**
- ✅ `axios` - HTTP client for API requests
- ✅ Backend dependencies (multer, zod, @types/multer)
- ✅ Environment configuration files created

### **API Service Layer Created:**
- ✅ `services/apiClient.js` - Core HTTP client with interceptors
- ✅ `services/authService.js` - Authentication management
- ✅ `services/propertyService.js` - Property, floor, room, bed operations
- ✅ `services/tenantService.js` - Tenant lifecycle management
- ✅ `services/paymentService.js` - Payment processing & analytics
- ✅ `services/dashboardService.js` - Dashboard data & analytics

### **Backend API Ready:**
- ✅ Complete REST API with all endpoints
- ✅ JWT authentication system
- ✅ Database schema and migrations
- ✅ File upload handling
- ✅ Error handling and validation

---

## 🔄 **NEXT STEPS: Frontend Integration**

### **Step 1: Update Redux Store to Use Real APIs**

#### **1.1 Update Auth Slice (`store/slices/authSlice.js`)**

```javascript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { AuthService } from '../../services/authService';

// Async thunks for API calls
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const result = await AuthService.login(credentials);
      if (!result.success) {
        return rejectWithValue(result.message);
      }
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const result = await AuthService.register(userData);
      if (!result.success) {
        return rejectWithValue(result.message);
      }
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const result = await AuthService.getProfile();
      if (!result.success) {
        return rejectWithValue(result.message);
      }
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: AuthService.getCurrentUser(),
    token: AuthService.getToken(),
    isAuthenticated: AuthService.isAuthenticated(),
    loading: false,
    error: null
  },
  reducers: {
    logout: (state) => {
      AuthService.logout();
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      // Register cases
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get current user cases
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
      });
  }
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
```

#### **1.2 Update Property Slice (`store/slices/propertySlice.js`)**

```javascript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { PropertyService } from '../../services/propertyService';

// Async thunks
export const fetchProperties = createAsyncThunk(
  'properties/fetchProperties',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const result = await PropertyService.getProperties(filters);
      if (!result.success) {
        return rejectWithValue(result.message);
      }
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createProperty = createAsyncThunk(
  'properties/createProperty',
  async (propertyData, { rejectWithValue }) => {
    try {
      const result = await PropertyService.createProperty(propertyData);
      if (!result.success) {
        return rejectWithValue(result.message);
      }
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateProperty = createAsyncThunk(
  'properties/updateProperty',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const result = await PropertyService.updateProperty(id, data);
      if (!result.success) {
        return rejectWithValue(result.message);
      }
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const propertySlice = createSlice({
  name: 'properties',
  initialState: {
    properties: [],
    selectedProperty: null,
    floors: [],
    loading: false,
    error: null,
    pagination: {}
  },
  reducers: {
    setSelectedProperty: (state, action) => {
      state.selectedProperty = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProperties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProperties.fulfilled, (state, action) => {
        state.loading = false;
        state.properties = action.payload.properties;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProperties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createProperty.fulfilled, (state, action) => {
        state.properties.push(action.payload.property);
      })
      .addCase(updateProperty.fulfilled, (state, action) => {
        const index = state.properties.findIndex(p => p.id === action.payload.property.id);
        if (index !== -1) {
          state.properties[index] = action.payload.property;
        }
      });
  }
});

export const { setSelectedProperty, clearError } = propertySlice.actions;
export default propertySlice.reducer;
```

#### **1.3 Update Dashboard Slice (`store/slices/dashboardSlice.js`)**

```javascript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { DashboardService } from '../../services/dashboardService';

export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchDashboardData',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const result = await DashboardService.getDashboardData(filters);
      if (!result.success) {
        return rejectWithValue(result.message);
      }
      return result.dashboard;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchQuickStats = createAsyncThunk(
  'dashboard/fetchQuickStats',
  async (propertyId = null, { rejectWithValue }) => {
    try {
      const result = await DashboardService.getQuickStats(propertyId);
      if (!result.success) {
        return rejectWithValue(result.message);
      }
      return result.stats;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    stats: {
      totalProperties: 0,
      totalBeds: 0,
      occupiedBeds: 0,
      activeTenants: 0,
      monthlyRevenue: 0,
      occupancyRate: 0
    },
    recentActivity: [],
    upcomingDues: [],
    loading: false,
    error: null
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.summary;
        state.recentActivity = action.payload.recentActivity;
        state.upcomingDues = action.payload.upcomingDues;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchQuickStats.fulfilled, (state, action) => {
        state.stats = { ...state.stats, ...action.payload };
      });
  }
});

export const { clearError } = dashboardSlice.actions;
export default dashboardSlice.reducer;
```

### **Step 2: Update Page Components**

#### **2.1 Update Login Page (`app/login/page.jsx`)**

```javascript
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../../store/slices/authSlice';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    identifier: '', // email or username
    password: ''
  });

  const dispatch = useDispatch();
  const router = useRouter();
  const { loading, error, isAuthenticated } = useSelector(state => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    
    const result = await dispatch(loginUser(formData));
    if (loginUser.fulfilled.match(result)) {
      router.push('/');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="mt-2 text-gray-600">Sign in to your MY PG account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <Input
            label="Email or Username"
            type="text"
            name="identifier"
            value={formData.identifier}
            onChange={handleChange}
            required
            placeholder="Enter your email or username"
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Enter your password"
          />

          <Button
            type="submit"
            className="w-full"
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        <div className="text-center">
          <a href="/signup" className="text-primary-600 hover:text-primary-500">
            Don't have an account? Sign up
          </a>
        </div>
      </div>
    </div>
  );
}
```

#### **2.2 Update Dashboard Page (`app/page.jsx`)**

Replace the dummy data fetching with real API calls:

```javascript
// Add these imports at the top
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardData } from '../store/slices/dashboardSlice';

// Inside the Dashboard component, replace dummy data with:
const dispatch = useDispatch();
const { stats, recentActivity, upcomingDues, loading, error } = useSelector(state => state.dashboard);

useEffect(() => {
  dispatch(fetchDashboardData());
}, [dispatch]);

// Use the real data from Redux store instead of dummy data
```

#### **2.3 Update Properties Page (`app/properties/page.jsx`)**

```javascript
// Add these imports
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProperties, createProperty, updateProperty } from '../store/slices/propertySlice';

// Inside the component
const dispatch = useDispatch();
const { properties, loading, error } = useSelector(state => state.properties);

useEffect(() => {
  dispatch(fetchProperties());
}, [dispatch]);

// Update form submission handlers to use real API calls
const handleCreateProperty = async (propertyData) => {
  const result = await dispatch(createProperty(propertyData));
  if (createProperty.fulfilled.match(result)) {
    setShowAddModal(false);
    // Show success message
  }
};
```

### **Step 3: Authentication Flow**

#### **3.1 Update App Layout (`components/layout/AppLayout.jsx`)**

```javascript
'use client';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '../../store/slices/authSlice';

export default function AppLayout({ children }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const { isAuthenticated, loading, user } = useSelector(state => state.auth);

  useEffect(() => {
    // Check authentication on app load
    if (!isAuthenticated && !loading) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, isAuthenticated, loading]);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Your existing layout */}
      {children}
    </div>
  );
}
```

### **Step 4: Testing the Integration**

1. **Start both servers:**
   ```bash
   # Backend (already running)
   cd backend && npm run dev-ts

   # Frontend (in another terminal)
   npm run dev
   ```

2. **Test the flow:**
   - Navigate to `http://localhost:3001/login`
   - Try to register a new user
   - Login with the created user
   - Check if dashboard loads with real data
   - Test property creation and management

### **Step 5: Error Handling & Loading States**

Add proper error handling and loading states to all components:

```javascript
// Example loading state component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
  </div>
);

// Example error state component
const ErrorMessage = ({ message, onRetry }) => (
  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
    <p>{message}</p>
    {onRetry && (
      <button 
        onClick={onRetry}
        className="mt-2 text-sm underline hover:no-underline"
      >
        Try Again
      </button>
    )}
  </div>
);
```

---

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **CORS Errors:** Make sure backend allows frontend origin
2. **Authentication Errors:** Check JWT secret and token storage
3. **API Connection:** Verify backend is running on port 9000
4. **Database Issues:** Ensure PostgreSQL is running and migrations are applied

### **Environment Setup:**

Make sure these files exist:
- `/.env.local` (frontend)
- `/backend/.env` (backend)

### **Database Setup:**

```bash
cd backend
npx prisma migrate dev
npx prisma generate
npx prisma db seed
```

---

## 🎉 **You're Ready!**

Once you complete these steps, your PG management system will be fully integrated with real data and ready for production use!

The system now supports:
- ✅ Real user authentication
- ✅ Property management with real data
- ✅ Tenant lifecycle management
- ✅ Payment processing and tracking
- ✅ Document management
- ✅ Real-time dashboard analytics
- ✅ Enterprise-level security and validation
