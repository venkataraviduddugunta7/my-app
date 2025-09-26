import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DashboardController {
  // Get comprehensive dashboard data
  static async getDashboardData(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const { propertyId, period = 'month' } = req.query;

      // Base where clause for user's properties
      const propertyWhere = propertyId ? 
        { id: propertyId as string, ownerId: userId } :
        { ownerId: userId };

      // Verify property access if specific property requested
      if (propertyId) {
        const property = await prisma.property.findFirst({
          where: propertyWhere
        });

        if (!property) {
          return res.status(404).json({
            success: false,
            message: 'Property not found'
          });
        }
      }

      // Date ranges for different periods
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      // Get user's properties for filtering
      const userProperties = await prisma.property.findMany({
        where: propertyWhere,
        select: { id: true }
      });

      const propertyIds = userProperties.map(p => p.id);

      if (propertyIds.length === 0) {
        return res.json({
          success: true,
          data: {
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
        });
      }

      // Execute all queries in parallel for better performance
      const [
        // Basic counts
        totalProperties,
        totalBeds,
        occupiedBeds,
        activeTenants,
        
        // Revenue data
        currentMonthRevenue,
        lastMonthRevenue,
        yearlyRevenue,
        
        // Payment data
        pendingPayments,
        overduePayments,
        
        // Occupancy trends
        currentOccupancy,
        lastMonthOccupancy,
        
        // Recent activity
        recentPayments,
        recentTenants,
        
        // Upcoming dues
        upcomingDues,
        
        // Property breakdown
        propertyStats,
        
        // Monthly revenue trend
        monthlyRevenueTrend,
        
        // Payment analytics
        paymentsByType,
        paymentsByStatus
      ] = await Promise.all([
        // Total properties
        prisma.property.count({
          where: { ...propertyWhere, isActive: true }
        }),

        // Total beds
        prisma.bed.count({
          where: {
            isActive: true,
            room: {
              isActive: true,
              floor: {
                isActive: true,
                propertyId: { in: propertyIds }
              }
            }
          }
        }),

        // Occupied beds
        prisma.bed.count({
          where: {
            status: 'OCCUPIED',
            isActive: true,
            room: {
              isActive: true,
              floor: {
                isActive: true,
                propertyId: { in: propertyIds }
              }
            }
          }
        }),

        // Active tenants
        prisma.tenant.count({
          where: {
            propertyId: { in: propertyIds },
            status: 'ACTIVE'
          }
        }),

        // Current month revenue
        prisma.payment.aggregate({
          where: {
            propertyId: { in: propertyIds },
            status: 'PAID',
            paidDate: {
              gte: startOfMonth,
              lte: now
            }
          },
          _sum: { amount: true }
        }),

        // Last month revenue
        prisma.payment.aggregate({
          where: {
            propertyId: { in: propertyIds },
            status: 'PAID',
            paidDate: {
              gte: startOfLastMonth,
              lte: endOfLastMonth
            }
          },
          _sum: { amount: true }
        }),

        // Yearly revenue
        prisma.payment.aggregate({
          where: {
            propertyId: { in: propertyIds },
            status: 'PAID',
            paidDate: {
              gte: startOfYear,
              lte: now
            }
          },
          _sum: { amount: true }
        }),

        // Pending payments count
        prisma.payment.count({
          where: {
            propertyId: { in: propertyIds },
            status: 'PENDING'
          }
        }),

        // Overdue payments count
        prisma.payment.count({
          where: {
            propertyId: { in: propertyIds },
            status: 'OVERDUE'
          }
        }),

        // Current occupancy (for comparison)
        Promise.resolve(0), // Will be calculated from occupiedBeds/totalBeds

        // Last month occupancy (simplified - can be enhanced with historical data)
        Promise.resolve(0), // Would need historical tracking

        // Recent payments (last 10)
        prisma.payment.findMany({
          where: {
            propertyId: { in: propertyIds },
            status: 'PAID'
          },
          include: {
            tenant: {
              select: {
                tenantId: true,
                fullName: true
              }
            },
            property: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            paidDate: 'desc'
          },
          take: 10
        }),

        // Recent tenants (last 10)
        prisma.tenant.findMany({
          where: {
            propertyId: { in: propertyIds },
            status: 'ACTIVE'
          },
          select: {
            id: true,
            tenantId: true,
            fullName: true,
            joiningDate: true,
            property: {
              select: {
                name: true
              }
            },
            bed: {
              select: {
                bedNumber: true,
                room: {
                  select: {
                    roomNumber: true,
                    floor: {
                      select: {
                        name: true
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: {
            joiningDate: 'desc'
          },
          take: 10
        }),

        // Upcoming dues (next 7 days)
        prisma.payment.findMany({
          where: {
            propertyId: { in: propertyIds },
            status: 'PENDING',
            dueDate: {
              gte: now,
              lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
            }
          },
          include: {
            tenant: {
              select: {
                tenantId: true,
                fullName: true,
                phone: true
              }
            },
            property: {
              select: {
                name: true
              }
            }
          },
          orderBy: {
            dueDate: 'asc'
          },
          take: 20
        }),

        // Property-wise breakdown
        prisma.property.findMany({
          where: propertyWhere,
          select: {
            id: true,
            name: true,
            address: true,
            totalBeds: true,
            _count: {
              select: {
                tenants: {
                  where: { status: 'ACTIVE' }
                }
              }
            }
          }
        }),

        // Monthly revenue trend (last 12 months)
        prisma.payment.groupBy({
          by: ['month', 'year'],
          where: {
            propertyId: { in: propertyIds },
            status: 'PAID',
            paidDate: {
              gte: new Date(now.getFullYear() - 1, now.getMonth(), 1)
            }
          },
          _sum: {
            amount: true
          },
          orderBy: [
            { year: 'asc' },
            { month: 'asc' }
          ]
        }),

        // Payments by type
        prisma.payment.groupBy({
          by: ['paymentType'],
          where: {
            propertyId: { in: propertyIds },
            status: 'PAID',
            paidDate: {
              gte: startOfMonth
            }
          },
          _sum: {
            amount: true
          },
          _count: true
        }),

        // Payments by status
        prisma.payment.groupBy({
          by: ['status'],
          where: {
            propertyId: { in: propertyIds }
          },
          _sum: {
            amount: true
          },
          _count: true
        })
      ]);

      // Calculate derived metrics
      const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
      const currentRevenue = currentMonthRevenue._sum.amount || 0;
      const lastRevenue = lastMonthRevenue._sum.amount || 0;
      const revenueGrowth = lastRevenue > 0 ? 
        Math.round(((currentRevenue - lastRevenue) / lastRevenue) * 100) : 0;

      // Enhanced property breakdown with occupancy
      const enhancedPropertyStats = await Promise.all(
        propertyStats.map(async (property) => {
          const [occupiedInProperty, totalInProperty, monthlyRevenueInProperty] = await Promise.all([
            prisma.bed.count({
              where: {
                status: 'OCCUPIED',
                room: {
                  floor: {
                    propertyId: property.id
                  }
                }
              }
            }),
            prisma.bed.count({
              where: {
                room: {
                  floor: {
                    propertyId: property.id
                  }
                }
              }
            }),
            prisma.payment.aggregate({
              where: {
                propertyId: property.id,
                status: 'PAID',
                paidDate: {
                  gte: startOfMonth
                }
              },
              _sum: { amount: true }
            })
          ]);

          return {
            ...property,
            occupiedBeds: occupiedInProperty,
            totalBeds: totalInProperty,
            occupancyRate: totalInProperty > 0 ? Math.round((occupiedInProperty / totalInProperty) * 100) : 0,
            monthlyRevenue: monthlyRevenueInProperty._sum.amount || 0
          };
        })
      );

      // Format monthly revenue trend
      const formattedMonthlyTrend = monthlyRevenueTrend.map(item => ({
        period: `${item.year}-${item.month.padStart(2, '0')}`,
        revenue: item._sum.amount || 0,
        month: item.month,
        year: item.year
      }));

      // Combine recent activity
      const recentActivity = [
        ...recentPayments.map(payment => ({
          id: payment.id,
          type: 'payment',
          title: `Payment received from ${payment.tenant.fullName}`,
          subtitle: `₹${payment.amount} - ${payment.paymentType}`,
          property: payment.property.name,
          timestamp: payment.paidDate,
          amount: payment.amount
        })),
        ...recentTenants.map(tenant => ({
          id: tenant.id,
          type: 'tenant',
          title: `New tenant: ${tenant.fullName}`,
          subtitle: `${tenant.bed?.room?.floor?.name} - Room ${tenant.bed?.room?.roomNumber} - Bed ${tenant.bed?.bedNumber}`,
          property: tenant.property.name,
          timestamp: tenant.joiningDate
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 15);

      // Dashboard response
      const dashboardData = {
        summary: {
          totalProperties,
          totalBeds,
          occupiedBeds,
          availableBeds: totalBeds - occupiedBeds,
          activeTenants,
          monthlyRevenue: currentRevenue,
          yearlyRevenue: yearlyRevenue._sum.amount || 0,
          pendingPayments,
          overduePayments,
          occupancyRate
        },
        trends: {
          revenueGrowth,
          occupancyGrowth: 0, // Would need historical data
          tenantGrowth: 0 // Would need historical data
        },
        recentActivity,
        upcomingDues: upcomingDues.map(due => ({
          ...due,
          daysUntilDue: Math.ceil((due.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        })),
        propertyBreakdown: enhancedPropertyStats,
        paymentAnalytics: {
          monthlyRevenue: formattedMonthlyTrend,
          paymentsByType,
          paymentsByStatus,
          collectionRate: paymentsByStatus.find(p => p.status === 'PAID')?._sum.amount || 0
        }
      };

      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      next(error);
    }
  }

  // Get property-specific dashboard
  static async getPropertyDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId } = req.params;
      const userId = req.user?.userId;

      // Verify property ownership
      const property = await prisma.property.findFirst({
        where: {
          id: propertyId,
          ownerId: userId
        },
        include: {
          settings: true
        }
      });

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }

      // Get comprehensive property data
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        floors,
        activeTenants,
        monthlyRevenue,
        pendingPayments,
        overduePayments,
        recentActivity,
        upcomingMaintenance
      ] = await Promise.all([
        // Floor and room breakdown
        prisma.floor.findMany({
          where: {
            propertyId,
            isActive: true
          },
          include: {
            rooms: {
              include: {
                beds: {
                  include: {
                    tenant: {
                      select: {
                        id: true,
                        tenantId: true,
                        fullName: true,
                        status: true
                      }
                    }
                  }
                }
              },
              orderBy: { roomNumber: 'asc' }
            }
          },
          orderBy: { floorNumber: 'asc' }
        }),

        // Active tenants with details
        prisma.tenant.findMany({
          where: {
            propertyId,
            status: 'ACTIVE'
          },
          include: {
            bed: {
              include: {
                room: {
                  include: {
                    floor: true
                  }
                }
              }
            },
            payments: {
              where: {
                status: 'PENDING'
              },
              select: {
                amount: true,
                dueDate: true,
                paymentType: true
              }
            }
          },
          orderBy: { fullName: 'asc' }
        }),

        // Monthly revenue
        prisma.payment.aggregate({
          where: {
            propertyId,
            status: 'PAID',
            paidDate: {
              gte: startOfMonth
            }
          },
          _sum: { amount: true }
        }),

        // Pending payments
        prisma.payment.findMany({
          where: {
            propertyId,
            status: 'PENDING'
          },
          include: {
            tenant: {
              select: {
                tenantId: true,
                fullName: true
              }
            }
          },
          orderBy: { dueDate: 'asc' }
        }),

        // Overdue payments
        prisma.payment.findMany({
          where: {
            propertyId,
            status: 'OVERDUE'
          },
          include: {
            tenant: {
              select: {
                tenantId: true,
                fullName: true,
                phone: true
              }
            }
          },
          orderBy: { dueDate: 'asc' }
        }),

        // Recent activity for this property
        prisma.payment.findMany({
          where: {
            propertyId,
            status: 'PAID'
          },
          include: {
            tenant: {
              select: {
                tenantId: true,
                fullName: true
              }
            }
          },
          orderBy: { paidDate: 'desc' },
          take: 10
        }),

        // Upcoming maintenance (placeholder - would need maintenance module)
        Promise.resolve([])
      ]);

      // Calculate statistics
      const totalBeds = floors.reduce((total, floor) => 
        total + floor.rooms.reduce((roomTotal, room) => roomTotal + room.beds.length, 0), 0
      );

      const occupiedBeds = floors.reduce((total, floor) => 
        total + floor.rooms.reduce((roomTotal, room) => 
          roomTotal + room.beds.filter(bed => bed.status === 'OCCUPIED').length, 0
        ), 0
      );

      const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

      // Floor-wise statistics
      const floorStats = floors.map(floor => {
        const floorBeds = floor.rooms.reduce((total, room) => total + room.beds.length, 0);
        const floorOccupied = floor.rooms.reduce((total, room) => 
          total + room.beds.filter(bed => bed.status === 'OCCUPIED').length, 0
        );

        return {
          ...floor,
          stats: {
            totalBeds: floorBeds,
            occupiedBeds: floorOccupied,
            availableBeds: floorBeds - floorOccupied,
            occupancyRate: floorBeds > 0 ? Math.round((floorOccupied / floorBeds) * 100) : 0
          }
        };
      });

      const propertyDashboard = {
        property: {
          ...property,
          stats: {
            totalFloors: floors.length,
            totalRooms: floors.reduce((total, floor) => total + floor.rooms.length, 0),
            totalBeds,
            occupiedBeds,
            availableBeds: totalBeds - occupiedBeds,
            activeTenants: activeTenants.length,
            occupancyRate,
            monthlyRevenue: monthlyRevenue._sum.amount || 0
          }
        },
        floors: floorStats,
        tenants: activeTenants.map(tenant => ({
          ...tenant,
          pendingAmount: tenant.payments.reduce((sum, payment) => sum + payment.amount, 0),
          overdueCount: tenant.payments.filter(payment => 
            new Date(payment.dueDate) < now
          ).length
        })),
        payments: {
          pending: pendingPayments,
          overdue: overduePayments,
          pendingAmount: pendingPayments.reduce((sum, payment) => sum + payment.amount, 0),
          overdueAmount: overduePayments.reduce((sum, payment) => sum + payment.amount, 0)
        },
        recentActivity: recentActivity.map(payment => ({
          type: 'payment',
          title: `Payment from ${payment.tenant.fullName}`,
          amount: payment.amount,
          timestamp: payment.paidDate,
          paymentType: payment.paymentType
        }))
      };

      res.json({
        success: true,
        data: propertyDashboard
      });
    } catch (error) {
      next(error);
    }
  }

  // Get analytics data
  static async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const { propertyId, period = 'year', startDate, endDate } = req.query;

      // Property filtering
      const propertyWhere = propertyId ? 
        { id: propertyId as string, ownerId: userId } :
        { ownerId: userId };

      const properties = await prisma.property.findMany({
        where: propertyWhere,
        select: { id: true }
      });

      const propertyIds = properties.map(p => p.id);

      if (propertyIds.length === 0) {
        return res.json({
          success: true,
          data: {
            revenue: { total: 0, trend: [] },
            occupancy: { current: 0, trend: [] },
            payments: { breakdown: [], collectionRate: 0 },
            tenants: { total: 0, trend: [] }
          }
        });
      }

      // Date range setup
      const now = new Date();
      const start = startDate ? new Date(startDate as string) : 
        new Date(now.getFullYear() - 1, now.getMonth(), 1);
      const end = endDate ? new Date(endDate as string) : now;

      // Analytics queries
      const [
        revenueAnalytics,
        occupancyAnalytics,
        paymentAnalytics,
        tenantAnalytics
      ] = await Promise.all([
        // Revenue analytics
        prisma.payment.groupBy({
          by: ['month', 'year'],
          where: {
            propertyId: { in: propertyIds },
            status: 'PAID',
            paidDate: { gte: start, lte: end }
          },
          _sum: { amount: true },
          orderBy: [{ year: 'asc' }, { month: 'asc' }]
        }),

        // Occupancy analytics (simplified - would need historical tracking)
        Promise.resolve([]),

        // Payment analytics
        Promise.all([
          prisma.payment.groupBy({
            by: ['paymentType'],
            where: {
              propertyId: { in: propertyIds },
              status: 'PAID',
              paidDate: { gte: start, lte: end }
            },
            _sum: { amount: true },
            _count: true
          }),
          prisma.payment.aggregate({
            where: {
              propertyId: { in: propertyIds },
              dueDate: { gte: start, lte: end }
            },
            _sum: { amount: true }
          }),
          prisma.payment.aggregate({
            where: {
              propertyId: { in: propertyIds },
              status: 'PAID',
              paidDate: { gte: start, lte: end }
            },
            _sum: { amount: true }
          })
        ]),

        // Tenant analytics
        prisma.tenant.groupBy({
          by: ['status'],
          where: {
            propertyId: { in: propertyIds }
          },
          _count: true
        })
      ]);

      // Format analytics data
      const [paymentsByType, totalDue, totalCollected] = paymentAnalytics;
      const collectionRate = totalDue._sum.amount > 0 ? 
        Math.round((totalCollected._sum.amount / totalDue._sum.amount) * 100) : 0;

      const analytics = {
        revenue: {
          total: totalCollected._sum.amount || 0,
          trend: revenueAnalytics.map(item => ({
            period: `${item.year}-${item.month.padStart(2, '0')}`,
            amount: item._sum.amount || 0
          }))
        },
        occupancy: {
          current: 0, // Would need current calculation
          trend: [] // Would need historical data
        },
        payments: {
          breakdown: paymentsByType,
          collectionRate
        },
        tenants: {
          total: tenantAnalytics.reduce((sum, item) => sum + item._count, 0),
          breakdown: tenantAnalytics
        }
      };

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      next(error);
    }
  }
}
