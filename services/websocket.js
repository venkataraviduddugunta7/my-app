import { io } from 'socket.io-client';
import { store } from '@/store';
import { addToast } from '@/store/slices/uiSlice';
import { prependNotification } from '@/store/slices/notificationsSlice';
import { 
  updateLocalStats, 
  addActivity 
} from '@/store/slices/dashboardSlice';
import { 
  updateBedStatus, 
  addBedRealtime, 
  removeBedRealtime 
} from '@/store/slices/bedsSlice';
import { 
  updateTenantRealtime, 
  addTenantRealtime, 
  removeTenantRealtime 
} from '@/store/slices/tenantsSlice';
import { 
  setSelectedProperty 
} from '@/store/slices/propertySlice';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.subscriptions = new Set();
    this.statusListeners = new Set();
  }

  connect(token) {
    if (this.socket?.connected) {
      return this.socket;
    }

    const serverUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:9000';

    this.socket = io(serverUrl, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true
    });

    this.setupEventListeners();
    return this.socket;
  }

  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('🔌 WebSocket connected');
      const wasReconnecting = this.reconnectAttempts > 0;
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.restoreSubscriptions();
      this.notifyStatusChange();

      if (wasReconnecting) {
        store.dispatch(addToast({
          title: 'Realtime reconnected',
          description: 'Live updates are active again.',
          variant: 'success'
        }));
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      this.isConnected = false;
      this.notifyStatusChange();
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.handleReconnection();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 WebSocket connection error:', error);
      this.isConnected = false;
      this.notifyStatusChange();
      this.handleReconnection();
    });

    // Property events
    this.socket.on('joined-property', (data) => {
      console.log(`🏠 Joined property: ${data.propertyName}`);
    });

    // Property updates
    this.socket.on('property-update', (data) => {
      console.log('🏠 Property update received:', data);
      
      // Dispatch custom event for components to listen to
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('property-update', { detail: data }));
      }
      
      switch (data.type) {
        case 'create':
          store.dispatch(addToast({
            title: 'New Property',
            description: `${data.data.name} has been added`,
            variant: 'success'
          }));
          break;
        case 'update':
          // Update selected property if it's the one being updated
          const currentState = store.getState();
          if (currentState.property.selectedProperty?.id === data.data.id) {
            store.dispatch(setSelectedProperty(data.data));
          }
          store.dispatch(addToast({
            title: 'Property Updated',
            description: `${data.data.name} has been updated`,
            variant: 'info'
          }));
          break;
        case 'delete':
          store.dispatch(addToast({
            title: 'Property Deleted',
            description: `${data.data.name} has been deleted`,
            variant: 'info'
          }));
          break;
      }
    });

    // Dashboard updates
    this.socket.on('dashboard-update', (data) => {
      console.log('📊 Dashboard update received:', data);
      store.dispatch(updateLocalStats(data.data));
    });

    // Bed updates
    this.socket.on('bed-update', (data) => {
      console.log('🛏️ Bed update received:', data);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bed-update', { detail: data }));
      }
      store.dispatch(updateBedStatus(data.data));
    });

    // Tenant updates
    this.socket.on('tenant-update', (data) => {
      console.log('👤 Tenant update received:', data);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tenant-update', { detail: data }));
      }
      
      switch (data.type) {
        case 'create':
          store.dispatch(addTenantRealtime(data.data));
          store.dispatch(addToast({
            title: 'New Tenant',
            description: `${data.data.fullName} has joined`,
            variant: 'success'
          }));
          break;
        case 'update':
          store.dispatch(updateTenantRealtime(data.data));
          break;
        case 'delete':
          store.dispatch(removeTenantRealtime(data.data.id));
          store.dispatch(addToast({
            title: 'Tenant Removed',
            description: 'A tenant has been removed',
            variant: 'info'
          }));
          break;
        case 'vacate':
          store.dispatch(updateTenantRealtime(data.data));
          store.dispatch(addToast({
            title: 'Tenant Vacated',
            description: `${data.data.fullName} has vacated`,
            variant: 'info'
          }));
          break;
      }
    });

    this.socket.on('property-metrics-update', (data) => {
      console.log('🏠 Property metrics update received:', data);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('property-metrics-update', { detail: data }));
      }
    });

    // Payment updates
    this.socket.on('payment-update', (data) => {
      console.log('💰 Payment update received:', data);
      // Handle payment updates here
      store.dispatch(addToast({
        title: 'Payment Update',
        description: `Payment ${data.type}d`,
        variant: data.type === 'paid' ? 'success' : 'info'
      }));
    });

    // Activity updates
    this.socket.on('new-activity', (activity) => {
      console.log('📋 New activity:', activity);
      store.dispatch(addActivity(activity));
    });

    // Notifications
    this.socket.on('notification', (notification) => {
      console.log('🔔 Notification received:', notification);
      const existingNotification = store
        .getState()
        .notifications.items.find((item) => item.id === notification.id);

      if (existingNotification) {
        return;
      }

      store.dispatch(prependNotification(notification));
      store.dispatch(addToast({
        title: notification.title || 'Notification',
        description: notification.message,
        variant: notification.type === 'error' ? 'error' : 'info'
      }));
    });

    // System notifications
    this.socket.on('system-notification', (notification) => {
      console.log('🔔 System notification:', notification);
      store.dispatch(addToast({
        title: 'System Update',
        description: notification.message,
        variant: notification.type === 'warning' ? 'warning' : 'info'
      }));
    });

    // Emergency alerts
    this.socket.on('emergency-alert', (alert) => {
      console.log('🚨 Emergency alert:', alert);
      store.dispatch(addToast({
        title: '🚨 EMERGENCY ALERT',
        description: alert.message,
        variant: 'error',
        duration: 10000 // Show for 10 seconds
      }));
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('🔌 WebSocket error:', error);
      store.dispatch(addToast({
        title: 'Connection Error',
        description: error.message || 'WebSocket error occurred',
        variant: 'error'
      }));
    });
  }

  handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('🔌 Max reconnection attempts reached');
      this.notifyStatusChange();
      store.dispatch(addToast({
        title: 'Connection Failed',
        description: 'Unable to establish real-time connection',
        variant: 'error'
      }));
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    this.notifyStatusChange();
    
    console.log(`🔌 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (this.socket) {
        this.socket.connect();
      }
    }, delay);
  }

  // Subscription methods
  joinProperty(propertyId) {
    if (!propertyId) return;
    this.subscriptions.add(`property:${propertyId}`);

    if (this.socket?.connected) {
      this.socket.emit('join-property', propertyId);
    }

    this.notifyStatusChange();
  }

  leaveProperty(propertyId) {
    if (!propertyId) return;
    this.subscriptions.delete(`property:${propertyId}`);

    if (this.socket?.connected) {
      this.socket.emit('leave-property', propertyId);
    }

    this.notifyStatusChange();
  }

  subscribeToDashboard(propertyId) {
    if (!propertyId) return;
    this.subscriptions.add(`dashboard:${propertyId}`);

    if (this.socket?.connected) {
      this.socket.emit('subscribe-dashboard', propertyId);
    }

    this.notifyStatusChange();
  }

  subscribeToBeds(propertyId) {
    if (!propertyId) return;
    this.subscriptions.add(`beds:${propertyId}`);

    if (this.socket?.connected) {
      this.socket.emit('subscribe-beds', propertyId);
    }

    this.notifyStatusChange();
  }

  subscribeToPayments(propertyId) {
    if (!propertyId) return;
    this.subscriptions.add(`payments:${propertyId}`);

    if (this.socket?.connected) {
      this.socket.emit('subscribe-payments', propertyId);
    }

    this.notifyStatusChange();
  }

  subscribeToProperties() {
    this.subscriptions.add('properties');

    if (this.socket?.connected) {
      this.socket.emit('subscribe-properties');
    }

    this.notifyStatusChange();
  }

  unsubscribeFromProperties() {
    this.subscriptions.delete('properties');

    if (this.socket?.connected) {
      this.socket.emit('unsubscribe-properties');
    }

    this.notifyStatusChange();
  }

  // Utility methods
  isConnectedToServer() {
    return this.socket?.connected || false;
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      subscriptions: Array.from(this.subscriptions)
    };
  }

  notifyStatusChange() {
    const status = this.getConnectionStatus();
    this.statusListeners.forEach((listener) => {
      try {
        listener(status);
      } catch (error) {
        console.error('🔌 Status listener error:', error);
      }
    });
  }

  subscribeConnectionStatus(listener) {
    this.statusListeners.add(listener);
    listener(this.getConnectionStatus());
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  restoreSubscriptions() {
    this.subscriptions.forEach((subscription) => {
      if (subscription === 'properties') {
        this.socket.emit('subscribe-properties');
        return;
      }

      const [channel, propertyId] = subscription.split(':');
      if (!propertyId) return;

      if (channel === 'property') {
        this.socket.emit('join-property', propertyId);
      }

      if (channel === 'dashboard') {
        this.socket.emit('subscribe-dashboard', propertyId);
      }

      if (channel === 'beds') {
        this.socket.emit('subscribe-beds', propertyId);
      }

      if (channel === 'payments') {
        this.socket.emit('subscribe-payments', propertyId);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.subscriptions.clear();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
      this.notifyStatusChange();
      
      console.log('🔌 WebSocket disconnected manually');
    }
  }

  // Manual refresh trigger
  refreshData(propertyId) {
    if (this.socket?.connected) {
      this.socket.emit('refresh-data', { propertyId });
    }
  }
}

// Singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;
