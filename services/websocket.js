import { io } from 'socket.io-client';
import { store } from '@/store';
import { addToast } from '@/store/slices/uiSlice';
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

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.subscriptions = new Set();
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
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      store.dispatch(addToast({
        title: 'Connected',
        description: 'Real-time updates enabled',
        variant: 'success'
      }));
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      this.isConnected = false;
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.handleReconnection();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 WebSocket connection error:', error);
      this.handleReconnection();
    });

    // Property events
    this.socket.on('joined-property', (data) => {
      console.log(`🏠 Joined property: ${data.propertyName}`);
    });

    // Dashboard updates
    this.socket.on('dashboard-update', (data) => {
      console.log('📊 Dashboard update received:', data);
      store.dispatch(updateLocalStats(data.data));
    });

    // Bed updates
    this.socket.on('bed-update', (data) => {
      console.log('🛏️ Bed update received:', data);
      store.dispatch(updateBedStatus(data.data));
    });

    // Tenant updates
    this.socket.on('tenant-update', (data) => {
      console.log('👤 Tenant update received:', data);
      
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
      store.dispatch(addToast({
        title: 'Connection Failed',
        description: 'Unable to establish real-time connection',
        variant: 'error'
      }));
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    
    console.log(`🔌 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (this.socket) {
        this.socket.connect();
      }
    }, delay);
  }

  // Subscription methods
  joinProperty(propertyId) {
    if (this.socket?.connected && propertyId) {
      this.socket.emit('join-property', propertyId);
      this.subscriptions.add(`property:${propertyId}`);
    }
  }

  leaveProperty(propertyId) {
    if (this.socket?.connected && propertyId) {
      this.socket.emit('leave-property', propertyId);
      this.subscriptions.delete(`property:${propertyId}`);
    }
  }

  subscribeToDashboard(propertyId) {
    if (this.socket?.connected && propertyId) {
      this.socket.emit('subscribe-dashboard', propertyId);
      this.subscriptions.add(`dashboard:${propertyId}`);
    }
  }

  subscribeToBeds(propertyId) {
    if (this.socket?.connected && propertyId) {
      this.socket.emit('subscribe-beds', propertyId);
      this.subscriptions.add(`beds:${propertyId}`);
    }
  }

  subscribeToPayments(propertyId) {
    if (this.socket?.connected && propertyId) {
      this.socket.emit('subscribe-payments', propertyId);
      this.subscriptions.add(`payments:${propertyId}`);
    }
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

  disconnect() {
    if (this.socket) {
      this.subscriptions.clear();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
      
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
