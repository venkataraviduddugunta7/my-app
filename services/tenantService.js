import { api } from './apiClient';

export class TenantService {
  // Create Tenant
  static async createTenant(propertyId, tenantData) {
    try {
      const response = await api.post(`/properties/${propertyId}/tenants`, tenantData);
      
      if (response.success) {
        return {
          success: true,
          tenant: response.data,
          message: response.message
        };
      }
      
      throw new Error(response.message || 'Tenant creation failed');
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Tenant creation failed'
      };
    }
  }

  // Get All Tenants
  static async getTenants(propertyId, filters = {}) {
    try {
      const response = await api.get(`/properties/${propertyId}/tenants`, filters);
      
      if (response.success) {
        return {
          success: true,
          tenants: response.data.tenants || [],
          pagination: response.data.pagination || {},
          message: response.message
        };
      }
      
      throw new Error(response.message || 'Failed to fetch tenants');
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch tenants',
        tenants: [],
        pagination: {}
      };
    }
  }

  // Get Single Tenant
  static async getTenant(propertyId, tenantId) {
    try {
      const response = await api.get(`/properties/${propertyId}/tenants/${tenantId}`);
      
      if (response.success) {
        return {
          success: true,
          tenant: response.data,
          message: response.message
        };
      }
      
      throw new Error(response.message || 'Failed to fetch tenant');
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch tenant'
      };
    }
  }

  // Update Tenant
  static async updateTenant(propertyId, tenantId, tenantData) {
    try {
      const response = await api.put(`/properties/${propertyId}/tenants/${tenantId}`, tenantData);
      
      if (response.success) {
        return {
          success: true,
          tenant: response.data,
          message: response.message
        };
      }
      
      throw new Error(response.message || 'Tenant update failed');
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Tenant update failed'
      };
    }
  }

  // Relocate Tenant
  static async relocateTenant(propertyId, tenantId, relocationData) {
    try {
      const response = await api.post(`/properties/${propertyId}/tenants/${tenantId}/relocate`, relocationData);
      
      if (response.success) {
        return {
          success: true,
          tenant: response.data,
          message: response.message
        };
      }
      
      throw new Error(response.message || 'Tenant relocation failed');
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Tenant relocation failed'
      };
    }
  }

  // Vacate Tenant
  static async vacateTenant(propertyId, tenantId, vacationData) {
    try {
      const response = await api.post(`/properties/${propertyId}/tenants/${tenantId}/vacate`, vacationData);
      
      if (response.success) {
        return {
          success: true,
          tenant: response.data,
          message: response.message
        };
      }
      
      throw new Error(response.message || 'Tenant vacation failed');
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Tenant vacation failed'
      };
    }
  }

  // Get Tenant Payments
  static async getTenantPayments(propertyId, tenantId, filters = {}) {
    try {
      const response = await api.get(`/properties/${propertyId}/tenants/${tenantId}/payments`, filters);
      
      if (response.success) {
        return {
          success: true,
          payments: response.data.payments || [],
          pagination: response.data.pagination || {},
          message: response.message
        };
      }
      
      throw new Error(response.message || 'Failed to fetch tenant payments');
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch tenant payments',
        payments: [],
        pagination: {}
      };
    }
  }

  // Tenant Statistics and Analytics
  static async getTenantStats(propertyId) {
    try {
      const tenantsResponse = await this.getTenants(propertyId);
      
      if (!tenantsResponse.success) {
        throw new Error(tenantsResponse.message);
      }

      const tenants = tenantsResponse.tenants;
      
      // Calculate statistics
      const stats = {
        total: tenants.length,
        active: tenants.filter(t => t.status === 'ACTIVE').length,
        inactive: tenants.filter(t => t.status === 'INACTIVE').length,
        vacated: tenants.filter(t => t.status === 'VACATED').length,
        pending: tenants.filter(t => t.status === 'PENDING').length,
        withPendingPayments: tenants.filter(t => t.stats?.pendingPayments > 0).length,
        withOverduePayments: tenants.filter(t => t.stats?.overduePayments > 0).length,
        averageStayDuration: this.calculateAverageStayDuration(tenants),
        totalRevenue: tenants.reduce((sum, t) => sum + (t.stats?.totalPaid || 0), 0)
      };

      return {
        success: true,
        stats,
        message: 'Tenant statistics calculated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to calculate tenant statistics',
        stats: {}
      };
    }
  }

  // Helper method to calculate average stay duration
  static calculateAverageStayDuration(tenants) {
    const activeTenants = tenants.filter(t => t.status === 'ACTIVE');
    
    if (activeTenants.length === 0) return 0;

    const totalDays = activeTenants.reduce((sum, tenant) => {
      const joiningDate = new Date(tenant.joiningDate);
      const currentDate = new Date();
      const diffTime = Math.abs(currentDate - joiningDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return sum + diffDays;
    }, 0);

    return Math.round(totalDays / activeTenants.length);
  }

  // Get Tenant Activity Timeline
  static async getTenantActivity(propertyId, tenantId) {
    try {
      // Get tenant details and payments
      const [tenantResponse, paymentsResponse] = await Promise.all([
        this.getTenant(propertyId, tenantId),
        this.getTenantPayments(propertyId, tenantId, { limit: 50 })
      ]);

      if (!tenantResponse.success || !paymentsResponse.success) {
        throw new Error('Failed to fetch tenant activity data');
      }

      const tenant = tenantResponse.tenant;
      const payments = paymentsResponse.payments;

      // Create activity timeline
      const activities = [];

      // Add joining activity
      activities.push({
        id: `join-${tenant.id}`,
        type: 'join',
        title: 'Tenant Joined',
        description: `${tenant.fullName} joined the property`,
        date: tenant.joiningDate,
        status: 'completed'
      });

      // Add payment activities
      payments.forEach(payment => {
        activities.push({
          id: `payment-${payment.id}`,
          type: 'payment',
          title: `${payment.paymentType} Payment`,
          description: `₹${payment.amount} - ${payment.status}`,
          date: payment.paidDate || payment.dueDate,
          status: payment.status.toLowerCase(),
          amount: payment.amount
        });
      });

      // Add leaving activity if applicable
      if (tenant.leavingDate) {
        activities.push({
          id: `leave-${tenant.id}`,
          type: 'leave',
          title: 'Tenant Left',
          description: `${tenant.fullName} vacated the property`,
          date: tenant.leavingDate,
          status: 'completed'
        });
      }

      // Sort activities by date (newest first)
      activities.sort((a, b) => new Date(b.date) - new Date(a.date));

      return {
        success: true,
        activities,
        tenant,
        message: 'Tenant activity fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch tenant activity',
        activities: []
      };
    }
  }
}
