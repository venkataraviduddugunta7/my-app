import { api } from './apiClient';

export class DashboardService {
  // Get Main Dashboard Data
  static async getDashboardData(filters = {}) {
    try {
      const response = await api.get('/dashboard', filters);
      
      if (response.success) {
        return {
          success: true,
          dashboard: response.data,
          message: response.message
        };
      }
      
      throw new Error(response.message || 'Failed to fetch dashboard data');
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch dashboard data',
        dashboard: {
          summary: {
            totalProperties: 0,
            totalBeds: 0,
            occupiedBeds: 0,
            activeTenants: 0,
            monthlyRevenue: 0,
            pendingPayments: 0,
            overduePayments: 0,
            occupancyRate: 0
          },
          trends: {
            revenueGrowth: 0,
            occupancyGrowth: 0,
            tenantGrowth: 0
          },
          recentActivity: [],
          upcomingDues: [],
          propertyBreakdown: [],
          paymentAnalytics: {
            monthlyRevenue: [],
            paymentsByType: [],
            collectionRate: 0
          }
        }
      };
    }
  }

  // Get Property-Specific Dashboard
  static async getPropertyDashboard(propertyId) {
    try {
      const response = await api.get(`/dashboard/properties/${propertyId}`);
      
      if (response.success) {
        return {
          success: true,
          dashboard: response.data,
          message: response.message
        };
      }
      
      throw new Error(response.message || 'Failed to fetch property dashboard');
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch property dashboard',
        dashboard: {}
      };
    }
  }

  // Get Analytics Data
  static async getAnalytics(filters = {}) {
    try {
      const response = await api.get('/dashboard/analytics', filters);
      
      if (response.success) {
        return {
          success: true,
          analytics: response.data,
          message: response.message
        };
      }
      
      throw new Error(response.message || 'Failed to fetch analytics');
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch analytics',
        analytics: {
          revenue: { total: 0, trend: [] },
          occupancy: { current: 0, trend: [] },
          payments: { breakdown: [], collectionRate: 0 },
          tenants: { total: 0, trend: [] }
        }
      };
    }
  }

  // Get Quick Stats (for cards and widgets)
  static async getQuickStats(propertyId = null) {
    try {
      const filters = propertyId ? { propertyId } : {};
      const response = await this.getDashboardData(filters);
      
      if (!response.success) {
        throw new Error(response.message);
      }

      const { summary, trends } = response.dashboard;

      return {
        success: true,
        stats: {
          // Main metrics
          totalProperties: summary.totalProperties,
          totalBeds: summary.totalBeds,
          occupiedBeds: summary.occupiedBeds,
          availableBeds: summary.availableBeds || (summary.totalBeds - summary.occupiedBeds),
          activeTenants: summary.activeTenants,
          occupancyRate: summary.occupancyRate,
          
          // Financial metrics
          monthlyRevenue: summary.monthlyRevenue,
          yearlyRevenue: summary.yearlyRevenue || 0,
          pendingPayments: summary.pendingPayments,
          overduePayments: summary.overduePayments,
          
          // Growth trends
          revenueGrowth: trends.revenueGrowth || 0,
          occupancyGrowth: trends.occupancyGrowth || 0,
          tenantGrowth: trends.tenantGrowth || 0
        },
        message: 'Quick stats fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch quick stats',
        stats: {
          totalProperties: 0,
          totalBeds: 0,
          occupiedBeds: 0,
          availableBeds: 0,
          activeTenants: 0,
          occupancyRate: 0,
          monthlyRevenue: 0,
          yearlyRevenue: 0,
          pendingPayments: 0,
          overduePayments: 0,
          revenueGrowth: 0,
          occupancyGrowth: 0,
          tenantGrowth: 0
        }
      };
    }
  }

  // Get Recent Activity
  static async getRecentActivity(propertyId = null, limit = 10) {
    try {
      const filters = { limit };
      if (propertyId) filters.propertyId = propertyId;
      
      const response = await this.getDashboardData(filters);
      
      if (!response.success) {
        throw new Error(response.message);
      }

      return {
        success: true,
        activities: response.dashboard.recentActivity || [],
        message: 'Recent activity fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch recent activity',
        activities: []
      };
    }
  }

  // Get Upcoming Due Payments
  static async getUpcomingDues(propertyId = null, days = 7) {
    try {
      const filters = { days };
      if (propertyId) filters.propertyId = propertyId;
      
      const response = await this.getDashboardData(filters);
      
      if (!response.success) {
        throw new Error(response.message);
      }

      return {
        success: true,
        upcomingDues: response.dashboard.upcomingDues || [],
        message: 'Upcoming dues fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch upcoming dues',
        upcomingDues: []
      };
    }
  }

  // Get Property Breakdown
  static async getPropertyBreakdown() {
    try {
      const response = await this.getDashboardData();
      
      if (!response.success) {
        throw new Error(response.message);
      }

      return {
        success: true,
        properties: response.dashboard.propertyBreakdown || [],
        message: 'Property breakdown fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch property breakdown',
        properties: []
      };
    }
  }

  // Get Revenue Analytics
  static async getRevenueAnalytics(propertyId = null, period = 'year') {
    try {
      const filters = { period };
      if (propertyId) filters.propertyId = propertyId;
      
      const response = await this.getAnalytics(filters);
      
      if (!response.success) {
        throw new Error(response.message);
      }

      const { revenue, payments } = response.analytics;

      return {
        success: true,
        revenue: {
          total: revenue.total || 0,
          trend: revenue.trend || [],
          collectionRate: payments.collectionRate || 0,
          breakdown: payments.breakdown || []
        },
        message: 'Revenue analytics fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch revenue analytics',
        revenue: {
          total: 0,
          trend: [],
          collectionRate: 0,
          breakdown: []
        }
      };
    }
  }

  // Get Occupancy Analytics
  static async getOccupancyAnalytics(propertyId = null, period = 'year') {
    try {
      const filters = { period };
      if (propertyId) filters.propertyId = propertyId;
      
      const response = await this.getAnalytics(filters);
      
      if (!response.success) {
        throw new Error(response.message);
      }

      const { occupancy } = response.analytics;

      return {
        success: true,
        occupancy: {
          current: occupancy.current || 0,
          trend: occupancy.trend || []
        },
        message: 'Occupancy analytics fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch occupancy analytics',
        occupancy: {
          current: 0,
          trend: []
        }
      };
    }
  }

  // Get Performance Metrics
  static async getPerformanceMetrics(propertyId = null) {
    try {
      const [statsResponse, analyticsResponse] = await Promise.all([
        this.getQuickStats(propertyId),
        this.getAnalytics({ propertyId })
      ]);

      if (!statsResponse.success) {
        throw new Error(statsResponse.message);
      }

      const stats = statsResponse.stats;
      const analytics = analyticsResponse.success ? analyticsResponse.analytics : {};

      // Calculate performance metrics
      const metrics = {
        // Occupancy Performance
        occupancyRate: stats.occupancyRate,
        occupancyTarget: 85, // Target occupancy rate
        occupancyPerformance: stats.occupancyRate >= 85 ? 'excellent' : stats.occupancyRate >= 70 ? 'good' : 'needs_improvement',
        
        // Revenue Performance
        monthlyRevenue: stats.monthlyRevenue,
        revenueGrowth: stats.revenueGrowth,
        revenuePerformance: stats.revenueGrowth > 10 ? 'excellent' : stats.revenueGrowth > 0 ? 'good' : 'declining',
        
        // Collection Performance
        collectionRate: analytics.payments?.collectionRate || 0,
        collectionTarget: 95,
        collectionPerformance: (analytics.payments?.collectionRate || 0) >= 95 ? 'excellent' : 
                               (analytics.payments?.collectionRate || 0) >= 85 ? 'good' : 'needs_improvement',
        
        // Tenant Satisfaction (based on retention)
        tenantRetention: this.calculateTenantRetention(stats),
        tenantSatisfaction: 'good', // Would need more data to calculate accurately
        
        // Overall Performance Score
        overallScore: this.calculateOverallScore(stats, analytics)
      };

      return {
        success: true,
        metrics,
        message: 'Performance metrics calculated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to calculate performance metrics',
        metrics: {}
      };
    }
  }

  // Helper method to calculate tenant retention
  static calculateTenantRetention(stats) {
    // Simplified calculation - would need historical data for accuracy
    const totalBeds = stats.totalBeds || 1;
    const occupiedBeds = stats.occupiedBeds || 0;
    
    return Math.round((occupiedBeds / totalBeds) * 100);
  }

  // Helper method to calculate overall performance score
  static calculateOverallScore(stats, analytics) {
    let score = 0;
    let factors = 0;

    // Occupancy score (30% weight)
    if (stats.occupancyRate) {
      score += (stats.occupancyRate / 100) * 30;
      factors += 30;
    }

    // Revenue growth score (25% weight)
    if (stats.revenueGrowth !== undefined) {
      const growthScore = Math.min(Math.max(stats.revenueGrowth, -20), 20); // Cap between -20 and +20
      score += ((growthScore + 20) / 40) * 25; // Normalize to 0-25
      factors += 25;
    }

    // Collection rate score (25% weight)
    if (analytics.payments?.collectionRate) {
      score += (analytics.payments.collectionRate / 100) * 25;
      factors += 25;
    }

    // Tenant count score (20% weight)
    if (stats.activeTenants && stats.totalBeds) {
      const tenantRatio = Math.min(stats.activeTenants / stats.totalBeds, 1);
      score += tenantRatio * 20;
      factors += 20;
    }

    return factors > 0 ? Math.round(score / factors * 100) : 0;
  }
}
