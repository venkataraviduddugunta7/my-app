const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middleware/error.middleware');

const prisma = new PrismaClient();

// GET /api/rooms - Get all rooms
const getRooms = asyncHandler(async (req, res) => {
  const { floorId, propertyId, status } = req.query;
  
  const where = {};
  
  if (floorId) {
    where.floorId = floorId;
  }
  
  if (propertyId) {
    where.floor = {
      propertyId: propertyId
    };
  }
  
  if (status) {
    where.status = status;
  }

  const rooms = await prisma.room.findMany({
    where,
    include: {
      floor: {
        select: {
          id: true,
          name: true,
          floorNumber: true,
          property: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
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
    },
    orderBy: [
      { floor: { floorNumber: 'asc' } },
      { roomNumber: 'asc' }
    ]
  });

  // Map enum values to display values
  const roomTypeDisplayMapping = {
    'SINGLE': 'Single',
    'SHARED': 'Shared',
    'DORMITORY': 'Dormitory'
  };

  const roomsWithDisplayTypes = rooms.map(room => ({
    ...room,
    type: roomTypeDisplayMapping[room.roomType] || room.roomType
  }));

  res.status(200).json({
    success: true,
    data: roomsWithDisplayTypes,
    count: roomsWithDisplayTypes.length
  });
});

// GET /api/rooms/:id - Get room by ID
const getRoom = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const room = await prisma.room.findUnique({
    where: { id },
    include: {
      floor: {
        include: {
          property: {
            select: {
              id: true,
              name: true,
              address: true
            }
          }
        }
      },
      beds: {
        include: {
          tenant: {
            select: {
              id: true,
              tenantId: true,
              fullName: true,
              phone: true,
              email: true,
              status: true,
              joiningDate: true
            }
          }
        }
      }
    }
  });

  if (!room) {
    return res.status(404).json({
      success: false,
      error: { message: 'Room not found' }
    });
  }

  // Map enum values to display values
  const roomTypeDisplayMapping = {
    'SINGLE': 'Single',
    'SHARED': 'Shared',
    'DORMITORY': 'Dormitory'
  };

  const roomWithDisplayType = {
    ...room,
    type: roomTypeDisplayMapping[room.roomType] || room.roomType
  };

  res.status(200).json({
    success: true,
    data: roomWithDisplayType
  });
});

// POST /api/rooms - Create new room
const createRoom = asyncHandler(async (req, res) => {
  const {
    roomNumber,
    name,
    floorId,
    type = 'Shared',
    capacity = 2,
    description,
    amenities = []
  } = req.body;

  console.log('🔧 CREATE ROOM REQUEST:', {
    roomNumber,
    name,
    floorId,
    type,
    capacity,
    amenities: amenities.length
  });

  // Validation
  if (!roomNumber || !floorId) {
    return res.status(400).json({
      success: false,
      error: { message: 'Room number and floor ID are required' }
    });
  }

  // Validate capacity
  const capacityNum = parseInt(capacity);
  if (capacityNum < 1 || capacityNum > 12) {
    return res.status(400).json({
      success: false,
      error: { message: 'Room capacity must be between 1 and 12 beds' }
    });
  }

  // Check if floor exists and user owns it
  const floor = await prisma.floor.findFirst({
    where: { 
      id: floorId,
      property: {
        ownerId: req.user.id
      }
    },
    include: {
      property: true
    }
  });

  if (!floor) {
    return res.status(404).json({
      success: false,
      error: { message: 'Floor not found or access denied' }
    });
  }

  // Check if room number already exists on this floor
  const existingRoom = await prisma.room.findFirst({
    where: {
      roomNumber,
      floorId
    }
  });

  if (existingRoom) {
    return res.status(400).json({
      success: false,
      error: { message: `Room number ${roomNumber} already exists on ${floor.name}` }
    });
  }

  // Create room with proper mapping
  const roomTypeMapping = {
    'Single': 'SINGLE',
    'Shared': 'SHARED', 
    'Dormitory': 'DORMITORY'
  };

  const room = await prisma.room.create({
    data: {
      roomNumber,
      name: name || null,
      floorId,
      roomType: roomTypeMapping[type] || 'SHARED',
      capacity: capacityNum,
      currentBeds: 0, // No beds initially
      rent: 0, // Rent is set on beds, not rooms
      deposit: 0, // Deposit is set on beds, not rooms
      description: description || null,
      amenities,
      status: 'AVAILABLE'
    },
    include: {
      floor: {
        include: {
          property: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  });

  // Update floor room count
  await prisma.floor.update({
    where: { id: floorId },
    data: {
      totalRooms: {
        increment: 1
      }
    }
  });

  // Update property room count
  await prisma.property.update({
    where: { id: floor.property.id },
    data: {
      totalRooms: {
        increment: 1
      }
    }
  });

  console.log('✅ Room created successfully:', room.id);

  // Map enum values to display values for response
  const roomTypeDisplayMapping = {
    'SINGLE': 'Single',
    'SHARED': 'Shared',
    'DORMITORY': 'Dormitory'
  };

  const roomWithDisplayType = {
    ...room,
    type: roomTypeDisplayMapping[room.roomType] || room.roomType
  };

  res.status(201).json({
    success: true,
    data: roomWithDisplayType,
    message: `Room ${roomNumber} created successfully with capacity for ${capacityNum} beds`
  });
});

// PUT /api/rooms/:id - Update room
const updateRoom = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    roomNumber,
    name,
    roomType,
    capacity,
    rent,
    deposit,
    description,
    amenities,
    status
  } = req.body;

  // Check if room exists
  const existingRoom = await prisma.room.findUnique({
    where: { id }
  });

  if (!existingRoom) {
    return res.status(404).json({
      success: false,
      error: { message: 'Room not found' }
    });
  }

  // If room number is being changed, check for duplicates
  if (roomNumber && roomNumber !== existingRoom.roomNumber) {
    const duplicateRoom = await prisma.room.findFirst({
      where: {
        roomNumber,
        floorId: existingRoom.floorId,
        id: { not: id }
      }
    });

    if (duplicateRoom) {
      return res.status(400).json({
        success: false,
        error: { message: 'Room number already exists on this floor' }
      });
    }
  }

  const updatedRoom = await prisma.room.update({
    where: { id },
    data: {
      ...(roomNumber && { roomNumber }),
      ...(name && { name }),
      ...(roomType && { roomType }),
      ...(capacity && { capacity: parseInt(capacity) }),
      ...(rent && { rent: parseFloat(rent) }),
      ...(deposit && { deposit: parseFloat(deposit) }),
      ...(description !== undefined && { description }),
      ...(amenities && { amenities }),
      ...(status && { status })
    },
    include: {
      floor: {
        include: {
          property: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      beds: {
        include: {
          tenant: {
            select: {
              id: true,
              tenantId: true,
              fullName: true
            }
          }
        }
      }
    }
  });

  res.status(200).json({
    success: true,
    data: updatedRoom,
    message: 'Room updated successfully'
  });
});

// DELETE /api/rooms/:id - Delete room
const deleteRoom = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { forceDelete = false } = req.body;

  // Check if room exists
  const room = await prisma.room.findUnique({
    where: { id },
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
      },
      floor: {
        include: {
          property: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  });

  if (!room) {
    return res.status(404).json({
      success: false,
      error: { message: 'Room not found' }
    });
  }

  // Check if room has occupied beds
  const occupiedBeds = room.beds.filter(bed => bed.tenant);
  if (occupiedBeds.length > 0 && !forceDelete) {
    // Find available beds in the same property for relocation suggestions
    const availableBeds = await prisma.bed.findMany({
      where: {
        room: {
          floor: {
            propertyId: room.floor.propertyId
          },
          id: { not: id } // Exclude beds from the room being deleted
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

    // Group tenants by bed for better display
    const tenantsToRelocate = occupiedBeds.map(bed => ({
      tenantId: bed.tenant.tenantId,
      tenantName: bed.tenant.fullName,
      phone: bed.tenant.phone,
      currentBed: {
        id: bed.id,
        bedNumber: bed.bedNumber,
        bedType: bed.bedType,
        rent: bed.rent
      }
    }));

    return res.status(400).json({
      success: false,
      error: { 
        message: `Cannot delete room with ${occupiedBeds.length} occupied beds. Please relocate tenants first.`,
        roomInfo: {
          id: room.id,
          roomNumber: room.roomNumber,
          floor: room.floor.name,
          totalBeds: room.beds.length,
          occupiedBeds: occupiedBeds.length
        },
        tenantsToRelocate,
        availableBeds: availableBeds.map(bed => ({
          id: bed.id,
          bedNumber: bed.bedNumber,
          bedType: bed.bedType,
          rent: bed.rent,
          room: bed.room.roomNumber,
          floor: bed.room.floor.name,
          location: `${bed.room.floor.name} - Room ${bed.room.roomNumber} - Bed ${bed.bedNumber}`
        }))
      },
      requiresAction: 'RELOCATE_TENANTS',
      recommendations: {
        message: availableBeds.length >= occupiedBeds.length 
          ? `✅ ${availableBeds.length} available beds found - relocation possible`
          : `⚠️ Only ${availableBeds.length} available beds found for ${occupiedBeds.length} tenants - additional beds needed`,
        canAutoRelocate: availableBeds.length >= occupiedBeds.length,
        actions: [
          {
            type: 'MANUAL_RELOCATE',
            description: 'Manually relocate each tenant to available beds',
            endpoint: 'PUT /api/tenants/:tenantId/assign-bed',
            note: 'Relocate tenants one by one, then delete room'
          },
          {
            type: 'FORCE_DELETE',
            description: 'Delete room and make all tenants unassigned (NOT RECOMMENDED)',
            endpoint: `DELETE /api/rooms/${id}`,
            payload: { forceDelete: true },
            warning: 'This will make tenants homeless - use with extreme caution'
          }
        ]
      }
    });
  }

  // If force delete is requested, handle tenant displacement
  if (forceDelete && occupiedBeds.length > 0) {
    console.log(`⚠️ FORCE DELETE: Room ${room.roomNumber} with ${occupiedBeds.length} tenants`);
    
    // Mark all tenants as pending reassignment
    for (const bed of occupiedBeds) {
      await prisma.tenant.update({
        where: { id: bed.tenant.id },
        data: {
          status: 'PENDING' // Mark as pending reassignment
        }
      });
      
      console.log(`⚠️ Tenant ${bed.tenant.tenantId} (${bed.tenant.fullName}) made unassigned due to room deletion`);
    }
  }

  // Delete room (beds will be cascade deleted)
  await prisma.room.delete({
    where: { id }
  });

  // Update floor room count
  await prisma.floor.update({
    where: { id: room.floorId },
    data: {
      totalRooms: {
        decrement: 1
      },
      totalBeds: {
        decrement: room.beds.length
      }
    }
  });

  // Update property counts
  await prisma.property.update({
    where: { id: room.floor.propertyId },
    data: {
      totalRooms: {
        decrement: 1
      },
      totalBeds: {
        decrement: room.beds.length
      }
    }
  });

  const responseMessage = occupiedBeds.length > 0 && forceDelete
    ? `Room deleted successfully. ${occupiedBeds.length} tenants marked as unassigned.`
    : 'Room deleted successfully';

  res.status(200).json({
    success: true,
    message: responseMessage,
    deletedRoom: {
      id: room.id,
      roomNumber: room.roomNumber,
      totalBeds: room.beds.length,
      affectedTenants: occupiedBeds.length
    }
  });
});

// GET /api/rooms/:id/beds - Get all beds for a room
const getRoomBeds = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const beds = await prisma.bed.findMany({
    where: { roomId: id },
    include: {
      tenant: {
        select: {
          id: true,
          tenantId: true,
          fullName: true,
          phone: true,
          email: true,
          status: true,
          joiningDate: true
        }
      },
      room: {
        select: {
          id: true,
          roomNumber: true,
          name: true,
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
    orderBy: {
      bedNumber: 'asc'
    }
  });

  res.status(200).json({
    success: true,
    data: beds,
    count: beds.length
  });
});

module.exports = {
  getRooms,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  getRoomBeds
}; 