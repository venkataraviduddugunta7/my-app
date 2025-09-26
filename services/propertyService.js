import { api } from './apiClient';

export class PropertyService {
  // Create Property
  static async createProperty(propertyData) {
    try {
      const response = await api.post('/properties', propertyData);
      
      if (response.success) {
        return {
          success: true,
          data: response.data,
          property: response.data,
          message: response.message
        };
      }
      
      throw new Error(response.message || 'Property creation failed');
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Property creation failed'
      };
    }
  }

  // Get All Properties
  static async getProperties(filters = {}) {
    try {
      const response = await api.get('/properties', filters);
      
      if (response.success) {
        return {
          success: true,
          data: response.data || [],
          properties: response.data || [],
          pagination: response.pagination || {},
          message: response.message
        };
      }
      
      throw new Error(response.message || 'Failed to fetch properties');
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch properties',
        data: [],
        properties: [],
        pagination: {}
      };
    }
  }

  // Get Single Property
  static async getProperty(propertyId) {
    try {
      const response = await api.get(`/properties/${propertyId}`);
      
      if (response.success) {
        return {
          success: true,
          data: response.data,
          property: response.data,
          message: response.message
        };
      }
      
      throw new Error(response.message || 'Failed to fetch property');
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch property'
      };
    }
  }

  // Update Property
  static async updateProperty(propertyId, propertyData) {
    try {
      const response = await api.put(`/properties/${propertyId}`, propertyData);
      
      if (response.success) {
        return {
          success: true,
          data: response.data,
          property: response.data,
          message: response.message
        };
      }
      
      throw new Error(response.message || 'Property update failed');
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Property update failed'
      };
    }
  }

  // Delete Property
  static async deleteProperty(propertyId) {
    try {
      const response = await api.delete(`/properties/${propertyId}`);
      
      if (response.success) {
        return {
          success: true,
          message: response.message || 'Property deleted successfully'
        };
      }
      
      throw new Error(response.message || 'Property deletion failed');
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Property deletion failed'
      };
    }
  }

  // Get Property Dashboard
  static async getPropertyDashboard(propertyId) {
    try {
      const response = await api.get(`/properties/${propertyId}/dashboard`);
      
      if (response.success) {
        return {
          success: true,
          dashboard: response.data,
          message: response.message
        };
      }
      
      throw new Error(response.message || 'Failed to fetch property dashboard');
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch property dashboard'
      };
    }
  }

  // Floor Management
  
  // Create Floor
  static async createFloor(propertyId, floorData) {
    try {
      const response = await api.post(`/properties/${propertyId}/rooms/floors`, floorData);
      
      if (response.success) {
        return {
          success: true,
          floor: response.data,
          message: response.message
        };
      }
      
      throw new Error(response.message || 'Floor creation failed');
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Floor creation failed'
      };
    }
  }

  // Get Floors
  static async getFloors(propertyId) {
    try {
      const response = await api.get(`/properties/${propertyId}/rooms/floors`);
      
      if (response.success) {
        return {
          success: true,
          floors: response.data || [],
          message: response.message
        };
      }
      
      throw new Error(response.message || 'Failed to fetch floors');
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch floors',
        floors: []
      };
    }
  }

  // Room Management
  
  // Create Room
  static async createRoom(propertyId, floorId, roomData) {
    try {
      const response = await api.post(`/properties/${propertyId}/rooms/floors/${floorId}/rooms`, roomData);
      
      if (response.success) {
        return {
          success: true,
          room: response.data,
          message: response.message
        };
      }
      
      throw new Error(response.message || 'Room creation failed');
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Room creation failed'
      };
    }
  }

  // Get Rooms
  static async getRooms(propertyId, floorId) {
    try {
      const response = await api.get(`/properties/${propertyId}/rooms/floors/${floorId}/rooms`);
      
      if (response.success) {
        return {
          success: true,
          rooms: response.data || [],
          message: response.message
        };
      }
      
      throw new Error(response.message || 'Failed to fetch rooms');
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch rooms',
        rooms: []
      };
    }
  }

  // Bed Management
  
  // Create Bed
  static async createBed(propertyId, floorId, roomId, bedData) {
    try {
      const response = await api.post(`/properties/${propertyId}/rooms/floors/${floorId}/rooms/${roomId}/beds`, bedData);
      
      if (response.success) {
        return {
          success: true,
          bed: response.data,
          message: response.message
        };
      }
      
      throw new Error(response.message || 'Bed creation failed');
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Bed creation failed'
      };
    }
  }

  // Get Beds
  static async getBeds(propertyId, floorId, roomId) {
    try {
      const response = await api.get(`/properties/${propertyId}/rooms/floors/${floorId}/rooms/${roomId}/beds`);
      
      if (response.success) {
        return {
          success: true,
          beds: response.data || [],
          message: response.message
        };
      }
      
      throw new Error(response.message || 'Failed to fetch beds');
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch beds',
        beds: []
      };
    }
  }

  // Get Available Beds
  static async getAvailableBeds(propertyId) {
    try {
      const response = await api.get(`/properties/${propertyId}/rooms/available-beds`);
      
      if (response.success) {
        return {
          success: true,
          beds: response.data || [],
          message: response.message
        };
      }
      
      throw new Error(response.message || 'Failed to fetch available beds');
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch available beds',
        beds: []
      };
    }
  }

  // Update Bed Status
  static async updateBedStatus(propertyId, floorId, roomId, bedId, status) {
    try {
      const response = await api.put(`/properties/${propertyId}/rooms/floors/${floorId}/rooms/${roomId}/beds/${bedId}/status`, { status });
      
      if (response.success) {
        return {
          success: true,
          bed: response.data,
          message: response.message
        };
      }
      
      throw new Error(response.message || 'Bed status update failed');
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Bed status update failed'
      };
    }
  }
}

// Default export for easier importing
export default PropertyService;