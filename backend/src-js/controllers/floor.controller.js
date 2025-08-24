const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middleware/error.middleware');

// We'll get prisma instance from the main app
const prisma = new PrismaClient();

// GET /api/floors - Get all floors for a property
const getFloors = asyncHandler(async (req, res) => {
  const { propertyId } = req.query;
  
  console.log('🔧 GET FLOORS REQUEST:', {
    propertyId,
    user: req.user ? { id: req.user.id, email: req.user.email } : 'NO USER'
  });
  
  if (!propertyId) {
    return res.status(400).json({
      success: false,
      error: { message: 'Property ID is required' }
    });
  }

  // Check if user is authenticated
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required' }
    });
  }

  // Verify property belongs to user
  const property = await prisma.property.findFirst({
    where: { 
      id: propertyId,
      ownerId: req.user.id
    }
  });

  if (!property) {
    return res.status(404).json({
      success: false,
      error: { message: 'Property not found or access denied' }
    });
  }

  const floors = await prisma.floor.findMany({
    where: {
      propertyId: propertyId
    },
    include: {
      rooms: {
        include: {
          beds: true
        }
      }
    },
    orderBy: {
      floorNumber: 'asc'
    }
  });

  console.log('✅ Floors fetched successfully:', floors.length);

  res.status(200).json({
    success: true,
    data: floors,
    count: floors.length
  });
});

// GET /api/floors/:id - Get floor by ID
const getFloor = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const floor = await prisma.floor.findUnique({
    where: { id },
    include: {
      rooms: {
        include: {
          beds: true
        }
      }
    }
  });

  if (!floor) {
    return res.status(404).json({
      success: false,
      error: { message: 'Floor not found' }
    });
  }

  res.status(200).json({
    success: true,
    data: floor
  });
});

// POST /api/floors - Create new floor
const createFloor = asyncHandler(async (req, res) => {
  console.log('🔧 CREATE FLOOR REQUEST:', {
    body: req.body,
    user: req.user ? { id: req.user.id, email: req.user.email } : 'NO USER',
    headers: req.headers.authorization ? 'TOKEN PROVIDED' : 'NO TOKEN'
  });

  // Handle both 'name' and 'floorName' fields for backward compatibility
  const { name, floorName, floorNumber, description, propertyId } = req.body;
  const finalFloorName = name || floorName;
  
  // Check if user is authenticated
  if (!req.user || !req.user.id) {
    console.log('❌ Authentication failed - no user object');
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required - please login first' }
    });
  }
  
  const userId = req.user.id;

  // Validation
  if (!finalFloorName || floorNumber === undefined || !propertyId) {
    console.log('❌ Validation failed:', { finalFloorName, floorNumber, propertyId });
    return res.status(400).json({
      success: false,
      error: { message: 'Floor name, floor number, and property ID are required' }
    });
  }

  // Check if property exists and belongs to user
  const property = await prisma.property.findFirst({
    where: { 
      id: propertyId,
      ownerId: userId
    }
  });

  if (!property) {
    console.log('❌ Property not found or access denied:', { propertyId, userId });
    return res.status(404).json({
      success: false,
      error: { message: 'Property not found or access denied' }
    });
  }

  // Check if floor number already exists for this property
  const existingFloor = await prisma.floor.findFirst({
    where: {
      propertyId,
      floorNumber: parseInt(floorNumber)
    }
  });

  if (existingFloor) {
    console.log('❌ Floor number already exists:', { propertyId, floorNumber });
    return res.status(409).json({
      success: false,
      error: { message: `Floor number ${floorNumber} already exists for this property` }
    });
  }

  try {
    const floor = await prisma.floor.create({
      data: {
        name: finalFloorName,
        floorNumber: parseInt(floorNumber),
        description,
        propertyId
      },
      include: {
        rooms: true
      }
    });

    console.log('✅ Floor created successfully:', floor.id);

    res.status(201).json({
      success: true,
      data: floor,
      message: 'Floor created successfully'
    });
  } catch (error) {
    console.error('❌ Database error creating floor:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create floor due to database error' }
    });
  }
});

// PUT /api/floors/:id - Update floor
const updateFloor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, floorName, floorNumber, description } = req.body;
  const finalFloorName = name || floorName;

  // Check if user is authenticated
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required' }
    });
  }

  // Check if floor exists and belongs to user's property
  const existingFloor = await prisma.floor.findFirst({
    where: { 
      id,
      property: {
        ownerId: req.user.id
      }
    },
    include: {
      property: true
    }
  });

  if (!existingFloor) {
    return res.status(404).json({
      success: false,
      error: { message: 'Floor not found or access denied' }
    });
  }

  // Check for duplicate floor number if it's being changed
  if (floorNumber !== undefined && floorNumber !== existingFloor.floorNumber) {
    const duplicateFloor = await prisma.floor.findFirst({
      where: {
        propertyId: existingFloor.propertyId,
        floorNumber: parseInt(floorNumber),
        id: { not: id }
      }
    });

    if (duplicateFloor) {
      return res.status(409).json({
        success: false,
        error: { message: `Floor number ${floorNumber} already exists for this property` }
      });
    }
  }

  const updateData = {};
  if (finalFloorName !== undefined) updateData.name = finalFloorName;
  if (floorNumber !== undefined) updateData.floorNumber = parseInt(floorNumber);
  if (description !== undefined) updateData.description = description;

  const floor = await prisma.floor.update({
    where: { id },
    data: updateData,
    include: {
      rooms: true
    }
  });

  res.status(200).json({
    success: true,
    data: floor,
    message: 'Floor updated successfully'
  });
});

// DELETE /api/floors/:id - Delete floor
const deleteFloor = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if user is authenticated
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required' }
    });
  }

  // Check if floor exists and belongs to user's property
  const existingFloor = await prisma.floor.findFirst({
    where: { 
      id,
      property: {
        ownerId: req.user.id
      }
    },
    include: {
      rooms: {
        include: {
          beds: {
            include: {
              tenant: true
            }
          }
        }
      }
    }
  });

  if (!existingFloor) {
    return res.status(404).json({
      success: false,
      error: { message: 'Floor not found or access denied' }
    });
  }

  // Check for active tenants
  const activeTenantsCount = existingFloor.rooms.reduce((count, room) => {
    return count + room.beds.filter(bed => bed.tenant && bed.tenant.status === 'ACTIVE').length;
  }, 0);

  if (activeTenantsCount > 0) {
    return res.status(400).json({
      success: false,
      error: { 
        message: `Cannot delete floor with ${activeTenantsCount} active tenant${activeTenantsCount > 1 ? 's' : ''}. Please relocate or vacate tenants first.` 
      }
    });
  }

  // Delete floor (cascade will handle rooms and beds)
  await prisma.floor.delete({
    where: { id }
  });

  res.status(200).json({
    success: true,
    message: 'Floor deleted successfully'
  });
});

module.exports = {
  getFloors,
  getFloor,
  createFloor,
  updateFloor,
  deleteFloor
}; 