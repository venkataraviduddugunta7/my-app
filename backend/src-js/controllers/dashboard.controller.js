const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middleware/error.middleware');

const prisma = new PrismaClient();

// GET /api/dashboard/stats - Get comprehensive dashboard statistics
const getDashboardStats = asyncHandler(async (req, res) => {
  const { propertyId } = req.query;
  const userId = req.user.id;

  // Build where clause for user's properties
  const whereClause = {};
  if (propertyId) {
    whereClause.propertyId = propertyId;
  } else {
    // Get user's properties
    const userProperties = await prisma.property.findMany({
      where: { ownerId: userId },
      select: { id: true }
    });
    whereClause.propertyId = { in: userProperties.map(p => p.id) };
  }

  // Get comprehensive statistics
  const [
    totalRooms,
    occupiedRooms,
    availableRooms,
    maintenanceRooms,
    totalBeds,
    occupiedBeds,
    availableBeds,
    totalTenants,
    activeTenants,
    totalProperties
  ] = await Promise.all([
    // Room statistics
    prisma.room.count({
      where: { floor: whereClause }
    }),
    prisma.room.count({
      where: { 
        floor: whereClause,
        beds: { some: { status: 'OCCUPIED' } }
      }
    }),
    prisma.room.count({
      where: { 
        floor: whereClause,
        beds: { some: { status: 'AVAILABLE' } }
      }
    }),
    prisma.room.count({
      where: { 
        floor: whereClause,
        beds: { some: { status: 'MAINTENANCE' } }
      }
    }),
    
    // Bed statistics
    prisma.bed.count({
      where: { room: { floor: whereClause } }
    }),
    prisma.bed.count({
      where: { 
        room: { floor: whereClause },
        status: 'OCCUPIED'
      }
    }),
    prisma.bed.count({
      where: { 
        room: { floor: whereClause },
        status: 'AVAILABLE'
      }
    }),
    
    // Tenant statistics
    prisma.tenant.count({
      where: whereClause
    }),
    prisma.tenant.count({
      where: {
        ...whereClause,
        status: 'ACTIVE'
      }
    }),
    
    // Property count
    prisma.property.count({
      where: { ownerId: userId }
    })
  ]);

  // Calculate occupancy rate
  const occupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : 0;

  // Get revenue statistics for current month
  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
  
  const revenueStats = await prisma.payment.aggregate({
    where: {
      ...whereClause,
      month: currentMonth,
      status: 'PAID'
    },
    _sum: { amount: true },
    _count: true
  });

  const pendingPayments = await prisma.payment.aggregate({
    where: {
      ...whereClause,
      month: currentMonth,
      status: 'PENDING'
    },
    _sum: { amount: true },
    _count: true
  });

  const overduePayments = await prisma.payment.count({
    where: {
      ...whereClause,
      status: 'PENDING',
      dueDate: { lt: new Date() }
    }
  });

  res.status(200).json({
    success: true,
    data: {
      rooms: {
        total: totalRooms,
        occupied: occupiedRooms,
        available: availableRooms,
        maintenance: maintenanceRooms
      },
      beds: {
        total: totalBeds,
        occupied: occupiedBeds,
        available: availableBeds,
        occupancyRate: parseFloat(occupancyRate)
      },
      tenants: {
        total: totalTenants,
        active: activeTenants
      },
      properties: {
        total: totalProperties
      },
      revenue: {
        monthlyRevenue: revenueStats._sum.amount || 0,
        paidPayments: revenueStats._count || 0,
        pendingAmount: pendingPayments._sum.amount || 0,
        pendingPayments: pendingPayments._count || 0,
        overduePayments
      }
    }
  });
});

// GET /api/dashboard/recent-activities - Get recent activities
const getRecentActivities = asyncHandler(async (req, res) => {
  const { propertyId, limit = 20 } = req.query;
  const userId = req.user.id;

  // Build where clause for user's properties
  const whereClause = {};
  if (propertyId) {
    whereClause.propertyId = propertyId;
  } else {
    const userProperties = await prisma.property.findMany({
      where: { ownerId: userId },
      select: { id: true }
    });
    whereClause.propertyId = { in: userProperties.map(p => p.id) };
  }

  // Get recent activities from different sources
  const [recentTenants, recentPayments, recentMaintenance] = await Promise.all([
    // Recent tenant activities
    prisma.tenant.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        fullName: true,
        createdAt: true,
        status: true,
        bed: {
          select: {
            bedNumber: true,
            room: {
              select: {
                roomNumber: true
              }
            }
          }
        }
      }
    }),
    
    // Recent payments
    prisma.payment.findMany({
      where: {
        ...whereClause,
        status: 'PAID'
      },
      orderBy: { paidDate: 'desc' },
      take: 5,
      select: {
        id: true,
        amount: true,
        paidDate: true,
        tenant: {
          select: {
            fullName: true
          }
        }
      }
    }),
    
    // Recent maintenance requests
    prisma.maintenanceRequest ? prisma.maintenanceRequest.findMany({
      where: {
        status: 'COMPLETED'
      },
      orderBy: { completedAt: 'desc' },
      take: 3,
      select: {
        id: true,
        title: true,
        completedAt: true,
        cost: true
      }
    }) : []
  ]);

  // Format activities
  const activities = [];

  // Add tenant activities
  recentTenants.forEach(tenant => {
    activities.push({
      id: `tenant-${tenant.id}`,
      type: 'tenant_joined',
      message: `${tenant.fullName} joined ${tenant.bed?.room?.roomNumber || 'room'}`,
      timestamp: tenant.createdAt.toISOString(),
      data: { tenantId: tenant.id }
    });
  });

  // Add payment activities
  recentPayments.forEach(payment => {
    activities.push({
      id: `payment-${payment.id}`,
      type: 'payment_received',
      message: `Payment received from ${payment.tenant.fullName} - ₹${payment.amount}`,
      timestamp: payment.paidDate.toISOString(),
      data: { paymentId: payment.id, amount: payment.amount }
    });
  });

  // Add maintenance activities
  if (Array.isArray(recentMaintenance)) {
    recentMaintenance.forEach(maintenance => {
      activities.push({
        id: `maintenance-${maintenance.id}`,
        type: 'maintenance_completed',
        message: `${maintenance.title} completed - ₹${maintenance.cost || 0}`,
        timestamp: maintenance.completedAt.toISOString(),
        data: { maintenanceId: maintenance.id, cost: maintenance.cost }
      });
    });
  }

  // Sort by timestamp and limit
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  res.status(200).json({
    success: true,
    data: activities.slice(0, parseInt(limit))
  });
});

// GET /api/dashboard/occupancy-trends - Get occupancy trends
const getOccupancyTrends = asyncHandler(async (req, res) => {
  const { propertyId, months = 6 } = req.query;
  const userId = req.user.id;

  // Build where clause
  const whereClause = {};
  if (propertyId) {
    whereClause.propertyId = propertyId;
  } else {
    const userProperties = await prisma.property.findMany({
      where: { ownerId: userId },
      select: { id: true }
    });
    whereClause.propertyId = { in: userProperties.map(p => p.id) };
  }

  // Generate last N months
  const trends = [];
  const currentDate = new Date();
  
  for (let i = parseInt(months) - 1; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

    // Get occupancy for this month (simplified - using current occupancy as example)
    const totalBeds = await prisma.bed.count({
      where: { room: { floor: whereClause } }
    });
    
    const occupiedBeds = await prisma.bed.count({
      where: { 
        room: { floor: whereClause },
        status: 'OCCUPIED'
      }
    });

    const occupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100) : 0;

    trends.push({
      month: monthName,
      monthKey,
      totalBeds,
      occupiedBeds,
      occupancyRate: Math.round(occupancyRate)
    });
  }

  res.status(200).json({
    success: true,
    data: trends
  });
});

// GET /api/dashboard/revenue-trends - Get revenue trends
const getRevenueTrends = asyncHandler(async (req, res) => {
  const { propertyId, months = 6 } = req.query;
  const userId = req.user.id;

  // Build where clause
  const whereClause = {};
  if (propertyId) {
    whereClause.propertyId = propertyId;
  } else {
    const userProperties = await prisma.property.findMany({
      where: { ownerId: userId },
      select: { id: true }
    });
    whereClause.propertyId = { in: userProperties.map(p => p.id) };
  }

  // Generate revenue trends for last N months
  const trends = [];
  const currentDate = new Date();
  
  for (let i = parseInt(months) - 1; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

    // Get revenue for this month
    const revenueData = await prisma.payment.aggregate({
      where: {
        ...whereClause,
        month: monthKey,
        status: 'PAID'
      },
      _sum: { amount: true },
      _count: true
    });

    const pendingData = await prisma.payment.aggregate({
      where: {
        ...whereClause,
        month: monthKey,
        status: 'PENDING'
      },
      _sum: { amount: true },
      _count: true
    });

    trends.push({
      month: monthName,
      monthKey,
      revenue: revenueData._sum.amount || 0,
      paidPayments: revenueData._count || 0,
      pendingAmount: pendingData._sum.amount || 0,
      pendingPayments: pendingData._count || 0
    });
  }

  res.status(200).json({
    success: true,
    data: trends
  });
});

// GET /api/dashboard/user-settings - Get user dashboard settings
const getUserDashboardSettings = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get user's dashboard settings from database
  let dashboardSettings = await prisma.dashboardSettings.findUnique({
    where: { userId }
  });

  // If no settings exist, create default settings
  if (!dashboardSettings) {
    dashboardSettings = await prisma.dashboardSettings.create({
      data: {
        userId,
        defaultView: 'cards',
        showNotifications: true,
        autoRefresh: false,
        refreshInterval: 30,
        defaultProperty: null,
        favoriteCharts: ['occupancy', 'revenue'],
        compactMode: false,
        statsVisible: true,
        activitiesVisible: true,
        chartsVisible: true,
        quickActionsVisible: true
      }
    });
  }

  // Format response to match frontend expectations
  const settings = {
    theme: 'light', // This comes from UserSettings, not DashboardSettings
    defaultView: dashboardSettings.defaultView,
    showNotifications: dashboardSettings.showNotifications,
    autoRefresh: dashboardSettings.autoRefresh,
    refreshInterval: dashboardSettings.refreshInterval,
    defaultProperty: dashboardSettings.defaultProperty,
    favoriteCharts: dashboardSettings.favoriteCharts,
    compactMode: dashboardSettings.compactMode,
    dashboardLayout: {
      stats: dashboardSettings.statsVisible,
      activities: dashboardSettings.activitiesVisible,
      charts: dashboardSettings.chartsVisible,
      quickActions: dashboardSettings.quickActionsVisible
    }
  };

  res.status(200).json({
    success: true,
    data: settings
  });
});

// PUT /api/dashboard/user-settings - Update user dashboard settings
const updateUserDashboardSettings = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    defaultView,
    showNotifications,
    autoRefresh,
    refreshInterval,
    defaultProperty,
    favoriteCharts,
    compactMode,
    dashboardLayout
  } = req.body;

  // Update dashboard settings in database
  const dashboardSettings = await prisma.dashboardSettings.upsert({
    where: { userId },
    update: {
      ...(defaultView !== undefined && { defaultView }),
      ...(showNotifications !== undefined && { showNotifications }),
      ...(autoRefresh !== undefined && { autoRefresh }),
      ...(refreshInterval !== undefined && { refreshInterval }),
      ...(defaultProperty !== undefined && { defaultProperty }),
      ...(favoriteCharts !== undefined && { favoriteCharts }),
      ...(compactMode !== undefined && { compactMode }),
      ...(dashboardLayout?.stats !== undefined && { statsVisible: dashboardLayout.stats }),
      ...(dashboardLayout?.activities !== undefined && { activitiesVisible: dashboardLayout.activities }),
      ...(dashboardLayout?.charts !== undefined && { chartsVisible: dashboardLayout.charts }),
      ...(dashboardLayout?.quickActions !== undefined && { quickActionsVisible: dashboardLayout.quickActions })
    },
    create: {
      userId,
      defaultView: defaultView || 'cards',
      showNotifications: showNotifications !== undefined ? showNotifications : true,
      autoRefresh: autoRefresh !== undefined ? autoRefresh : false,
      refreshInterval: refreshInterval || 30,
      defaultProperty,
      favoriteCharts: favoriteCharts || ['occupancy', 'revenue'],
      compactMode: compactMode !== undefined ? compactMode : false,
      statsVisible: dashboardLayout?.stats !== undefined ? dashboardLayout.stats : true,
      activitiesVisible: dashboardLayout?.activities !== undefined ? dashboardLayout.activities : true,
      chartsVisible: dashboardLayout?.charts !== undefined ? dashboardLayout.charts : true,
      quickActionsVisible: dashboardLayout?.quickActions !== undefined ? dashboardLayout.quickActions : true
    }
  });

  // Format response to match frontend expectations
  const settings = {
    defaultView: dashboardSettings.defaultView,
    showNotifications: dashboardSettings.showNotifications,
    autoRefresh: dashboardSettings.autoRefresh,
    refreshInterval: dashboardSettings.refreshInterval,
    defaultProperty: dashboardSettings.defaultProperty,
    favoriteCharts: dashboardSettings.favoriteCharts,
    compactMode: dashboardSettings.compactMode,
    dashboardLayout: {
      stats: dashboardSettings.statsVisible,
      activities: dashboardSettings.activitiesVisible,
      charts: dashboardSettings.chartsVisible,
      quickActions: dashboardSettings.quickActionsVisible
    }
  };

  res.status(200).json({
    success: true,
    data: settings,
    message: 'Dashboard settings updated successfully'
  });
});

module.exports = {
  getDashboardStats,
  getRecentActivities,
  getOccupancyTrends,
  getRevenueTrends,
  getUserDashboardSettings,
  updateUserDashboardSettings
}; 