// API Test Utility
export const testBackendConnection = async () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  
  try {
    console.log('🔍 Testing backend connection to:', apiUrl);
    
    const response = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend is accessible:', data);
      return { success: true, data };
    } else {
      console.error('❌ Backend responded with error:', response.status, response.statusText);
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }
  } catch (error) {
    console.error('❌ Backend connection failed:', error);
    return { success: false, error: error.message };
  }
};

export const testSocketConnection = async () => {
  const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';
  
  try {
    console.log('🔍 Testing socket connection to:', socketUrl);
    
    // Test if the socket endpoint is accessible
    const response = await fetch(`${socketUrl}/socket.io/`, {
      method: 'GET'
    });
    
    if (response.ok) {
      console.log('✅ Socket endpoint is accessible');
      return { success: true };
    } else {
      console.error('❌ Socket endpoint error:', response.status);
      return { success: false, error: `Socket HTTP ${response.status}` };
    }
  } catch (error) {
    console.error('❌ Socket connection failed:', error);
    return { success: false, error: error.message };
  }
}; 