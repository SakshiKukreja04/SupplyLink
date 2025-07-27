import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import userRoutes from './routes/userRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import vendorRoutes from './routes/vendorRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import geocodingRoutes from './routes/geocodingRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import debugRoutes from './routes/debugRoutes.js';
import connectDB from './config/mongodb.js';
import { initializeSocket } from './utils/socketManager.js';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin SDK
import './config/firebaseAdmin.js';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    process.env.CORS_ORIGIN || 'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:8082'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware to ensure all responses are JSON
app.use((req, res, next) => {
  // Store the original json method
  const originalJson = res.json;
  
  // Override the json method to ensure it always works
  res.json = function(data) {
    try {
      return originalJson.call(this, data);
    } catch (error) {
      console.error('❌ JSON serialization error:', error);
      return originalJson.call(this, {
        success: false,
        message: 'Response serialization error',
        error: 'SERIALIZATION_ERROR'
      });
    }
  };
  
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint (public)
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/user', userRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/geocoding', geocodingRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/debug', debugRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: 'NOT_FOUND',
    path: req.originalUrl
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Global error handler:', error);
  
  // Ensure we always return valid JSON
  try {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Internal server error',
      error: 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  } catch (jsonError) {
    console.error('❌ Error in global error handler:', jsonError);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Initialize Socket.IO
    initializeSocket(server);
    
    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
      console.log('✅ Firebase Admin SDK initialized');
      console.log('✅ MongoDB connected');
      console.log('✅ Socket.IO initialized');
      console.log('📋 Available endpoints:');
      console.log('   GET  /health                    - Server health check');
      console.log('   GET  /api/user/health           - Authentication test');
      console.log('   GET  /api/user/profile          - Get user profile');
      console.log('   PUT  /api/user/profile          - Update user profile');
      console.log('   DELETE /api/user/profile        - Delete user account');
      console.log('   GET  /api/user/location         - Get user location');
      console.log('   POST /api/user/location         - Update user location');
      console.log('   GET  /api/user/admin            - Admin-only endpoint');
      console.log('   GET  /api/user/supplier         - Supplier-only endpoint');
      console.log('   GET  /api/user/vendor           - Vendor-only endpoint');
      console.log('   POST /api/search                - Voice search products');
      console.log('   POST /api/search/name           - Search by product name');
      console.log('   POST /api/search/category       - Search by category');
      console.log('   GET  /api/search/stats          - Search statistics');
      console.log('   GET  /api/search/health         - Search service health');
      console.log('   POST /api/vendors/search        - Search suppliers');
      console.log('   GET  /api/vendors/orders        - Get vendor orders');
      console.log('   POST /api/vendors/orders        - Place order');
      console.log('   POST /api/vendors/orders/:id/payment - Make payment');
      console.log('   GET  /api/suppliers/materials   - Get supplier materials');
      console.log('   POST /api/suppliers/materials   - Add material');
      console.log('   GET  /api/suppliers/orders      - Get supplier orders');
      console.log('   PATCH /api/suppliers/orders/:id/approve - Approve order');
      console.log('   PATCH /api/suppliers/orders/:id/reject - Reject order');
      console.log('   PATCH /api/suppliers/orders/:id/dispatch - Dispatch order');
      console.log('   PATCH /api/suppliers/orders/:id/deliver - Deliver order');
      console.log('   POST /api/reviews               - Submit review');
      console.log('   GET  /api/reviews/supplier/:id  - Get supplier reviews');
      console.log('   GET  /api/reviews/vendor        - Get vendor reviews');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app; 