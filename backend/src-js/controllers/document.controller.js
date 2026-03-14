const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middleware/error.middleware');
const appNotificationService = require('../services/app-notification.service');
const webSocketService = require('../services/websocket.service');

const prisma = new PrismaClient();

const DOCUMENT_TYPES = new Set([
  'AGREEMENT',
  'ID_PROOF',
  'RECEIPT',
  'POLICY',
  'MAINTENANCE',
  'LEGAL',
  'INSURANCE',
  'OTHER'
]);

const NOTICE_TYPES = new Set([
  'GENERAL',
  'MAINTENANCE',
  'PAYMENT_REMINDER',
  'RULE_UPDATE',
  'EVENT',
  'EMERGENCY'
]);

const PRIORITIES = new Set(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
const NOTICE_AUDIENCES = new Set(['PROPERTY', 'FLOOR', 'ROOM', 'TENANT']);

const parseBoolean = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  return String(value).toLowerCase() === 'true';
};

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const parseStringArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry).trim())
      .filter(Boolean);
  }

  return String(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const parseUniqueStringArray = (value) => [...new Set(parseStringArray(value))];

const normalizeAudienceType = (value) => String(value || 'PROPERTY').toUpperCase();

const formatAudienceLabel = (audienceType, count, singular) => {
  if (count === 1) {
    return singular;
  }

  return `${count} ${audienceType.toLowerCase()}s`;
};

const verifyPropertyAccess = async (propertyId, ownerId) => {
  return prisma.property.findFirst({
    where: {
      id: propertyId,
      isActive: true,
      ownerId,
    },
    select: {
      id: true,
      name: true,
    },
  });
};

const resolveNoticeAudience = async ({
  propertyId,
  audienceType,
  targetTenantIds,
  targetFloorIds,
  targetRoomIds,
}) => {
  const normalizedAudience = normalizeAudienceType(audienceType);

  if (!NOTICE_AUDIENCES.has(normalizedAudience)) {
    return {
      error: 'Invalid audience type',
    };
  }

  const parsedTenantIds = parseUniqueStringArray(targetTenantIds);
  const parsedFloorIds = parseUniqueStringArray(targetFloorIds);
  const parsedRoomIds = parseUniqueStringArray(targetRoomIds);

  let validatedFloorIds = [];
  let validatedRoomIds = [];
  let recipients = [];

  if (normalizedAudience === 'PROPERTY') {
    recipients = await prisma.tenant.findMany({
      where: {
        propertyId,
        isActive: true,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        tenantId: true,
        fullName: true,
      },
    });
  }

  if (normalizedAudience === 'FLOOR') {
    if (parsedFloorIds.length === 0) {
      return {
        error: 'Select at least one floor for this notice',
      };
    }

    const validFloors = await prisma.floor.findMany({
      where: {
        id: { in: parsedFloorIds },
        propertyId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (validFloors.length !== parsedFloorIds.length) {
      return {
        error: 'Some selected floors are invalid for this property',
      };
    }

    validatedFloorIds = validFloors.map((floor) => floor.id);

    recipients = await prisma.tenant.findMany({
      where: {
        propertyId,
        isActive: true,
        status: 'ACTIVE',
        bed: {
          room: {
            floorId: { in: validatedFloorIds },
          },
        },
      },
      select: {
        id: true,
        tenantId: true,
        fullName: true,
      },
    });
  }

  if (normalizedAudience === 'ROOM') {
    if (parsedRoomIds.length === 0) {
      return {
        error: 'Select at least one room for this notice',
      };
    }

    const validRooms = await prisma.room.findMany({
      where: {
        id: { in: parsedRoomIds },
        floor: {
          propertyId,
        },
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (validRooms.length !== parsedRoomIds.length) {
      return {
        error: 'Some selected rooms are invalid for this property',
      };
    }

    validatedRoomIds = validRooms.map((room) => room.id);

    recipients = await prisma.tenant.findMany({
      where: {
        propertyId,
        isActive: true,
        status: 'ACTIVE',
        bed: {
          roomId: { in: validatedRoomIds },
        },
      },
      select: {
        id: true,
        tenantId: true,
        fullName: true,
      },
    });
  }

  if (normalizedAudience === 'TENANT') {
    if (parsedTenantIds.length === 0) {
      return {
        error: 'Select at least one tenant for this notice',
      };
    }

    recipients = await prisma.tenant.findMany({
      where: {
        id: { in: parsedTenantIds },
        propertyId,
        isActive: true,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        tenantId: true,
        fullName: true,
      },
    });

    if (recipients.length !== parsedTenantIds.length) {
      return {
        error: 'Some selected tenants are invalid or inactive for this property',
      };
    }
  }

  return {
    audienceType: normalizedAudience,
    targetFloorIds: validatedFloorIds,
    targetRoomIds: validatedRoomIds,
    targetTenantIds: recipients.map((tenant) => tenant.id),
    recipients,
  };
};

const attachNoticeAudienceSummary = async (notices) => {
  if (!Array.isArray(notices) || notices.length === 0) {
    return [];
  }

  const floorIds = [...new Set(notices.flatMap((notice) => notice.targetFloorIds || []))];
  const roomIds = [...new Set(notices.flatMap((notice) => notice.targetRoomIds || []))];

  const [floors, rooms] = await Promise.all([
    floorIds.length
      ? prisma.floor.findMany({
          where: { id: { in: floorIds } },
          select: {
            id: true,
            name: true,
            floorNumber: true,
          },
        })
      : [],
    roomIds.length
      ? prisma.room.findMany({
          where: { id: { in: roomIds } },
          select: {
            id: true,
            roomNumber: true,
            name: true,
            floor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })
      : [],
  ]);

  const floorMap = new Map(floors.map((floor) => [floor.id, floor]));
  const roomMap = new Map(rooms.map((room) => [room.id, room]));

  return notices.map((notice) => {
    const floorTargets = (notice.targetFloorIds || [])
      .map((id) => floorMap.get(id))
      .filter(Boolean);
    const roomTargets = (notice.targetRoomIds || [])
      .map((id) => roomMap.get(id))
      .filter(Boolean);
    const totalTargets = notice._count?.targetTenants || 0;
    const targetTenants = Array.isArray(notice.targetTenants) ? notice.targetTenants : [];

    let audienceLabel = 'Entire property';
    let audienceSubtitle = totalTargets
      ? `${totalTargets} active tenant${totalTargets === 1 ? '' : 's'} targeted`
      : 'No active tenants matched yet';

    if (notice.audienceType === 'FLOOR') {
      audienceLabel =
        floorTargets.length === 1
          ? floorTargets[0].name
          : formatAudienceLabel('floor', floorTargets.length, '1 floor');
      audienceSubtitle = floorTargets.map((floor) => floor.name).join(', ') || audienceSubtitle;
    }

    if (notice.audienceType === 'ROOM') {
      audienceLabel =
        roomTargets.length === 1
          ? `Room ${roomTargets[0].roomNumber}`
          : formatAudienceLabel('room', roomTargets.length, '1 room');
      audienceSubtitle =
        roomTargets.map((room) => `${room.roomNumber}${room.floor?.name ? ` • ${room.floor.name}` : ''}`).join(', ') ||
        audienceSubtitle;
    }

    if (notice.audienceType === 'TENANT') {
      audienceLabel =
        totalTargets === 1 && targetTenants[0]
          ? targetTenants[0].fullName
          : formatAudienceLabel('tenant', totalTargets, '1 tenant');
      audienceSubtitle =
        targetTenants
          .slice(0, 3)
          .map((tenant) => tenant.fullName)
          .join(', ') || audienceSubtitle;
    }

    return {
      ...notice,
      audience: {
        type: notice.audienceType,
        label: audienceLabel,
        subtitle: audienceSubtitle,
        floors: floorTargets,
        rooms: roomTargets,
      },
      stats: {
        totalTargets,
        readCount: notice.readBy.length,
        readRate: totalTargets > 0 ? Math.round((notice.readBy.length / totalTargets) * 100) : 0,
      },
    };
  });
};

const getDocuments = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  const { page = 1, limit = 20, documentType, isPublic, search, tags } = req.query;

  const property = await verifyPropertyAccess(propertyId, req.user.id);
  if (!property) {
    return res.status(404).json({
      success: false,
      error: { message: 'Property not found' },
    });
  }

  const where = { propertyId };
  const parsedIsPublic = parseBoolean(isPublic);
  const parsedTags = parseStringArray(tags);

  if (documentType) {
    const upperType = String(documentType).toUpperCase();
    if (!DOCUMENT_TYPES.has(upperType)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid document type' },
      });
    }
    where.documentType = upperType;
  }

  if (parsedIsPublic !== undefined) {
    where.isPublic = parsedIsPublic;
  }

  if (search) {
    where.OR = [
      { title: { contains: String(search), mode: 'insensitive' } },
      { description: { contains: String(search), mode: 'insensitive' } },
      { fileName: { contains: String(search), mode: 'insensitive' } },
    ];
  }

  if (parsedTags.length > 0) {
    where.tags = {
      hasSome: parsedTags,
    };
  }

  const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const skip = (pageNumber - 1) * pageSize;

  const [documents, totalCount] = await Promise.all([
    prisma.document.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
      skip,
      take: pageSize,
    }),
    prisma.document.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      documents,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total: totalCount,
        pages: Math.ceil(totalCount / pageSize) || 1,
      },
    },
  });
});

const createDocument = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  const {
    title,
    description,
    documentType,
    filePath,
    fileName,
    fileSize,
    mimeType,
    tags,
    isPublic,
    expiryDate,
  } = req.body;

  if (!title || !documentType || !fileName) {
    return res.status(400).json({
      success: false,
      error: { message: 'Required fields: title, documentType, fileName' },
    });
  }

  const normalizedType = String(documentType).toUpperCase();
  if (!DOCUMENT_TYPES.has(normalizedType)) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid document type' },
    });
  }

  const property = await verifyPropertyAccess(propertyId, req.user.id);
  if (!property) {
    return res.status(404).json({
      success: false,
      error: { message: 'Property not found' },
    });
  }

  const parsedExpiryDate = parseDate(expiryDate);
  if (expiryDate && !parsedExpiryDate) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid expiryDate' },
    });
  }

  const normalizedFileSize = Number(fileSize ?? 0);
  if (Number.isNaN(normalizedFileSize) || normalizedFileSize < 0) {
    return res.status(400).json({
      success: false,
      error: { message: 'fileSize must be a non-negative number' },
    });
  }

  const document = await prisma.document.create({
    data: {
      title: String(title).trim(),
      description: description ? String(description).trim() : null,
      documentType: normalizedType,
      filePath: filePath ? String(filePath).trim() : `manual://${Date.now()}-${String(fileName).trim()}`,
      fileName: String(fileName).trim(),
      fileSize: normalizedFileSize,
      mimeType: mimeType ? String(mimeType).trim() : 'application/octet-stream',
      tags: parseStringArray(tags),
      isPublic: parseBoolean(isPublic) ?? false,
      expiryDate: parsedExpiryDate,
      propertyId,
      createdById: req.user.id,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  await appNotificationService.notifyPropertyOwner(propertyId, {
    title: 'Document added',
    message: `${document.title} was uploaded to ${property.name}.`,
    type: 'INFO',
    category: 'DOCUMENT',
    actionUrl: '/documents',
    entityType: 'document',
    entityId: document.id,
    metadata: {
      documentType: document.documentType,
      fileName: document.fileName,
    },
  });

  res.status(201).json({
    success: true,
    data: document,
    message: 'Document created successfully',
  });
});

const updateDocument = asyncHandler(async (req, res) => {
  const { propertyId, documentId } = req.params;

  const property = await verifyPropertyAccess(propertyId, req.user.id);
  if (!property) {
    return res.status(404).json({
      success: false,
      error: { message: 'Property not found' },
    });
  }

  const existingDocument = await prisma.document.findFirst({
    where: {
      id: documentId,
      propertyId,
    },
    select: { id: true },
  });

  if (!existingDocument) {
    return res.status(404).json({
      success: false,
      error: { message: 'Document not found' },
    });
  }

  const updateData = {};
  const {
    title,
    description,
    documentType,
    filePath,
    fileName,
    fileSize,
    mimeType,
    tags,
    isPublic,
    expiryDate,
  } = req.body;

  if (title !== undefined) updateData.title = String(title).trim();
  if (description !== undefined) updateData.description = description ? String(description).trim() : null;

  if (documentType !== undefined) {
    const normalizedType = String(documentType).toUpperCase();
    if (!DOCUMENT_TYPES.has(normalizedType)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid document type' },
      });
    }
    updateData.documentType = normalizedType;
  }

  if (filePath !== undefined) updateData.filePath = String(filePath).trim();
  if (fileName !== undefined) updateData.fileName = String(fileName).trim();
  if (mimeType !== undefined) updateData.mimeType = String(mimeType).trim();
  if (tags !== undefined) updateData.tags = parseStringArray(tags);

  if (fileSize !== undefined) {
    const normalizedFileSize = Number(fileSize);
    if (Number.isNaN(normalizedFileSize) || normalizedFileSize < 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'fileSize must be a non-negative number' },
      });
    }
    updateData.fileSize = normalizedFileSize;
  }

  if (isPublic !== undefined) {
    updateData.isPublic = parseBoolean(isPublic);
  }

  if (expiryDate !== undefined) {
    if (expiryDate === null || expiryDate === '') {
      updateData.expiryDate = null;
    } else {
      const parsedExpiryDate = parseDate(expiryDate);
      if (!parsedExpiryDate) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid expiryDate' },
        });
      }
      updateData.expiryDate = parsedExpiryDate;
    }
  }

  const updatedDocument = await prisma.document.update({
    where: { id: documentId },
    data: updateData,
    include: {
      createdBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  res.status(200).json({
    success: true,
    data: updatedDocument,
    message: 'Document updated successfully',
  });
});

const deleteDocument = asyncHandler(async (req, res) => {
  const { propertyId, documentId } = req.params;

  const property = await verifyPropertyAccess(propertyId, req.user.id);
  if (!property) {
    return res.status(404).json({
      success: false,
      error: { message: 'Property not found' },
    });
  }

  const existingDocument = await prisma.document.findFirst({
    where: {
      id: documentId,
      propertyId,
    },
    select: { id: true },
  });

  if (!existingDocument) {
    return res.status(404).json({
      success: false,
      error: { message: 'Document not found' },
    });
  }

  await prisma.document.delete({
    where: { id: documentId },
  });

  res.status(200).json({
    success: true,
    message: 'Document deleted successfully',
  });
});

const getNotices = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  const { page = 1, limit = 20, noticeType, priority, audienceType, isPublished, search } = req.query;

  const property = await verifyPropertyAccess(propertyId, req.user.id);
  if (!property) {
    return res.status(404).json({
      success: false,
      error: { message: 'Property not found' },
    });
  }

  const where = { propertyId };

  if (noticeType) {
    const normalizedType = String(noticeType).toUpperCase();
    if (!NOTICE_TYPES.has(normalizedType)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid notice type' },
      });
    }
    where.noticeType = normalizedType;
  }

  if (priority) {
    const normalizedPriority = String(priority).toUpperCase();
    if (!PRIORITIES.has(normalizedPriority)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid priority' },
      });
    }
    where.priority = normalizedPriority;
  }

  if (audienceType) {
    const normalizedAudience = normalizeAudienceType(audienceType);
    if (!NOTICE_AUDIENCES.has(normalizedAudience)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid audience type' },
      });
    }
    where.audienceType = normalizedAudience;
  }

  const parsedIsPublished = parseBoolean(isPublished);
  if (parsedIsPublished !== undefined) {
    where.isPublished = parsedIsPublished;
  }

  if (search) {
    where.OR = [
      { title: { contains: String(search), mode: 'insensitive' } },
      { content: { contains: String(search), mode: 'insensitive' } },
    ];
  }

  const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const skip = (pageNumber - 1) * pageSize;

  const [notices, totalCount] = await Promise.all([
    prisma.notice.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
        targetTenants: {
          select: {
            id: true,
            tenantId: true,
            fullName: true,
          },
        },
        _count: {
          select: {
            targetTenants: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
      skip,
      take: pageSize,
    }),
    prisma.notice.count({ where }),
  ]);

  const noticesWithStats = await attachNoticeAudienceSummary(notices);

  res.status(200).json({
    success: true,
    data: {
      notices: noticesWithStats,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total: totalCount,
        pages: Math.ceil(totalCount / pageSize) || 1,
      },
    },
  });
});

const createNotice = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  const {
    title,
    content,
    noticeType = 'GENERAL',
    audienceType = 'PROPERTY',
    priority = 'MEDIUM',
    isPublished = false,
    publishDate,
    expiryDate,
    targetTenantIds = [],
    targetFloorIds = [],
    targetRoomIds = [],
  } = req.body;

  if (!title || !content) {
    return res.status(400).json({
      success: false,
      error: { message: 'Required fields: title, content' },
    });
  }

  const normalizedType = String(noticeType).toUpperCase();
  const normalizedPriority = String(priority).toUpperCase();

  if (!NOTICE_TYPES.has(normalizedType)) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid notice type' },
    });
  }

  if (!PRIORITIES.has(normalizedPriority)) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid priority' },
    });
  }

  const property = await verifyPropertyAccess(propertyId, req.user.id);
  if (!property) {
    return res.status(404).json({
      success: false,
      error: { message: 'Property not found' },
    });
  }

  const parsedPublishDate = parseDate(publishDate);
  const parsedExpiryDate = parseDate(expiryDate);

  if (publishDate && !parsedPublishDate) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid publishDate' },
    });
  }

  if (expiryDate && !parsedExpiryDate) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid expiryDate' },
    });
  }

  const resolvedAudience = await resolveNoticeAudience({
    propertyId,
    audienceType,
    targetTenantIds,
    targetFloorIds,
    targetRoomIds,
  });

  if (resolvedAudience.error) {
    return res.status(400).json({
      success: false,
      error: { message: resolvedAudience.error },
    });
  }

  if ((parseBoolean(isPublished) ?? false) && resolvedAudience.targetTenantIds.length === 0) {
    return res.status(400).json({
      success: false,
      error: { message: 'No active tenants matched this audience. Adjust the audience or save it as a draft.' },
    });
  }

  const notice = await prisma.notice.create({
    data: {
      title: String(title).trim(),
      content: String(content).trim(),
      noticeType: normalizedType,
      audienceType: resolvedAudience.audienceType,
      priority: normalizedPriority,
      isPublished: parseBoolean(isPublished) ?? false,
      publishDate: parsedPublishDate || (parseBoolean(isPublished) ? new Date() : null),
      expiryDate: parsedExpiryDate,
      targetFloorIds: resolvedAudience.targetFloorIds,
      targetRoomIds: resolvedAudience.targetRoomIds,
      propertyId,
      createdById: req.user.id,
      targetTenants:
        resolvedAudience.targetTenantIds.length > 0
          ? {
              connect: resolvedAudience.targetTenantIds.map((id) => ({ id })),
            }
          : undefined,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          fullName: true,
        },
      },
      targetTenants: {
        select: {
          id: true,
          tenantId: true,
          fullName: true,
        },
      },
    },
  });

  webSocketService.broadcastActivity(propertyId, {
    type: 'notice_created',
    message: `${notice.title} was ${notice.isPublished ? 'published' : 'saved as draft'}.`,
    data: {
      noticeId: notice.id,
      audienceType: notice.audienceType,
      targetCount: notice.targetTenants.length,
    },
  });

  await appNotificationService.notifyPropertyOwner(propertyId, {
    title: 'Notice published',
    message: `${notice.title} was ${notice.isPublished ? 'published' : 'saved'} for ${property.name}.`,
    type: normalizedPriority === 'URGENT' ? 'WARNING' : 'INFO',
    category: 'NOTICE',
    actionUrl: '/notices',
    entityType: 'notice',
    entityId: notice.id,
    metadata: {
      noticeType: notice.noticeType,
      priority: notice.priority,
      audienceType: notice.audienceType,
      targetCount: notice.targetTenants.length,
    },
  });

  res.status(201).json({
    success: true,
    data: notice,
    message: 'Notice created successfully',
  });
});

const updateNotice = asyncHandler(async (req, res) => {
  const { propertyId, noticeId } = req.params;

  const property = await verifyPropertyAccess(propertyId, req.user.id);
  if (!property) {
    return res.status(404).json({
      success: false,
      error: { message: 'Property not found' },
    });
  }

  const existingNotice = await prisma.notice.findFirst({
    where: {
      id: noticeId,
      propertyId,
    },
    select: {
      id: true,
      title: true,
      audienceType: true,
      targetFloorIds: true,
      targetRoomIds: true,
      isPublished: true,
      targetTenants: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!existingNotice) {
    return res.status(404).json({
      success: false,
      error: { message: 'Notice not found' },
    });
  }

  const {
    title,
    content,
    noticeType,
    audienceType,
    priority,
    isPublished,
    publishDate,
    expiryDate,
    targetTenantIds,
    targetFloorIds,
    targetRoomIds,
  } = req.body;

  const updateData = {};

  if (title !== undefined) updateData.title = String(title).trim();
  if (content !== undefined) updateData.content = String(content).trim();

  if (noticeType !== undefined) {
    const normalizedType = String(noticeType).toUpperCase();
    if (!NOTICE_TYPES.has(normalizedType)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid notice type' },
      });
    }
    updateData.noticeType = normalizedType;
  }

  if (priority !== undefined) {
    const normalizedPriority = String(priority).toUpperCase();
    if (!PRIORITIES.has(normalizedPriority)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid priority' },
      });
    }
    updateData.priority = normalizedPriority;
  }

  if (isPublished !== undefined) {
    updateData.isPublished = parseBoolean(isPublished);
    if (updateData.isPublished && publishDate === undefined) {
      updateData.publishDate = new Date();
    }
  }

  if (publishDate !== undefined) {
    if (publishDate === null || publishDate === '') {
      updateData.publishDate = null;
    } else {
      const parsedPublishDate = parseDate(publishDate);
      if (!parsedPublishDate) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid publishDate' },
        });
      }
      updateData.publishDate = parsedPublishDate;
    }
  }

  if (expiryDate !== undefined) {
    if (expiryDate === null || expiryDate === '') {
      updateData.expiryDate = null;
    } else {
      const parsedExpiryDate = parseDate(expiryDate);
      if (!parsedExpiryDate) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid expiryDate' },
        });
      }
      updateData.expiryDate = parsedExpiryDate;
    }
  }

  const audienceWasTouched =
    audienceType !== undefined ||
    targetTenantIds !== undefined ||
    targetFloorIds !== undefined ||
    targetRoomIds !== undefined ||
    isPublished !== undefined;

  if (audienceWasTouched) {
    const resolvedAudience = await resolveNoticeAudience({
      propertyId,
      audienceType: audienceType ?? existingNotice.audienceType,
      targetTenantIds:
        targetTenantIds !== undefined
          ? targetTenantIds
          : existingNotice.targetTenants.map((tenant) => tenant.id),
      targetFloorIds: targetFloorIds !== undefined ? targetFloorIds : existingNotice.targetFloorIds,
      targetRoomIds: targetRoomIds !== undefined ? targetRoomIds : existingNotice.targetRoomIds,
    });

    if (resolvedAudience.error) {
      return res.status(400).json({
        success: false,
        error: { message: resolvedAudience.error },
      });
    }

    const nextPublishedState =
      updateData.isPublished !== undefined ? updateData.isPublished : existingNotice.isPublished;

    if (nextPublishedState && resolvedAudience.targetTenantIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'No active tenants matched this audience. Adjust the audience or save it as a draft.' },
      });
    }

    updateData.audienceType = resolvedAudience.audienceType;
    updateData.targetFloorIds = resolvedAudience.targetFloorIds;
    updateData.targetRoomIds = resolvedAudience.targetRoomIds;
    updateData.targetTenants = {
      set: resolvedAudience.targetTenantIds.map((id) => ({ id })),
    };
  }

  const updatedNotice = await prisma.notice.update({
    where: { id: noticeId },
    data: updateData,
    include: {
      createdBy: {
        select: {
          id: true,
          fullName: true,
        },
      },
      targetTenants: {
        select: {
          id: true,
          tenantId: true,
          fullName: true,
        },
      },
    },
  });

  webSocketService.broadcastActivity(propertyId, {
    type: 'notice_updated',
    message: `${updatedNotice.title} was updated.`,
    data: {
      noticeId: updatedNotice.id,
      audienceType: updatedNotice.audienceType,
      targetCount: updatedNotice.targetTenants.length,
    },
  });

  res.status(200).json({
    success: true,
    data: updatedNotice,
    message: 'Notice updated successfully',
  });
});

const deleteNotice = asyncHandler(async (req, res) => {
  const { propertyId, noticeId } = req.params;

  const property = await verifyPropertyAccess(propertyId, req.user.id);
  if (!property) {
    return res.status(404).json({
      success: false,
      error: { message: 'Property not found' },
    });
  }

  const existingNotice = await prisma.notice.findFirst({
    where: {
      id: noticeId,
      propertyId,
    },
    select: {
      id: true,
      title: true,
    },
  });

  if (!existingNotice) {
    return res.status(404).json({
      success: false,
      error: { message: 'Notice not found' },
    });
  }

  await prisma.notice.delete({
    where: { id: noticeId },
  });

  webSocketService.broadcastActivity(propertyId, {
    type: 'notice_deleted',
    message: `${existingNotice.title} was removed.`,
    data: {
      noticeId,
    },
  });

  res.status(200).json({
    success: true,
    message: 'Notice deleted successfully',
  });
});

const markNoticeAsRead = asyncHandler(async (req, res) => {
  const { propertyId, noticeId } = req.params;
  const { tenantId } = req.body;

  if (!tenantId) {
    return res.status(400).json({
      success: false,
      error: { message: 'tenantId is required' },
    });
  }

  const notice = await prisma.notice.findFirst({
    where: {
      id: noticeId,
      propertyId,
      isPublished: true,
    },
    select: {
      id: true,
      readBy: true,
      audienceType: true,
      targetTenants: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!notice) {
    return res.status(404).json({
      success: false,
      error: { message: 'Notice not found or not accessible' },
    });
  }

  const canRead =
    notice.targetTenants.length === 0
      ? notice.audienceType === 'PROPERTY'
      : notice.targetTenants.some((tenant) => tenant.id === tenantId);

  if (!canRead) {
    return res.status(404).json({
      success: false,
      error: { message: 'Notice not found or not accessible' },
    });
  }

  if (!notice.readBy.includes(tenantId)) {
    await prisma.notice.update({
      where: { id: noticeId },
      data: {
        readBy: {
          push: tenantId,
        },
      },
    });
  }

  res.status(200).json({
    success: true,
    message: 'Notice marked as read',
  });
});

module.exports = {
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice,
  markNoticeAsRead,
};
