import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

// Authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;

    // Check if user still exists and is active
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.userId,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        role: true,
        subscriptionStatus: true,
        isActive: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found or inactive.'
      });
    }

    // Check subscription status (except for admins)
    if (user.role !== 'ADMIN' && !['ACTIVE', 'WAITING_APPROVAL'].includes(user.subscriptionStatus)) {
      return res.status(403).json({
        success: false,
        message: 'Account access denied. Please contact administrator.',
        subscriptionStatus: user.subscriptionStatus
      });
    }

    // Update last login
    if (user.subscriptionStatus === 'ACTIVE') {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });
    }

    // Add user info to request
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      subscriptionStatus: user.subscriptionStatus
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Token verification failed.'
    });
  }
};

// Authorization middleware
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions.'
      });
    }

    next();
  };
};

// Property ownership middleware
export const requirePropertyOwnership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user?.userId;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        message: 'Property ID is required.'
      });
    }

    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        ownerId: userId
      }
    });

    if (!property) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this property.'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to verify property ownership.'
    });
  }
};

// Optional authentication (for public endpoints that can benefit from user context)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      
      const user = await prisma.user.findFirst({
        where: {
          id: decoded.userId,
          isActive: true,
          subscriptionStatus: {
            in: ['ACTIVE', 'WAITING_APPROVAL'] // Allow waiting users to access limited features
          }
        },
        select: {
          id: true,
          email: true,
          role: true,
          subscriptionStatus: true
        }
      });

      if (user) {
        req.user = {
          userId: user.id,
          email: user.email,
          role: user.role,
          subscriptionStatus: user.subscriptionStatus
        };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

// Role-based access control middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    
    next();
  };
};
