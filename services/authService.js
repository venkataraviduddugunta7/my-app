import { api } from './apiClient';

export class AuthService {
  // User Registration
  static async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.success) {
        // Store auth token and user data
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        return {
          success: true,
          user: response.data.user,
          token: response.data.token,
          message: response.message
        };
      }
      
      throw new Error(response.message || 'Registration failed');
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Registration failed'
      };
    }
  }

  // User Login
  static async login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials);
      
      if (response.success) {
        // Store auth token and user data
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        return {
          success: true,
          user: response.data.user,
          token: response.data.token,
          message: response.message
        };
      }
      
      throw new Error(response.message || 'Login failed');
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Login failed'
      };
    }
  }

  // Get Current User Profile
  static async getProfile() {
    try {
      const response = await api.get('/auth/profile');
      
      if (response.success) {
        // Update stored user data
        localStorage.setItem('user', JSON.stringify(response.data));
        
        return {
          success: true,
          user: response.data
        };
      }
      
      throw new Error(response.message || 'Failed to fetch profile');
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch profile'
      };
    }
  }

  // Update User Profile
  static async updateProfile(profileData) {
    try {
      const response = await api.put('/auth/profile', profileData);
      
      if (response.success) {
        // Update stored user data
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = { ...currentUser, ...response.data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        return {
          success: true,
          user: updatedUser,
          message: response.message
        };
      }
      
      throw new Error(response.message || 'Profile update failed');
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Profile update failed'
      };
    }
  }

  // Change Password
  static async changePassword(passwordData) {
    try {
      const response = await api.post('/auth/change-password', passwordData);
      
      if (response.success) {
        return {
          success: true,
          message: response.message || 'Password changed successfully'
        };
      }
      
      throw new Error(response.message || 'Password change failed');
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Password change failed'
      };
    }
  }

  // Logout
  static async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      return {
        success: true,
        message: 'Logged out successfully'
      };
    }
  }

  // Check if user is authenticated
  static isAuthenticated() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    
    return !!(token && user);
  }

  // Get current user from localStorage
  static getCurrentUser() {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  // Get auth token
  static getToken() {
    return localStorage.getItem('authToken');
  }

  // Refresh user data
  static async refreshUserData() {
    if (!this.isAuthenticated()) {
      return { success: false, message: 'Not authenticated' };
    }

    return await this.getProfile();
  }
}
