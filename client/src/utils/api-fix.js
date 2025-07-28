// This file contains a list of all API endpoints that need to be updated
// to use the correct backend URL instead of relative paths

export const API_ENDPOINTS_TO_FIX = [
  // Supplier Dashboard
  '/api/suppliers/profile',
  '/api/suppliers/materials',
  '/api/orders/supplier',
  '/api/suppliers/{id}/reviews',
  '/api/suppliers/materials/{id}',
  '/api/orders/{id}/approve',
  '/api/orders/{id}/reject',
  '/api/orders/{id}/dispatch',
  
  // Vendor Dashboard
  '/api/vendors/orders',
  '/api/suppliers/{id}/reviews',
  '/api/payments/create-order',
  '/api/payments/verify',
  
  // Location Updates
  '/api/suppliers/location',
  '/api/vendors/location',
  
  // Search and Voice
  '/api/search/translate',
  '/api/vendors/search',
  '/api/search',
  
  // Orders and Reviews
  '/api/orders/place',
  '/api/reviews',
  '/api/suppliers/{id}/materials',
  
  // Login/Signup
  '/api/suppliers/location',
  '/api/vendors/location',
  
  // Nearby Suppliers
  '/api/suppliers/nearby',
  '/api/suppliers/{id}/reviews'
];

// Helper function to convert relative API path to full URL
export const getFullApiUrl = (endpoint) => {
  const baseUrl = import.meta.env.VITE_API_URL || 'https://supplylink-ck4s.onrender.com';
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}/${cleanEndpoint}`;
};

// Example usage:
// Instead of: fetch('/api/suppliers/profile', {...})
// Use: fetch(getFullApiUrl('/api/suppliers/profile'), {...})
// Or: apiGet('api/suppliers/profile', headers) 