const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middleware/error.middleware');

// We'll get prisma instance from the main app
const prisma = new PrismaClient();

// GET /api/floors - Get all floors for a property
const getFloors = asyncHandler(async (req, res) => {
  const { propertyId } = req.query;
  
  if (!propertyId) {
    return res.status(400).json({
      success: false,
      error: { message: 'Property ID is required' }
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

  const { floorName, floorNumber, description, propertyId } = req.body;
  
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
  if (!floorName || floorNumber === undefined || !propertyId) {
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
    return res.status(409).json({
      success: false,
      error: { message: 'Floor number already exists for this property' }
    });
  }

  const floor = await prisma.floor.create({
    data: {
      name: floorName,
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
});

// PUT /api/floors/:id - Update floor
const updateFloor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { floorName, floorNumber, description } = req.body;

  // Check if floor exists
  const existingFloor = await prisma.floor.findUnique({
    where: { id }
  });

  if (!existingFloor) {
    return res.status(404).json({
      success: false,
      error: { message: 'Floor not found' }
    });
  }

  // If updating floor number, check for conflicts
  if (floorNumber !== undefined && floorNumber !== existingFloor.floorNumber) {
    const conflictingFloor = await prisma.floor.findFirst({
      where: {
        propertyId: existingFloor.propertyId,
        floorNumber: parseInt(floorNumber),
        id: { not: id }
      }
    });

    if (conflictingFloor) {
      return res.status(409).json({
        success: false,
        error: { message: 'Floor number already exists for this property' }
      });
    }
  }

  const updatedFloor = await prisma.floor.update({
    where: { id },
    data: {
      ...(floorName && { floorName }),
      ...(floorNumber !== undefined && { floorNumber: parseInt(floorNumber) }),
      ...(description !== undefined && { description })
    },
    include: {
      rooms: true
    }
  });

  res.status(200).json({
    success: true,
    data: updatedFloor,
    message: 'Floor updated successfully'
  });
});

// DELETE /api/floors/:id - Delete floor
const deleteFloor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { forceDelete = false } = req.body;

  // Check if floor exists
  const floor = await prisma.floor.findUnique({
    where: { id },
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
                  phone: true,
                  status: true
                }
              }
            }
          }
        }
      },
      property: {
        select: {
          id: true,
          name: true
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

  // Check for occupied beds across all rooms
  const allBeds = floor.rooms.flatMap(room => room.beds);
  const occupiedBeds = allBeds.filter(bed => bed.tenant);
  const totalTenants = occupiedBeds.length;

  // If floor has rooms with tenants and not force delete
  if (floor.rooms.length > 0 && !forceDelete) {
    // Find available beds in other floors of the same property
    const availableBeds = await prisma.bed.findMany({
      where: {
        room: {
          floor: {
            propertyId: floor.propertyId,
            id: { not: id } // Exclude floors being deleted
          }
        },
        tenantId: null,
        status: 'AVAILABLE'
      },
      include: {
        room: {
          include: {
            floor: {
              select: {
                id: true,
                name: true,
                floorNumber: true
              }
            }
          }
        }
      },
      orderBy: [
        { room: { floor: { floorNumber: 'asc' } } },
        { room: { roomNumber: 'asc' } },
        { bedNumber: 'asc' }
      ]
    });

    // Prepare detailed information about affected tenants
    const affectedTenants = occupiedBeds.map(bed => {
      const room = floor.rooms.find(r => r.beds.some(b => b.id === bed.id));
      return {
        tenantId: bed.tenant.tenantId,
        tenantName: bed.tenant.fullName,
        phone: bed.tenant.phone,
        currentLocation: {
          floor: floor.name,
          room: room.roomNumber,
          bed: bed.bedNumber,
          bedType: bed.bedType,
          rent: bed.rent
        }
      };
    });

    return res.status(400).json({
      success: false,
      error: { 
        message: totalTenants > 0 
          ? `Cannot delete floor with ${totalTenants} tenants in ${floor.rooms.length} rooms. Please relocate all tenants first.`
          : `Cannot delete floor with ${floor.rooms.length} rooms. Please remove all rooms first.`
      },
      floorInfo: {
        id: floor.id,
        name: floor.name,
        floorNumber: floor.floorNumber,
        totalRooms: floor.rooms.length,
        totalBeds: allBeds.length,
        occupiedBeds: occupiedBeds.length,
        totalTenants
      },
      affectedTenants,
      relocationOptions: {
        availableBeds: availableBeds.length,
        canRelocateAll: availableBeds.length >= totalTenants,
        availableBedsDetails: availableBeds.map(bed => ({
          id: bed.id,
          location: `${bed.room.floor.name} - Room ${bed.room.roomNumber} - Bed ${bed.bedNumber}`,
          bedType: bed.bedType,
          rent: bed.rent,
          floor: bed.room.floor.name,
          room: bed.room.roomNumber,
          bedNumber: bed.bedNumber
        }))
      },
      requiresAction: totalTenants > 0 ? 'RELOCATE_ALL_TENANTS' : 'REMOVE_ALL_ROOMS',
      recommendations: {
        message: totalTenants > 0 
          ? (availableBeds.length >= totalTenants 
            ? `✅ ${availableBeds.length} available beds found across other floors - relocation possible`
            : `⚠️ Only ${availableBeds.length} available beds found for ${totalTenants} tenants - need ${totalTenants - availableBeds.length} more beds`)
          : `Remove all ${floor.rooms.length} rooms first before deleting the floor`,
        priority: totalTenants > 0 ? 'HIGH' : 'MEDIUM',
        actions: totalTenants > 0 ? [
          {
            type: 'BULK_RELOCATE',
            description: 'Relocate all tenants to available beds in other floors',
            endpoint: 'POST /api/floors/:id/relocate-tenants',
            note: 'Automated relocation to best available beds'
          },
          {
            type: 'MANUAL_RELOCATE',
            description: 'Manually relocate each tenant',
            endpoint: 'PUT /api/tenants/:tenantId/assign-bed',
            note: 'Relocate tenants one by one to preferred beds'
          },
          {
            type: 'FORCE_DELETE',
            description: 'Delete floor and make all tenants unassigned (EXTREME CAUTION)',
            endpoint: `DELETE /api/floors/${id}`,
            payload: { forceDelete: true },
            warning: `This will displace ${totalTenants} tenants - use only in emergency`
          }
        ] : [
          {
            type: 'REMOVE_ROOMS',
            description: 'Remove all rooms first',
            note: `Delete ${floor.rooms.length} rooms individually, then delete floor`
          }
        ]
      }
    });
  }

  // Handle force delete scenario
  if (forceDelete && totalTenants > 0) {
    console.log(`🚨 FORCE DELETE FLOOR: ${floor.name} with ${totalTenants} tenants across ${floor.rooms.length} rooms`);
    
    // Mark all affected tenants as pending reassignment
    for (const bed of occupiedBeds) {
      await prisma.tenant.update({
        where: { id: bed.tenant.id },
        data: {
          status: 'PENDING' // Mark as pending reassignment
        }
      });
      
      console.log(`⚠️ Tenant ${bed.tenant.tenantId} (${bed.tenant.fullName}) displaced from floor deletion`);
    }
  }

  // Delete floor (cascade will handle rooms and beds)
  await prisma.floor.delete({
    where: { id }
  });

  // Update property counts
  await prisma.property.update({
    where: { id: floor.propertyId },
    data: {
      totalFloors: { decrement: 1 },
      totalRooms: { decrement: floor.rooms.length },
      totalBeds: { decrement: allBeds.length }
    }
  });

  const responseMessage = totalTenants > 0 && forceDelete
    ? `Floor deleted successfully. ${totalTenants} tenants across ${floor.rooms.length} rooms marked as unassigned.`
    : `Floor deleted successfully. ${floor.rooms.length} rooms and ${allBeds.length} beds removed.`;

  res.status(200).json({
    success: true,
    message: responseMessage,
    deletedFloor: {
      id: floor.id,
      name: floor.name,
      floorNumber: floor.floorNumber,
      totalRooms: floor.rooms.length,
      totalBeds: allBeds.length,
      affectedTenants: totalTenants
    }
  });
});

// GET /api/floors/:id/rooms - Get all rooms for a specific floor
const getFloorRooms = asyncHandler(async (req, res) => {
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
    data: floor.rooms,
    count: floor.rooms.length
  });
});

module.exports = {
  getFloors,
  getFloor,
  createFloor,
  updateFloor,
  deleteFloor,
  getFloorRooms
}; 