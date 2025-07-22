const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middleware/error.middleware');

const prisma = new PrismaClient();

// GET /api/beds - Get all beds
const getBeds = asyncHandler(async (req, res) => {
  const { roomId, status, propertyId } = req.query;
  
  const where = {};
  
  if (roomId) {
    where.roomId = roomId;
  }
  
  if (status) {
    where.status = status;
  }
  
  if (propertyId) {
    where.room = {
      floor: {
        propertyId: propertyId
      }
    };
  }

  const beds = await prisma.bed.findMany({
    where,
    include: {
      room: {
        select: {
          id: true,
          roomNumber: true,
          name: true,
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
          }
        }
      },
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
    },
    orderBy: [
      { room: { floor: { floorNumber: 'asc' } } },
      { room: { roomNumber: 'asc' } },
      { bedNumber: 'asc' }
    ]
  });

  // Map enum values to display values
  const bedTypeDisplayMapping = {
    'SINGLE': 'Single',
    'DOUBLE': 'Double',
    'BUNK': 'Bunk'
  };

  const bedsWithDisplayTypes = beds.map(bed => ({
    ...bed,
    bedType: bedTypeDisplayMapping[bed.bedType] || bed.bedType
  }));

  res.status(200).json({
    success: true,
    data: bedsWithDisplayTypes,
    count: bedsWithDisplayTypes.length
  });
});

// GET /api/beds/:id - Get bed by ID
const getBed = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const bed = await prisma.bed.findUnique({
    where: { id },
    include: {
      room: {
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
          }
        }
      },
      tenant: {
        select: {
          id: true,
          tenantId: true,
          fullName: true,
          phone: true,
          email: true,
          status: true,
          joiningDate: true,
          securityDeposit: true,
          advanceRent: true
        }
      },
      payments: {
        take: 5,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          paymentId: true,
          amount: true,
          paymentType: true,
          status: true,
          dueDate: true,
          paidDate: true
        }
      }
    }
  });

  if (!bed) {
    return res.status(404).json({
      success: false,
      error: { message: 'Bed not found' }
    });
  }

  // Map enum values to display values
  const bedTypeDisplayMapping = {
    'SINGLE': 'Single',
    'DOUBLE': 'Double',
    'BUNK': 'Bunk'
  };

  const bedWithDisplayType = {
    ...bed,
    bedType: bedTypeDisplayMapping[bed.bedType] || bed.bedType
  };

  res.status(200).json({
    success: true,
    data: bedWithDisplayType
  });
});

// POST /api/beds - Create new bed
const createBed = asyncHandler(async (req, res) => {
  const {
    bedNumber,
    roomId,
    bedType = 'Single',
    rent,
    deposit,
    description
  } = req.body;

  console.log('🔧 CREATE BED REQUEST:', {
    bedNumber,
    roomId,
    bedType,
    rent,
    deposit
  });

  // Validation
  if (!bedNumber || !roomId || !rent || !deposit) {
    return res.status(400).json({
      success: false,
      error: { message: 'Bed number, room ID, rent, and deposit are required' }
    });
  }

  // Validate rent amount
  const rentAmount = parseFloat(rent);
  if (rentAmount < 1000) {
    return res.status(400).json({
      success: false,
      error: { message: 'Rent amount must be at least ₹1,000' }
    });
  }

  // Check if room exists and user owns it
  const room = await prisma.room.findFirst({
    where: { 
      id: roomId,
      floor: {
        property: {
          ownerId: req.user.id
        }
      }
    },
    include: {
      floor: {
        include: {
          property: true
        }
      },
      beds: true // Get existing beds to check capacity
    }
  });

  if (!room) {
    return res.status(404).json({
      success: false,
      error: { message: 'Room not found or access denied' }
    });
  }

  // Check room capacity
  const currentBedCount = room.beds.length;
  if (currentBedCount >= room.capacity) {
    return res.status(400).json({
      success: false,
      error: { 
        message: `Room ${room.roomNumber} is at full capacity (${room.capacity} beds). Cannot add more beds.`
      }
    });
  }

  // Check if bed number already exists in this room
  const existingBed = room.beds.find(bed => bed.bedNumber === bedNumber);
  if (existingBed) {
    return res.status(400).json({
      success: false,
      error: { message: `Bed number ${bedNumber} already exists in room ${room.roomNumber}` }
    });
  }

  // Map bed types
  const bedTypeMapping = {
    'Single': 'SINGLE',
    'Double': 'DOUBLE',
    'Bunk': 'BUNK'
  };

  const bed = await prisma.bed.create({
    data: {
      bedNumber,
      roomId,
      bedType: bedTypeMapping[bedType] || 'SINGLE',
      rent: rentAmount,
      deposit: parseFloat(deposit),
      description: description || null,
      status: 'AVAILABLE'
    },
    include: {
      room: {
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
      }
    }
  });

  // Update room current beds count
  await prisma.room.update({
    where: { id: roomId },
    data: {
      currentBeds: currentBedCount + 1
    }
  });

  // Update floor bed count
  await prisma.floor.update({
    where: { id: room.floor.id },
    data: {
      totalBeds: {
        increment: 1
      }
    }
  });

  // Update property bed count
  await prisma.property.update({
    where: { id: room.floor.property.id },
    data: {
      totalBeds: {
        increment: 1
      }
    }
  });

  console.log('✅ Bed created successfully:', bed.id);

  // Map enum values to display values for response
  const bedTypeDisplayMapping = {
    'SINGLE': 'Single',
    'DOUBLE': 'Double',
    'BUNK': 'Bunk'
  };

  const bedWithDisplayType = {
    ...bed,
    bedType: bedTypeDisplayMapping[bed.bedType] || bed.bedType
  };

  res.status(201).json({
    success: true,
    data: bedWithDisplayType,
    message: `Bed ${bedNumber} created successfully in room ${room.roomNumber} (${currentBedCount + 1}/${room.capacity} beds)`
  });
});

// PUT /api/beds/:id - Update bed
const updateBed = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    bedNumber,
    bedType,
    rent,
    deposit,
    description,
    status
  } = req.body;

  // Check if bed exists
  const existingBed = await prisma.bed.findUnique({
    where: { id }
  });

  if (!existingBed) {
    return res.status(404).json({
      success: false,
      error: { message: 'Bed not found' }
    });
  }

  // If bed number is being changed, check for duplicates
  if (bedNumber && bedNumber !== existingBed.bedNumber) {
    const duplicateBed = await prisma.bed.findFirst({
      where: {
        bedNumber,
        roomId: existingBed.roomId,
        id: { not: id }
      }
    });

    if (duplicateBed) {
      return res.status(400).json({
        success: false,
        error: { message: 'Bed number already exists in this room' }
      });
    }
  }

  const updatedBed = await prisma.bed.update({
    where: { id },
    data: {
      ...(bedNumber && { bedNumber }),
      ...(bedType && { bedType }),
      ...(rent && { rent: parseFloat(rent) }),
      ...(deposit && { deposit: parseFloat(deposit) }),
      ...(description !== undefined && { description }),
      ...(status && { status })
    },
    include: {
      room: {
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
      },
      tenant: {
        select: {
          id: true,
          tenantId: true,
          fullName: true
        }
      }
    }
  });

  res.status(200).json({
    success: true,
    data: updatedBed,
    message: 'Bed updated successfully'
  });
});

// DELETE /api/beds/:id - Delete bed
const deleteBed = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { forceDelete = false, relocateTenantToBedId = null } = req.body;

  // Check if bed exists
  const bed = await prisma.bed.findUnique({
    where: { id },
    include: {
      tenant: {
        select: {
          id: true,
          tenantId: true,
          fullName: true,
          phone: true,
          status: true
        }
      },
      room: {
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
      }
    }
  });

  if (!bed) {
    return res.status(404).json({
      success: false,
      error: { message: 'Bed not found' }
    });
  }

  // If bed is occupied, handle tenant relocation
  if (bed.tenant) {
    if (!forceDelete && !relocateTenantToBedId) {
      // Find available beds in the same property for relocation suggestions
      const availableBeds = await prisma.bed.findMany({
        where: {
          room: {
            floor: {
              propertyId: bed.room.floor.propertyId
            }
          },
          tenantId: null,
          status: 'AVAILABLE',
          id: { not: id }
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

      return res.status(400).json({
        success: false,
        error: { 
          message: 'Cannot delete occupied bed. Please relocate tenant first.',
          tenant: {
            id: bed.tenant.id,
            tenantId: bed.tenant.tenantId,
            name: bed.tenant.fullName,
            phone: bed.tenant.phone
          },
          currentBed: {
            id: bed.id,
            bedNumber: bed.bedNumber,
            room: bed.room.roomNumber,
            floor: bed.room.floor.name
          },
          availableBeds: availableBeds.map(availableBed => ({
            id: availableBed.id,
            bedNumber: availableBed.bedNumber,
            bedType: availableBed.bedType,
            rent: availableBed.rent,
            room: availableBed.room.roomNumber,
            floor: availableBed.room.floor.name,
            location: `${availableBed.room.floor.name} - Room ${availableBed.room.roomNumber} - Bed ${availableBed.bedNumber}`
          }))
        },
        requiresAction: 'RELOCATE_TENANT',
        actions: [
          {
            type: 'RELOCATE',
            description: 'Move tenant to another available bed',
            endpoint: `DELETE /api/beds/${id}`,
            payload: { relocateTenantToBedId: 'TARGET_BED_ID' }
          },
          {
            type: 'FORCE_DELETE',
            description: 'Delete bed and make tenant unassigned (not recommended)',
            endpoint: `DELETE /api/beds/${id}`,
            payload: { forceDelete: true }
          }
        ]
      });
    }

    // Handle tenant relocation
    if (relocateTenantToBedId) {
      // Verify target bed exists and is available
      const targetBed = await prisma.bed.findUnique({
        where: { id: relocateTenantToBedId },
        include: {
          tenant: true,
          room: {
            include: {
              floor: {
                select: {
                  id: true,
                  name: true,
                  propertyId: true
                }
              }
            }
          }
        }
      });

      if (!targetBed) {
        return res.status(400).json({
          success: false,
          error: { message: 'Target bed not found for relocation' }
        });
      }

      if (targetBed.tenant) {
        return res.status(400).json({
          success: false,
          error: { message: 'Target bed is already occupied' }
        });
      }

      if (targetBed.room.floor.propertyId !== bed.room.floor.propertyId) {
        return res.status(400).json({
          success: false,
          error: { message: 'Cannot relocate tenant to a different property' }
        });
      }

      // Relocate tenant to target bed
      await prisma.bed.update({
        where: { id: relocateTenantToBedId },
        data: {
          tenantId: bed.tenant.id,
          status: 'OCCUPIED'
        }
      });

      // Create audit log for relocation
      console.log(`🔄 Tenant ${bed.tenant.tenantId} relocated from Bed ${bed.bedNumber} to Bed ${targetBed.bedNumber}`);
    } else if (forceDelete) {
      // Force delete: Make tenant unassigned
      await prisma.tenant.update({
        where: { id: bed.tenant.id },
        data: {
          status: 'PENDING' // Mark as pending reassignment
        }
      });

      console.log(`⚠️ Tenant ${bed.tenant.tenantId} made unassigned due to bed deletion`);
    }
  }

  // Delete bed
  await prisma.bed.delete({
    where: { id }
  });

  // Update room bed count
  await prisma.room.update({
    where: { id: bed.roomId },
    data: {
      currentBeds: {
        decrement: 1
      }
    }
  });

  // Update floor bed count
  await prisma.floor.update({
    where: { id: bed.room.floorId },
    data: {
      totalBeds: {
        decrement: 1
      }
    }
  });

  // Update property bed count
  await prisma.property.update({
    where: { id: bed.room.floor.propertyId },
    data: {
      totalBeds: {
        decrement: 1
      }
    }
  });

  const responseMessage = bed.tenant 
    ? (relocateTenantToBedId 
      ? `Bed deleted successfully and tenant relocated to new bed`
      : `Bed deleted successfully and tenant marked as unassigned`)
    : 'Bed deleted successfully';

  res.status(200).json({
    success: true,
    message: responseMessage,
    relocationInfo: bed.tenant && relocateTenantToBedId ? {
      tenantId: bed.tenant.tenantId,
      tenantName: bed.tenant.fullName,
      relocatedTo: relocateTenantToBedId
    } : null
  });
});

// PUT /api/beds/:id/assign - Assign tenant to bed
const assignTenant = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.body;

  if (!tenantId) {
    return res.status(400).json({
      success: false,
      error: { message: 'Tenant ID is required' }
    });
  }

  // Check if bed exists and is available
  const bed = await prisma.bed.findUnique({
    where: { id },
    include: {
      tenant: true
    }
  });

  if (!bed) {
    return res.status(404).json({
      success: false,
      error: { message: 'Bed not found' }
    });
  }

  if (bed.tenant) {
    return res.status(400).json({
      success: false,
      error: { message: 'Bed is already occupied' }
    });
  }

  // Check if tenant exists
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });

  if (!tenant) {
    return res.status(404).json({
      success: false,
      error: { message: 'Tenant not found' }
    });
  }

  // Assign tenant to bed
  const updatedBed = await prisma.bed.update({
    where: { id },
    data: {
      tenantId,
      status: 'OCCUPIED'
    },
    include: {
      room: true,
      tenant: {
        select: {
          id: true,
          tenantId: true,
          fullName: true,
          phone: true
        }
      }
    }
  });

  res.status(200).json({
    success: true,
    data: updatedBed,
    message: 'Tenant assigned to bed successfully'
  });
});

// PUT /api/beds/:id/unassign - Remove tenant from bed
const unassignTenant = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if bed exists
  const bed = await prisma.bed.findUnique({
    where: { id },
    include: {
      tenant: true
    }
  });

  if (!bed) {
    return res.status(404).json({
      success: false,
      error: { message: 'Bed not found' }
    });
  }

  if (!bed.tenant) {
    return res.status(400).json({
      success: false,
      error: { message: 'Bed is not occupied' }
    });
  }

  // Remove tenant from bed
  const updatedBed = await prisma.bed.update({
    where: { id },
    data: {
      tenantId: null,
      status: 'AVAILABLE'
    },
    include: {
      room: true
    }
  });

  res.status(200).json({
    success: true,
    data: updatedBed,
    message: 'Tenant removed from bed successfully'
  });
});

module.exports = {
  getBeds,
  getBed,
  createBed,
  updateBed,
  deleteBed,
  assignTenant,
  unassignTenant
}; 