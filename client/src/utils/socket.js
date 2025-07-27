import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

class SocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventListeners = new Map();
  }

  connect(userId, userRole) {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.isConnected = true;
      
      // Register user with socket
      this.socket.emit('register', { userId, userRole });
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Order events
  onOrderRequestSent(callback) {
    this.addListener('order_request_sent', callback);
  }

  onOrderApproved(callback) {
    this.addListener('order_approved', callback);
  }

  onOrderRejected(callback) {
    this.addListener('order_rejected', callback);
  }

  onPaymentMade(callback) {
    this.addListener('payment_made', callback);
  }

  onOrderDispatched(callback) {
    this.addListener('order_dispatched', callback);
  }

  onOrderDelivered(callback) {
    this.addListener('order_delivered', callback);
  }

  // Emit order events
  emitOrderRequestSent(data) {
    this.emit('order_request_sent', data);
  }

  emitOrderApproved(data) {
    this.emit('order_approved', data);
  }

  emitOrderRejected(data) {
    this.emit('order_rejected', data);
  }

  emitPaymentMade(data) {
    this.emit('payment_made', data);
  }

  emitOrderDispatched(data) {
    this.emit('order_dispatched', data);
  }

  emitOrderDelivered(data) {
    this.emit('order_delivered', data);
  }

  // Generic event handling
  addListener(event, callback) {
    if (!this.socket) {
      console.warn('Socket not connected. Cannot add listener for:', event);
      return;
    }

    this.socket.on(event, callback);
    this.eventListeners.set(event, callback);
  }

  removeListener(event) {
    if (!this.socket) return;

    const callback = this.eventListeners.get(event);
    if (callback) {
      this.socket.off(event, callback);
      this.eventListeners.delete(event);
    }
  }

  emit(event, data) {
    if (!this.socket || !this.isConnected) {
      console.warn('Socket not connected. Cannot emit event:', event);
      return;
    }

    this.socket.emit(event, data);
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id
    };
  }
}

// Create singleton instance
const socketManager = new SocketManager();

export default socketManager; 