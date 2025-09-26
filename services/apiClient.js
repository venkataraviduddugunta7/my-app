import axios from 'axios';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API Error:', error);

    // Handle specific error cases
    if (error.response) {
      const { status, data } = error.response;
      
      // Handle authentication errors
      if (status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.location.href = '/login';
        return Promise.reject(new Error('Session expired. Please login again.'));
      }

      // Handle validation errors
      if (status === 400 && data.errors) {
        const errorMessage = data.errors.map(err => err.message).join(', ');
        return Promise.reject(new Error(errorMessage));
      }

      // Handle other API errors
      return Promise.reject(new Error(data.message || 'An error occurred'));
    }

    // Handle network errors
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timeout. Please try again.'));
    }

    return Promise.reject(new Error('Network error. Please check your connection.'));
  }
);

// Helper function to handle file uploads
export const createFormData = (data, fileField = 'file') => {
  const formData = new FormData();
  
  Object.keys(data).forEach(key => {
    if (key === fileField && data[key] instanceof File) {
      formData.append(fileField, data[key]);
    } else if (Array.isArray(data[key])) {
      formData.append(key, JSON.stringify(data[key]));
    } else if (typeof data[key] === 'object' && data[key] !== null) {
      formData.append(key, JSON.stringify(data[key]));
    } else {
      formData.append(key, data[key]);
    }
  });
  
  return formData;
};

// Generic API methods
export const api = {
  // GET request
  get: (url, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    return apiClient.get(fullUrl);
  },

  // POST request
  post: (url, data = {}) => {
    return apiClient.post(url, data);
  },

  // PUT request
  put: (url, data = {}) => {
    return apiClient.put(url, data);
  },

  // DELETE request
  delete: (url) => {
    return apiClient.delete(url);
  },

  // File upload
  upload: (url, data, onUploadProgress) => {
    const formData = createFormData(data);
    return apiClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  },
};

export default apiClient;
