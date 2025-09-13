// Demo API service for handling requests without a backend
// This provides fallback data when the actual API is not available

const DEMO_USER = {
  id: 'demo-user-1',
  email: 'demo@pgmanager.com',
  fullName: 'Demo User',
  phone: '+91 9876543210',
  username: 'demouser',
  role: 'OWNER',
  userSettings: {
    theme: 'light',
    language: 'en',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    currency: 'INR',
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    rentReminders: true,
    maintenanceAlerts: true,
    newTenantAlerts: true,
    paymentAlerts: true,
    systemUpdates: false,
    twoFactorEnabled: false,
    sessionTimeout: 60,
    loginNotifications: true
  }
};

const DEMO_PROPERTIES = [
  {
    id: 'prop-1',
    name: 'Sunrise PG',
    address: '123 Main Street, Koramangala, Bangalore',
    city: 'Bangalore',
    state: 'Karnataka',
    totalBeds: 48,
    occupiedBeds: 42,
    monthlyRent: 8000,
    securityDeposit: 16000,
    paymentSettings: {
      rentDueDay: 5,
      lateFeeDays: 3,
      lateFeeAmount: 500
    }
  },
  {
    id: 'prop-2',
    name: 'Green Valley PG',
    address: '456 Park Road, Indiranagar, Bangalore',
    city: 'Bangalore',
    state: 'Karnataka',
    totalBeds: 36,
    occupiedBeds: 30,
    monthlyRent: 9000,
    securityDeposit: 18000,
    paymentSettings: {
      rentDueDay: 5,
      lateFeeDays: 3,
      lateFeeAmount: 500
    }
  }
];

const DEMO_DASHBOARD_SETTINGS = {
  defaultView: 'cards',
  showNotifications: true,
  autoRefresh: true,
  refreshInterval: 30,
  defaultProperty: 'prop-1'
};

const DEMO_STATS = {
  totalBeds: 48,
  occupiedBeds: 42,
  availableBeds: 6,
  totalTenants: 42,
  monthlyRevenue: 336000,
  pendingPayments: 48000,
  occupancyRate: 87.5,
  collectionRate: 85.7,
  maintenanceRequests: 3,
  newApplications: 5
};

const DEMO_ACTIVITIES = [
  {
    id: 1,
    type: 'payment',
    message: 'Payment received from John Doe - ₹8,000',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'success'
  },
  {
    id: 2,
    type: 'tenant',
    message: 'New tenant Charlie Wilson moved in to Bed 203',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    status: 'info'
  },
  {
    id: 3,
    type: 'maintenance',
    message: 'Maintenance request for Bed 202 - AC repair',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    status: 'warning'
  }
];

class DemoApiService {
  constructor() {
    this.isDemoMode = true;
  }

  // Simulate API delay
  async delay(ms = 500) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Settings endpoints
  async getUserSettings() {
    await this.delay();
    return {
      success: true,
      data: DEMO_USER
    };
  }

  async updateUserSettings(settings) {
    await this.delay();
    return {
      success: true,
      data: {
        ...DEMO_USER,
        userSettings: {
          ...DEMO_USER.userSettings,
          ...settings
        }
      }
    };
  }

  async getPropertySettings(propertyId) {
    await this.delay();
    const property = DEMO_PROPERTIES.find(p => p.id === propertyId) || DEMO_PROPERTIES[0];
    return {
      success: true,
      data: property
    };
  }

  async updatePropertySettings(propertyId, settings) {
    await this.delay();
    return {
      success: true,
      data: settings
    };
  }

  async getDashboardSettings() {
    await this.delay();
    return {
      success: true,
      data: DEMO_DASHBOARD_SETTINGS
    };
  }

  async updateDashboardSettings(settings) {
    await this.delay();
    return {
      success: true,
      data: {
        ...DEMO_DASHBOARD_SETTINGS,
        ...settings
      }
    };
  }

  // Dashboard endpoints
  async getDashboardStats() {
    await this.delay();
    return {
      success: true,
      data: {
        stats: DEMO_STATS,
        activities: DEMO_ACTIVITIES,
        settings: DEMO_DASHBOARD_SETTINGS
      }
    };
  }

  async getRecentActivities() {
    await this.delay();
    return {
      success: true,
      data: DEMO_ACTIVITIES
    };
  }

  // Properties endpoints
  async getProperties() {
    await this.delay();
    return {
      success: true,
      data: DEMO_PROPERTIES
    };
  }

  async createProperty(property) {
    await this.delay();
    return {
      success: true,
      data: {
        id: `prop-${Date.now()}`,
        ...property
      }
    };
  }

  async updateProperty(propertyId, property) {
    await this.delay();
    return {
      success: true,
      data: {
        id: propertyId,
        ...property
      }
    };
  }

  async deleteProperty(propertyId) {
    await this.delay();
    return {
      success: true,
      message: 'Property deleted successfully'
    };
  }
}

// Create a singleton instance
const demoApiService = new DemoApiService();

export default demoApiService;
