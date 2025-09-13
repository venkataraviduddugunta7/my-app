// Property Service for PG Management System
import apiService from './api';
import demoApiService from './demo-api';

class PropertyService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 seconds
  }

  // Get auth token
  getToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  // Check if in demo mode
  isDemoMode() {
    // Check for explicit demo mode flag in localStorage
    if (typeof window !== 'undefined') {
      const demoMode = localStorage.getItem('demo_mode');
      if (demoMode === 'true') {
        console.log('🎭 Demo mode enabled via localStorage flag');
        return true;
      }
    }
    
    const token = this.getToken();
    // Only use demo mode if explicitly using a demo token
    // For real users, always use the real API
    const isDemo = token && token.startsWith('demo-');
    console.log('🔍 Demo mode check:', { isDemo, hasToken: !!token, tokenPrefix: token?.substring(0, 10) });
    return isDemo;
  }

  // Cache management
  getCacheKey(method, ...args) {
    return `${method}:${args.join(':')}`;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  getCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get all properties
  async getProperties() {
    const cacheKey = this.getCacheKey('getProperties');
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      let response;
      const isDemo = this.isDemoMode();
      console.log('Property Service - Demo Mode:', isDemo, 'Token:', this.getToken());
      
      if (isDemo) {
        response = await demoApiService.getProperties();
        console.log('Demo API Response:', response);
      } else {
        response = await apiService.get('/properties');
      }

      const result = {
        success: response.success,
        data: response.data || [],
        count: response.count || response.data?.length || 0
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }
  }

  // Get property by ID
  async getProperty(id) {
    const cacheKey = this.getCacheKey('getProperty', id);
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      let response;
      if (this.isDemoMode()) {
        const properties = await demoApiService.getProperties();
        const property = properties.data.find(p => p.id === id);
        response = {
          success: !!property,
          data: property
        };
      } else {
        response = await apiService.get(`/properties/${id}`);
      }

      const result = {
        success: response.success,
        data: response.data
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching property:', error);
      throw error;
    }
  }

  // Create property
  async createProperty(propertyData) {
    try {
      let response;
      const isDemo = this.isDemoMode();
      console.log('Create Property - Demo Mode:', isDemo, 'Token:', this.getToken());
      
      if (isDemo) {
        response = await demoApiService.createProperty(propertyData);
        console.log('Demo Create Response:', response);
      } else {
        response = await apiService.post('/properties', propertyData);
      }

      // Clear cache after creating
      this.clearCache();

      return {
        success: response.success,
        data: response.data,
        message: response.message || 'Property created successfully'
      };
    } catch (error) {
      console.error('Error creating property:', error);
      throw error;
    }
  }

  // Update property
  async updateProperty(id, propertyData) {
    try {
      let response;
      if (this.isDemoMode()) {
        response = await demoApiService.updateProperty(id, propertyData);
      } else {
        response = await apiService.put(`/properties/${id}`, propertyData);
      }

      // Clear cache after updating
      this.clearCache();

      return {
        success: response.success,
        data: response.data,
        message: response.message || 'Property updated successfully'
      };
    } catch (error) {
      console.error('Error updating property:', error);
      throw error;
    }
  }

  // Delete property
  async deleteProperty(id) {
    try {
      let response;
      const isDemo = this.isDemoMode();
      console.log('Delete Property - Demo Mode:', isDemo, 'Token:', this.getToken());
      
      if (isDemo) {
        response = await demoApiService.deleteProperty(id);
        console.log('Demo Delete Response:', response);
      } else {
        response = await apiService.delete(`/properties/${id}`);
        console.log('Real API Delete Response:', response);
      }

      // Clear cache after deleting
      this.clearCache();

      return {
        success: response.success,
        message: response.message || 'Property deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting property:', error);
      throw error;
    }
  }

  // Get property statistics
  async getPropertyStats(propertyId) {
    const cacheKey = this.getCacheKey('getPropertyStats', propertyId);
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      let response;
      if (this.isDemoMode()) {
        // Calculate stats from demo data
        const properties = await demoApiService.getProperties();
        const property = properties.data.find(p => p.id === propertyId);
        
        if (!property) {
          throw new Error('Property not found');
        }

        response = {
          success: true,
          data: {
            totalBeds: property.totalBeds || 0,
            occupiedBeds: property.occupiedBeds || 0,
            availableBeds: (property.totalBeds || 0) - (property.occupiedBeds || 0),
            occupancyRate: property.totalBeds ? 
              ((property.occupiedBeds || 0) / property.totalBeds * 100) : 0,
            monthlyRevenue: (property.occupiedBeds || 0) * (property.monthlyRent || 0),
            totalFloors: property.totalFloors || 0,
            totalRooms: property.totalRooms || 0
          }
        };
      } else {
        response = await apiService.get(`/properties/${propertyId}/stats`);
      }

      const result = {
        success: response.success,
        data: response.data
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching property stats:', error);
      throw error;
    }
  }

  // Search properties
  async searchProperties(query, filters = {}) {
    try {
      const properties = await this.getProperties();
      if (!properties.success) {
        throw new Error('Failed to fetch properties');
      }

      let filtered = properties.data;

      // Apply search query
      if (query) {
        const searchTerm = query.toLowerCase();
        filtered = filtered.filter(property => 
          property.name.toLowerCase().includes(searchTerm) ||
          property.address.toLowerCase().includes(searchTerm) ||
          property.city.toLowerCase().includes(searchTerm) ||
          property.state.toLowerCase().includes(searchTerm)
        );
      }

      // Apply filters
      if (filters.type && filters.type !== 'all') {
        filtered = filtered.filter(property => property.type === filters.type);
      }

      if (filters.status && filters.status !== 'all') {
        filtered = filtered.filter(property => property.status === filters.status);
      }

      return {
        success: true,
        data: filtered,
        count: filtered.length
      };
    } catch (error) {
      console.error('Error searching properties:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
const propertyService = new PropertyService();
export default propertyService;
