const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middleware/error.middleware');

const prisma = new PrismaClient();

// Get all users with pagination and filters
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, role, search } = req.query;
  
  const where = {};
  
  if (status) where.subscriptionStatus = status;
  if (role) where.role = role;
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { username: { contains: search, mode: 'insensitive' } }
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
      adminId: req.user.id,
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
});

// Get user statistics
const getUserStats = asyncHandler(async (req, res) => {
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
});

// Update user subscription status
const updateUserStatus = asyncHandler(async (req, res) => {
  const { userId, status, reason } = req.body;
  const adminId = req.user.id;

  // Validation
  if (!userId || !status) {
    return res.status(400).json({
      success: false,
      error: { message: 'UserId and status are required' }
    });
  }

  const validStatuses = ['WAITING_APPROVAL', 'ACTIVE', 'INACTIVE', 'BLOCKED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid status' }
    });
  }

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, fullName: true, email: true, subscriptionStatus: true }
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: { message: 'User not found' }
    });
  }

  // Update user status
  const updateData = {
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
});

// Delete user and all associated data
const deleteUser = asyncHandler(async (req, res) => {
  const { userId, reason } = req.body;
  const adminId = req.user.id;

  // Validation
  if (!userId || !reason) {
    return res.status(400).json({
      success: false,
      error: { message: 'UserId and reason are required' }
    });
  }

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
      error: { message: 'User not found' }
    });
  }

  // Prevent deleting own account
  if (userId === adminId) {
    return res.status(400).json({
      success: false,
      error: { message: 'Cannot delete your own account' }
    });
  }

  // Prevent deleting other admins
  if (user.role === 'ADMIN') {
    return res.status(400).json({
      success: false,
      error: { message: 'Cannot delete admin users' }
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
});

// Get pending approvals
const getPendingApprovals = asyncHandler(async (req, res) => {
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
});

module.exports = {
  getAllUsers,
  getUserStats,
  updateUserStatus,
  deleteUser,
  getPendingApprovals
};
