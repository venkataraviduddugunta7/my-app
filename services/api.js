// API Service for PG Management System
import demoApiService from './demo-api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.cacheTimeout = 30000; // 30 seconds cache
  }

  // Get auth token from localStorage
  getToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  // Create cache key for requests
  getCacheKey(endpoint, options = {}) {
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    return `${method}:${endpoint}:${body}`;
  }

  // Check if request is cacheable (GET requests only)
  isCacheable(options = {}) {
    return (options.method || 'GET') === 'GET';
  }

  // Base request method with caching and deduplication
  async request(endpoint, options = {}) {
    const token = this.getToken();
    
    // Use demo API for demo mode
    if (token && token.startsWith('demo-')) {
      console.log('🎭 Demo mode - using demo API for:', endpoint);
      
      // Route to appropriate demo API method
      if (endpoint.includes('/settings/user')) {
        if (options.method === 'PUT' || options.method === 'PATCH') {
          return demoApiService.updateUserSettings(options.body);
        }
        return demoApiService.getUserSettings();
      }
      if (endpoint.includes('/settings/property')) {
        const propertyId = endpoint.split('/').pop();
        if (options.method === 'PUT' || options.method === 'PATCH') {
          return demoApiService.updatePropertySettings(propertyId, options.body);
        }
        return demoApiService.getPropertySettings(propertyId);
      }
      if (endpoint.includes('/dashboard/stats')) {
        return demoApiService.getDashboardStats();
      }
      if (endpoint.includes('/properties')) {
        if (options.method === 'POST') {
          return demoApiService.createProperty(options.body);
        }
        if (options.method === 'PUT' || options.method === 'PATCH') {
          const propertyId = endpoint.split('/').pop();
          return demoApiService.updateProperty(propertyId, options.body);
        }
        if (options.method === 'DELETE') {
          const propertyId = endpoint.split('/').pop();
          return demoApiService.deleteProperty(propertyId);
        }
        return demoApiService.getProperties();
      }
      
      // Default demo response
      return {
        success: true,
        data: null,
        message: 'Demo mode - no API call made'
      };
    }
    
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    console.log('🔧 API Request:', {
      method: config.method || 'GET',
      url,
      hasToken: !!token
    });

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      console.log('📡 API Response:', {
        status: response.status,
        ok: response.ok,
        url
      });

      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      // Only log errors in development, not in production
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ API Error (Dev Mode):', {
          url,
          error: error.message
        });
      }
      throw error;
    }
  }

  // Actual HTTP request
  async makeRequest(url, config, cacheKey) {
    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Handle rate limiting specifically
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After') || 60;
          throw new Error(`Rate limit exceeded. Please try again in ${retryAfter} seconds.`);
        }
        throw new Error(data.error?.message || data.message || 'API request failed');
      }

      // Cache successful GET requests
      if (this.isCacheable(config)) {
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  // Clear specific cache entries
  clearCacheByPattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // HTTP Methods
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: data,
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data,
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Authentication endpoints
  auth = {
    login: (data) => this.post('/auth/login', data),
    register: (data) => this.post('/auth/register', data),
    logout: () => this.post('/auth/logout'),
    getProfile: () => this.get('/auth/me'),
    updateProfile: (data) => this.put('/auth/profile', data),
    changePassword: (data) => this.post('/auth/change-password', data)
  };

  // Floor APIs
  floors = {
    getAll: (propertyId) => this.get(`/floors?propertyId=${propertyId}`),
    getById: (id) => this.get(`/floors/${id}`),
    create: (floorData) => this.post('/floors', floorData),
    update: (id, floorData) => this.put(`/floors/${id}`, floorData),
    delete: (id) => this.delete(`/floors/${id}`),
  };

  // Room APIs
  rooms = {
    getAll: (floorId) => this.get(`/rooms?floorId=${floorId}`),
    getById: (id) => this.get(`/rooms/${id}`),
    create: (roomData) => this.post('/rooms', roomData),
    update: (id, roomData) => this.put(`/rooms/${id}`, roomData),
    delete: (id) => this.delete(`/rooms/${id}`),
  };

  // Bed APIs
  beds = {
    getAll: (roomId) => this.get(`/beds?roomId=${roomId}`),
    getById: (id) => this.get(`/beds/${id}`),
    create: (bedData) => this.post('/beds', bedData),
    update: (id, bedData) => this.put(`/beds/${id}`, bedData),
    delete: (id) => this.delete(`/beds/${id}`),
    assign: (id, tenantId) => this.put(`/beds/${id}/assign`, { tenantId }),
    unassign: (id) => this.put(`/beds/${id}/unassign`),
  };

  // Tenant APIs
  tenants = {
    getAll: () => this.get('/tenants'),
    getById: (id) => this.get(`/tenants/${id}`),
    create: (tenantData) => this.post('/tenants', tenantData),
    update: (id, tenantData) => this.put(`/tenants/${id}`, tenantData),
    delete: (id) => this.delete(`/tenants/${id}`),
  };

  // Payment APIs
  payments = {
    getAll: () => this.get('/payments'),
    getById: (id) => this.get(`/payments/${id}`),
    create: (paymentData) => this.post('/payments', paymentData),
    update: (id, paymentData) => this.put(`/payments/${id}`, paymentData),
    delete: (id) => this.delete(`/payments/${id}`),
  };

  // Dashboard endpoints
  dashboard = {
    getStats: (propertyId) => this.get(`/dashboard/stats${propertyId ? `?propertyId=${propertyId}` : ''}`),
    getRecentActivities: (propertyId, limit = 20) => this.get(`/dashboard/activities${propertyId ? `?propertyId=${propertyId}&limit=${limit}` : `?limit=${limit}`}`),
    getOccupancyTrends: (propertyId, months = 6) => this.get(`/dashboard/occupancy-trends${propertyId ? `?propertyId=${propertyId}&months=${months}` : `?months=${months}`}`),
    getRevenueTrends: (propertyId, months = 6) => this.get(`/dashboard/revenue-trends${propertyId ? `?propertyId=${propertyId}&months=${months}` : `?months=${months}`}`),
    getUserSettings: () => this.get('/dashboard/user-settings'),
    updateUserSettings: (data) => this.put('/dashboard/user-settings', data),
    
    // Batch fetch dashboard data to reduce API calls
    getDashboardData: async (propertyId) => {
      try {
        const [stats, activities, settings] = await Promise.all([
          this.get(`/dashboard/stats${propertyId ? `?propertyId=${propertyId}` : ''}`),
          this.get(`/dashboard/activities${propertyId ? `?propertyId=${propertyId}&limit=20` : '?limit=20'}`),
          this.get('/dashboard/user-settings')
        ]);
        
        return {
          stats: stats.data,
          activities: activities.data,
          settings: settings.data
        };
      } catch (error) {
        console.error('Batch dashboard fetch failed:', error);
        throw error;
      }
    }
  };

  // Settings endpoints
  settings = {
    getPropertySettings: (propertyId) => this.get(`/settings/property/${propertyId}`),
    updatePropertySettings: (propertyId, data) => this.put(`/settings/property/${propertyId}`, data),
    getTermsAndConditions: (propertyId) => this.get(`/settings/terms/${propertyId}`),
    getUserSettings: () => this.get('/settings/user'),
    updateUserSettings: (data) => this.put('/settings/user', data),
    getPropertyRules: (propertyId) => this.get(`/settings/property/${propertyId}/rules`),
    updatePropertyRules: (propertyId, data) => this.put(`/settings/property/${propertyId}/rules`, data),
    getDashboardSettings: () => this.get('/settings/dashboard'),
    updateDashboardSettings: (data) => this.put('/settings/dashboard', data)
  };
}

// Create and export singleton instance
const apiService = new ApiService();
export default apiService; 