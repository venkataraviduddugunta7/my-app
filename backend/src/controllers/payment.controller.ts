import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const createPaymentSchema = z.object({
  tenantId: z.string().min(1, 'Tenant is required'),
  bedId: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  paymentType: z.enum(['RENT', 'DEPOSIT', 'MAINTENANCE', 'ELECTRICITY', 'WATER', 'INTERNET', 'LAUNDRY', 'LATE_FEE', 'OTHER']),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'UPI', 'CARD', 'CHEQUE']).default('CASH'),
  dueDate: z.string().transform(str => new Date(str)),
  description: z.string().optional(),
  transactionId: z.string().optional()
});

const recordPaymentSchema = z.object({
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'UPI', 'CARD', 'CHEQUE']),
  paidDate: z.string().transform(str => new Date(str)),
  transactionId: z.string().optional(),
  lateFee: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  notes: z.string().optional()
});

const bulkPaymentSchema = z.object({
  tenantIds: z.array(z.string()),
  paymentType: z.enum(['RENT', 'MAINTENANCE', 'ELECTRICITY', 'WATER', 'INTERNET', 'LAUNDRY', 'OTHER']),
  amount: z.number().positive(),
  dueDate: z.string().transform(str => new Date(str)),
  description: z.string().optional()
});

export class PaymentController {
  // Create payment record
  static async createPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId } = req.params;
      const userId = req.user?.userId;
      const validatedData = createPaymentSchema.parse(req.body);

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

      // Verify tenant belongs to property
      const tenant = await prisma.tenant.findFirst({
        where: {
          id: validatedData.tenantId,
          propertyId,
          status: 'ACTIVE'
        },
        include: {
          bed: true
        }
      });

      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Active tenant not found in this property'
        });
      }

      // Generate payment ID
      const paymentId = `PAY${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // Create payment
      const payment = await prisma.payment.create({
        data: {
          paymentId,
          ...validatedData,
          bedId: validatedData.bedId || tenant.bed?.id,
          month: `${validatedData.dueDate.getFullYear()}-${String(validatedData.dueDate.getMonth() + 1).padStart(2, '0')}`,
          year: validatedData.dueDate.getFullYear(),
          status: 'PENDING',
          propertyId,
          createdById: userId!
        },
        include: {
          tenant: {
            select: {
              id: true,
              tenantId: true,
              fullName: true,
              phone: true
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
        }
      });

      res.status(201).json({
        success: true,
        message: 'Payment record created successfully',
        data: payment
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

  // Get payments for a property
  static async getPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId } = req.params;
      const userId = req.user?.userId;
      const { 
        page = 1, 
        limit = 10, 
        status, 
        paymentType, 
        paymentMethod,
        tenantId,
        startDate, 
        endDate,
        search 
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

      if (status) {
        where.status = status;
      }

      if (paymentType) {
        where.paymentType = paymentType;
      }

      if (paymentMethod) {
        where.paymentMethod = paymentMethod;
      }

      if (tenantId) {
        where.tenantId = tenantId;
      }

      if (startDate || endDate) {
        where.dueDate = {};
        if (startDate) {
          where.dueDate.gte = new Date(startDate as string);
        }
        if (endDate) {
          where.dueDate.lte = new Date(endDate as string);
        }
      }

      if (search) {
        where.OR = [
          { paymentId: { contains: search as string, mode: 'insensitive' } },
          { tenant: { fullName: { contains: search as string, mode: 'insensitive' } } },
          { tenant: { tenantId: { contains: search as string, mode: 'insensitive' } } },
          { transactionId: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      const [payments, totalCount] = await Promise.all([
        prisma.payment.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            tenant: {
              select: {
                id: true,
                tenantId: true,
                fullName: true,
                phone: true,
                profilePhoto: true
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
                        name: true,
                        floorNumber: true
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

      // Calculate summary statistics
      const [totalAmount, paidAmount, pendingAmount, overdueCount] = await Promise.all([
        prisma.payment.aggregate({
          where,
          _sum: { amount: true }
        }),
        prisma.payment.aggregate({
          where: { ...where, status: 'PAID' },
          _sum: { amount: true }
        }),
        prisma.payment.aggregate({
          where: { ...where, status: 'PENDING' },
          _sum: { amount: true }
        }),
        prisma.payment.count({
          where: { ...where, status: 'OVERDUE' }
        })
      ]);

      res.json({
        success: true,
        data: {
          payments,
          summary: {
            total: totalAmount._sum.amount || 0,
            paid: paidAmount._sum.amount || 0,
            pending: pendingAmount._sum.amount || 0,
            overdueCount
          },
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

  // Record payment (mark as paid)
  static async recordPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId, paymentId } = req.params;
      const userId = req.user?.userId;
      const validatedData = recordPaymentSchema.parse(req.body);

      // Verify payment exists and belongs to property
      const payment = await prisma.payment.findFirst({
        where: {
          id: paymentId,
          propertyId,
          property: {
            ownerId: userId
          }
        },
        include: {
          tenant: {
            select: {
              id: true,
              tenantId: true,
              fullName: true,
              phone: true
            }
          }
        }
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      if (payment.status === 'PAID') {
        return res.status(400).json({
          success: false,
          message: 'Payment is already recorded as paid'
        });
      }

      // Calculate final amount
      const finalAmount = payment.amount + validatedData.lateFee - validatedData.discount;

      // Update payment
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'PAID',
          paymentMethod: validatedData.paymentMethod,
          paidDate: validatedData.paidDate,
          transactionId: validatedData.transactionId,
          lateFee: validatedData.lateFee,
          discount: validatedData.discount,
          amount: finalAmount,
          description: validatedData.notes ? 
            `${payment.description || ''}\nNotes: ${validatedData.notes}`.trim() : 
            payment.description
        },
        include: {
          tenant: {
            select: {
              id: true,
              tenantId: true,
              fullName: true,
              phone: true
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
        }
      });

      res.json({
        success: true,
        message: 'Payment recorded successfully',
        data: updatedPayment
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

  // Generate bulk payments (e.g., monthly rent for all tenants)
  static async generateBulkPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId } = req.params;
      const userId = req.user?.userId;
      const validatedData = bulkPaymentSchema.parse(req.body);

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

      // Get active tenants
      const tenants = await prisma.tenant.findMany({
        where: {
          id: { in: validatedData.tenantIds },
          propertyId,
          status: 'ACTIVE'
        },
        include: {
          bed: true
        }
      });

      if (tenants.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No active tenants found'
        });
      }

      // Create payments in transaction
      const payments = await prisma.$transaction(async (tx) => {
        const createdPayments = [];

        for (const tenant of tenants) {
          // Check if payment already exists for this month
          const existingPayment = await tx.payment.findFirst({
            where: {
              tenantId: tenant.id,
              paymentType: validatedData.paymentType,
              month: `${validatedData.dueDate.getFullYear()}-${String(validatedData.dueDate.getMonth() + 1).padStart(2, '0')}`,
              year: validatedData.dueDate.getFullYear()
            }
          });

          if (!existingPayment) {
            const paymentId = `PAY${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
            
            const payment = await tx.payment.create({
              data: {
                paymentId,
                amount: validatedData.amount,
                paymentType: validatedData.paymentType,
                dueDate: validatedData.dueDate,
                status: 'PENDING',
                month: `${validatedData.dueDate.getFullYear()}-${String(validatedData.dueDate.getMonth() + 1).padStart(2, '0')}`,
                year: validatedData.dueDate.getFullYear(),
                description: validatedData.description || `${validatedData.paymentType.toLowerCase()} payment`,
                propertyId,
                tenantId: tenant.id,
                bedId: tenant.bed?.id,
                createdById: userId!
              }
            });

            createdPayments.push(payment);
          }
        }

        return createdPayments;
      });

      res.status(201).json({
        success: true,
        message: `${payments.length} payment records created successfully`,
        data: {
          created: payments.length,
          skipped: tenants.length - payments.length,
          payments
        }
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

  // Get payment analytics
  static async getPaymentAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId } = req.params;
      const userId = req.user?.userId;
      const { startDate, endDate, period = 'month' } = req.query;

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

      // Set default date range if not provided
      const end = endDate ? new Date(endDate as string) : new Date();
      const start = startDate ? new Date(startDate as string) : 
        new Date(end.getFullYear(), end.getMonth() - 11, 1); // Last 12 months

      // Get payment statistics
      const [
        totalRevenue,
        monthlyRevenue,
        paymentsByStatus,
        paymentsByType,
        paymentsByMethod,
        overduePayments,
        collectionRate
      ] = await Promise.all([
        // Total revenue in period
        prisma.payment.aggregate({
          where: {
            propertyId,
            status: 'PAID',
            paidDate: { gte: start, lte: end }
          },
          _sum: { amount: true },
          _count: true
        }),

        // Monthly revenue breakdown
        prisma.payment.groupBy({
          by: ['month', 'year'],
          where: {
            propertyId,
            status: 'PAID',
            paidDate: { gte: start, lte: end }
          },
          _sum: { amount: true },
          _count: true,
          orderBy: [{ year: 'asc' }, { month: 'asc' }]
        }),

        // Payments by status
        prisma.payment.groupBy({
          by: ['status'],
          where: {
            propertyId,
            dueDate: { gte: start, lte: end }
          },
          _sum: { amount: true },
          _count: true
        }),

        // Payments by type
        prisma.payment.groupBy({
          by: ['paymentType'],
          where: {
            propertyId,
            dueDate: { gte: start, lte: end }
          },
          _sum: { amount: true },
          _count: true
        }),

        // Payments by method
        prisma.payment.groupBy({
          by: ['paymentMethod'],
          where: {
            propertyId,
            status: 'PAID',
            paidDate: { gte: start, lte: end }
          },
          _sum: { amount: true },
          _count: true
        }),

        // Overdue payments
        prisma.payment.findMany({
          where: {
            propertyId,
            status: 'OVERDUE',
            dueDate: { lt: new Date() }
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

        // Collection rate
        prisma.payment.aggregate({
          where: {
            propertyId,
            dueDate: { gte: start, lte: end }
          },
          _sum: { amount: true }
        })
      ]);

      // Calculate collection rate
      const totalDue = collectionRate._sum.amount || 0;
      const totalCollected = totalRevenue._sum.amount || 0;
      const collectionRatePercent = totalDue > 0 ? Math.round((totalCollected / totalDue) * 100) : 0;

      // Format monthly revenue for charts
      const monthlyRevenueFormatted = monthlyRevenue.map(item => ({
        period: `${item.year}-${item.month}`,
        revenue: item._sum.amount || 0,
        count: item._count
      }));

      const analytics = {
        summary: {
          totalRevenue: totalCollected,
          totalTransactions: totalRevenue._count,
          collectionRate: collectionRatePercent,
          overdueAmount: overduePayments.reduce((sum, payment) => sum + payment.amount, 0),
          overdueCount: overduePayments.length
        },
        trends: {
          monthlyRevenue: monthlyRevenueFormatted
        },
        breakdowns: {
          byStatus: paymentsByStatus,
          byType: paymentsByType,
          byMethod: paymentsByMethod
        },
        overduePayments: overduePayments.slice(0, 10) // Top 10 overdue
      };

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      next(error);
    }
  }

  // Update overdue payments (run as cron job)
  static async updateOverduePayments(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId } = req.params;
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

      // Get property settings for late fee configuration
      const propertySettings = await prisma.propertySettings.findUnique({
        where: { propertyId }
      });

      const lateFeeAfterDays = (propertySettings?.paymentSettings as any)?.lateFeeAfterDays || 3;
      const lateFeeAmount = (propertySettings?.paymentSettings as any)?.lateFeeAmount || 100;

      const overdueDate = new Date();
      overdueDate.setDate(overdueDate.getDate() - lateFeeAfterDays);

      // Update overdue payments
      const result = await prisma.payment.updateMany({
        where: {
          propertyId,
          status: 'PENDING',
          dueDate: { lt: overdueDate }
        },
        data: {
          status: 'OVERDUE'
        }
      });

      res.json({
        success: true,
        message: `${result.count} payments marked as overdue`,
        data: { updatedCount: result.count }
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete payment (only if not paid)
  static async deletePayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId, paymentId } = req.params;
      const userId = req.user?.userId;

      // Verify payment exists and belongs to property
      const payment = await prisma.payment.findFirst({
        where: {
          id: paymentId,
          propertyId,
          property: {
            ownerId: userId
          }
        }
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      if (payment.status === 'PAID') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete paid payment'
        });
      }

      await prisma.payment.delete({
        where: { id: paymentId }
      });

      res.json({
        success: true,
        message: 'Payment deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}
