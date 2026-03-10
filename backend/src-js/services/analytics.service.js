const { PrismaClient } = require('@prisma/client');
const logger = require('./logger.service');

const prisma = new PrismaClient();

const toDate = (value) => {
  const parsed = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }
  return parsed;
};

const startOfDay = (value) => {
  const date = toDate(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value) => {
  const date = toDate(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

const toDayKey = (value) => toDate(value).toISOString().slice(0, 10);
const toMonthKey = (value) => toDate(value).toISOString().slice(0, 7);
const toMonthDate = (monthKey) => new Date(`${monthKey}-01T00:00:00.000Z`);

const diffDays = (from, to) => {
  const start = startOfDay(from).getTime();
  const end = startOfDay(to).getTime();
  return Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
};

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
      timestamp: Date.now(),
    });

    return data;
  }

  // Occupancy Analytics
  async getOccupancyAnalytics(propertyId, startDate, endDate) {
    const normalizedStartDate = startOfDay(startDate);
    const normalizedEndDate = endOfDay(endDate);
    const cacheKey = `occupancy_${propertyId}_${normalizedStartDate.toISOString()}_${normalizedEndDate.toISOString()}`;

    return this.getOrCompute(cacheKey, async () => {
      const [totalBeds, tenants] = await Promise.all([
        prisma.bed.count({
          where: {
            room: {
              floor: {
                propertyId,
              },
            },
          },
        }),
        prisma.tenant.findMany({
          where: {
            propertyId,
            status: 'ACTIVE',
            joiningDate: {
              lte: normalizedEndDate,
            },
            OR: [
              { leavingDate: null },
              { leavingDate: { gte: normalizedStartDate } },
            ],
          },
          select: {
            joiningDate: true,
            leavingDate: true,
          },
        }),
      ]);

      const dailyOccupancy = [];
      const cursor = new Date(normalizedStartDate);

      while (cursor <= normalizedEndDate) {
        const dayStart = startOfDay(cursor);
        const occupiedBeds = tenants.reduce((count, tenant) => {
          const joined = tenant.joiningDate <= dayStart;
          const notLeft = !tenant.leavingDate || tenant.leavingDate >= dayStart;
          return joined && notLeft ? count + 1 : count;
        }, 0);

        const occupancyRate = totalBeds > 0 ? Number(((occupiedBeds * 100) / totalBeds).toFixed(2)) : 0;

        dailyOccupancy.push({
          date: toDayKey(dayStart),
          occupied_beds: occupiedBeds,
          total_beds: totalBeds,
          occupancy_rate: occupancyRate,
        });

        cursor.setDate(cursor.getDate() + 1);
      }

      const avgOccupancyRate = dailyOccupancy.length
        ? Number(
            (
              dailyOccupancy.reduce((sum, day) => sum + Number(day.occupancy_rate || 0), 0) /
              dailyOccupancy.length
            ).toFixed(2)
          )
        : 0;

      const peakOccupancy = dailyOccupancy.length
        ? Math.max(...dailyOccupancy.map((day) => Number(day.occupancy_rate || 0)))
        : 0;

      return {
        totalBeds,
        dailyOccupancy,
        avgOccupancyRate,
        peakOccupancy,
        currentOccupancy: Number(dailyOccupancy[dailyOccupancy.length - 1]?.occupancy_rate || 0),
      };
    });
  }

  // Revenue Analytics
  async getRevenueAnalytics(propertyId, startDate, endDate) {
    const normalizedStartDate = startOfDay(startDate);
    const normalizedEndDate = endOfDay(endDate);
    const cacheKey = `revenue_${propertyId}_${normalizedStartDate.toISOString()}_${normalizedEndDate.toISOString()}`;

    return this.getOrCompute(cacheKey, async () => {
      const [paidPayments, outstandingPaymentRecords] = await Promise.all([
        prisma.payment.findMany({
          where: {
            propertyId,
            status: 'PAID',
            paidDate: {
              gte: normalizedStartDate,
              lte: normalizedEndDate,
            },
          },
          select: {
            amount: true,
            paymentType: true,
            paymentMethod: true,
            paidDate: true,
          },
        }),
        prisma.payment.findMany({
          where: {
            propertyId,
            status: {
              in: ['PENDING', 'OVERDUE', 'PARTIAL'],
            },
          },
          select: {
            amount: true,
            dueDate: true,
          },
        }),
      ]);

      const monthlyRevenueMap = new Map();
      const revenueByTypeMap = new Map();

      for (const payment of paidPayments) {
        const monthKey = toMonthKey(payment.paidDate);
        const monthlyKey = `${monthKey}__${payment.paymentType}__${payment.paymentMethod}`;
        const monthlyEntry = monthlyRevenueMap.get(monthlyKey) || {
          month: toMonthDate(monthKey),
          total_revenue: 0,
          payment_count: 0,
          avg_payment: 0,
          payment_type: payment.paymentType,
          payment_method: payment.paymentMethod,
        };

        monthlyEntry.total_revenue += Number(payment.amount || 0);
        monthlyEntry.payment_count += 1;
        monthlyRevenueMap.set(monthlyKey, monthlyEntry);

        const byTypeEntry = revenueByTypeMap.get(payment.paymentType) || {
          payment_type: payment.paymentType,
          total_amount: 0,
          count: 0,
          avg_amount: 0,
        };

        byTypeEntry.total_amount += Number(payment.amount || 0);
        byTypeEntry.count += 1;
        revenueByTypeMap.set(payment.paymentType, byTypeEntry);
      }

      const monthlyRevenue = Array.from(monthlyRevenueMap.values())
        .map((entry) => ({
          ...entry,
          avg_payment: entry.payment_count > 0 ? entry.total_revenue / entry.payment_count : 0,
        }))
        .sort((a, b) => a.month.getTime() - b.month.getTime());

      const revenueByType = Array.from(revenueByTypeMap.values())
        .map((entry) => ({
          ...entry,
          avg_amount: entry.count > 0 ? entry.total_amount / entry.count : 0,
        }))
        .sort((a, b) => b.total_amount - a.total_amount);

      const now = new Date();
      const overdueRecords = outstandingPaymentRecords.filter(
        (payment) => payment.dueDate && payment.dueDate < now
      );

      const outstandingCount = outstandingPaymentRecords.length;
      const outstandingTotal = outstandingPaymentRecords.reduce(
        (sum, payment) => sum + Number(payment.amount || 0),
        0
      );
      const avgDaysOverdue = overdueRecords.length
        ? overdueRecords.reduce((sum, payment) => sum + diffDays(payment.dueDate, now), 0) /
          overdueRecords.length
        : 0;

      const totalRevenue = paidPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
      const activeMonths = new Set(paidPayments.map((payment) => toMonthKey(payment.paidDate))).size || 1;

      return {
        totalRevenue,
        monthlyRevenue,
        revenueByType,
        outstandingPayments: {
          count: outstandingCount,
          total_amount: outstandingTotal,
          avg_days_overdue: avgDaysOverdue,
        },
        averageMonthlyRevenue: totalRevenue / activeMonths,
      };
    });
  }

  // Tenant Analytics
  async getTenantAnalytics(propertyId, startDate, endDate) {
    const normalizedStartDate = startOfDay(startDate);
    const normalizedEndDate = endOfDay(endDate);
    const cacheKey = `tenant_${propertyId}_${normalizedStartDate.toISOString()}_${normalizedEndDate.toISOString()}`;

    return this.getOrCompute(cacheKey, async () => {
      const [tenantDemographicsRaw, stayDurationTenants, turnoverTenants, paidPayments] = await Promise.all([
        prisma.tenant.groupBy({
          by: ['status'],
          where: {
            propertyId,
            createdAt: {
              gte: normalizedStartDate,
              lte: normalizedEndDate,
            },
          },
          _count: { _all: true },
        }),
        prisma.tenant.findMany({
          where: {
            propertyId,
            joiningDate: {
              gte: normalizedStartDate,
              lte: normalizedEndDate,
            },
          },
          select: {
            joiningDate: true,
            leavingDate: true,
          },
        }),
        prisma.tenant.findMany({
          where: {
            propertyId,
            OR: [
              {
                joiningDate: {
                  gte: normalizedStartDate,
                  lte: normalizedEndDate,
                },
              },
              {
                leavingDate: {
                  gte: normalizedStartDate,
                  lte: normalizedEndDate,
                },
              },
            ],
          },
          select: {
            joiningDate: true,
            leavingDate: true,
          },
        }),
        prisma.payment.findMany({
          where: {
            propertyId,
            status: 'PAID',
            paidDate: {
              gte: normalizedStartDate,
              lte: normalizedEndDate,
            },
          },
          select: {
            id: true,
            amount: true,
            tenant: {
              select: {
                id: true,
                fullName: true,
                tenantId: true,
              },
            },
          },
        }),
      ]);

      const tenantDemographics = tenantDemographicsRaw.map((item) => ({
        status: item.status,
        _count: item._count?._all || 0,
      }));

      const averageStayDuration = stayDurationTenants.length
        ? stayDurationTenants.reduce((sum, tenant) => {
            const leaveDate = tenant.leavingDate || normalizedEndDate;
            return sum + diffDays(tenant.joiningDate, leaveDate);
          }, 0) / stayDurationTenants.length
        : 0;

      const monthBuckets = [];
      const monthCursor = new Date(
        Date.UTC(normalizedStartDate.getUTCFullYear(), normalizedStartDate.getUTCMonth(), 1)
      );
      const monthEnd = new Date(
        Date.UTC(normalizedEndDate.getUTCFullYear(), normalizedEndDate.getUTCMonth(), 1)
      );

      while (monthCursor <= monthEnd) {
        monthBuckets.push(toMonthKey(monthCursor));
        monthCursor.setUTCMonth(monthCursor.getUTCMonth() + 1);
      }

      const turnoverMap = new Map(
        monthBuckets.map((monthKey) => [
          monthKey,
          { month: toMonthDate(monthKey), new_tenants: 0, departed_tenants: 0 },
        ])
      );

      for (const tenant of turnoverTenants) {
        if (
          tenant.joiningDate &&
          tenant.joiningDate >= normalizedStartDate &&
          tenant.joiningDate <= normalizedEndDate
        ) {
          const monthKey = toMonthKey(tenant.joiningDate);
          if (turnoverMap.has(monthKey)) {
            turnoverMap.get(monthKey).new_tenants += 1;
          }
        }

        if (
          tenant.leavingDate &&
          tenant.leavingDate >= normalizedStartDate &&
          tenant.leavingDate <= normalizedEndDate
        ) {
          const monthKey = toMonthKey(tenant.leavingDate);
          if (turnoverMap.has(monthKey)) {
            turnoverMap.get(monthKey).departed_tenants += 1;
          }
        }
      }

      const monthlyTurnover = Array.from(turnoverMap.values()).sort(
        (a, b) => a.month.getTime() - b.month.getTime()
      );

      const topPayingMap = new Map();
      for (const payment of paidPayments) {
        if (!payment.tenant?.id) continue;
        const key = payment.tenant.id;
        const current = topPayingMap.get(key) || {
          id: payment.tenant.id,
          full_name: payment.tenant.fullName,
          tenant_id: payment.tenant.tenantId,
          total_paid: 0,
          payment_count: 0,
          avg_payment: 0,
        };

        current.total_paid += Number(payment.amount || 0);
        current.payment_count += 1;
        topPayingMap.set(key, current);
      }

      const topPayingTenants = Array.from(topPayingMap.values())
        .map((entry) => ({
          ...entry,
          avg_payment: entry.payment_count > 0 ? entry.total_paid / entry.payment_count : 0,
        }))
        .sort((a, b) => b.total_paid - a.total_paid)
        .slice(0, 10);

      return {
        tenantDemographics,
        averageStayDuration,
        monthlyTurnover,
        topPayingTenants,
        totalTenants: tenantDemographics.reduce((sum, demo) => sum + Number(demo._count || 0), 0),
      };
    });
  }

  // Maintenance Analytics
  async getMaintenanceAnalytics(propertyId, startDate, endDate) {
    const normalizedStartDate = startOfDay(startDate);
    const normalizedEndDate = endOfDay(endDate);
    const cacheKey = `maintenance_${propertyId}_${normalizedStartDate.toISOString()}_${normalizedEndDate.toISOString()}`;

    return this.getOrCompute(cacheKey, async () => {
      try {
        const [aggregate, completedRequests, requestsByPriorityRaw, requestsByStatusRaw] =
          await Promise.all([
            prisma.maintenanceRequest.aggregate({
              where: {
                createdAt: {
                  gte: normalizedStartDate,
                  lte: normalizedEndDate,
                },
              },
              _count: { _all: true },
              _sum: { cost: true },
              _avg: { cost: true },
            }),
            prisma.maintenanceRequest.findMany({
              where: {
                createdAt: {
                  gte: normalizedStartDate,
                  lte: normalizedEndDate,
                },
                completedAt: {
                  not: null,
                },
              },
              select: {
                createdAt: true,
                completedAt: true,
              },
            }),
            prisma.maintenanceRequest.groupBy({
              by: ['priority'],
              where: {
                createdAt: {
                  gte: normalizedStartDate,
                  lte: normalizedEndDate,
                },
              },
              _count: { _all: true },
            }),
            prisma.maintenanceRequest.groupBy({
              by: ['status'],
              where: {
                createdAt: {
                  gte: normalizedStartDate,
                  lte: normalizedEndDate,
                },
              },
              _count: { _all: true },
            }),
          ]);

        const avgResolutionDays = completedRequests.length
          ? completedRequests.reduce((sum, request) => {
              if (!request.completedAt) return sum;
              return sum + diffDays(request.createdAt, request.completedAt);
            }, 0) / completedRequests.length
          : 0;

        return {
          totalRequests: aggregate._count?._all || 0,
          avgResolutionDays,
          totalCost: Number(aggregate._sum?.cost || 0),
          avgCost: Number(aggregate._avg?.cost || 0),
          requestsByPriority: requestsByPriorityRaw.map((item) => ({
            priority: item.priority,
            count: item._count?._all || 0,
          })),
          requestsByStatus: requestsByStatusRaw.map((item) => ({
            status: item.status,
            count: item._count?._all || 0,
          })),
        };
      } catch (error) {
        logger.info('Maintenance analytics fallback triggered', {
          propertyId,
          message: error.message,
        });

        return {
          totalRequests: 0,
          avgResolutionDays: 0,
          totalCost: 0,
          avgCost: 0,
          requestsByPriority: [],
          requestsByStatus: [],
        };
      }
    });
  }

  // Comprehensive Dashboard Analytics
  async getDashboardAnalytics(propertyId, period = '30d', customStartDate = null, customEndDate = null) {
    let normalizedEndDate = endOfDay(new Date());
    let normalizedStartDate = startOfDay(new Date());

    if (period === 'custom' && customStartDate && customEndDate) {
      normalizedStartDate = startOfDay(customStartDate);
      normalizedEndDate = endOfDay(customEndDate);
    } else {
      switch (period) {
        case '7d':
          normalizedStartDate.setDate(normalizedEndDate.getDate() - 7);
          break;
        case '30d':
          normalizedStartDate.setDate(normalizedEndDate.getDate() - 30);
          break;
        case '90d':
          normalizedStartDate.setDate(normalizedEndDate.getDate() - 90);
          break;
        case '1y':
          normalizedStartDate.setFullYear(normalizedEndDate.getFullYear() - 1);
          break;
        default:
          normalizedStartDate.setDate(normalizedEndDate.getDate() - 30);
          break;
      }
    }

    const [occupancy, revenue, tenant, maintenance] = await Promise.all([
      this.getOccupancyAnalytics(propertyId, normalizedStartDate, normalizedEndDate),
      this.getRevenueAnalytics(propertyId, normalizedStartDate, normalizedEndDate),
      this.getTenantAnalytics(propertyId, normalizedStartDate, normalizedEndDate),
      this.getMaintenanceAnalytics(propertyId, normalizedStartDate, normalizedEndDate),
    ]);

    const totalRevenue = Number(revenue.totalRevenue || 0);
    const maintenanceCost = Number(maintenance.totalCost || 0);
    const outstandingAmount = Number(revenue.outstandingPayments?.total_amount || 0);

    const kpis = {
      occupancyRate: Number(occupancy.avgOccupancyRate || 0),
      monthlyRevenue: Number(revenue.averageMonthlyRevenue || 0),
      tenantRetentionRate: this.calculateRetentionRate(tenant.monthlyTurnover),
      averageStayDuration: Number(tenant.averageStayDuration || 0),
      outstandingAmount,
      maintenanceCostRatio: totalRevenue > 0 ? (maintenanceCost / totalRevenue) * 100 : 0,
    };

    return {
      period,
      startDate: normalizedStartDate,
      endDate: normalizedEndDate,
      kpis,
      occupancy,
      revenue,
      tenant,
      maintenance,
      insights: this.generateInsights(kpis, { occupancy, revenue, tenant, maintenance }),
    };
  }

  // Calculate tenant retention rate
  calculateRetentionRate(monthlyTurnover) {
    if (!Array.isArray(monthlyTurnover) || monthlyTurnover.length === 0) return 0;

    const totalNew = monthlyTurnover.reduce(
      (sum, month) => sum + Number(month.new_tenants || 0),
      0
    );
    const totalDeparted = monthlyTurnover.reduce(
      (sum, month) => sum + Number(month.departed_tenants || 0),
      0
    );

    if (totalNew <= 0) return 0;

    const retention = ((totalNew - totalDeparted) / totalNew) * 100;
    return Math.max(0, Math.min(100, retention));
  }

  // Generate business insights
  generateInsights(kpis) {
    const insights = [];

    // Occupancy insights
    if (kpis.occupancyRate > 90) {
      insights.push({
        type: 'success',
        category: 'occupancy',
        message: 'Excellent occupancy rate! Consider expanding capacity.',
        priority: 'low',
      });
    } else if (kpis.occupancyRate < 70) {
      insights.push({
        type: 'warning',
        category: 'occupancy',
        message: 'Low occupancy rate. Review pricing and marketing strategies.',
        priority: 'high',
      });
    }

    // Revenue insights
    if (kpis.outstandingAmount > kpis.monthlyRevenue * 0.2) {
      insights.push({
        type: 'warning',
        category: 'revenue',
        message: 'High outstanding payments. Implement stricter collection policies.',
        priority: 'high',
      });
    }

    // Tenant insights
    if (kpis.tenantRetentionRate < 80) {
      insights.push({
        type: 'info',
        category: 'tenant',
        message: 'Consider tenant satisfaction surveys to improve retention.',
        priority: 'medium',
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
    const analytics = await this.getDashboardAnalytics(propertyId, 'custom', startDate, endDate);

    if (format === 'csv') {
      return this.convertToCSV(analytics);
    }

    return analytics;
  }

  convertToCSV(data) {
    const csvData = [];
    csvData.push(['Metric', 'Value', 'Period']);

    Object.entries(data.kpis).forEach(([key, value]) => {
      csvData.push([key, value, data.period]);
    });

    return csvData.map((row) => row.join(',')).join('\n');
  }
}

module.exports = new AnalyticsService();
