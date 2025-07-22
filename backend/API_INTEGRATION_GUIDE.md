# 🚀 API Integration Guide

## 📋 Overview

This guide shows how to integrate your existing Redux frontend with the new Node.js/Express/PostgreSQL backend.

## 🔗 API Base URL
- **Development**: `http://localhost:5000/api`
- **Production**: Update `.env` file with your production URL

## 📊 Current Redux State vs Backend APIs

### 🏢 Floors Management

**Redux Actions → API Endpoints**
```javascript
// Current Redux: store/slices/floorsSlice.js
addFloor() → POST /api/floors
updateFloor() → PUT /api/floors/:id  
deleteFloor() → DELETE /api/floors/:id
setFloors() → GET /api/floors?propertyId=xxx
```

**API Response Format**:
```json
{
  "success": true,
  "data": [
    {
      "id": "clxxx...",
      "floorName": "Ground Floor",
      "floorNumber": 0,
      "description": "Ground floor with common areas",
      "propertyId": "clxxx...",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "rooms": []
    }
  ],
  "count": 1
}
```

### 🏠 Rooms Management

**Redux Actions → API Endpoints**
```javascript
// Current Redux: store/slices/roomsSlice.js  
addRoom() → POST /api/rooms
updateRoom() → PUT /api/rooms/:id
deleteRoom() → DELETE /api/rooms/:id
// Get rooms → GET /api/rooms?floorId=xxx&propertyId=xxx
```

### 🛏️ Beds Management

**Redux Actions → API Endpoints**
```javascript
// Current Redux: store/slices/bedsSlice.js
addBed() → POST /api/beds
updateBed() → PUT /api/beds/:id  
deleteBed() → DELETE /api/beds/:id
assignTenantToBed() → PUT /api/beds/:id/assign
vacateBed() → PUT /api/beds/:id/vacate
```

### 👥 Tenants Management

**Redux Actions → API Endpoints**
```javascript
// Current Redux: store/slices/tenantsSlice.js
addTenant() → POST /api/tenants
updateTenant() → PUT /api/tenants/:id
deleteTenant() → DELETE /api/tenants/:id
updateTenantStatus() → PUT /api/tenants/:id/status
```

## 🔧 Frontend Integration Steps

### Step 1: Create API Service Layer

Create `src/services/api.js`:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Floor API methods
  getFloors(propertyId) {
    return this.request(`/floors?propertyId=${propertyId}`);
  }

  createFloor(floorData) {
    return this.request('/floors', {
      method: 'POST',
      body: floorData,
    });
  }

  updateFloor(id, floorData) {
    return this.request(`/floors/${id}`, {
      method: 'PUT',
      body: floorData,
    });
  }

  deleteFloor(id) {
    return this.request(`/floors/${id}`, {
      method: 'DELETE',
    });
  }

  // Room API methods
  getRooms(propertyId, floorId = null) {
    const params = new URLSearchParams({ propertyId });
    if (floorId) params.append('floorId', floorId);
    return this.request(`/rooms?${params}`);
  }

  createRoom(roomData) {
    return this.request('/rooms', {
      method: 'POST',
      body: roomData,
    });
  }

  // Add more methods for beds, tenants, etc.
}

export const apiService = new ApiService();
```

### Step 2: Update Redux Slices with Async Thunks

Update `store/slices/floorsSlice.js`:
```javascript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../../services/api';

// Async thunks
export const fetchFloors = createAsyncThunk(
  'floors/fetchFloors',
  async (propertyId, { rejectWithValue }) => {
    try {
      const response = await apiService.getFloors(propertyId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createFloor = createAsyncThunk(
  'floors/createFloor',
  async (floorData, { rejectWithValue }) => {
    try {
      const response = await apiService.createFloor(floorData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const floorsSlice = createSlice({
  name: 'floors',
  initialState: {
    floors: [],
    loading: false,
    error: null,
  },
  reducers: {
    // Keep existing reducers for local state management
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFloors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFloors.fulfilled, (state, action) => {
        state.loading = false;
        state.floors = action.payload;
      })
      .addCase(fetchFloors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createFloor.fulfilled, (state, action) => {
        state.floors.push(action.payload);
      });
  },
});
```

### Step 3: Update Components to Use Async Actions

Update your `app/rooms/page.jsx`:
```javascript
import { useDispatch } from 'react-redux';
import { fetchFloors, createFloor } from '../store/slices/floorsSlice';

// In component
const dispatch = useDispatch();

// Load floors on component mount
useEffect(() => {
  dispatch(fetchFloors('your-property-id'));
}, [dispatch]);

// Handle floor creation
const handleFloorSubmit = async (floorData) => {
  try {
    await dispatch(createFloor({
      ...floorData,
      propertyId: 'your-property-id'
    })).unwrap();
    
    // Success handling
    dispatch(addToast({
      title: 'Floor Created',
      description: 'Floor has been created successfully.',
      variant: 'success'
    }));
  } catch (error) {
    // Error handling
    dispatch(addToast({
      title: 'Error',
      description: error,
      variant: 'error'
    }));
  }
};
```

## 🗄️ Database Setup Instructions

### 1. Install PostgreSQL
```bash
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu
sudo apt update
sudo apt install postgresql postgresql-contrib
```

### 2. Create Database
```bash
psql -U postgres
CREATE DATABASE pg_management;
\q
```

### 3. Update Environment Variables
```bash
# backend/.env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/pg_management?schema=public"
```

### 4. Run Migrations
```bash
cd backend
npm run db:migrate
npm run db:generate
```

## 🔐 Authentication Integration

The backend includes authentication endpoints:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

Add JWT token handling to your API service:
```javascript
class ApiService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  async request(endpoint, options = {}) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };
    // ... rest of request method
  }
}
```

## 📈 Migration Strategy

### Phase 1: Parallel Development
- Keep existing Redux state management
- Add API integration alongside
- Test with both local and API data

### Phase 2: Gradual Migration
- Start with one entity (floors)
- Replace local Redux actions with API calls
- Verify functionality

### Phase 3: Complete Migration
- Move all entities to API
- Remove local state management
- Add offline support if needed

## 🚀 Running the Backend

```bash
cd backend

# Development
npm run dev

# Production build
npm run build
npm start

# Database operations
npm run db:migrate    # Run migrations
npm run db:generate   # Generate Prisma client
npm run db:studio     # Open Prisma Studio
npm run db:seed       # Seed database (create seed file)
```

## 📝 API Testing

Test the APIs using:
- **Postman** collections
- **Thunder Client** (VS Code extension)
- **curl** commands

Example test:
```bash
# Test health endpoint
curl http://localhost:5000/health

# Test floors endpoint (after setting up property)
curl -X GET "http://localhost:5000/api/floors?propertyId=your-property-id"
```

## 🔧 Environment Variables

```bash
# backend/.env
DATABASE_URL="postgresql://postgres:password@localhost:5432/pg_management?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

```bash
# frontend/.env.local (create this file)
REACT_APP_API_URL="http://localhost:5000/api"
```

This integration maintains your existing UI while adding robust backend functionality! 🎉 