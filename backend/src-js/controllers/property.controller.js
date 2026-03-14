const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middleware/error.middleware');
const webSocketService = require('../services/websocket.service');

const prisma = new PrismaClient();
const VALID_PROPERTY_TYPES = new Set(['Men', 'Women', 'Co-ed']);
const PINCODE_REGEX = /^\d{6}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\-()\s]{7,20}$/;
const INDIA_STATE_OPTIONS = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry'
];
const INDIA_STATES = new Set(INDIA_STATE_OPTIONS);
const STATE_ALIAS_MAP = {
  nctofdelhi: 'Delhi',
  delhi: 'Delhi',
  orissa: 'Odisha',
  odisha: 'Odisha',
  pondicherry: 'Puducherry',
  puducherry: 'Puducherry',
  dadraandnagarhavelianddamananddiu: 'Dadra and Nagar Haveli and Daman and Diu'
};

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const cleanString = (value) => (typeof value === 'string' ? value.trim() : value);
const normalizeTextToken = (value) =>
  cleanString(value)
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, '') || '';

const toInteger = (value) => {
  if (value === '' || value === null || value === undefined) return undefined;
  const number = Number(value);
  if (!Number.isInteger(number)) return null;
  return number;
};

const toNumber = (value) => {
  if (value === '' || value === null || value === undefined) return undefined;
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return number;
};

const normalizeWebsite = (value) => {
  const text = cleanString(value);
  if (!text) return null;
  const candidate = /^https?:\/\//i.test(text) ? text : `https://${text}`;
  try {
    return new URL(candidate).toString();
  } catch (_error) {
    return undefined;
  }
};

const sanitizeAmenities = (amenities) =>
  Array.isArray(amenities)
    ? [...new Set(amenities.map((item) => cleanString(item)).filter(Boolean))]
    : [];

const normalizeIndianState = (value) => {
  const text = cleanString(value);
  if (!text) return '';

  if (INDIA_STATES.has(text)) {
    return text;
  }

  const token = normalizeTextToken(text);
  if (STATE_ALIAS_MAP[token]) {
    return STATE_ALIAS_MAP[token];
  }

  for (const option of INDIA_STATE_OPTIONS) {
    if (normalizeTextToken(option) === token) {
      return option;
    }
  }

  return text;
};

const validatePropertyPayload = (input, options = {}) => {
  const { isUpdate = false, existingProperty = null } = options;
  const errors = [];
  const payload = {};

  const shouldValidate = (field) => !isUpdate || hasOwn(input, field);

  if (shouldValidate('name')) {
    const name = cleanString(input.name);
    if (!name) errors.push('Property name is required.');
    else payload.name = name;
  }

  if (shouldValidate('type')) {
    const type = cleanString(input.type);
    if (!type || !VALID_PROPERTY_TYPES.has(type)) {
      errors.push('Property type must be Men, Women, or Co-ed.');
    } else {
      payload.type = type;
    }
  }

  if (shouldValidate('address')) {
    const address = cleanString(input.address);
    if (!address) errors.push('Address is required.');
    else payload.address = address;
  }

  if (shouldValidate('city')) {
    const city = cleanString(input.city);
    if (!city) errors.push('City is required.');
    else payload.city = city;
  }

  if (shouldValidate('state')) {
    const state = normalizeIndianState(input.state);
    if (!state) {
      errors.push('State is required.');
    } else if (!INDIA_STATES.has(state)) {
      errors.push('Select a valid Indian state/UT.');
    } else {
      payload.state = state;
    }
  }

  if (shouldValidate('pincode')) {
    const pincode = cleanString(input.pincode);
    if (!pincode) {
      errors.push('Pincode is required.');
    } else if (!PINCODE_REGEX.test(pincode)) {
      errors.push('Pincode must be a 6-digit number.');
    } else {
      payload.pincode = pincode;
    }
  }

  if (shouldValidate('totalBeds')) {
    const totalBeds = toInteger(input.totalBeds);
    if (totalBeds === null || totalBeds < 1) {
      errors.push('Total beds must be at least 1.');
    } else {
      payload.totalBeds = totalBeds;
    }
  }

  if (shouldValidate('monthlyRent')) {
    const monthlyRent = toNumber(input.monthlyRent);
    if (monthlyRent === null || monthlyRent <= 0) {
      errors.push('Monthly rent must be greater than 0.');
    } else {
      payload.monthlyRent = monthlyRent;
    }
  }

  if (shouldValidate('totalFloors')) {
    const totalFloors = toInteger(input.totalFloors);
    if (totalFloors === null || totalFloors < 0) {
      errors.push('Total floors must be 0 or more.');
    } else if (totalFloors !== undefined) {
      payload.totalFloors = totalFloors;
    }
  }

  if (shouldValidate('totalRooms')) {
    const totalRooms = toInteger(input.totalRooms);
    if (totalRooms === null || totalRooms < 0) {
      errors.push('Total rooms must be 0 or more.');
    } else if (totalRooms !== undefined) {
      payload.totalRooms = totalRooms;
    }
  }

  if (shouldValidate('securityDeposit')) {
    const securityDeposit = toNumber(input.securityDeposit);
    if (securityDeposit === null || securityDeposit < 0) {
      errors.push('Security deposit cannot be negative.');
    } else if (securityDeposit !== undefined) {
      payload.securityDeposit = securityDeposit;
    }
  }

  if (shouldValidate('phone')) {
    const phone = cleanString(input.phone);
    if (!phone) {
      payload.phone = null;
    } else if (!PHONE_REGEX.test(phone)) {
      errors.push('Phone number format is invalid.');
    } else {
      payload.phone = phone;
    }
  }

  if (shouldValidate('email')) {
    const email = cleanString(input.email);
    if (!email) {
      payload.email = null;
    } else if (!EMAIL_REGEX.test(email)) {
      errors.push('Email format is invalid.');
    } else {
      payload.email = email.toLowerCase();
    }
  }

  if (shouldValidate('website')) {
    const normalizedWebsite = normalizeWebsite(input.website);
    if (normalizedWebsite === undefined) {
      errors.push('Website URL format is invalid.');
    } else {
      payload.website = normalizedWebsite;
    }
  }

  if (shouldValidate('description')) {
    const description = cleanString(input.description);
    if (description && description.length > 500) {
      errors.push('Description should be 500 characters or fewer.');
    } else {
      payload.description = description || null;
    }
  }

  if (shouldValidate('amenities')) {
    payload.amenities = sanitizeAmenities(input.amenities);
  } else if (!isUpdate) {
    payload.amenities = [];
  }

  const resolvedTotalFloors =
    payload.totalFloors !== undefined ? payload.totalFloors : existingProperty?.totalFloors;
  const resolvedTotalRooms =
    payload.totalRooms !== undefined ? payload.totalRooms : existingProperty?.totalRooms;
  const resolvedTotalBeds =
    payload.totalBeds !== undefined ? payload.totalBeds : existingProperty?.totalBeds;

  if (
    resolvedTotalRooms !== undefined &&
    resolvedTotalBeds !== undefined &&
    resolvedTotalRooms !== null &&
    resolvedTotalBeds !== null &&
    resolvedTotalRooms > resolvedTotalBeds
  ) {
    errors.push('Total rooms cannot be greater than total beds.');
  }

  if (
    resolvedTotalFloors !== undefined &&
    resolvedTotalRooms !== undefined &&
    resolvedTotalFloors !== null &&
    resolvedTotalRooms !== null &&
    resolvedTotalFloors > 0 &&
    resolvedTotalRooms > 0 &&
    resolvedTotalRooms < resolvedTotalFloors
  ) {
    errors.push('Total rooms should be greater than or equal to total floors.');
  }

  return { errors, payload };
};

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
              beds: {
                include: {
                  tenant: {
                    select: {
                      id: true,
                      status: true
                    }
                  }
                }
              }
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
              beds: {
                include: {
                  tenant: {
                    select: {
                      id: true,
                      status: true
                    }
                  }
                }
              }
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

  // Check if user is authenticated
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required - please login first' }
    });
  }
  
  const userId = req.user.id;
  const { errors, payload } = validatePropertyPayload(req.body, { isUpdate: false });

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: { message: errors[0], details: errors }
    });
  }

  try {
    const property = await prisma.property.create({
      data: {
        ...payload,
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

  const { errors, payload } = validatePropertyPayload(req.body, {
    isUpdate: true,
    existingProperty
  });

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: { message: errors[0], details: errors }
    });
  }

  if (Object.keys(payload).length === 0) {
    return res.status(400).json({
      success: false,
      error: { message: 'No valid fields provided to update.' }
    });
  }

  const property = await prisma.property.update({
    where: { id },
    data: payload
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
