const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middleware/error.middleware');

const prisma = new PrismaClient();

// GET /api/properties - Get all properties for authenticated user
const getProperties = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const properties = await prisma.property.findMany({
    where: {
      ownerId: userId
    },
    include: {
      floors: {
        include: {
          rooms: {
            include: {
              beds: true
            }
          }
        }
      },
      _count: {
        select: {
          floors: true,
          tenants: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  res.status(200).json({
    success: true,
    data: properties,
    count: properties.length
  });
});

// GET /api/properties/:id - Get property by ID
const getProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const property = await prisma.property.findFirst({
    where: {
      id,
      ownerId: userId
    },
    include: {
      floors: {
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
            }
          }
        },
        orderBy: {
          floorNumber: 'asc'
        }
      },
      tenants: {
        select: {
          id: true,
          tenantId: true,
          fullName: true,
          status: true
        }
      },
      settings: true
    }
  });

  if (!property) {
    return res.status(404).json({
      success: false,
      error: { message: 'Property not found' }
    });
  }

  res.status(200).json({
    success: true,
    data: property
  });
});

// POST /api/properties - Create new property
const createProperty = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    name,
    address,
    city,
    state,
    pincode,
    description
  } = req.body;

  // Validation
  if (!name || !address || !city || !state || !pincode) {
    return res.status(400).json({
      success: false,
      error: { message: 'Name, address, city, state, and pincode are required' }
    });
  }

  const property = await prisma.property.create({
    data: {
      name,
      address,
      city,
      state,
      pincode,
      description,
      ownerId: userId
    },
    include: {
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
    data: property,
    message: 'Property created successfully'
  });
});

// PUT /api/properties/:id - Update property
const updateProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const {
    name,
    address,
    city,
    state,
    pincode,
    description
  } = req.body;

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
      error: { message: 'Property not found' }
    });
  }

  const property = await prisma.property.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(address && { address }),
      ...(city && { city }),
      ...(state && { state }),
      ...(pincode && { pincode }),
      ...(description !== undefined && { description })
    },
    include: {
      _count: {
        select: {
          floors: true,
          tenants: true
        }
      }
    }
  });

  res.status(200).json({
    success: true,
    data: property,
    message: 'Property updated successfully'
  });
});

// DELETE /api/properties/:id - Delete property
const deleteProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Check if property exists and belongs to user
  const property = await prisma.property.findFirst({
    where: {
      id,
      ownerId: userId
    },
    include: {
      floors: {
        include: {
          rooms: {
            include: {
              beds: true
            }
          }
        }
      },
      tenants: true
    }
  });

  if (!property) {
    return res.status(404).json({
      success: false,
      error: { message: 'Property not found' }
    });
  }

  // Check if property has active tenants
  const activeTenants = property.tenants.filter(tenant => tenant.status === 'ACTIVE');
  if (activeTenants.length > 0) {
    return res.status(400).json({
      success: false,
      error: { message: `Cannot delete property with ${activeTenants.length} active tenants. Please terminate all tenants first.` }
    });
  }

  // Delete property (cascade will handle floors, rooms, beds)
  await prisma.property.delete({
    where: { id }
  });

  res.status(200).json({
    success: true,
    message: 'Property deleted successfully'
  });
});

// GET /api/properties/:id/stats - Get property statistics
const getPropertyStats = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Check if property belongs to user
  const property = await prisma.property.findFirst({
    where: {
      id,
      ownerId: userId
    }
  });

  if (!property) {
    return res.status(404).json({
      success: false,
      error: { message: 'Property not found' }
    });
  }

  // Get comprehensive statistics
  const [
    totalFloors,
    totalRooms,
    totalBeds,
    occupiedBeds,
    activeTenants,
    monthlyRevenue
  ] = await Promise.all([
    prisma.floor.count({
      where: { propertyId: id }
    }),
    prisma.room.count({
      where: { floor: { propertyId: id } }
    }),
    prisma.bed.count({
      where: { room: { floor: { propertyId: id } } }
    }),
    prisma.bed.count({
      where: { 
        room: { floor: { propertyId: id } },
        status: 'OCCUPIED'
      }
    }),
    prisma.tenant.count({
      where: { 
        propertyId: id,
        status: 'ACTIVE'
      }
    }),
    prisma.payment.aggregate({
      where: {
        propertyId: id,
        status: 'PAID',
        month: new Date().toISOString().slice(0, 7) // Current month
      },
      _sum: {
        amount: true
      }
    })
  ]);

  const occupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : 0;

  res.status(200).json({
    success: true,
    data: {
      totalFloors,
      totalRooms,
      totalBeds,
      occupiedBeds,
      availableBeds: totalBeds - occupiedBeds,
      occupancyRate: parseFloat(occupancyRate),
      activeTenants,
      monthlyRevenue: monthlyRevenue._sum.amount || 0
    }
  });
});

module.exports = {
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  getPropertyStats
}; 