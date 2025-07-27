import { Server } from 'socket.io';

let io;
const userSocketMap = new Map(); // userId -> socketId
const socketUserMap = new Map(); // socketId -> userId

/**
 * Initialize Socket.IO server
 * @param {Object} server - HTTP server instance
 */
export function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: [
        process.env.CLIENT_URL || "http://localhost:5173",
        "http://localhost:8080",
        "http://localhost:8082"
      ],
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Register user with their socket
    socket.on('register', ({ userId, userRole }) => {
      userSocketMap.set(userId, socket.id);
      socketUserMap.set(socket.id, { userId, userRole });
      socket.join(`user_${userId}`);
      socket.join(`role_${userRole}`);
      
      console.log(`User ${userId} (${userRole}) registered with socket ${socket.id}`);
    });

    // Handle profile update events
    socket.on('profile_updated', (data) => {
      emitToUser(data.userId, 'profile_updated', data);
    });

    // Handle order events
    socket.on('order_request_sent', (data) => {
      emitToUser(data.supplierId, 'order_request_sent', data);
    });

    socket.on('order_approved', (data) => {
      emitToUser(data.vendorId, 'order_approved', data);
    });

    socket.on('order_rejected', (data) => {
      emitToUser(data.vendorId, 'order_rejected', data);
    });

    socket.on('payment_made', (data) => {
      emitToUser(data.supplierId, 'payment_made', data);
    });

    socket.on('order_dispatched', (data) => {
      emitToUser(data.vendorId, 'order_dispatched', data);
    });

    socket.on('order_delivered', (data) => {
      emitToUser(data.vendorId, 'order_delivered', data);
    });

    // Handle supplier response events
    socket.on('supplier_response', (data) => {
      if (data.vendorId) {
        emitToUser(data.vendorId, 'supplier_response', data);
      }
    });

    // Handle material update events
    socket.on('material_added', (data) => {
      emitToUser(data.supplierId, 'material_added', data);
    });

    socket.on('material_updated', (data) => {
      emitToUser(data.supplierId, 'material_updated', data);
    });

    socket.on('material_deleted', (data) => {
      emitToUser(data.supplierId, 'material_deleted', data);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const userInfo = socketUserMap.get(socket.id);
      if (userInfo) {
        userSocketMap.delete(userInfo.userId);
        socketUserMap.delete(socket.id);
        console.log(`User ${userInfo.userId} disconnected`);
      }
    });
  });

  return io;
}

/**
 * Emit event to specific user
 * @param {string} userId - User ID to emit to
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
export function emitToUser(userId, event, data) {
  const socketId = userSocketMap.get(userId);
  if (socketId) {
    io.to(socketId).emit(event, data);
    console.log(`Emitted ${event} to user ${userId}`);
  } else {
    console.log(`User ${userId} not found in socket map`);
  }
}

/**
 * Emit event to all users of a specific role
 * @param {string} role - User role (vendor/supplier)
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
export function emitToRole(role, event, data) {
  io.to(`role_${role}`).emit(event, data);
  console.log(`Emitted ${event} to all ${role}s`);
}

/**
 * Emit event to all connected users
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
export function emitToAll(event, data) {
  io.emit(event, data);
  console.log(`Emitted ${event} to all users`);
}

/**
 * Get connected users count
 * @returns {number} Number of connected users
 */
export function getConnectedUsersCount() {
  return userSocketMap.size;
}

/**
 * Get user info by socket ID
 * @param {string} socketId - Socket ID
 * @returns {Object|null} User info or null
 */
export function getUserBySocketId(socketId) {
  return socketUserMap.get(socketId) || null;
}

/**
 * Get socket ID by user ID
 * @param {string} userId - User ID
 * @returns {string|null} Socket ID or null
 */
export function getSocketIdByUserId(userId) {
  return userSocketMap.get(userId) || null;
}

export { io }; 