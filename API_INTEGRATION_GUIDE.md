// API Service for PG Management System
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
  }

  // Set auth token
  setToken(token) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  // Get auth token
  getToken() {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  // Remove auth token
  removeToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  // Base request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
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
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // GET request
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: data,
    });
  }

  // PUT request
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data,
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Authentication APIs
  auth = {
    login: (credentials) => this.post('/auth/login', credentials),
    register: (userData) => this.post('/auth/register', userData),
    logout: () => this.post('/auth/logout'),
    getProfile: () => this.get('/auth/me'),
  };

  // User APIs
  users = {
    getAll: () => this.get('/users'),
    getById: (id) => this.get(`/users/${id}`),
    create: (userData) => this.post('/users', userData),
    update: (id, userData) => this.put(`/users/${id}`, userData),
    delete: (id) => this.delete(`/users/${id}`),
  };

  // Property APIs
  properties = {
    getAll: () => this.get('/properties'),
    getById: (id) => this.get(`/properties/${id}`),
    create: (propertyData) => this.post('/properties', propertyData),
    update: (id, propertyData) => this.put(`/properties/${id}`, propertyData),
    delete: (id) => this.delete(`/properties/${id}`),
    getSettings: (id) => this.get(`/properties/${id}/settings`),
    updateSettings: (id, settings) => this.put(`/properties/${id}/settings`, settings),
  };

  // Floor APIs
  floors = {
    getAll: () => this.get('/floors'),
    getById: (id) => this.get(`/floors/${id}`),
    getByProperty: (propertyId) => this.get(`/properties/${propertyId}/floors`),
    create: (floorData) => this.post('/floors', floorData),
    update: (id, floorData) => this.put(`/floors/${id}`, floorData),
    delete: (id) => this.delete(`/floors/${id}`),
  };

  // Room APIs
  rooms = {
    getAll: () => this.get('/rooms'),
    getById: (id) => this.get(`/rooms/${id}`),
    getByFloor: (floorId) => this.get(`/floors/${floorId}/rooms`),
    create: (roomData) => this.post('/rooms', roomData),
    update: (id, roomData) => this.put(`/rooms/${id}`, roomData),
    delete: (id) => this.delete(`/rooms/${id}`),
  };

  // Bed APIs
  beds = {
    getAll: () => this.get('/beds'),
    getById: (id) => this.get(`/beds/${id}`),
    getByRoom: (roomId) => this.get(`/rooms/${roomId}/beds`),
    create: (bedData) => this.post('/beds', bedData),
    update: (id, bedData) => this.put(`/beds/${id}`, bedData),
    delete: (id) => this.delete(`/beds/${id}`),
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
    getByTenant: (tenantId) => this.get(`/tenants/${tenantId}/payments`),
    create: (paymentData) => this.post('/payments', paymentData),
    update: (id, paymentData) => this.put(`/payments/${id}`, paymentData),
    delete: (id) => this.delete(`/payments/${id}`),
  };

  // Notice APIs
  notices = {
    getAll: () => this.get('/notices'),
    getById: (id) => this.get(`/notices/${id}`),
    create: (noticeData) => this.post('/notices', noticeData),
    update: (id, noticeData) => this.put(`/notices/${id}`, noticeData),
    delete: (id) => this.delete(`/notices/${id}`),
    publish: (id) => this.put(`/notices/${id}/publish`),
    markAsRead: (id, tenantId) => this.put(`/notices/${id}/read`, { tenantId }),
  };

  // Document APIs
  documents = {
    getAll: () => this.get('/documents'),
    getById: (id) => this.get(`/documents/${id}`),
    create: (documentData) => this.post('/documents', documentData),
    update: (id, documentData) => this.put(`/documents/${id}`, documentData),
    delete: (id) => this.delete(`/documents/${id}`),
    download: (id) => this.get(`/documents/${id}/download`),
  };

  // Dashboard APIs
  dashboard = {
    getStats: () => this.get('/dashboard/stats'),
    getRecentActivities: () => this.get('/dashboard/activities'),
    getOccupancyTrends: () => this.get('/dashboard/occupancy'),
    getRevenueTrends: () => this.get('/dashboard/revenue'),
  };
}

// Create and export singleton instance
const apiService = new ApiService();
export default apiService; 