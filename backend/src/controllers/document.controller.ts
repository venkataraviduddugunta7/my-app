import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

const prisma = new PrismaClient();

// File upload configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  // Allow common document formats
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, Word documents, images, and text files are allowed.'), false);
  }
};

export const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Validation schemas
const createDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  documentType: z.enum(['AGREEMENT', 'ID_PROOF', 'RECEIPT', 'POLICY', 'MAINTENANCE', 'LEGAL', 'INSURANCE', 'OTHER']),
  tags: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
  expiryDate: z.string().transform(str => str ? new Date(str) : null).optional()
});

const createNoticeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  noticeType: z.enum(['GENERAL', 'MAINTENANCE', 'PAYMENT_REMINDER', 'RULE_UPDATE', 'EVENT', 'EMERGENCY']).default('GENERAL'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  isPublished: z.boolean().default(false),
  publishDate: z.string().transform(str => str ? new Date(str) : null).optional(),
  expiryDate: z.string().transform(str => str ? new Date(str) : null).optional(),
  targetTenantIds: z.array(z.string()).default([])
});

export class DocumentController {
  // Upload and create document
  static async createDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId } = req.params;
      const userId = req.user?.userId;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'File is required'
        });
      }

      const validatedData = createDocumentSchema.parse(req.body);

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

      // Create document record
      const document = await prisma.document.create({
        data: {
          ...validatedData,
          filePath: req.file.path,
          fileName: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          propertyId,
          createdById: userId!
        }
      });

      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        data: document
      });
    } catch (error) {
      // Clean up uploaded file if document creation fails
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Failed to delete uploaded file:', unlinkError);
        }
      }

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

  // Get documents for a property
  static async getDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId } = req.params;
      const userId = req.user?.userId;
      const { 
        page = 1, 
        limit = 10, 
        documentType, 
        search,
        isPublic,
        tags 
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

      if (documentType) {
        where.documentType = documentType;
      }

      if (isPublic !== undefined) {
        where.isPublic = isPublic === 'true';
      }

      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
          { fileName: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        where.tags = {
          hasSome: tagArray
        };
      }

      const [documents, totalCount] = await Promise.all([
        prisma.document.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            createdBy: {
              select: {
                fullName: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.document.count({ where })
      ]);

      // Add file URLs and format file sizes
      const documentsWithUrls = documents.map(doc => ({
        ...doc,
        fileUrl: `/api/documents/${doc.id}/download`,
        fileSizeFormatted: formatFileSize(doc.fileSize)
      }));

      res.json({
        success: true,
        data: {
          documents: documentsWithUrls,
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

  // Download document
  static async downloadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId, documentId } = req.params;
      const userId = req.user?.userId;

      // Verify document exists and user has access
      const document = await prisma.document.findFirst({
        where: {
          id: documentId,
          propertyId,
          property: {
            ownerId: userId
          }
        }
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      // Check if file exists
      try {
        await fs.access(document.filePath);
      } catch {
        return res.status(404).json({
          success: false,
          message: 'File not found on server'
        });
      }

      // Set appropriate headers
      res.setHeader('Content-Type', document.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);

      // Stream file
      const fileStream = require('fs').createReadStream(document.filePath);
      fileStream.pipe(res);
    } catch (error) {
      next(error);
    }
  }

  // Update document
  static async updateDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId, documentId } = req.params;
      const userId = req.user?.userId;
      
      const updateData = createDocumentSchema.partial().parse(req.body);

      // Verify document exists and user has access
      const document = await prisma.document.findFirst({
        where: {
          id: documentId,
          propertyId,
          property: {
            ownerId: userId
          }
        }
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      const updatedDocument = await prisma.document.update({
        where: { id: documentId },
        data: updateData
      });

      res.json({
        success: true,
        message: 'Document updated successfully',
        data: updatedDocument
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

  // Delete document
  static async deleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId, documentId } = req.params;
      const userId = req.user?.userId;

      // Verify document exists and user has access
      const document = await prisma.document.findFirst({
        where: {
          id: documentId,
          propertyId,
          property: {
            ownerId: userId
          }
        }
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      // Delete file from filesystem
      try {
        await fs.unlink(document.filePath);
      } catch (error) {
        console.error('Failed to delete file:', error);
        // Continue with database deletion even if file deletion fails
      }

      // Delete from database
      await prisma.document.delete({
        where: { id: documentId }
      });

      res.json({
        success: true,
        message: 'Document deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Notice Management

  // Create notice
  static async createNotice(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId } = req.params;
      const userId = req.user?.userId;
      const validatedData = createNoticeSchema.parse(req.body);

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

      // Verify target tenants exist and belong to property
      if (validatedData.targetTenantIds.length > 0) {
        const validTenants = await prisma.tenant.findMany({
          where: {
            id: { in: validatedData.targetTenantIds },
            propertyId,
            status: 'ACTIVE'
          }
        });

        if (validTenants.length !== validatedData.targetTenantIds.length) {
          return res.status(400).json({
            success: false,
            message: 'Some target tenants are invalid or inactive'
          });
        }
      }

      const { targetTenantIds, ...noticeData } = validatedData;

      // Create notice
      const notice = await prisma.notice.create({
        data: {
          ...noticeData,
          propertyId,
          createdById: userId!,
          targetTenants: targetTenantIds.length > 0 ? {
            connect: targetTenantIds.map(id => ({ id }))
          } : undefined
        },
        include: {
          targetTenants: {
            select: {
              id: true,
              tenantId: true,
              fullName: true
            }
          },
          createdBy: {
            select: {
              fullName: true
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        message: 'Notice created successfully',
        data: notice
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

  // Get notices for a property
  static async getNotices(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId } = req.params;
      const userId = req.user?.userId;
      const { 
        page = 1, 
        limit = 10, 
        noticeType, 
        priority,
        isPublished,
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

      if (noticeType) {
        where.noticeType = noticeType;
      }

      if (priority) {
        where.priority = priority;
      }

      if (isPublished !== undefined) {
        where.isPublished = isPublished === 'true';
      }

      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { content: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      const [notices, totalCount] = await Promise.all([
        prisma.notice.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            targetTenants: {
              select: {
                id: true,
                tenantId: true,
                fullName: true
              }
            },
            createdBy: {
              select: {
                fullName: true
              }
            },
            _count: {
              select: {
                targetTenants: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.notice.count({ where })
      ]);

      // Add read status for each notice
      const noticesWithStats = notices.map(notice => ({
        ...notice,
        stats: {
          totalTargets: notice._count.targetTenants,
          readCount: notice.readBy.length,
          readRate: notice._count.targetTenants > 0 ? 
            Math.round((notice.readBy.length / notice._count.targetTenants) * 100) : 0
        }
      }));

      res.json({
        success: true,
        data: {
          notices: noticesWithStats,
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

  // Update notice
  static async updateNotice(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId, noticeId } = req.params;
      const userId = req.user?.userId;
      
      const updateData = createNoticeSchema.partial().parse(req.body);

      // Verify notice exists and user has access
      const notice = await prisma.notice.findFirst({
        where: {
          id: noticeId,
          propertyId,
          property: {
            ownerId: userId
          }
        }
      });

      if (!notice) {
        return res.status(404).json({
          success: false,
          message: 'Notice not found'
        });
      }

      const { targetTenantIds, ...noticeData } = updateData;

      // Update notice
      const updatedNotice = await prisma.notice.update({
        where: { id: noticeId },
        data: {
          ...noticeData,
          targetTenants: targetTenantIds ? {
            set: targetTenantIds.map(id => ({ id }))
          } : undefined
        },
        include: {
          targetTenants: {
            select: {
              id: true,
              tenantId: true,
              fullName: true
            }
          }
        }
      });

      res.json({
        success: true,
        message: 'Notice updated successfully',
        data: updatedNotice
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

  // Delete notice
  static async deleteNotice(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId, noticeId } = req.params;
      const userId = req.user?.userId;

      // Verify notice exists and user has access
      const notice = await prisma.notice.findFirst({
        where: {
          id: noticeId,
          propertyId,
          property: {
            ownerId: userId
          }
        }
      });

      if (!notice) {
        return res.status(404).json({
          success: false,
          message: 'Notice not found'
        });
      }

      await prisma.notice.delete({
        where: { id: noticeId }
      });

      res.json({
        success: true,
        message: 'Notice deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Mark notice as read (for tenant app)
  static async markNoticeAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId, noticeId } = req.params;
      const { tenantId } = req.body;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Tenant ID is required'
        });
      }

      // Verify notice exists and tenant has access
      const notice = await prisma.notice.findFirst({
        where: {
          id: noticeId,
          propertyId,
          isPublished: true,
          OR: [
            { targetTenants: { some: { id: tenantId } } },
            { targetTenants: { none: {} } } // Public notice
          ]
        }
      });

      if (!notice) {
        return res.status(404).json({
          success: false,
          message: 'Notice not found or not accessible'
        });
      }

      // Add tenant to readBy array if not already present
      if (!notice.readBy.includes(tenantId)) {
        await prisma.notice.update({
          where: { id: noticeId },
          data: {
            readBy: {
              push: tenantId
            }
          }
        });
      }

      res.json({
        success: true,
        message: 'Notice marked as read'
      });
    } catch (error) {
      next(error);
    }
  }
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
