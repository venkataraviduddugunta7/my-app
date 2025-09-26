import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const createTenantSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(10, 'Valid phone number is required'),
  alternatePhone: z.string().optional(),
  emergencyContact: z.string().optional(),
  address: z.string().min(5, 'Address is required'),
  idProofType: z.enum(['AADHAR', 'PAN', 'PASSPORT', 'DRIVING_LICENSE', 'VOTER_ID']),
  idProofNumber: z.string().min(5, 'ID proof number is required'),
  occupation: z.string().optional(),
  company: z.string().optional(),
  monthlyIncome: z.number().positive().optional(),
  joiningDate: z.string().transform(str => new Date(str)),
  securityDeposit: z.number().positive().default(0),
  advanceRent: z.number().positive().default(0),
  bedId: z.string().min(1, 'Bed selection is required'),
  termsAccepted: z.boolean().refine(val => val === true, 'Terms must be accepted')
});

const updateTenantSchema = createTenantSchema.partial().omit({ termsAccepted: true });

const relocateTenantSchema = z.object({
  newBedId: z.string().min(1, 'New bed selection is required'),
  effectiveDate: z.string().transform(str => new Date(str)),
  reason: z.string().optional()
});

export class TenantController {
  // Create new tenant
  static async createTenant(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId } = req.params;
      const userId = req.user?.userId;
      const validatedData = createTenantSchema.parse(req.body);

      // Verify property ownership
      const property = await prisma.property.findFirst({
        where: {
          id: propertyId,
          ownerId: userId
        }
      });

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }

      // Verify bed availability and ownership
      const bed = await prisma.bed.findFirst({
        where: {
          id: validatedData.bedId,
          status: 'AVAILABLE',
          isActive: true,
          room: {
            isActive: true,
            floor: {
              isActive: true,
              propertyId
            }
          }
        },
        include: {
          room: {
            include: {
              floor: true
            }
          }
        }
      });

      if (!bed) {
        return res.status(400).json({
          success: false,
          message: 'Selected bed is not available'
        });
      }

      // Generate unique tenant ID
      const tenantCount = await prisma.tenant.count({
        where: { propertyId }
      });
      const tenantId = `PG${String(tenantCount + 1).padStart(3, '0')}`;

      // Create tenant in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create tenant
        const tenant = await tx.tenant.create({
          data: {
            ...validatedData,
            tenantId,
            propertyId,
            createdById: userId!,
            status: 'ACTIVE',
            termsAcceptedAt: new Date()
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
            }
          }
        });

        // Update bed status and assign tenant
        await tx.bed.update({
          where: { id: validatedData.bedId },
          data: {
            status: 'OCCUPIED',
            tenantId: tenant.id
          }
        });

        // Create initial rent payment record
        const currentDate = new Date();
        const dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 5); // 5th of next month
        
        await tx.payment.create({
          data: {
            paymentId: `PAY${Date.now()}`,
            amount: bed.rent,
            paymentType: 'RENT',
            dueDate,
            status: 'PENDING',
            month: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`,
            year: currentDate.getFullYear(),
            description: 'Monthly rent',
            propertyId,
            tenantId: tenant.id,
            bedId: validatedData.bedId,
            createdById: userId!
          }
        });

        return tenant;
      });

      res.status(201).json({
        success: true,
        message: 'Tenant created successfully',
        data: result
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

  // Get all tenants for a property
  static async getTenants(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId } = req.params;
      const userId = req.user?.userId;
      const { 
        page = 1, 
        limit = 10, 
        search, 
        status, 
        floor, 
        room,
        paymentStatus 
      } = req.query;

      // Verify property ownership
      const property = await prisma.property.findFirst({
        where: {
          id: propertyId,
          ownerId: userId
        }
      });

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }

      const skip = (Number(page) - 1) * Number(limit);

      // Build where clause
      const where: any = {
        propertyId
      };

      if (search) {
        where.OR = [
          { fullName: { contains: search as string, mode: 'insensitive' } },
          { tenantId: { contains: search as string, mode: 'insensitive' } },
          { phone: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      if (status) {
        where.status = status;
      }

      if (floor) {
        where.bed = {
          room: {
            floor: {
              id: floor as string
            }
          }
        };
      }

      if (room) {
        where.bed = {
          room: {
            id: room as string
          }
        };
      }

      const [tenants, totalCount] = await Promise.all([
        prisma.tenant.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            bed: {
              include: {
                room: {
                  include: {
                    floor: {
                      select: {
                        id: true,
                        name: true,
                        floorNumber: true
                      }
                    }
                  }
                }
              }
            },
            payments: {
              where: paymentStatus ? {
                status: paymentStatus as any
              } : {},
              select: {
                id: true,
                amount: true,
                dueDate: true,
                status: true,
                paymentType: true
              },
              orderBy: {
                dueDate: 'desc'
              },
              take: 5
            },
            _count: {
              select: {
                payments: {
                  where: {
                    status: 'PENDING'
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.tenant.count({ where })
      ]);

      // Add additional stats for each tenant
      const tenantsWithStats = await Promise.all(
        tenants.map(async (tenant) => {
          const [totalPaid, totalPending, overdueCount] = await Promise.all([
            prisma.payment.aggregate({
              where: {
                tenantId: tenant.id,
                status: 'PAID'
              },
              _sum: {
                amount: true
              }
            }),
            prisma.payment.aggregate({
              where: {
                tenantId: tenant.id,
                status: 'PENDING'
              },
              _sum: {
                amount: true
              }
            }),
            prisma.payment.count({
              where: {
                tenantId: tenant.id,
                status: 'OVERDUE'
              }
            })
          ]);

          return {
            ...tenant,
            stats: {
              totalPaid: totalPaid._sum.amount || 0,
              totalPending: totalPending._sum.amount || 0,
              overduePayments: overdueCount,
              pendingPayments: (tenant as any)._count.payments
            }
          };
        })
      );

      res.json({
        success: true,
        data: {
          tenants: tenantsWithStats,
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

  // Get single tenant details
  static async getTenant(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId, tenantId } = req.params;
      const userId = req.user?.userId;

      // Verify property ownership
      const property = await prisma.property.findFirst({
        where: {
          id: propertyId,
          ownerId: userId
        }
      });

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }

      const tenant = await prisma.tenant.findFirst({
        where: {
          id: tenantId,
          propertyId
        },
        include: {
          bed: {
            include: {
              room: {
                include: {
                  floor: {
                    select: {
                      id: true,
                      name: true,
                      floorNumber: true
                    }
                  }
                }
              }
            }
          },
          payments: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 20
          },
          notices: {
            where: {
              isPublished: true
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 10
          }
        }
      });

      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant not found'
        });
      }

      // Calculate tenant statistics
      const [paymentStats, durationStats] = await Promise.all([
        prisma.payment.groupBy({
          by: ['status'],
          where: {
            tenantId: tenant.id
          },
          _count: {
            status: true
          },
          _sum: {
            amount: true
          }
        }),
        // Calculate stay duration
        Promise.resolve({
          joiningDate: tenant.joiningDate,
          currentDate: new Date(),
          durationInDays: Math.floor(
            (new Date().getTime() - tenant.joiningDate.getTime()) / (1000 * 60 * 60 * 24)
          )
        })
      ]);

      const tenantWithStats = {
        ...tenant,
        stats: {
          payments: paymentStats.reduce((acc, stat) => {
            acc[stat.status] = {
              count: stat._count.status,
              amount: stat._sum.amount || 0
            };
            return acc;
          }, {} as any),
          stayDuration: durationStats
        }
      };

      res.json({
        success: true,
        data: tenantWithStats
      });
    } catch (error) {
      next(error);
    }
  }

  // Update tenant information
  static async updateTenant(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId, tenantId } = req.params;
      const userId = req.user?.userId;
      const validatedData = updateTenantSchema.parse(req.body);

      // Verify property ownership and tenant existence
      const tenant = await prisma.tenant.findFirst({
        where: {
          id: tenantId,
          propertyId,
          property: {
            ownerId: userId
          }
        }
      });

      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant not found'
        });
      }

      // Remove bedId from update data as it should be handled separately
      const { bedId, ...updateData } = validatedData;

      const updatedTenant = await prisma.tenant.update({
        where: { id: tenantId },
        data: updateData,
        include: {
          bed: {
            include: {
              room: {
                include: {
                  floor: true
                }
              }
            }
          }
        }
      });

      res.json({
        success: true,
        message: 'Tenant updated successfully',
        data: updatedTenant
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

  // Relocate tenant to different bed
  static async relocateTenant(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId, tenantId } = req.params;
      const userId = req.user?.userId;
      const { newBedId, effectiveDate, reason } = relocateTenantSchema.parse(req.body);

      // Verify tenant and property ownership
      const tenant = await prisma.tenant.findFirst({
        where: {
          id: tenantId,
          propertyId,
          status: 'ACTIVE',
          property: {
            ownerId: userId
          }
        },
        include: {
          bed: true
        }
      });

      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Active tenant not found'
        });
      }

      // Verify new bed availability
      const newBed = await prisma.bed.findFirst({
        where: {
          id: newBedId,
          status: 'AVAILABLE',
          isActive: true,
          room: {
            isActive: true,
            floor: {
              isActive: true,
              propertyId
            }
          }
        },
        include: {
          room: {
            include: {
              floor: true
            }
          }
        }
      });

      if (!newBed) {
        return res.status(400).json({
          success: false,
          message: 'Selected bed is not available'
        });
      }

      if (tenant.bed?.id === newBedId) {
        return res.status(400).json({
          success: false,
          message: 'Tenant is already assigned to this bed'
        });
      }

      // Perform relocation in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Free up current bed
        if (tenant.bed) {
          await tx.bed.update({
            where: { id: tenant.bed.id },
            data: {
              status: 'AVAILABLE',
              tenantId: null
            }
          });
        }

        // Assign new bed
        await tx.bed.update({
          where: { id: newBedId },
          data: {
            status: 'OCCUPIED',
            tenantId: tenant.id
          }
        });

        // Update tenant record
        const updatedTenant = await tx.tenant.update({
          where: { id: tenantId },
          data: {
            // Note: bedId is handled through the bed relation
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
            }
          }
        });

        // Create rent adjustment if needed (different bed rent)
        if (tenant.bed && tenant.bed.rent !== newBed.rent) {
          const currentDate = new Date();
          const nextDueDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 5);
          
          await tx.payment.create({
            data: {
              paymentId: `PAY${Date.now()}`,
              amount: newBed.rent,
              paymentType: 'RENT',
              dueDate: nextDueDate,
              status: 'PENDING',
              month: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`,
              year: currentDate.getFullYear(),
              description: `Monthly rent after relocation - ${reason || 'Bed change'}`,
              propertyId,
              tenantId: tenant.id,
              bedId: newBedId,
              createdById: userId!
            }
          });
        }

        return updatedTenant;
      });

      res.json({
        success: true,
        message: 'Tenant relocated successfully',
        data: result
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

  // Vacate tenant
  static async vacateTenant(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId, tenantId } = req.params;
      const userId = req.user?.userId;
      const { leavingDate, reason, refundAmount = 0 } = req.body;

      if (!leavingDate) {
        return res.status(400).json({
          success: false,
          message: 'Leaving date is required'
        });
      }

      // Verify tenant and property ownership
      const tenant = await prisma.tenant.findFirst({
        where: {
          id: tenantId,
          propertyId,
          status: 'ACTIVE',
          property: {
            ownerId: userId
          }
        },
        include: {
          bed: true,
          payments: {
            where: {
              status: { in: ['PENDING', 'OVERDUE'] }
            }
          }
        }
      });

      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Active tenant not found'
        });
      }

      // Check for pending payments
      if (tenant.payments.length > 0) {
        const totalPending = tenant.payments.reduce((sum, payment) => sum + payment.amount, 0);
        
        return res.status(400).json({
          success: false,
          message: `Cannot vacate tenant with pending payments. Total pending: ₹${totalPending}`,
          data: {
            pendingPayments: tenant.payments
          }
        });
      }

      // Perform vacation in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Update tenant status
        const vacatedTenant = await tx.tenant.update({
          where: { id: tenantId },
          data: {
            status: 'VACATED',
            leavingDate: new Date(leavingDate)
          }
        });

        // Free up bed
        if (tenant.bed) {
          await tx.bed.update({
            where: { id: tenant.bed.id },
            data: {
              status: 'AVAILABLE',
              tenantId: null
            }
          });
        }

        // Create refund record if applicable
        if (refundAmount > 0) {
          await tx.payment.create({
            data: {
              paymentId: `REF${Date.now()}`,
              amount: -refundAmount, // Negative amount for refund
              paymentType: 'DEPOSIT',
              paymentMethod: 'CASH',
              dueDate: new Date(),
              paidDate: new Date(),
              status: 'PAID',
              month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
              year: new Date().getFullYear(),
              description: `Security deposit refund - ${reason || 'Tenant vacation'}`,
              propertyId,
              tenantId: tenant.id,
              bedId: tenant.bed?.id,
              createdById: userId!
            }
          });
        }

        return vacatedTenant;
      });

      res.json({
        success: true,
        message: 'Tenant vacated successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // Get tenant payment history
  static async getTenantPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId, tenantId } = req.params;
      const userId = req.user?.userId;
      const { page = 1, limit = 10, status, paymentType, startDate, endDate } = req.query;

      // Verify tenant and property ownership
      const tenant = await prisma.tenant.findFirst({
        where: {
          id: tenantId,
          propertyId,
          property: {
            ownerId: userId
          }
        }
      });

      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant not found'
        });
      }

      const skip = (Number(page) - 1) * Number(limit);

      // Build where clause
      const where: any = {
        tenantId
      };

      if (status) {
        where.status = status;
      }

      if (paymentType) {
        where.paymentType = paymentType;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate as string);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate as string);
        }
      }

      const [payments, totalCount] = await Promise.all([
        prisma.payment.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
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
            createdAt: 'desc'
          }
        }),
        prisma.payment.count({ where })
      ]);

      res.json({
        success: true,
        data: {
          payments,
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
}
