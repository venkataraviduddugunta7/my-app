import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const createPropertySchema = z.object({
  name: z.string().min(2, 'Property name is required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().min(6, 'Valid pincode is required'),
  description: z.string().optional(),
  type: z.string().default('Co-ed'),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  amenities: z.array(z.string()).default([]),
  monthlyRent: z.number().positive().optional(),
  securityDeposit: z.number().positive().optional()
});

const updatePropertySchema = createPropertySchema.partial();

export class PropertyController {
  // Create new property
  static async createProperty(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const validatedData = createPropertySchema.parse(req.body);

      const property = await prisma.property.create({
        data: {
          ...validatedData,
          ownerId: userId!,
          settings: {
            create: {
              rules: [
                'No smoking inside the premises',
                'Maintain cleanliness in common areas',
                'No loud music after 10 PM',
                'Guests must be registered at reception',
                'Monthly rent due by 5th of every month'
              ],
              amenities: validatedData.amenities,
              contactInfo: {
                phone: validatedData.phone,
                email: validatedData.email,
                website: validatedData.website
              },
              paymentSettings: {
                dueDate: 5, // 5th of every month
                lateFeeAfterDays: 3,
                lateFeeAmount: 100,
                acceptedMethods: ['CASH', 'UPI', 'BANK_TRANSFER']
              },
              notificationSettings: {
                rentReminders: true,
                maintenanceAlerts: true,
                newTenantWelcome: true,
                paymentConfirmations: true
              }
            }
          }
        },
        include: {
          settings: true,
          _count: {
            select: {
              floors: true,
              tenants: true
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        message: 'Property created successfully',
        data: property
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors
        });
      }
      next(error);
    }
  }

  // Get all properties for the authenticated user
  static async getProperties(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const { page = 1, limit = 10, search, city, state, isActive } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      
      // Build where clause
      const where: any = {
        ownerId: userId
      };

      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { address: { contains: search as string, mode: 'insensitive' } },
          { city: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      if (city) {
        where.city = { contains: city as string, mode: 'insensitive' };
      }

      if (state) {
        where.state = { contains: state as string, mode: 'insensitive' };
      }

      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      const [properties, totalCount] = await Promise.all([
        prisma.property.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            settings: true,
            _count: {
              select: {
                floors: true,
                tenants: { where: { status: 'ACTIVE' } },
                payments: {
                  where: {
                    status: 'PAID',
                    createdAt: {
                      gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                    }
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.property.count({ where })
      ]);

      // Calculate occupancy and revenue for each property
      const propertiesWithStats = await Promise.all(
        properties.map(async (property) => {
          const totalBeds = await prisma.bed.count({
            where: {
              room: {
                floor: {
                  propertyId: property.id
                }
              }
            }
          });

          const occupiedBeds = await prisma.bed.count({
            where: {
              status: 'OCCUPIED',
              room: {
                floor: {
                  propertyId: property.id
                }
              }
            }
          });

          const monthlyRevenue = await prisma.payment.aggregate({
            where: {
              propertyId: property.id,
              status: 'PAID',
              createdAt: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
              }
            },
            _sum: {
              amount: true
            }
          });

          const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

          return {
            ...property,
            stats: {
              totalBeds,
              occupiedBeds,
              availableBeds: totalBeds - occupiedBeds,
              occupancyRate,
              monthlyRevenue: monthlyRevenue._sum.amount || 0,
              activeTenants: property._count.tenants
            }
          };
        })
      );

      res.json({
        success: true,
        data: {
          properties: propertiesWithStats,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: totalCount,
            pages: Math.ceil(totalCount / Number(limit))
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get single property by ID
  static async getProperty(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      const property = await prisma.property.findFirst({
        where: {
          id,
          ownerId: userId
        },
        include: {
          settings: true,
          floors: {
            include: {
              rooms: {
                include: {
                  beds: {
                    include: {
                      tenant: {
                        select: {
                          id: true,
                          fullName: true,
                          phone: true,
                          status: true
                        }
                      }
                    }
                  }
                }
              }
            },
            orderBy: {
              floorNumber: 'asc'
            }
          },
          tenants: {
            where: {
              status: 'ACTIVE'
            },
            select: {
              id: true,
              tenantId: true,
              fullName: true,
              phone: true,
              joiningDate: true,
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
            take: 10,
            orderBy: {
              joiningDate: 'desc'
            }
          },
          _count: {
            select: {
              floors: true,
              tenants: { where: { status: 'ACTIVE' } },
              payments: {
                where: {
                  status: 'PAID',
                  createdAt: {
                    gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                  }
                }
              }
            }
          }
        }
      });

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }

      // Calculate detailed statistics
      const totalBeds = await prisma.bed.count({
        where: {
          room: {
            floor: {
              propertyId: property.id
            }
          }
        }
      });

      const occupiedBeds = await prisma.bed.count({
        where: {
          status: 'OCCUPIED',
          room: {
            floor: {
              propertyId: property.id
            }
          }
        }
      });

      const monthlyRevenue = await prisma.payment.aggregate({
        where: {
          propertyId: property.id,
          status: 'PAID',
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
          }
        },
        _sum: {
          amount: true
        }
      });

      const pendingPayments = await prisma.payment.count({
        where: {
          propertyId: property.id,
          status: 'PENDING'
        }
      });

      const overduePayments = await prisma.payment.count({
        where: {
          propertyId: property.id,
          status: 'OVERDUE'
        }
      });

      const propertyWithStats = {
        ...property,
        stats: {
          totalBeds,
          occupiedBeds,
          availableBeds: totalBeds - occupiedBeds,
          occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
          monthlyRevenue: monthlyRevenue._sum.amount || 0,
          activeTenants: property._count.tenants,
          pendingPayments,
          overduePayments
        }
      };

      res.json({
        success: true,
        data: propertyWithStats
      });
    } catch (error) {
      next(error);
    }
  }

  // Update property
  static async updateProperty(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      const validatedData = updatePropertySchema.parse(req.body);

      // Check if property exists and belongs to user
      const existingProperty = await prisma.property.findFirst({
        where: {
          id,
          ownerId: userId
        }
      });

      if (!existingProperty) {
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }

      const updatedProperty = await prisma.property.update({
        where: { id },
        data: validatedData,
        include: {
          settings: true,
          _count: {
            select: {
              floors: true,
              tenants: { where: { status: 'ACTIVE' } }
            }
          }
        }
      });

      res.json({
        success: true,
        message: 'Property updated successfully',
        data: updatedProperty
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors
        });
      }
      next(error);
    }
  }

  // Delete property (soft delete)
  static async deleteProperty(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      // Check if property has active tenants
      const activeTenants = await prisma.tenant.count({
        where: {
          propertyId: id,
          status: 'ACTIVE'
        }
      });

      if (activeTenants > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete property with active tenants. Please relocate or remove all tenants first.'
        });
      }

      const updatedProperty = await prisma.property.update({
        where: {
          id,
          ownerId: userId
        },
        data: {
          isActive: false
        }
      });

      res.json({
        success: true,
        message: 'Property deleted successfully',
        data: updatedProperty
      });
    } catch (error) {
      next(error);
    }
  }

  // Get property dashboard stats
  static async getPropertyDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      const property = await prisma.property.findFirst({
        where: {
          id,
          ownerId: userId
        }
      });

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }

      // Get current month dates
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      // Parallel queries for dashboard data
      const [
        totalBeds,
        occupiedBeds,
        activeTenants,
        monthlyRevenue,
        pendingPayments,
        overduePayments,
        recentPayments,
        upcomingDues,
        maintenanceRequests
      ] = await Promise.all([
        // Total beds
        prisma.bed.count({
          where: {
            room: {
              floor: {
                propertyId: id
              }
            }
          }
        }),

        // Occupied beds
        prisma.bed.count({
          where: {
            status: 'OCCUPIED',
            room: {
              floor: {
                propertyId: id
              }
            }
          }
        }),

        // Active tenants
        prisma.tenant.count({
          where: {
            propertyId: id,
            status: 'ACTIVE'
          }
        }),

        // Monthly revenue
        prisma.payment.aggregate({
          where: {
            propertyId: id,
            status: 'PAID',
            paidDate: {
              gte: startOfMonth,
              lte: endOfMonth
            }
          },
          _sum: {
            amount: true
          }
        }),

        // Pending payments
        prisma.payment.count({
          where: {
            propertyId: id,
            status: 'PENDING'
          }
        }),

        // Overdue payments
        prisma.payment.count({
          where: {
            propertyId: id,
            status: 'OVERDUE'
          }
        }),

        // Recent payments (last 10)
        prisma.payment.findMany({
          where: {
            propertyId: id,
            status: 'PAID'
          },
          include: {
            tenant: {
              select: {
                fullName: true,
                tenantId: true
              }
            }
          },
          orderBy: {
            paidDate: 'desc'
          },
          take: 10
        }),

        // Upcoming dues (next 7 days)
        prisma.payment.findMany({
          where: {
            propertyId: id,
            status: 'PENDING',
            dueDate: {
              gte: new Date(),
              lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
          },
          include: {
            tenant: {
              select: {
                fullName: true,
                tenantId: true,
                phone: true
              }
            }
          },
          orderBy: {
            dueDate: 'asc'
          }
        }),

        // Maintenance requests (if implemented)
        prisma.maintenanceRequest.count({
          where: {
            // Add property relation when implemented
            status: 'PENDING'
          }
        })
      ]);

      const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
      const availableBeds = totalBeds - occupiedBeds;

      const dashboardData = {
        property: {
          id: property.id,
          name: property.name,
          address: property.address
        },
        stats: {
          totalBeds,
          occupiedBeds,
          availableBeds,
          occupancyRate,
          activeTenants,
          monthlyRevenue: monthlyRevenue._sum.amount || 0,
          pendingPayments,
          overduePayments,
          maintenanceRequests
        },
        recentActivity: {
          recentPayments,
          upcomingDues
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
}
