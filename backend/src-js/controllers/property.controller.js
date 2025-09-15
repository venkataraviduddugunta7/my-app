const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middleware/error.middleware');
const webSocketService = require('../services/websocket.service');

const prisma = new PrismaClient();

// GET /api/properties - Get all properties for authenticated user
const getProperties = asyncHandler(async (req, res) => {
  console.log('🔧 GET PROPERTIES REQUEST:', {
    user: req.user ? { id: req.user.id, email: req.user.email } : 'NO USER'
  });

  // Check if user is authenticated
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required' }
    });
  }

  const properties = await prisma.property.findMany({
    where: {
      ownerId: req.user.id
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
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  console.log('✅ Properties fetched successfully:', properties.length);

  res.status(200).json({
    success: true,
    data: properties,
    count: properties.length
  });
});

// GET /api/properties/:id - Get property by ID
const getProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if user is authenticated
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required' }
    });
  }

  const property = await prisma.property.findFirst({
    where: {
      id,
      ownerId: req.user.id
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
      }
    }
  });

  if (!property) {
    return res.status(404).json({
      success: false,
      error: { message: 'Property not found or access denied' }
    });
  }

  res.status(200).json({
    success: true,
    data: property
  });
});

// POST /api/properties - Create new property
const createProperty = asyncHandler(async (req, res) => {
  console.log('🔧 CREATE PROPERTY REQUEST:', {
    body: req.body,
    user: req.user ? { id: req.user.id, email: req.user.email } : 'NO USER'
  });

  const { 
    name, address, city, state, pincode, description,
    type, phone, email, website, amenities,
    monthlyRent, securityDeposit,
    totalFloors, totalRooms, totalBeds
  } = req.body;
  
  // Check if user is authenticated
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required - please login first' }
    });
  }
  
  const userId = req.user.id;

  // Validation
  if (!name || !address || !city || !state || !pincode) {
    return res.status(400).json({
      success: false,
      error: { message: 'Name, address, city, state, and pincode are required' }
    });
  }

  try {
    const property = await prisma.property.create({
      data: {
        name,
        address,
        city,
        state,
        pincode,
        description,
        type: type ?? 'Co-ed',
        phone,
        email,
        website,
        amenities: Array.isArray(amenities) ? amenities : [],
        monthlyRent: monthlyRent !== undefined ? Number(monthlyRent) : undefined,
        securityDeposit: securityDeposit !== undefined ? Number(securityDeposit) : undefined,
        totalFloors: totalFloors !== undefined ? Number(totalFloors) : undefined,
        totalRooms: totalRooms !== undefined ? Number(totalRooms) : undefined,
        totalBeds: totalBeds !== undefined ? Number(totalBeds) : undefined,
        ownerId: userId
      }
    });

    console.log('✅ Property created successfully:', property.id);

    // Broadcast property creation to all connected clients
    webSocketService.broadcastToAll('property-update', {
      type: 'create',
      data: property
    });

    res.status(201).json({
      success: true,
      data: property,
      message: 'Property created successfully'
    });
  } catch (error) {
    console.error('❌ Database error creating property:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create property due to database error' }
    });
  }
});

// PUT /api/properties/:id - Update property
const updateProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { 
    name, address, city, state, pincode, description,
    type, phone, email, website, amenities,
    monthlyRent, securityDeposit,
    totalFloors, totalRooms, totalBeds
  } = req.body;

  // Check if user is authenticated
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required' }
    });
  }

  // Check if property exists and belongs to user
  const existingProperty = await prisma.property.findFirst({
    where: { 
      id,
      ownerId: req.user.id
    }
  });

  if (!existingProperty) {
    return res.status(404).json({
      success: false,
      error: { message: 'Property not found or access denied' }
    });
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (address !== undefined) updateData.address = address;
  if (city !== undefined) updateData.city = city;
  if (state !== undefined) updateData.state = state;
  if (pincode !== undefined) updateData.pincode = pincode;
  if (description !== undefined) updateData.description = description;
  if (type !== undefined) updateData.type = type;
  if (phone !== undefined) updateData.phone = phone;
  if (email !== undefined) updateData.email = email;
  if (website !== undefined) updateData.website = website;
  if (amenities !== undefined) updateData.amenities = Array.isArray(amenities) ? amenities : [];
  if (monthlyRent !== undefined) updateData.monthlyRent = Number(monthlyRent);
  if (securityDeposit !== undefined) updateData.securityDeposit = Number(securityDeposit);
  if (totalFloors !== undefined) updateData.totalFloors = Number(totalFloors);
  if (totalRooms !== undefined) updateData.totalRooms = Number(totalRooms);
  if (totalBeds !== undefined) updateData.totalBeds = Number(totalBeds);

  const property = await prisma.property.update({
    where: { id },
    data: updateData
  });

  // Broadcast property update to all connected clients
  webSocketService.broadcastToAll('property-update', {
    type: 'update',
    data: property
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

  // Check if user is authenticated
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required' }
    });
  }

  // Check if property exists and belongs to user
  const existingProperty = await prisma.property.findFirst({
    where: { 
      id,
      ownerId: req.user.id
    },
    include: {
      floors: {
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
      }
    }
  });

  if (!existingProperty) {
    return res.status(404).json({
      success: false,
      error: { message: 'Property not found or access denied' }
    });
  }

  // Check for active tenants
  const activeTenantsCount = existingProperty.floors.reduce((count, floor) => {
    return count + floor.rooms.reduce((roomCount, room) => {
      return roomCount + room.beds.filter(bed => bed.tenant && bed.tenant.status === 'ACTIVE').length;
    }, 0);
  }, 0);

  if (activeTenantsCount > 0) {
    return res.status(400).json({
      success: false,
      error: { 
        message: `Cannot delete property with ${activeTenantsCount} active tenant${activeTenantsCount > 1 ? 's' : ''}. Please relocate or vacate all tenants first.` 
      }
    });
  }

  // Store property data before deletion for broadcasting
  const propertyToDelete = existingProperty;

  // Delete property (cascade will handle floors, rooms, and beds)
  await prisma.property.delete({
    where: { id }
  });

  // Broadcast property deletion to all connected clients
  webSocketService.broadcastToAll('property-update', {
    type: 'delete',
    data: propertyToDelete
  });

  res.status(200).json({
    success: true,
    message: 'Property deleted successfully'
  });
});

module.exports = {
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty
}; 