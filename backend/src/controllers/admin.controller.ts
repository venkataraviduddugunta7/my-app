import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const updateUserStatusSchema = z.object({
  userId: z.string().cuid(),
  status: z.enum(['WAITING_APPROVAL', 'ACTIVE', 'INACTIVE', 'BLOCKED', 'CANCELLED']),
  reason: z.string().optional()
});

const updateUserRoleSchema = z.object({
  userId: z.string().cuid(),
  role: z.enum(['ADMIN', 'OWNER', 'MANAGER', 'STAFF'])
});

const deleteUserSchema = z.object({
  userId: z.string().cuid(),
  reason: z.string().min(1, 'Reason is required for user deletion')
});

export class AdminController {
  // Get all users with pagination and filters
  static async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, status, role, search } = req.query;
      
      const where: any = {};
      
      if (status) where.subscriptionStatus = status;
      if (role) where.role = role;
      if (search) {
        where.OR = [
          { fullName: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
          { username: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take,
          select: {
            id: true,
            email: true,
            username: true,
            fullName: true,
            phone: true,
            role: true,
            subscriptionStatus: true,
            isActive: true,
            approvedAt: true,
            blockedAt: true,
            blockedReason: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
            approver: {
              select: { fullName: true, email: true }
            },
            blocker: {
              select: { fullName: true, email: true }
            },
            properties: {
              select: { id: true, name: true }
            },
            _count: {
              select: {
                properties: true,
                createdTenants: true,
                createdPayments: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where })
      ]);

      const totalPages = Math.ceil(totalCount / take);

      // Log admin action
      await prisma.adminAction.create({
        data: {
          adminId: (req as any).user.id,
          action: 'USER_STATUS_CHANGED',
          details: {
            action: 'view_users',
            filters: { status, role, search },
            pagination: { page, limit }
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      res.status(200).json({
        success: true,
        data: {
          users,
          pagination: {
            currentPage: Number(page),
            totalPages,
            totalCount,
            hasNext: Number(page) < totalPages,
            hasPrev: Number(page) > 1
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user statistics
  static async getUserStats(req: Request, res: Response, next: NextFunction) {
    try {
      const [
        totalUsers,
        activeUsers,
        waitingApproval,
        blockedUsers,
        recentSignups
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { subscriptionStatus: 'ACTIVE' } }),
        prisma.user.count({ where: { subscriptionStatus: 'WAITING_APPROVAL' } }),
        prisma.user.count({ where: { subscriptionStatus: 'BLOCKED' } }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          }
        })
      ]);

      const roleDistribution = await prisma.user.groupBy({
        by: ['role'],
        _count: { role: true }
      });

      const statusDistribution = await prisma.user.groupBy({
        by: ['subscriptionStatus'],
        _count: { subscriptionStatus: true }
      });

      res.status(200).json({
        success: true,
        data: {
          overview: {
            totalUsers,
            activeUsers,
            waitingApproval,
            blockedUsers,
            recentSignups
          },
          roleDistribution,
          statusDistribution
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update user subscription status
  static async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, status, reason } = updateUserStatusSchema.parse(req.body);
      const adminId = (req as any).user.id;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, fullName: true, email: true, subscriptionStatus: true }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update user status
      const updateData: any = {
        subscriptionStatus: status,
        updatedAt: new Date()
      };

      if (status === 'ACTIVE') {
        updateData.approvedAt = new Date();
        updateData.approvedBy = adminId;
        updateData.blockedAt = null;
        updateData.blockedBy = null;
        updateData.blockedReason = null;
      } else if (status === 'BLOCKED') {
        updateData.blockedAt = new Date();
        updateData.blockedBy = adminId;
        updateData.blockedReason = reason;
        updateData.isActive = false;
      } else if (status === 'INACTIVE' || status === 'CANCELLED') {
        updateData.isActive = false;
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          fullName: true,
          email: true,
          subscriptionStatus: true,
          approvedAt: true,
          blockedAt: true,
          blockedReason: true
        }
      });

      // Log admin action
      await prisma.adminAction.create({
        data: {
          adminId,
          targetUserId: userId,
          action: status === 'ACTIVE' ? 'USER_APPROVED' : 
                  status === 'BLOCKED' ? 'USER_BLOCKED' : 'USER_STATUS_CHANGED',
          details: {
            previousStatus: user.subscriptionStatus,
            newStatus: status,
            reason
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      res.status(200).json({
        success: true,
        data: updatedUser,
        message: `User status updated to ${status}`
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

  // Update user role
  static async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, role } = updateUserRoleSchema.parse(req.body);
      const adminId = (req as any).user.id;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, fullName: true, email: true, role: true }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Prevent changing own role
      if (userId === adminId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot change your own role'
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true
        }
      });

      // Log admin action
      await prisma.adminAction.create({
        data: {
          adminId,
          targetUserId: userId,
          action: 'USER_ROLE_CHANGED',
          details: {
            previousRole: user.role,
            newRole: role
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      res.status(200).json({
        success: true,
        data: updatedUser,
        message: `User role updated to ${role}`
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

  // Delete user and all associated data
  static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, reason } = deleteUserSchema.parse(req.body);
      const adminId = (req as any).user.id;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          _count: {
            select: {
              properties: true,
              createdTenants: true,
              createdPayments: true
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Prevent deleting own account
      if (userId === adminId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete your own account'
        });
      }

      // Prevent deleting other admins
      if (user.role === 'ADMIN') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete admin users'
        });
      }

      // Log admin action before deletion
      await prisma.adminAction.create({
        data: {
          adminId,
          targetUserId: userId,
          action: 'USER_DELETED',
          details: {
            userEmail: user.email,
            userFullName: user.fullName,
            reason,
            dataCount: user._count
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      // Delete user (cascading will handle related data)
      await prisma.user.delete({
        where: { id: userId }
      });

      res.status(200).json({
        success: true,
        message: `User ${user.fullName} and all associated data deleted successfully`
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

  // Get admin activity log
  static async getAdminActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20, adminId, action } = req.query;
      
      const where: any = {};
      if (adminId) where.adminId = adminId;
      if (action) where.action = action;

      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      const [activities, totalCount] = await Promise.all([
        prisma.adminAction.findMany({
          where,
          skip,
          take,
          include: {
            admin: {
              select: { fullName: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.adminAction.count({ where })
      ]);

      const totalPages = Math.ceil(totalCount / take);

      res.status(200).json({
        success: true,
        data: {
          activities,
          pagination: {
            currentPage: Number(page),
            totalPages,
            totalCount,
            hasNext: Number(page) < totalPages,
            hasPrev: Number(page) > 1
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get pending approvals
  static async getPendingApprovals(req: Request, res: Response, next: NextFunction) {
    try {
      const pendingUsers = await prisma.user.findMany({
        where: {
          subscriptionStatus: 'WAITING_APPROVAL'
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          createdAt: true,
          _count: {
            select: {
              properties: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      res.status(200).json({
        success: true,
        data: pendingUsers
      });
    } catch (error) {
      next(error);
    }
  }
}
