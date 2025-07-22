import { Request, Response } from 'express';
import { prisma } from '../index';
import { asyncHandler } from '../middleware/error.middleware';

// GET /api/floors - Get all floors for a property
export const getFloors = asyncHandler(async (req: Request, res: Response) => {
  const { propertyId } = req.query;
  
  if (!propertyId) {
    return res.status(400).json({
      success: false,
      error: { message: 'Property ID is required' }
    });
  }

  const floors = await prisma.floor.findMany({
    where: {
      propertyId: propertyId as string
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
export const getFloor = asyncHandler(async (req: Request, res: Response) => {
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
export const createFloor = asyncHandler(async (req: Request, res: Response) => {
  const { floorName, floorNumber, description, propertyId } = req.body;

  // Validation
  if (!floorName || floorNumber === undefined || !propertyId) {
    return res.status(400).json({
      success: false,
      error: { message: 'Floor name, floor number, and property ID are required' }
    });
  }

  // Check if property exists
  const property = await prisma.property.findUnique({
    where: { id: propertyId }
  });

  if (!property) {
    return res.status(404).json({
      success: false,
      error: { message: 'Property not found' }
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
      floorName,
      floorNumber: parseInt(floorNumber),
      description,
      propertyId
    },
    include: {
      rooms: true
    }
  });

  res.status(201).json({
    success: true,
    data: floor,
    message: 'Floor created successfully'
  });
});

// PUT /api/floors/:id - Update floor
export const updateFloor = asyncHandler(async (req: Request, res: Response) => {
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
export const deleteFloor = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if floor exists
  const floor = await prisma.floor.findUnique({
    where: { id },
    include: {
      rooms: true
    }
  });

  if (!floor) {
    return res.status(404).json({
      success: false,
      error: { message: 'Floor not found' }
    });
  }

  // Check if floor has rooms
  if (floor.rooms.length > 0) {
    return res.status(400).json({
      success: false,
      error: { message: 'Cannot delete floor with existing rooms. Please remove all rooms first.' }
    });
  }

  await prisma.floor.delete({
    where: { id }
  });

  res.status(200).json({
    success: true,
    message: 'Floor deleted successfully'
  });
});

// GET /api/floors/:id/rooms - Get all rooms for a specific floor
export const getFloorRooms = asyncHandler(async (req: Request, res: Response) => {
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