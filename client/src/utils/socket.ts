import { io, Socket } from 'socket.io-client';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000';

console.log('Connecting to socket at:', SOCKET_URL);

class SocketManager {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private eventListeners: Map<string, Function> = new Map();

  connect(userId: string, userRole: string): Socket {
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
      console.log('Socket connected:', this.socket?.id);
      this.isConnected = true;
      
      // Register user with socket
      this.socket?.emit('register', { userId, userRole });
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

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Order events
  onOrderRequestSent(callback: Function): void {
    this.addListener('order_request_sent', callback);
  }

  onOrderApproved(callback: Function): void {
    this.addListener('order_approved', callback);
  }

  onOrderRejected(callback: Function): void {
    this.addListener('order_rejected', callback);
  }

  onPaymentMade(callback: Function): void {
    this.addListener('payment_made', callback);
  }

  onOrderDispatched(callback: Function): void {
    this.addListener('order_dispatched', callback);
  }

  onOrderDelivered(callback: Function): void {
    this.addListener('order_delivered', callback);
  }

  // Emit order events
  emitOrderRequestSent(data: any): void {
    this.emit('order_request_sent', data);
  }

  emitOrderApproved(data: any): void {
    this.emit('order_approved', data);
  }

  emitOrderRejected(data: any): void {
    this.emit('order_rejected', data);
  }

  emitPaymentMade(data: any): void {
    this.emit('payment_made', data);
  }

  emitOrderDispatched(data: any): void {
    this.emit('order_dispatched', data);
  }

  emitOrderDelivered(data: any): void {
    this.emit('order_delivered', data);
  }

  // Supplier response events
  emitSupplierResponse(data: { orderId: string; status: string; vendorId?: string }): void {
    this.emit('supplier_response', data);
  }

  onSupplierResponse(callback: Function): void {
    this.addListener('supplier_response', callback);
  }

  // Generic event handling
  addListener(event: string, callback: Function): void {
    if (!this.socket) {
      console.warn('Socket not connected. Cannot add listener for:', event);
      return;
    }

    this.socket.on(event, callback);
    this.eventListeners.set(event, callback);
  }

  removeListener(event: string): void {
    if (!this.socket) return;

    const callback = this.eventListeners.get(event);
    if (callback) {
      this.socket.off(event, callback);
      this.eventListeners.delete(event);
    }
  }

  emit(event: string, data: any): void {
    if (!this.socket || !this.isConnected) {
      console.warn('Socket not connected. Cannot emit event:', event);
      return;
    }

    this.socket.emit(event, data);
  }

  // Get connection status
  getConnectionStatus(): { isConnected: boolean; socketId?: string } {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id
    };
  }
}

// Create singleton instance
const socketManager = new SocketManager();

export default socketManager; 