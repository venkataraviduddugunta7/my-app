import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const createFloorSchema = z.object({
  name: z.string().min(1, 'Floor name is required'),
  floorNumber: z.number().int().min(0, 'Floor number must be 0 or positive'),
  description: z.string().optional()
});

const createRoomSchema = z.object({
  roomNumber: z.string().min(1, 'Room number is required'),
  name: z.string().optional(),
  roomType: z.enum(['SINGLE', 'SHARED', 'DORMITORY']).default('SHARED'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  rent: z.number().positive('Rent must be positive'),
  deposit: z.number().positive('Deposit must be positive'),
  description: z.string().optional(),
  amenities: z.array(z.string()).default([])
});

const createBedSchema = z.object({
  bedNumber: z.string().min(1, 'Bed number is required'),
  bedType: z.enum(['SINGLE', 'DOUBLE', 'BUNK']).default('SINGLE'),
  rent: z.number().positive('Rent must be positive'),
  deposit: z.number().positive('Deposit must be positive'),
  description: z.string().optional()
});

export class RoomController {
  // Floor Management
  
  // Create floor
  static async createFloor(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId } = req.params;
      const userId = req.user?.userId;
      const validatedData = createFloorSchema.parse(req.body);

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

      // Check if floor number already exists
      const existingFloor = await prisma.floor.findFirst({
        where: {
          propertyId,
          floorNumber: validatedData.floorNumber
        }
      });

      if (existingFloor) {
        return res.status(400).json({
          success: false,
          message: 'Floor number already exists'
        });
      }

      const floor = await prisma.floor.create({
        data: {
          ...validatedData,
          propertyId
        },
        include: {
          _count: {
            select: {
              rooms: true
            }
          }
        }
      });

      // Update property's total floors count
      await prisma.property.update({
        where: { id: propertyId },
        data: {
          totalFloors: {
            increment: 1
          }
        }
      });

      res.status(201).json({
        success: true,
        message: 'Floor created successfully',
        data: floor
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

  // Get floors for a property
  static async getFloors(req: Request, res: Response, next: NextFunction) {
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

      const floors = await prisma.floor.findMany({
        where: {
          propertyId,
          isActive: true
        },
        include: {
          rooms: {
            include: {
              beds: {
                select: {
                  id: true,
                  bedNumber: true,
                  status: true,
                  tenant: {
                    select: {
                      id: true,
                      fullName: true,
                      tenantId: true
                    }
                  }
                }
              }
            },
            orderBy: {
              roomNumber: 'asc'
            }
          },
          _count: {
            select: {
              rooms: true
            }
          }
        },
        orderBy: {
          floorNumber: 'asc'
        }
      });

      // Calculate statistics for each floor
      const floorsWithStats = floors.map(floor => {
        const totalRooms = floor.rooms.length;
        const totalBeds = floor.rooms.reduce((sum, room) => sum + room.beds.length, 0);
        const occupiedBeds = floor.rooms.reduce((sum, room) => 
          sum + room.beds.filter(bed => bed.status === 'OCCUPIED').length, 0
        );
        const availableBeds = totalBeds - occupiedBeds;
        const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

        return {
          ...floor,
          stats: {
            totalRooms,
            totalBeds,
            occupiedBeds,
            availableBeds,
            occupancyRate
          }
        };
      });

      res.json({
        success: true,
        data: floorsWithStats
      });
    } catch (error) {
      next(error);
    }
  }

  // Room Management
  
  // Create room
  static async createRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId, floorId } = req.params;
      const userId = req.user?.userId;
      const validatedData = createRoomSchema.parse(req.body);

      // Verify property and floor ownership
      const floor = await prisma.floor.findFirst({
        where: {
          id: floorId,
          property: {
            id: propertyId,
            ownerId: userId
          }
        },
        include: {
          property: true
        }
      });

      if (!floor) {
        return res.status(404).json({
          success: false,
          message: 'Floor not found'
        });
      }

      // Check if room number already exists on this floor
      const existingRoom = await prisma.room.findFirst({
        where: {
          floorId,
          roomNumber: validatedData.roomNumber
        }
      });

      if (existingRoom) {
        return res.status(400).json({
          success: false,
          message: 'Room number already exists on this floor'
        });
      }

      const room = await prisma.room.create({
        data: {
          ...validatedData,
          floorId,
          status: 'AVAILABLE'
        },
        include: {
          beds: true,
          _count: {
            select: {
              beds: true
            }
          }
        }
      });

      // Update floor and property counts
      await Promise.all([
        prisma.floor.update({
          where: { id: floorId },
          data: {
            totalRooms: {
              increment: 1
            }
          }
        }),
        prisma.property.update({
          where: { id: propertyId },
          data: {
            totalRooms: {
              increment: 1
            }
          }
        })
      ]);

      res.status(201).json({
        success: true,
        message: 'Room created successfully',
        data: room
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

  // Get rooms for a floor
  static async getRooms(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId, floorId } = req.params;
      const userId = req.user?.userId;

      // Verify ownership
      const floor = await prisma.floor.findFirst({
        where: {
          id: floorId,
          property: {
            id: propertyId,
            ownerId: userId
          }
        }
      });

      if (!floor) {
        return res.status(404).json({
          success: false,
          message: 'Floor not found'
        });
      }

      const rooms = await prisma.room.findMany({
        where: {
          floorId,
          isActive: true
        },
        include: {
          beds: {
            include: {
              tenant: {
                select: {
                  id: true,
                  tenantId: true,
                  fullName: true,
                  phone: true,
                  joiningDate: true,
                  status: true
                }
              }
            },
            orderBy: {
              bedNumber: 'asc'
            }
          }
        },
        orderBy: {
          roomNumber: 'asc'
        }
      });

      // Calculate statistics for each room
      const roomsWithStats = rooms.map(room => {
        const totalBeds = room.beds.length;
        const occupiedBeds = room.beds.filter(bed => bed.status === 'OCCUPIED').length;
        const availableBeds = totalBeds - occupiedBeds;
        const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

        // Update room status based on bed occupancy
        let roomStatus = 'AVAILABLE';
        if (occupiedBeds === totalBeds) {
          roomStatus = 'OCCUPIED';
        } else if (occupiedBeds > 0) {
          roomStatus = 'OCCUPIED'; // Partially occupied is still occupied
        }

        return {
          ...room,
          status: roomStatus,
          stats: {
            totalBeds,
            occupiedBeds,
            availableBeds,
            occupancyRate
          }
        };
      });

      res.json({
        success: true,
        data: roomsWithStats
      });
    } catch (error) {
      next(error);
    }
  }

  // Bed Management
  
  // Create bed
  static async createBed(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId, floorId, roomId } = req.params;
      const userId = req.user?.userId;
      const validatedData = createBedSchema.parse(req.body);

      // Verify ownership
      const room = await prisma.room.findFirst({
        where: {
          id: roomId,
          floor: {
            id: floorId,
            property: {
              id: propertyId,
              ownerId: userId
            }
          }
        },
        include: {
          beds: true,
          floor: {
            include: {
              property: true
            }
          }
        }
      });

      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Room not found'
        });
      }

      // Check capacity
      if (room.beds.length >= room.capacity) {
        return res.status(400).json({
          success: false,
          message: 'Room has reached maximum capacity'
        });
      }

      // Check if bed number already exists in this room
      const existingBed = await prisma.bed.findFirst({
        where: {
          roomId,
          bedNumber: validatedData.bedNumber
        }
      });

      if (existingBed) {
        return res.status(400).json({
          success: false,
          message: 'Bed number already exists in this room'
        });
      }

      const bed = await prisma.bed.create({
        data: {
          ...validatedData,
          roomId,
          status: 'AVAILABLE'
        }
      });

      // Update counts
      await Promise.all([
        prisma.room.update({
          where: { id: roomId },
          data: {
            currentBeds: {
              increment: 1
            }
          }
        }),
        prisma.floor.update({
          where: { id: floorId },
          data: {
            totalBeds: {
              increment: 1
            }
          }
        }),
        prisma.property.update({
          where: { id: propertyId },
          data: {
            totalBeds: {
              increment: 1
            }
          }
        })
      ]);

      res.status(201).json({
        success: true,
        message: 'Bed created successfully',
        data: bed
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

  // Get beds for a room
  static async getBeds(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId, floorId, roomId } = req.params;
      const userId = req.user?.userId;

      // Verify ownership
      const room = await prisma.room.findFirst({
        where: {
          id: roomId,
          floor: {
            id: floorId,
            property: {
              id: propertyId,
              ownerId: userId
            }
          }
        }
      });

      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Room not found'
        });
      }

      const beds = await prisma.bed.findMany({
        where: {
          roomId,
          isActive: true
        },
        include: {
          tenant: {
            select: {
              id: true,
              tenantId: true,
              fullName: true,
              phone: true,
              email: true,
              joiningDate: true,
              status: true,
              profilePhoto: true
            }
          },
          payments: {
            where: {
              status: 'PENDING'
            },
            select: {
              id: true,
              amount: true,
              dueDate: true,
              paymentType: true
            },
            orderBy: {
              dueDate: 'asc'
            }
          }
        },
        orderBy: {
          bedNumber: 'asc'
        }
      });

      res.json({
        success: true,
        data: beds
      });
    } catch (error) {
      next(error);
    }
  }

  // Get available beds for a property
  static async getAvailableBeds(req: Request, res: Response, next: NextFunction) {
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

      const availableBeds = await prisma.bed.findMany({
        where: {
          status: 'AVAILABLE',
          isActive: true,
          room: {
            isActive: true,
            floor: {
              isActive: true,
              propertyId
            }
          }
        },
        include: {
          room: {
            select: {
              id: true,
              roomNumber: true,
              name: true,
              roomType: true,
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
          {
            room: {
              floor: {
                floorNumber: 'asc'
              }
            }
          },
          {
            room: {
              roomNumber: 'asc'
            }
          },
          {
            bedNumber: 'asc'
          }
        ]
      });

      res.json({
        success: true,
        data: availableBeds
      });
    } catch (error) {
      next(error);
    }
  }

  // Update bed status
  static async updateBedStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { propertyId, floorId, roomId, bedId } = req.params;
      const { status } = req.body;
      const userId = req.user?.userId;

      if (!['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid bed status'
        });
      }

      // Verify ownership
      const bed = await prisma.bed.findFirst({
        where: {
          id: bedId,
          room: {
            id: roomId,
            floor: {
              id: floorId,
              property: {
                id: propertyId,
                ownerId: userId
              }
            }
          }
        }
      });

      if (!bed) {
        return res.status(404).json({
          success: false,
          message: 'Bed not found'
        });
      }

      const updatedBed = await prisma.bed.update({
        where: { id: bedId },
        data: { status },
        include: {
          tenant: {
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
        message: 'Bed status updated successfully',
        data: updatedBed
      });
    } catch (error) {
      next(error);
    }
  }
}
