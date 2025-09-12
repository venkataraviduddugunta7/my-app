const { PrismaClient } = require('@prisma/client');
const logger = require('./logger.service');

const prisma = new PrismaClient();

class AnalyticsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get from cache or compute
  async getOrCompute(key, computeFn, timeout = this.cacheTimeout) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < timeout) {
      return cached.data;
    }

    const data = await computeFn();
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    return data;
  }

  // Occupancy Analytics
  async getOccupancyAnalytics(propertyId, startDate, endDate) {
    const cacheKey = `occupancy_${propertyId}_${startDate}_${endDate}`;
    
    return this.getOrCompute(cacheKey, async () => {
      // Get total beds for the property
      const totalBeds = await prisma.bed.count({
        where: {
          room: {
            floor: {
              propertyId
            }
          }
        }
      });

      // Get daily occupancy data
      const dailyOccupancy = await prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as occupied_beds,
          ${totalBeds} as total_beds,
          ROUND((COUNT(*) * 100.0 / ${totalBeds}), 2) as occupancy_rate
        FROM tenants 
        WHERE property_id = ${propertyId}
          AND status = 'ACTIVE'
          AND joining_date <= ${endDate}
          AND (leaving_date IS NULL OR leaving_date >= ${startDate})
        GROUP BY DATE(created_at)
        ORDER BY date
      `;

      // Calculate average occupancy rate
      const avgOccupancyRate = dailyOccupancy.reduce((sum, day) => 
        sum + parseFloat(day.occupancy_rate), 0) / dailyOccupancy.length || 0;

      // Get peak occupancy
      const peakOccupancy = Math.max(...dailyOccupancy.map(day => 
        parseFloat(day.occupancy_rate)));

      return {
        totalBeds,
        dailyOccupancy,
        avgOccupancyRate: Math.round(avgOccupancyRate * 100) / 100,
        peakOccupancy,
        currentOccupancy: dailyOccupancy[dailyOccupancy.length - 1]?.occupancy_rate || 0
      };
    });
  }

  // Revenue Analytics
  async getRevenueAnalytics(propertyId, startDate, endDate) {
    const cacheKey = `revenue_${propertyId}_${startDate}_${endDate}`;
    
    return this.getOrCompute(cacheKey, async () => {
      // Monthly revenue breakdown
      const monthlyRevenue = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', paid_date) as month,
          SUM(amount) as total_revenue,
          COUNT(*) as payment_count,
          AVG(amount) as avg_payment,
          payment_type,
          payment_method
        FROM payments 
        WHERE property_id = ${propertyId}
          AND status = 'PAID'
          AND paid_date >= ${startDate}
          AND paid_date <= ${endDate}
        GROUP BY DATE_TRUNC('month', paid_date), payment_type, payment_method
        ORDER BY month
      `;

      // Revenue by payment type
      const revenueByType = await prisma.$queryRaw`
        SELECT 
          payment_type,
          SUM(amount) as total_amount,
          COUNT(*) as count,
          AVG(amount) as avg_amount
        FROM payments 
        WHERE property_id = ${propertyId}
          AND status = 'PAID'
          AND paid_date >= ${startDate}
          AND paid_date <= ${endDate}
        GROUP BY payment_type
        ORDER BY total_amount DESC
      `;

      // Outstanding payments
      const outstandingPayments = await prisma.$queryRaw`
        SELECT 
          COUNT(*) as count,
          SUM(amount) as total_amount,
          AVG(EXTRACT(DAY FROM (CURRENT_DATE - due_date))) as avg_days_overdue
        FROM payments 
        WHERE property_id = ${propertyId}
          AND status = 'PENDING'
          AND due_date < CURRENT_DATE
      `;

      const totalRevenue = monthlyRevenue.reduce((sum, month) => 
        sum + parseFloat(month.total_revenue), 0);

      return {
        totalRevenue,
        monthlyRevenue,
        revenueByType,
        outstandingPayments: outstandingPayments[0],
        averageMonthlyRevenue: totalRevenue / (monthlyRevenue.length || 1)
      };
    });
  }

  // Tenant Analytics
  async getTenantAnalytics(propertyId, startDate, endDate) {
    const cacheKey = `tenant_${propertyId}_${startDate}_${endDate}`;
    
    return this.getOrCompute(cacheKey, async () => {
      // Tenant demographics
      const tenantDemographics = await prisma.tenant.groupBy({
        by: ['status'],
        where: {
          propertyId,
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        },
        _count: true
      });

      // Average stay duration
      const averageStayDuration = await prisma.$queryRaw`
        SELECT 
          AVG(EXTRACT(DAY FROM (
            COALESCE(leaving_date, CURRENT_DATE) - joining_date
          ))) as avg_stay_days
        FROM tenants 
        WHERE property_id = ${propertyId}
          AND joining_date >= ${startDate}
          AND joining_date <= ${endDate}
      `;

      // Monthly tenant turnover
      const monthlyTurnover = await prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', joining_date) as month,
          COUNT(*) as new_tenants,
          (
            SELECT COUNT(*) 
            FROM tenants t2 
            WHERE t2.property_id = ${propertyId}
              AND DATE_TRUNC('month', t2.leaving_date) = DATE_TRUNC('month', t1.joining_date)
          ) as departed_tenants
        FROM tenants t1
        WHERE property_id = ${propertyId}
          AND joining_date >= ${startDate}
          AND joining_date <= ${endDate}
        GROUP BY DATE_TRUNC('month', joining_date)
        ORDER BY month
      `;

      // Top paying tenants
      const topPayingTenants = await prisma.$queryRaw`
        SELECT 
          t.id,
          t.full_name,
          t.tenant_id,
          SUM(p.amount) as total_paid,
          COUNT(p.id) as payment_count,
          AVG(p.amount) as avg_payment
        FROM tenants t
        JOIN payments p ON t.id = p.tenant_id
        WHERE t.property_id = ${propertyId}
          AND p.status = 'PAID'
          AND p.paid_date >= ${startDate}
          AND p.paid_date <= ${endDate}
        GROUP BY t.id, t.full_name, t.tenant_id
        ORDER BY total_paid DESC
        LIMIT 10
      `;

      return {
        tenantDemographics,
        averageStayDuration: averageStayDuration[0]?.avg_stay_days || 0,
        monthlyTurnover,
        topPayingTenants,
        totalTenants: tenantDemographics.reduce((sum, demo) => sum + demo._count, 0)
      };
    });
  }

  // Maintenance Analytics
  async getMaintenanceAnalytics(propertyId, startDate, endDate) {
    const cacheKey = `maintenance_${propertyId}_${startDate}_${endDate}`;
    
    return this.getOrCompute(cacheKey, async () => {
      // This would be implemented when maintenance requests are added to schema
      const maintenanceRequests = await prisma.$queryRaw`
        SELECT 
          COUNT(*) as total_requests,
          AVG(EXTRACT(DAY FROM (completed_at - created_at))) as avg_resolution_days,
          SUM(cost) as total_cost,
          AVG(cost) as avg_cost
        FROM maintenance_requests 
        WHERE created_at >= ${startDate}
          AND created_at <= ${endDate}
      `;

      return {
        totalRequests: 0, // Placeholder
        avgResolutionDays: 0,
        totalCost: 0,
        avgCost: 0,
        requestsByPriority: [],
        requestsByStatus: []
      };
    });
  }

  // Comprehensive Dashboard Analytics
  async getDashboardAnalytics(propertyId, period = '30d') {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    const [occupancy, revenue, tenant, maintenance] = await Promise.all([
      this.getOccupancyAnalytics(propertyId, startDate, endDate),
      this.getRevenueAnalytics(propertyId, startDate, endDate),
      this.getTenantAnalytics(propertyId, startDate, endDate),
      this.getMaintenanceAnalytics(propertyId, startDate, endDate)
    ]);

    // Calculate key performance indicators
    const kpis = {
      occupancyRate: occupancy.avgOccupancyRate,
      monthlyRevenue: revenue.averageMonthlyRevenue,
      tenantRetentionRate: this.calculateRetentionRate(tenant.monthlyTurnover),
      averageStayDuration: tenant.averageStayDuration,
      outstandingAmount: revenue.outstandingPayments.total_amount || 0,
      maintenanceCostRatio: (maintenance.totalCost / revenue.totalRevenue) * 100 || 0
    };

    return {
      period,
      startDate,
      endDate,
      kpis,
      occupancy,
      revenue,
      tenant,
      maintenance,
      insights: this.generateInsights(kpis, { occupancy, revenue, tenant, maintenance })
    };
  }

  // Calculate tenant retention rate
  calculateRetentionRate(monthlyTurnover) {
    if (!monthlyTurnover.length) return 0;
    
    const totalNew = monthlyTurnover.reduce((sum, month) => sum + month.new_tenants, 0);
    const totalDeparted = monthlyTurnover.reduce((sum, month) => sum + month.departed_tenants, 0);
    
    return totalNew > 0 ? ((totalNew - totalDeparted) / totalNew) * 100 : 0;
  }

  // Generate business insights
  generateInsights(kpis, analytics) {
    const insights = [];

    // Occupancy insights
    if (kpis.occupancyRate > 90) {
      insights.push({
        type: 'success',
        category: 'occupancy',
        message: 'Excellent occupancy rate! Consider expanding capacity.',
        priority: 'low'
      });
    } else if (kpis.occupancyRate < 70) {
      insights.push({
        type: 'warning',
        category: 'occupancy',
        message: 'Low occupancy rate. Review pricing and marketing strategies.',
        priority: 'high'
      });
    }

    // Revenue insights
    if (kpis.outstandingAmount > kpis.monthlyRevenue * 0.2) {
      insights.push({
        type: 'warning',
        category: 'revenue',
        message: 'High outstanding payments. Implement stricter collection policies.',
        priority: 'high'
      });
    }

    // Tenant insights
    if (kpis.tenantRetentionRate < 80) {
      insights.push({
        type: 'info',
        category: 'tenant',
        message: 'Consider tenant satisfaction surveys to improve retention.',
        priority: 'medium'
      });
    }

    return insights;
  }

  // Clear cache
  clearCache(pattern = null) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
    
    logger.info('Analytics cache cleared', { pattern });
  }

  // Export analytics data
  async exportAnalytics(propertyId, startDate, endDate, format = 'json') {
    const analytics = await this.getDashboardAnalytics(propertyId, 'custom');
    
    if (format === 'csv') {
      // Convert to CSV format
      return this.convertToCSV(analytics);
    }
    
    return analytics;
  }

  convertToCSV(data) {
    // Implementation for CSV conversion
    const csvData = [];
    
    // Add headers
    csvData.push(['Metric', 'Value', 'Period']);
    
    // Add KPIs
    Object.entries(data.kpis).forEach(([key, value]) => {
      csvData.push([key, value, data.period]);
    });
    
    return csvData.map(row => row.join(',')).join('\n');
  }
}

module.exports = new AnalyticsService();
