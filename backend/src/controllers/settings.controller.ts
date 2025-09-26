import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const updateUserSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
  dateFormat: z.string().optional(),
  currency: z.string().optional(),
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  rentReminders: z.boolean().optional(),
  maintenanceAlerts: z.boolean().optional(),
  newTenantAlerts: z.boolean().optional(),
  paymentAlerts: z.boolean().optional(),
  systemUpdates: z.boolean().optional(),
  twoFactorEnabled: z.boolean().optional(),
  sessionTimeout: z.number().int().min(5).max(480).optional(),
  loginNotifications: z.boolean().optional()
});

const updateDashboardSettingsSchema = z.object({
  defaultView: z.enum(['cards', 'table']).optional(),
  showNotifications: z.boolean().optional(),
  autoRefresh: z.boolean().optional(),
  refreshInterval: z.number().int().min(10).max(300).optional(),
  defaultProperty: z.string().optional(),
  favoriteCharts: z.array(z.string()).optional(),
  compactMode: z.boolean().optional(),
  statsVisible: z.boolean().optional(),
  activitiesVisible: z.boolean().optional(),
  chartsVisible: z.boolean().optional(),
  quickActionsVisible: z.boolean().optional()
});

const updatePropertySettingsSchema = z.object({
  termsAndConditions: z.string().optional(),
  privacyPolicy: z.string().optional(),
  rules: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
  contactInfo: z.object({
    phone: z.string().optional(),
    email: z.string().email().optional(),
    website: z.string().url().optional(),
    address: z.string().optional()
  }).optional(),
  paymentSettings: z.object({
    dueDate: z.number().int().min(1).max(31).optional(),
    lateFeeAfterDays: z.number().int().min(0).max(30).optional(),
    lateFeeAmount: z.number().min(0).optional(),
    lateFeeType: z.enum(['FIXED', 'PERCENTAGE']).optional(),
    acceptedMethods: z.array(z.enum(['CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'CHEQUE'])).optional(),
    autoGenerateRent: z.boolean().optional(),
    rentGenerationDay: z.number().int().min(1).max(31).optional()
  }).optional(),
  notificationSettings: z.object({
    rentReminders: z.boolean().optional(),
    reminderDaysBefore: z.number().int().min(0).max(30).optional(),
    maintenanceAlerts: z.boolean().optional(),
    newTenantWelcome: z.boolean().optional(),
    paymentConfirmations: z.boolean().optional(),
    overdueNotifications: z.boolean().optional(),
    vacancyAlerts: z.boolean().optional()
  }).optional(),
  maintenanceSchedule: z.object({
    cleaningFrequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).optional(),
    inspectionFrequency: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
    maintenanceDay: z.string().optional(),
    emergencyContact: z.string().optional()
  }).optional(),
  emergencyContacts: z.array(z.object({
    name: z.string(),
    phone: z.string(),
    role: z.string(),
    available24x7: z.boolean().optional()
  })).optional()
});

export class SettingsController {
  // User Settings Management
  
  // Get user settings
  static async getUserSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      const userSettings = await prisma.userSettings.findUnique({
        where: { userId }
      });

      if (!userSettings) {
        // Create default settings if they don't exist
        const defaultSettings = await prisma.userSettings.create({
          data: { userId }
        });

        return res.json({
          success: true,
          data: defaultSettings
        });
      }

      res.json({
        success: true,
        data: userSettings
      });
    } catch (error) {
      next(error);
    }
  }

  // Update user settings
  static async updateUserSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const validatedData = updateUserSettingsSchema.parse(req.body);

      const updatedSettings = await prisma.userSettings.upsert({
        where: { userId },
        update: validatedData,
        create: {
          userId,
          ...validatedData
        }
      });

      res.json({
        success: true,
        message: 'User settings updated successfully',
        data: updatedSettings
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

  // Dashboard Settings Management
  
  // Get dashboard settings
  static async getDashboardSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      const dashboardSettings = await prisma.dashboardSettings.findUnique({
        where: { userId }
      });

      if (!dashboardSettings) {
        // Create default settings if they don't exist
        const defaultSettings = await prisma.dashboardSettings.create({
          data: { userId }
        });

        return res.json({
          success: true,
          data: defaultSettings
        });
      }

      res.json({
        success: true,
        data: dashboardSettings
      });
    } catch (error) {
      next(error);
    }
  }

  // Update dashboard settings
  static async updateDashboardSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const validatedData = updateDashboardSettingsSchema.parse(req.body);

      const updatedSettings = await prisma.dashboardSettings.upsert({
        where: { userId },
        update: validatedData,
        create: {
          userId,
          ...validatedData
        }
      });

      res.json({
        success: true,
        message: 'Dashboard settings updated successfully',
        data: updatedSettings
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

  // Property Settings Management
  
  // Get property settings
  static async getPropertySettings(req: Request, res: Response, next: NextFunction) {
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

      const propertySettings = await prisma.propertySettings.findUnique({
        where: { propertyId }
      });

      if (!propertySettings) {
        // Create default settings if they don't exist
        const defaultSettings = await prisma.propertySettings.create({
          data: {
            propertyId,
            rules: [
              'No smoking inside the premises',
              'Maintain cleanliness in common areas',
              'No loud music after 10 PM',
              'Guests must be registered at reception',
              'Monthly rent due by 5th of every month'
            ],
            contactInfo: {
              phone: property.phone,
              email: property.email,
              website: property.website
            },
            paymentSettings: {
              dueDate: 5,
              lateFeeAfterDays: 3,
              lateFeeAmount: 100,
              lateFeeType: 'FIXED',
              acceptedMethods: ['CASH', 'UPI', 'BANK_TRANSFER'],
              autoGenerateRent: true,
              rentGenerationDay: 1
            },
            notificationSettings: {
              rentReminders: true,
              reminderDaysBefore: 3,
              maintenanceAlerts: true,
              newTenantWelcome: true,
              paymentConfirmations: true,
              overdueNotifications: true,
              vacancyAlerts: false
            }
          }
        });

        return res.json({
          success: true,
          data: defaultSettings
        });
      }

      res.json({
        success: true,
        data: propertySettings
      });
    } catch (error) {
      next(error);
    }
  }

  // Update property settings
  static async updatePropertySettings(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId } = req.params;
      const userId = req.user?.userId;
      const validatedData = updatePropertySettingsSchema.parse(req.body);

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

      const updatedSettings = await prisma.propertySettings.upsert({
        where: { propertyId },
        update: validatedData,
        create: {
          propertyId,
          ...validatedData
        }
      });

      res.json({
        success: true,
        message: 'Property settings updated successfully',
        data: updatedSettings
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

  // System Settings (Admin only - future feature)
  
  // Get system configuration
  static async getSystemSettings(req: Request, res: Response, next: NextFunction) {
    try {
      // This would be for system-wide settings in future
      const systemSettings = {
        version: '1.0.0',
        maintenanceMode: false,
        maxPropertiesPerUser: 10,
        maxTenantsPerProperty: 100,
        fileUploadLimit: 10 * 1024 * 1024, // 10MB
        supportedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
        features: {
          multiProperty: true,
          bulkOperations: true,
          analytics: true,
          notifications: true,
          documentManagement: true,
          paymentTracking: true
        }
      };

      res.json({
        success: true,
        data: systemSettings
      });
    } catch (error) {
      next(error);
    }
  }

  // Backup and Export Settings
  
  // Export user data
  static async exportUserData(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      // Get all user data for export
      const userData = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          userSettings: true,
          dashboardSettings: true,
          properties: {
            include: {
              settings: true,
              floors: {
                include: {
                  rooms: {
                    include: {
                      beds: true
                    }
                  }
                }
              },
              tenants: true,
              payments: true,
              notices: true,
              documents: {
                select: {
                  id: true,
                  title: true,
                  documentType: true,
                  createdAt: true
                  // Exclude file paths for security
                }
              }
            }
          }
        }
      });

      if (!userData) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Remove sensitive information
      const { password, ...safeUserData } = userData;

      res.json({
        success: true,
        message: 'User data exported successfully',
        data: {
          exportedAt: new Date().toISOString(),
          user: safeUserData
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Reset settings to default
  static async resetUserSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const { settingsType } = req.body; // 'user', 'dashboard', or 'all'

      if (!settingsType || !['user', 'dashboard', 'all'].includes(settingsType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid settings type. Must be "user", "dashboard", or "all"'
        });
      }

      const operations = [];

      if (settingsType === 'user' || settingsType === 'all') {
        operations.push(
          prisma.userSettings.upsert({
            where: { userId },
            update: {
              theme: 'light',
              language: 'en',
              timezone: 'Asia/Kolkata',
              dateFormat: 'DD/MM/YYYY',
              currency: 'INR',
              emailNotifications: true,
              smsNotifications: false,
              pushNotifications: true,
              rentReminders: true,
              maintenanceAlerts: true,
              newTenantAlerts: true,
              paymentAlerts: true,
              systemUpdates: false,
              twoFactorEnabled: false,
              sessionTimeout: 60,
              loginNotifications: true
            },
            create: { userId }
          })
        );
      }

      if (settingsType === 'dashboard' || settingsType === 'all') {
        operations.push(
          prisma.dashboardSettings.upsert({
            where: { userId },
            update: {
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
            },
            create: { userId }
          })
        );
      }

      const results = await Promise.all(operations);

      res.json({
        success: true,
        message: `${settingsType === 'all' ? 'All' : settingsType} settings reset to default`,
        data: results
      });
    } catch (error) {
      next(error);
    }
  }
}
