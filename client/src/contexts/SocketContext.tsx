import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import socketManager from '@/utils/socket';

interface SocketContextType {
  isConnected: boolean;
  socketId?: string;
  connect: () => void;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, firebaseUser } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | undefined>();

  const connect = () => {
    if (firebaseUser && user) {
      const socket = socketManager.connect(firebaseUser.uid, user.role);
      
      socket.on('connect', () => {
        setIsConnected(true);
        setSocketId(socket.id);
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
        setSocketId(undefined);
      });

      // Set up order event listeners
      socketManager.onOrderRequestSent((data) => {
        console.log('Order request sent:', data);
        // Handle order request sent event
      });

      socketManager.onOrderApproved((data) => {
        console.log('Order approved:', data);
        // Handle order approved event
      });

      socketManager.onOrderRejected((data) => {
        console.log('Order rejected:', data);
        // Handle order rejected event
      });

      socketManager.onPaymentMade((data) => {
        console.log('Payment made:', data);
        // Handle payment made event
      });

      socketManager.onOrderDispatched((data) => {
        console.log('Order dispatched:', data);
        // Handle order dispatched event
      });

      socketManager.onOrderDelivered((data) => {
        console.log('Order delivered:', data);
        // Handle order delivered event
      });
    }
  };

  const disconnect = () => {
    socketManager.disconnect();
    setIsConnected(false);
    setSocketId(undefined);
  };

  useEffect(() => {
    if (firebaseUser && user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [firebaseUser, user]);

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        socketId,
        connect,
        disconnect
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}; 