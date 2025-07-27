import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
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

import './config/firebaseAdmin.js';
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;

// === CORS CONFIGURATION ===
// Allow all origins for production deployment
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// === CORS PREFLIGHT HANDLER ===
app.options('*', cors()); // Enable pre-flight for all routes

// === SOCKET.IO SETUP ===
const io = new Server(server, {
  cors: {
    origin: true, // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true
  }
});
initializeSocket(io); // pass io object

// === MIDDLEWARE ===
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (data) {
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

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// === ROUTES ===
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

app.use('/api/user', userRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/geocoding', geocodingRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/debug', debugRoutes);

// === 404 Handler ===
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: 'NOT_FOUND',
    path: req.originalUrl
  });
});

// === Global Error Handler ===
app.use((error, req, res, next) => {
  console.error('❌ Global error handler:', error);
  try {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Internal server error',
      error: 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  } catch (jsonError) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'INTERNAL_ERROR'
    });
  }
});

// === SERVER INIT ===
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Frontend: ${process.env.CLIENT_URL}`);
      console.log(`✅ Socket.IO ready`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// === Graceful Shutdown ===
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});
process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;
