const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middleware/error.middleware');

const prisma = new PrismaClient();

// GET /api/payments - Get all payments
const getPayments = asyncHandler(async (req, res) => {
  const { propertyId, tenantId, status, paymentType, month, year } = req.query;
  
  const where = {};
  
  if (propertyId) {
    where.propertyId = propertyId;
  }
  
  if (tenantId) {
    where.tenantId = tenantId;
  }
  
  if (status) {
    where.status = status;
  }
  
  if (paymentType) {
    where.paymentType = paymentType;
  }
  
  if (month) {
    where.month = month;
  }
  
  if (year) {
    where.year = parseInt(year);
  }

  const payments = await prisma.payment.findMany({
    where,
    include: {
      tenant: {
        select: {
          id: true,
          tenantId: true,
          fullName: true,
          phone: true,
          email: true
        }
      },
      bed: {
        select: {
          id: true,
          bedNumber: true,
          room: {
            select: {
              id: true,
              roomNumber: true,
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
          name: true
        }
      },
      createdBy: {
        select: {
          id: true,
          fullName: true
        }
      }
    },
    orderBy: [
      { status: 'asc' },
      { dueDate: 'desc' }
    ]
  });

  res.status(200).json({
    success: true,
    data: payments,
    count: payments.length
  });
});

// GET /api/payments/:id - Get payment by ID
const getPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      tenant: {
        select: {
          id: true,
          tenantId: true,
          fullName: true,
          phone: true,
          email: true,
          address: true
        }
      },
      bed: {
        select: {
          id: true,
          bedNumber: true,
          rent: true,
          deposit: true,
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
        }
      },
      property: {
        select: {
          id: true,
          name: true,
          address: true
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

  if (!payment) {
    return res.status(404).json({
      success: false,
      error: { message: 'Payment not found' }
    });
  }

  res.status(200).json({
    success: true,
    data: payment
  });
});

// POST /api/payments - Create new payment
const createPayment = asyncHandler(async (req, res) => {
  const {
    paymentId,
    amount,
    paymentType,
    paymentMethod = 'CASH',
    dueDate,
    paidDate,
    status = 'PENDING',
    month,
    year,
    description,
    lateFee = 0,
    discount = 0,
    tenantId,
    bedId,
    propertyId,
    transactionId
  } = req.body;

  // Validation
  if (!paymentId || !amount || !paymentType || !dueDate || !tenantId || !propertyId) {
    return res.status(400).json({
      success: false,
      error: { message: 'Required fields: paymentId, amount, paymentType, dueDate, tenantId, propertyId' }
    });
  }

  // Check if paymentId already exists
  const existingPayment = await prisma.payment.findUnique({
    where: { paymentId }
  });

  if (existingPayment) {
    return res.status(400).json({
      success: false,
      error: { message: 'Payment ID already exists' }
    });
  }

  // Check if tenant exists
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });

  if (!tenant) {
    return res.status(400).json({
      success: false,
      error: { message: 'Tenant not found' }
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

  // If bedId is provided, check if bed exists
  if (bedId) {
    const bed = await prisma.bed.findUnique({
      where: { id: bedId }
    });

    if (!bed) {
      return res.status(400).json({
        success: false,
        error: { message: 'Bed not found' }
      });
    }
  }

  // Generate month and year if not provided
  const paymentDueDate = new Date(dueDate);
  const paymentMonth = month || `${paymentDueDate.getFullYear()}-${(paymentDueDate.getMonth() + 1).toString().padStart(2, '0')}`;
  const paymentYear = year || paymentDueDate.getFullYear();

  const payment = await prisma.payment.create({
    data: {
      paymentId,
      amount: parseFloat(amount),
      paymentType,
      paymentMethod,
      dueDate: new Date(dueDate),
      paidDate: paidDate ? new Date(paidDate) : null,
      status,
      month: paymentMonth,
      year: paymentYear,
      description,
      lateFee: parseFloat(lateFee),
      discount: parseFloat(discount),
      transactionId,
      tenantId,
      bedId,
      propertyId,
      createdById: req.user.id,
    },
    include: {
      tenant: {
        select: {
          id: true,
          tenantId: true,
          fullName: true,
          phone: true
        }
      },
      bed: {
        select: {
          id: true,
          bedNumber: true,
          room: {
            select: {
              roomNumber: true
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

  res.status(201).json({
    success: true,
    data: payment,
    message: 'Payment created successfully'
  });
});

// PUT /api/payments/:id - Update payment
const updatePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    amount,
    paymentMethod,
    paidDate,
    status,
    description,
    lateFee,
    discount,
    transactionId
  } = req.body;

  // Check if payment exists
  const existingPayment = await prisma.payment.findUnique({
    where: { id }
  });

  if (!existingPayment) {
    return res.status(404).json({
      success: false,
      error: { message: 'Payment not found' }
    });
  }

  const updatedPayment = await prisma.payment.update({
    where: { id },
    data: {
      ...(amount && { amount: parseFloat(amount) }),
      ...(paymentMethod && { paymentMethod }),
      ...(paidDate !== undefined && { paidDate: paidDate ? new Date(paidDate) : null }),
      ...(status && { status }),
      ...(description !== undefined && { description }),
      ...(lateFee !== undefined && { lateFee: parseFloat(lateFee) }),
      ...(discount !== undefined && { discount: parseFloat(discount) }),
      ...(transactionId !== undefined && { transactionId })
    },
    include: {
      tenant: {
        select: {
          id: true,
          tenantId: true,
          fullName: true,
          phone: true
        }
      },
      bed: {
        select: {
          id: true,
          bedNumber: true,
          room: {
            select: {
              roomNumber: true,
              floor: {
                select: {
                  name: true
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

  res.status(200).json({
    success: true,
    data: updatedPayment,
    message: 'Payment updated successfully'
  });
});

// DELETE /api/payments/:id - Delete payment
const deletePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if payment exists
  const payment = await prisma.payment.findUnique({
    where: { id }
  });

  if (!payment) {
    return res.status(404).json({
      success: false,
      error: { message: 'Payment not found' }
    });
  }

  // Check if payment is already paid
  if (payment.status === 'PAID') {
    return res.status(400).json({
      success: false,
      error: { message: 'Cannot delete paid payment. Please contact administrator.' }
    });
  }

  // Delete payment
  await prisma.payment.delete({
    where: { id }
  });

  res.status(200).json({
    success: true,
    message: 'Payment deleted successfully'
  });
});

// PUT /api/payments/:id/mark-paid - Mark payment as paid
const markPaymentPaid = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { paymentMethod, transactionId, paidDate } = req.body;

  // Check if payment exists
  const payment = await prisma.payment.findUnique({
    where: { id }
  });

  if (!payment) {
    return res.status(404).json({
      success: false,
      error: { message: 'Payment not found' }
    });
  }

  if (payment.status === 'PAID') {
    return res.status(400).json({
      success: false,
      error: { message: 'Payment is already marked as paid' }
    });
  }

  const updatedPayment = await prisma.payment.update({
    where: { id },
    data: {
      status: 'PAID',
      paidDate: paidDate ? new Date(paidDate) : new Date(),
      ...(paymentMethod && { paymentMethod }),
      ...(transactionId && { transactionId })
    },
    include: {
      tenant: {
        select: {
          id: true,
          tenantId: true,
          fullName: true,
          phone: true
        }
      },
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
  });

  res.status(200).json({
    success: true,
    data: updatedPayment,
    message: 'Payment marked as paid successfully'
  });
});

// GET /api/payments/stats - Get payment statistics
const getPaymentStats = asyncHandler(async (req, res) => {
  const { propertyId, year } = req.query;
  
  const currentYear = year ? parseInt(year) : new Date().getFullYear();
  const where = {
    year: currentYear,
    ...(propertyId && { propertyId })
  };

  const [totalPayments, paidPayments, pendingPayments, overduePayments] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.count({ where: { ...where, status: 'PAID' } }),
    prisma.payment.count({ where: { ...where, status: 'PENDING' } }),
    prisma.payment.count({ 
      where: { 
        ...where, 
        status: 'PENDING',
        dueDate: { lt: new Date() }
      } 
    })
  ]);

  const [totalRevenue, paidRevenue, pendingRevenue] = await Promise.all([
    prisma.payment.aggregate({
      where,
      _sum: { amount: true }
    }),
    prisma.payment.aggregate({
      where: { ...where, status: 'PAID' },
      _sum: { amount: true }
    }),
    prisma.payment.aggregate({
      where: { ...where, status: 'PENDING' },
      _sum: { amount: true }
    })
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalPayments,
      paidPayments,
      pendingPayments,
      overduePayments,
      totalRevenue: totalRevenue._sum.amount || 0,
      paidRevenue: paidRevenue._sum.amount || 0,
      pendingRevenue: pendingRevenue._sum.amount || 0,
      year: currentYear
    }
  });
});

module.exports = {
  getPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
  markPaymentPaid,
  getPaymentStats
}; 