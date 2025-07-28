// Debug utility to check environment variables
export const debugEnvironment = () => {
  console.log('🔍 Environment Debug Info:');
  console.log('NODE_ENV:', import.meta.env.MODE);
  console.log('PROD:', import.meta.env.PROD);
  console.log('DEV:', import.meta.env.DEV);
  console.log('VITE_SOCKET_URL:', import.meta.env.VITE_SOCKET_URL);
  console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
  console.log('VITE_SERVER_URL:', import.meta.env.VITE_SERVER_URL);
  
  // Check if we're in production
  if (import.meta.env.PROD) {
    console.log('🚀 Production mode detected');
    console.log('Forcing production URLs...');
  }
  
  return {
    mode: import.meta.env.MODE,
    isProd: import.meta.env.PROD,
    socketUrl: import.meta.env.VITE_SOCKET_URL || 'wss://supplylink-ck4s.onrender.com',
    apiUrl: import.meta.env.VITE_API_URL || 'https://supplylink-ck4s.onrender.com'
  };
}; 