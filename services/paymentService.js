import { api } from './apiClient';

export class PaymentService {
  // Create Payment
  static async createPayment(propertyId, paymentData) {
    try {
      const response = await api.post(`/properties/${propertyId}/payments`, paymentData);
      
      if (response.success) {
        return {
          success: true,
          payment: response.data,
          message: response.message
        };
      }
      
      throw new Error(response.message || 'Payment creation failed');
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Payment creation failed'
      };
    }
  }

  // Get All Payments
  static async getPayments(propertyId, filters = {}) {
    try {
      const response = await api.get(`/properties/${propertyId}/payments`, filters);
      
      if (response.success) {
        return {
          success: true,
          payments: response.data.payments || [],
          summary: response.data.summary || {},
          pagination: response.data.pagination || {},
          message: response.message
        };
      }
      
      throw new Error(response.message || 'Failed to fetch payments');
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch payments',
        payments: [],
        summary: {},
        pagination: {}
      };
    }
  }

  // Record Payment (Mark as Paid)
  static async recordPayment(propertyId, paymentId, paymentDetails) {
    try {
      const response = await api.post(`/properties/${propertyId}/payments/${paymentId}/record`, paymentDetails);
      
      if (response.success) {
        return {
          success: true,
          payment: response.data,
          message: response.message
        };
      }
      
      throw new Error(response.message || 'Payment recording failed');
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Payment recording failed'
      };
    }
  }

  // Delete Payment
  static async deletePayment(propertyId, paymentId) {
    try {
      const response = await api.delete(`/properties/${propertyId}/payments/${paymentId}`);
      
      if (response.success) {
        return {
          success: true,
          message: response.message || 'Payment deleted successfully'
        };
      }
      
      throw new Error(response.message || 'Payment deletion failed');
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Payment deletion failed'
      };
    }
  }

  // Generate Bulk Payments
  static async generateBulkPayments(propertyId, bulkData) {
    try {
      const response = await api.post(`/properties/${propertyId}/payments/bulk`, bulkData);
      
      if (response.success) {
        return {
          success: true,
          result: response.data,
          message: response.message
        };
      }
      
      throw new Error(response.message || 'Bulk payment generation failed');
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Bulk payment generation failed'
      };
    }
  }

  // Get Payment Analytics
  static async getPaymentAnalytics(propertyId, filters = {}) {
    try {
      const response = await api.get(`/properties/${propertyId}/payments/analytics`, filters);
      
      if (response.success) {
        return {
          success: true,
          analytics: response.data,
          message: response.message
        };
      }
      
      throw new Error(response.message || 'Failed to fetch payment analytics');
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch payment analytics',
        analytics: {}
      };
    }
  }

  // Update Overdue Payments
  static async updateOverduePayments(propertyId) {
    try {
      const response = await api.post(`/properties/${propertyId}/payments/update-overdue`);
      
      if (response.success) {
        return {
          success: true,
          result: response.data,
          message: response.message
        };
      }
      
      throw new Error(response.message || 'Failed to update overdue payments');
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to update overdue payments'
      };
    }
  }

  // Payment Statistics and Insights
  static async getPaymentStats(propertyId, period = 'month') {
    try {
      const filters = { period };
      const [paymentsResponse, analyticsResponse] = await Promise.all([
        this.getPayments(propertyId, filters),
        this.getPaymentAnalytics(propertyId, filters)
      ]);

      if (!paymentsResponse.success) {
        throw new Error(paymentsResponse.message);
      }

      const payments = paymentsResponse.payments;
      const summary = paymentsResponse.summary;
      const analytics = analyticsResponse.success ? analyticsResponse.analytics : {};

      // Calculate additional statistics
      const stats = {
        // Basic counts
        totalPayments: payments.length,
        paidCount: payments.filter(p => p.status === 'PAID').length,
        pendingCount: payments.filter(p => p.status === 'PENDING').length,
        overdueCount: payments.filter(p => p.status === 'OVERDUE').length,
        
        // Financial summary
        totalAmount: summary.total || 0,
        paidAmount: summary.paid || 0,
        pendingAmount: summary.pending || 0,
        
        // Collection efficiency
        collectionRate: summary.total > 0 ? Math.round((summary.paid / summary.total) * 100) : 0,
        
        // Payment method distribution
        paymentMethods: this.calculatePaymentMethodStats(payments.filter(p => p.status === 'PAID')),
        
        // Recent trends
        recentPayments: payments.filter(p => p.status === 'PAID').slice(0, 10),
        upcomingDues: payments.filter(p => p.status === 'PENDING' && new Date(p.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        
        // Analytics data
        monthlyTrend: analytics.trends?.monthlyRevenue || [],
        typeBreakdown: analytics.breakdowns?.byType || []
      };

      return {
        success: true,
        stats,
        message: 'Payment statistics calculated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to calculate payment statistics',
        stats: {}
      };
    }
  }

  // Helper method to calculate payment method statistics
  static calculatePaymentMethodStats(paidPayments) {
    const methods = {};
    
    paidPayments.forEach(payment => {
      const method = payment.paymentMethod || 'UNKNOWN';
      if (!methods[method]) {
        methods[method] = { count: 0, amount: 0 };
      }
      methods[method].count++;
      methods[method].amount += payment.amount;
    });

    return Object.entries(methods).map(([method, data]) => ({
      method,
      count: data.count,
      amount: data.amount,
      percentage: paidPayments.length > 0 ? Math.round((data.count / paidPayments.length) * 100) : 0
    }));
  }

  // Get Overdue Payments Report
  static async getOverdueReport(propertyId) {
    try {
      const response = await this.getPayments(propertyId, { status: 'OVERDUE' });
      
      if (!response.success) {
        throw new Error(response.message);
      }

      const overduePayments = response.payments;
      
      // Group by tenant
      const tenantGroups = {};
      overduePayments.forEach(payment => {
        const tenantId = payment.tenant.id;
        if (!tenantGroups[tenantId]) {
          tenantGroups[tenantId] = {
            tenant: payment.tenant,
            payments: [],
            totalAmount: 0,
            oldestDue: payment.dueDate
          };
        }
        
        tenantGroups[tenantId].payments.push(payment);
        tenantGroups[tenantId].totalAmount += payment.amount;
        
        if (new Date(payment.dueDate) < new Date(tenantGroups[tenantId].oldestDue)) {
          tenantGroups[tenantId].oldestDue = payment.dueDate;
        }
      });

      // Convert to array and sort by total amount (highest first)
      const overdueByTenant = Object.values(tenantGroups).sort((a, b) => b.totalAmount - a.totalAmount);

      return {
        success: true,
        overdueByTenant,
        summary: {
          totalOverdueAmount: overduePayments.reduce((sum, p) => sum + p.amount, 0),
          totalOverdueCount: overduePayments.length,
          affectedTenants: overdueByTenant.length
        },
        message: 'Overdue report generated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to generate overdue report',
        overdueByTenant: [],
        summary: {}
      };
    }
  }

  // Generate Monthly Rent for All Tenants
  static async generateMonthlyRent(propertyId, month, year) {
    try {
      // Get all active tenants
      const tenantsResponse = await api.get(`/properties/${propertyId}/tenants`, { status: 'ACTIVE' });
      
      if (!tenantsResponse.success) {
        throw new Error('Failed to fetch active tenants');
      }

      const tenants = tenantsResponse.data.tenants || [];
      const tenantIds = tenants.map(t => t.id);

      if (tenantIds.length === 0) {
        return {
          success: false,
          message: 'No active tenants found'
        };
      }

      // Generate bulk rent payments
      const dueDate = new Date(year, month - 1, 5); // 5th of the month
      const bulkData = {
        tenantIds,
        paymentType: 'RENT',
        amount: 0, // Will be calculated based on bed rent
        dueDate: dueDate.toISOString(),
        description: `Monthly rent for ${month}/${year}`
      };

      return await this.generateBulkPayments(propertyId, bulkData);
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to generate monthly rent'
      };
    }
  }
}
