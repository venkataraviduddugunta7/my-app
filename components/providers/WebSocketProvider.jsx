'use client';

import { createContext, useContext, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import webSocketService from '@/services/websocket';
import { addToast } from '@/store/slices/uiSlice';

const WebSocketContext = createContext(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export default function WebSocketProvider({ children }) {
  const dispatch = useDispatch();
  const { isAuthenticated, token } = useSelector((state) => state.auth);
  const { selectedProperty } = useSelector((state) => state.property);
  const isInitialized = useRef(false);
  const currentPropertyId = useRef(null);

  // Initialize WebSocket connection when user is authenticated
  useEffect(() => {
    if (isAuthenticated && token && !isInitialized.current) {
      console.log('🔌 Initializing WebSocket connection...');
      webSocketService.connect(token);
      isInitialized.current = true;

      // Subscribe to properties updates
      webSocketService.subscribeToProperties();

      // Show connection status
      dispatch(addToast({
        title: 'Connecting',
        description: 'Establishing real-time connection...',
        variant: 'info',
        duration: 2000
      }));
    }

    // Cleanup on logout
    if (!isAuthenticated && isInitialized.current) {
      console.log('🔌 Disconnecting WebSocket...');
      webSocketService.unsubscribeFromProperties();
      webSocketService.disconnect();
      isInitialized.current = false;
      currentPropertyId.current = null;
    }
  }, [isAuthenticated, token, dispatch]);

  // Handle property changes
  useEffect(() => {
    if (!isAuthenticated || !selectedProperty || !isInitialized.current) return;

    const propertyId = selectedProperty.id;

    // Leave previous property if different
    if (currentPropertyId.current && currentPropertyId.current !== propertyId) {
      webSocketService.leaveProperty(currentPropertyId.current);
    }

    // Join new property and subscribe to updates
    if (propertyId !== currentPropertyId.current) {
      console.log(`🏠 Switching to property: ${selectedProperty.name}`);
      
      webSocketService.joinProperty(propertyId);
      webSocketService.subscribeToDashboard(propertyId);
      webSocketService.subscribeToBeds(propertyId);
      webSocketService.subscribeToPayments(propertyId);
      
      currentPropertyId.current = propertyId;

      dispatch(addToast({
        title: 'Property Connected',
        description: `Real-time updates enabled for ${selectedProperty.name}`,
        variant: 'success',
        duration: 3000
      }));
    }
  }, [selectedProperty, isAuthenticated, dispatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isInitialized.current) {
        webSocketService.disconnect();
      }
    };
  }, []);

  const contextValue = {
    isConnected: webSocketService.isConnectedToServer(),
    connectionStatus: webSocketService.getConnectionStatus(),
    refreshData: (propertyId) => webSocketService.refreshData(propertyId),
    service: webSocketService
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}
