// Centralized API utility to ensure all calls go to the correct backend
const getApiUrl = (endpoint: string): string => {
  const baseUrl = import.meta.env.VITE_API_URL || 'https://supplylink-ck4s.onrender.com';
  // Remove leading slash if present and ensure proper URL construction
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}/${cleanEndpoint}`;
};

export const apiCall = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = getApiUrl(endpoint);
  console.log(`🌐 API Call: ${options.method || 'GET'} ${url}`);
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
};

// Convenience methods for common HTTP methods
export const apiGet = (endpoint: string, headers?: Record<string, string>) =>
  apiCall(endpoint, { method: 'GET', headers });

export const apiPost = (endpoint: string, data?: any, headers?: Record<string, string>) =>
  apiCall(endpoint, {
    method: 'POST',
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

export const apiPut = (endpoint: string, data?: any, headers?: Record<string, string>) =>
  apiCall(endpoint, {
    method: 'PUT',
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

export const apiDelete = (endpoint: string, headers?: Record<string, string>) =>
  apiCall(endpoint, { method: 'DELETE', headers });

// Export the base URL for components that need it
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://supplylink-ck4s.onrender.com'; 