import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: mode === 'development',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          gsap: ['gsap'],
          socket: ['socket.io-client']
        }
      }
    }
  },
  define: {
    'process.env': {},
    // Force production URLs in production builds
    ...(mode === 'production' && {
      'import.meta.env.VITE_SOCKET_URL': JSON.stringify('wss://supplylink-ck4s.onrender.com'),
      'import.meta.env.VITE_API_URL': JSON.stringify('https://supplylink-ck4s.onrender.com')
    })
  },
  optimizeDeps: {
    include: ['socket.io-client']
  }
}));
