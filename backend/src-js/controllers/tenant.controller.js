const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middleware/error.middleware');
const webSocketService = require('../services/websocket.service');
const logger = require('../services/logger.service');

const prisma = new PrismaClient();

// GET /api/tenants - Get all tenants
const getTenants = asyncHandler(async (req, res) => {
  const { propertyId, status, bedId } = req.query;
  
  const where = {};
  
  if (propertyId) {
    where.propertyId = propertyId;
  }
  
  if (status) {
    where.status = status;
  }
  
  if (bedId) {
    where.bed = {
      id: bedId
    };
  }

  const tenants = await prisma.tenant.findMany({
    where,
    include: {
      bed: {
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
        }
      },
      property: {
        select: {
          id: true,
          name: true,
          address: true
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
    },
    orderBy: [
      { status: 'asc' },
      { joiningDate: 'desc' }
    ]
  });

  res.status(200).json({
    success: true,
    data: tenants,
    count: tenants.length
  });
});

// GET /api/tenants/:id - Get tenant by ID
const getTenant = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      bed: {
        include: {
          room: {
            include: {
              floor: {
                include: {
                  property: {
                    select: {
                      id: true,
                      name: true,
                      address: true,
                      city: true
                    }
                  }
                }
              }
            }
          }
        }
      },
      property: {
        select: {
          id: true,
          name: true,
          address: true,
          city: true
        }
      },
      payments: {
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          bed: {
            select: {
              bedNumber: true,
              room: {
                select: {
                  roomNumber: true
                }
              }
            }
          }
        }
      },
      createdBy: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      }
    }
  });

  if (!tenant) {
    return res.status(404).json({
      success: false,
      error: { message: 'Tenant not found' }
    });
  }

  res.status(200).json({
    success: true,
    data: tenant
  });
});

// POST /api/tenants - Create new tenant
const createTenant = asyncHandler(async (req, res) => {
  const {
    tenantId,
    fullName,
    email,
    phone,
    alternatePhone,
    emergencyContact,
    address,
    idProofType,
    idProofNumber,
    occupation,
    company,
    monthlyIncome,
    joiningDate,
    securityDeposit,
    advanceRent,
    bedId,
    propertyId,
    termsAccepted = false
  } = req.body;

  // Validation
  if (!tenantId || !fullName || !phone || !address || !idProofType || !idProofNumber || !joiningDate || !propertyId) {
    return res.status(400).json({
      success: false,
      error: { message: 'Required fields: tenantId, fullName, phone, address, idProofType, idProofNumber, joiningDate, propertyId' }
    });
  }

  // Check if tenantId already exists
  const existingTenant = await prisma.tenant.findUnique({
    where: { tenantId }
  });

  if (existingTenant) {
    return res.status(400).json({
      success: false,
      error: { message: 'Tenant ID already exists' }
    });
  }

  // Check if property exists
  const property = await prisma.property.findUnique({
    where: { id: propertyId }
  });

  if (!property) {
    return res.status(400).json({
      success: false,
      error: { message: 'Property not found' }
    });
  }

  // If bedId is provided, check if bed is available
  if (bedId) {
    const bed = await prisma.bed.findUnique({
      where: { id: bedId },
      include: { tenant: true }
    });

    if (!bed) {
      return res.status(400).json({
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
  }

  const tenant = await prisma.tenant.create({
    data: {
      tenantId,
      fullName,
      email,
      phone,
      alternatePhone,
      emergencyContact,
      address,
      idProofType,
      idProofNumber,
      occupation,
      company,
      monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : null,
      joiningDate: new Date(joiningDate),
      securityDeposit: securityDeposit ? parseFloat(securityDeposit) : 0,
      advanceRent: advanceRent ? parseFloat(advanceRent) : 0,
      termsAccepted,
      termsAcceptedAt: termsAccepted ? new Date() : null,
      propertyId,
      createdById: req.user.id,
    },
    include: {
      bed: {
        include: {
          room: {
            include: {
              floor: true
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

  // If bedId is provided, assign bed to tenant
  if (bedId) {
    await prisma.bed.update({
      where: { id: bedId },
      data: {
        tenantId: tenant.id,
        status: 'OCCUPIED'
      }
    });

    // Broadcast real-time bed update
    webSocketService.broadcastBedUpdate(propertyId, {
      id: bedId,
      status: 'OCCUPIED',
      tenantId: tenant.id,
      tenant: {
        id: tenant.id,
        fullName: tenant.fullName,
        phone: tenant.phone
      }
    });
  }

  // Log business event
  logger.business('tenant_created', {
    tenantId: tenant.id,
    tenantCustomId: tenant.tenantId,
    propertyId,
    bedId,
    createdBy: req.user.id
  });

  // Broadcast tenant creation
  webSocketService.broadcastTenantUpdate(propertyId, tenant, 'create');

  // Broadcast activity
  webSocketService.broadcastActivity(propertyId, {
    type: 'tenant_joined',
    message: `New tenant ${tenant.fullName} joined`,
    data: { tenantId: tenant.id, bedId }
  });

  res.status(201).json({
    success: true,
    data: tenant,
    message: 'Tenant created successfully'
  });
});

// PUT /api/tenants/:id - Update tenant
const updateTenant = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    fullName,
    email,
    phone,
    alternatePhone,
    emergencyContact,
    address,
    occupation,
    company,
    monthlyIncome,
    leavingDate,
    status,
    securityDeposit,
    advanceRent
  } = req.body;

  // Check if tenant exists
  const existingTenant = await prisma.tenant.findUnique({
    where: { id }
  });

  if (!existingTenant) {
    return res.status(404).json({
      success: false,
      error: { message: 'Tenant not found' }
    });
  }

  const updatedTenant = await prisma.tenant.update({
    where: { id },
    data: {
      ...(fullName && { fullName }),
      ...(email !== undefined && { email }),
      ...(phone && { phone }),
      ...(alternatePhone !== undefined && { alternatePhone }),
      ...(emergencyContact !== undefined && { emergencyContact }),
      ...(address && { address }),
      ...(occupation !== undefined && { occupation }),
      ...(company !== undefined && { company }),
      ...(monthlyIncome && { monthlyIncome: parseFloat(monthlyIncome) }),
      ...(leavingDate && { leavingDate: new Date(leavingDate) }),
      ...(status && { status }),
      ...(securityDeposit && { securityDeposit: parseFloat(securityDeposit) }),
      ...(advanceRent && { advanceRent: parseFloat(advanceRent) })
    },
    include: {
      bed: {
        include: {
          room: {
            include: {
              floor: true
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

  // Log business event
  logger.business('tenant_updated', {
    tenantId: id,
    changes: Object.keys(req.body),
    updatedBy: req.user.id
  });

  // Broadcast tenant update
  webSocketService.broadcastTenantUpdate(updatedTenant.propertyId, updatedTenant, 'update');

  res.status(200).json({
    success: true,
    data: updatedTenant,
    message: 'Tenant updated successfully'
  });
});

// DELETE /api/tenants/:id - Delete tenant
const deleteTenant = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if tenant exists
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      bed: true,
      payments: {
        where: {
          status: 'PENDING'
        }
      }
    }
  });

  if (!tenant) {
    return res.status(404).json({
      success: false,
      error: { message: 'Tenant not found' }
    });
  }

  // Check for pending payments
  if (tenant.payments.length > 0) {
    return res.status(400).json({
      success: false,
      error: { 
        message: 'Cannot delete tenant with pending payments. Please settle all payments first.',
        pendingPayments: tenant.payments.length
      }
    });
  }

  // Free up the bed if assigned
  if (tenant.bed) {
    await prisma.bed.update({
      where: { id: tenant.bed.id },
      data: {
        tenantId: null,
        status: 'AVAILABLE'
      }
    });
  }

  // Delete tenant
  await prisma.tenant.delete({
    where: { id }
  });

  // Log business event
  logger.business('tenant_deleted', {
    tenantId: id,
    tenantCustomId: tenant.tenantId,
    propertyId: tenant.propertyId,
    deletedBy: req.user.id
  });

  // Broadcast tenant deletion
  webSocketService.broadcastTenantUpdate(tenant.propertyId, { id }, 'delete');

  // If bed was freed, broadcast bed update
  if (tenant.bed) {
    webSocketService.broadcastBedUpdate(tenant.propertyId, {
      id: tenant.bed.id,
      status: 'AVAILABLE',
      tenantId: null,
      tenant: null
    });
  }

  res.status(200).json({
    success: true,
    message: 'Tenant deleted successfully'
  });
});

// PUT /api/tenants/:id/assign-bed - Assign bed to tenant
const assignBed = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { bedId } = req.body;

  if (!bedId) {
    return res.status(400).json({
      success: false,
      error: { message: 'Bed ID is required' }
    });
  }

  // Check if tenant exists
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: { bed: true }
  });

  if (!tenant) {
    return res.status(404).json({
      success: false,
      error: { message: 'Tenant not found' }
    });
  }

  // Check if bed exists and is available
  const bed = await prisma.bed.findUnique({
    where: { id: bedId },
    include: { tenant: true }
  });

  if (!bed) {
    return res.status(404).json({
      success: false,
      error: { message: 'Bed not found' }
    });
  }

  if (bed.tenant && bed.tenant.id !== id) {
    return res.status(400).json({
      success: false,
      error: { message: 'Bed is already occupied by another tenant' }
    });
  }

  // Free up current bed if tenant has one
  if (tenant.bed) {
    await prisma.bed.update({
      where: { id: tenant.bed.id },
      data: {
        tenantId: null,
        status: 'AVAILABLE'
      }
    });
  }

  // Assign new bed
  await prisma.bed.update({
    where: { id: bedId },
    data: {
      tenantId: id,
      status: 'OCCUPIED'
    }
  });

  const updatedTenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      bed: {
        include: {
          room: {
            include: {
              floor: true
            }
          }
        }
      }
    }
  });

  // Log business event
  logger.business('bed_assigned', {
    tenantId: id,
    bedId,
    previousBedId: tenant.bed?.id,
    assignedBy: req.user.id
  });

  // Broadcast bed updates
  if (tenant.bed) {
    // Previous bed is now available
    webSocketService.broadcastBedUpdate(updatedTenant.propertyId, {
      id: tenant.bed.id,
      status: 'AVAILABLE',
      tenantId: null,
      tenant: null
    });
  }

  // New bed is now occupied
  webSocketService.broadcastBedUpdate(updatedTenant.propertyId, {
    id: bedId,
    status: 'OCCUPIED',
    tenantId: id,
    tenant: {
      id: updatedTenant.id,
      fullName: updatedTenant.fullName,
      phone: updatedTenant.phone
    }
  });

  // Broadcast tenant update
  webSocketService.broadcastTenantUpdate(updatedTenant.propertyId, updatedTenant, 'update');

  res.status(200).json({
    success: true,
    data: updatedTenant,
    message: 'Bed assigned to tenant successfully'
  });
});

// PUT /api/tenants/:id/vacate - Vacate tenant
const vacateTenant = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { leavingDate, reason = 'Tenant vacated' } = req.body;

  // Validate leaving date
  if (!leavingDate) {
    return res.status(400).json({
      success: false,
      error: { message: 'Leaving date is required' }
    });
  }

  const leavingDateObj = new Date(leavingDate);
  const today = new Date();
  
  // Validate leaving date is not in the future beyond today
  if (leavingDateObj > today) {
    return res.status(400).json({
      success: false,
      error: { message: 'Leaving date cannot be in the future' }
    });
  }

  // Check if tenant exists first to get joining date
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      bed: {
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
        }
      },
      payments: {
        where: {
          status: 'PENDING'
        },
        select: {
          id: true,
          paymentId: true,
          amount: true,
          paymentType: true,
          dueDate: true
        }
      }
    }
  });

  if (!tenant) {
    return res.status(404).json({
      success: false,
      error: { message: 'Tenant not found' }
    });
  }

  // Check if tenant is already vacated
  if (tenant.status === 'VACATED') {
    return res.status(400).json({
      success: false,
      error: { 
        message: 'Tenant is already vacated',
        vacatedDate: tenant.leavingDate
      }
    });
  }

  // Validate leaving date is not before joining date
  const joiningDateObj = new Date(tenant.joiningDate);
  if (leavingDateObj < joiningDateObj) {
    return res.status(400).json({
      success: false,
      error: { 
        message: `Leaving date cannot be before joining date (${joiningDateObj.toDateString()})`,
        joiningDate: tenant.joiningDate
      }
    });
  }

  // Check for pending payments (optional warning, don't block)
  const pendingPayments = tenant.payments || [];
  const totalPendingAmount = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0);

  // Update tenant status to VACATED and set leaving date
  const vacatedTenant = await prisma.tenant.update({
    where: { id },
    data: {
      status: 'VACATED',
      leavingDate: leavingDateObj,
      isActive: false // Mark as inactive
    },
    include: {
      bed: {
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
        }
      }
    }
  });

  // Free up the bed if tenant was assigned to one
  let bedInfo = null;
  if (tenant.bed) {
    await prisma.bed.update({
      where: { id: tenant.bed.id },
      data: {
        tenantId: null,
        status: 'AVAILABLE'
      }
    });

    // Update room status if it becomes available
    const roomBeds = await prisma.bed.findMany({
      where: { roomId: tenant.bed.roomId }
    });
    
    const occupiedBeds = roomBeds.filter(bed => bed.status === 'OCCUPIED').length;
    
    if (occupiedBeds === 0) {
      await prisma.room.update({
        where: { id: tenant.bed.roomId },
        data: { status: 'AVAILABLE' }
      });
    }

    bedInfo = {
      id: tenant.bed.id,
      bedNumber: tenant.bed.bedNumber,
      room: tenant.bed.room.roomNumber,
      floor: tenant.bed.room.floor.name,
      location: `${tenant.bed.room.floor.name} - Room ${tenant.bed.room.roomNumber} - Bed ${tenant.bed.bedNumber}`
    };

    console.log(`🏠 Bed ${tenant.bed.bedNumber} in Room ${tenant.bed.room.roomNumber} is now available`);
  }

  // Log business event
  logger.business('tenant_vacated', {
    tenantId: id,
    tenantCustomId: tenant.tenantId,
    propertyId: tenant.propertyId,
    leavingDate: leavingDateObj,
    stayDuration: Math.ceil((leavingDateObj - new Date(tenant.joiningDate)) / (1000 * 60 * 60 * 24)),
    pendingPayments: pendingPayments.length,
    totalPendingAmount,
    vacatedBy: req.user.id
  });

  // Broadcast tenant vacation
  webSocketService.broadcastTenantUpdate(tenant.propertyId, vacatedTenant, 'vacate');

  // If bed was freed, broadcast bed update
  if (bedInfo) {
    webSocketService.broadcastBedUpdate(tenant.propertyId, {
      id: tenant.bed.id,
      status: 'AVAILABLE',
      tenantId: null,
      tenant: null
    });
  }

  // Broadcast activity
  webSocketService.broadcastActivity(tenant.propertyId, {
    type: 'tenant_vacated',
    message: `${tenant.fullName} vacated ${bedInfo ? bedInfo.location : 'property'}`,
    data: { 
      tenantId: id,
      bedId: bedInfo?.id,
      stayDuration: Math.ceil((leavingDateObj - new Date(tenant.joiningDate)) / (1000 * 60 * 60 * 24)) + ' days'
    }
  });

  // Prepare response with warnings if there are pending payments
  const warnings = [];
  if (pendingPayments.length > 0) {
    warnings.push(`Tenant has ${pendingPayments.length} pending payments totaling ₹${totalPendingAmount}`);
  }

  res.status(200).json({
    success: true,
    message: `Tenant ${tenant.tenantId} vacated successfully`,
    data: {
      tenant: {
        id: vacatedTenant.id,
        tenantId: vacatedTenant.tenantId,
        fullName: vacatedTenant.fullName,
        phone: vacatedTenant.phone,
        joiningDate: vacatedTenant.joiningDate,
        leavingDate: vacatedTenant.leavingDate,
        status: vacatedTenant.status,
        totalStayDays: Math.ceil((leavingDateObj - new Date(vacatedTenant.joiningDate)) / (1000 * 60 * 60 * 24))
      },
      freedBed: bedInfo,
      pendingPayments: {
        count: pendingPayments.length,
        totalAmount: totalPendingAmount,
        payments: pendingPayments
      },
      warnings
    },
    vacationSummary: {
      vacatedDate: leavingDateObj,
      reason,
      bedFreed: bedInfo !== null,
      pendingPaymentsExist: pendingPayments.length > 0,
      stayDuration: Math.ceil((leavingDateObj - new Date(tenant.joiningDate)) / (1000 * 60 * 60 * 24)) + ' days'
    }
  });
});

module.exports = {
  getTenants,
  getTenant,
  createTenant,
  updateTenant,
  deleteTenant,
  assignBed,
  vacateTenant
}; 