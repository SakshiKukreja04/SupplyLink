/**
 * API Client utility for frontend integration
 * This file can be copied to your frontend project for easy API integration
 */

class ApiClient {
  constructor(baseURL = 'http://localhost:5000') {
    this.baseURL = baseURL;
  }

  /**
   * Get Firebase ID token from current user
   * @returns {Promise<string|null>} Firebase ID token or null
   */
  async getAuthToken() {
    try {
      // This assumes you have Firebase Auth initialized in your frontend
      const { auth } = await import('@/firebase/firebase');
      const user = auth.currentUser;
      
      if (user) {
        return await user.getIdToken();
      }
      return null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Make authenticated API request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Object>} API response
   */
  async authenticatedRequest(endpoint, options = {}) {
    const token = await this.getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token available');
    }

    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // User Profile Methods

  /**
   * Get user profile
   * @returns {Promise<Object>} User profile data
   */
  async getProfile() {
    return this.authenticatedRequest('/api/user/profile');
  }

  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated profile data
   */
  async updateProfile(profileData) {
    return this.authenticatedRequest('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  /**
   * Delete user account (soft delete)
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteProfile() {
    return this.authenticatedRequest('/api/user/profile', {
      method: 'DELETE'
    });
  }

  // Location Methods

  /**
   * Get user location
   * @returns {Promise<Object>} User location data
   */
  async getLocation() {
    return this.authenticatedRequest('/api/user/location');
  }

  /**
   * Update user location
   * @param {Object} locationData - Location data
   * @returns {Promise<Object>} Updated location data
   */
  async updateLocation(locationData) {
    return this.authenticatedRequest('/api/user/location', {
      method: 'POST',
      body: JSON.stringify(locationData)
    });
  }

  // Health Check

  /**
   * Test authentication
   * @returns {Promise<Object>} Authentication status
   */
  async testAuth() {
    return this.authenticatedRequest('/api/user/health');
  }

  // Role-based Endpoints

  /**
   * Access supplier-only endpoint
   * @returns {Promise<Object>} Supplier data
   */
  async getSupplierData() {
    return this.authenticatedRequest('/api/user/supplier');
  }

  /**
   * Access vendor-only endpoint
   * @returns {Promise<Object>} Vendor data
   */
  async getVendorData() {
    return this.authenticatedRequest('/api/user/vendor');
  }

  /**
   * Access admin-only endpoint
   * @returns {Promise<Object>} Admin data
   */
  async getAdminData() {
    return this.authenticatedRequest('/api/user/admin');
  }

  // Utility Methods

  /**
   * Get current user's location from browser
   * @returns {Promise<Object>} Location coordinates
   */
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp)
          });
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  /**
   * Update user location with current GPS coordinates
   * @returns {Promise<Object>} Updated location data
   */
  async updateCurrentLocation() {
    try {
      const location = await this.getCurrentLocation();
      return await this.updateLocation(location);
    } catch (error) {
      console.error('Error updating current location:', error);
      throw error;
    }
  }
}

// Create and export default instance
const apiClient = new ApiClient();

export default apiClient;

// Usage examples:
/*
// In your React component:
import apiClient from '@/utils/apiClient';

// Get user profile
const profile = await apiClient.getProfile();

// Update location
const location = await apiClient.updateLocation({
  latitude: 40.7128,
  longitude: -74.0060,
  address: 'New York, NY'
});

// Test authentication
const authStatus = await apiClient.testAuth();

// Get current location and update
const currentLocation = await apiClient.updateCurrentLocation();
*/ 