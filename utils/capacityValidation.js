/**
 * Capacity Validation Utilities
 * Ensures floors, rooms, and beds don't exceed property capacity limits
 */

/**
 * Calculate current usage for a property
 * @param {Object} property - Property object with floors, rooms, beds
 * @returns {Object} Current usage statistics
 */
export const calculateCurrentUsage = (property) => {
  if (!property) {
    return { floors: 0, rooms: 0, beds: 0 };
  }

  const floors = property.floors || [];
  const rooms = floors.flatMap(floor => floor.rooms || []);
  const beds = rooms.flatMap(room => room.beds || []);

  return {
    floors: floors.length,
    rooms: rooms.length,
    beds: beds.length,
    occupiedBeds: beds.filter(bed => bed.status === 'OCCUPIED').length
  };
};

/**
 * Validate if adding floors/rooms/beds would exceed capacity
 * @param {Object} property - Property object
 * @param {Object} newItem - New item to add (floor/room/bed)
 * @param {string} itemType - Type of item ('floor', 'room', 'bed')
 * @returns {Object} Validation result
 */
export const validateCapacity = (property, newItem, itemType) => {
  const currentUsage = calculateCurrentUsage(property);
  const { totalFloors, totalRooms, totalBeds } = property;

  const validation = {
    isValid: true,
    errors: [],
    warnings: []
  };

  switch (itemType) {
    case 'floor':
      if (currentUsage.floors >= totalFloors) {
        validation.isValid = false;
        validation.errors.push(`Cannot add more floors. Property capacity is ${totalFloors} floors.`);
      }
      break;

    case 'room':
      if (currentUsage.rooms >= totalRooms) {
        validation.isValid = false;
        validation.errors.push(`Cannot add more rooms. Property capacity is ${totalRooms} rooms.`);
      }
      break;

    case 'bed':
      if (currentUsage.beds >= totalBeds) {
        validation.isValid = false;
        validation.errors.push(`Cannot add more beds. Property capacity is ${totalBeds} beds.`);
      }
      break;

    default:
      validation.isValid = false;
      validation.errors.push('Invalid item type for capacity validation.');
  }

  // Add warnings for approaching capacity limits
  if (itemType === 'floor' && currentUsage.floors >= totalFloors * 0.8) {
    validation.warnings.push(`Approaching floor capacity limit (${currentUsage.floors}/${totalFloors})`);
  }
  if (itemType === 'room' && currentUsage.rooms >= totalRooms * 0.8) {
    validation.warnings.push(`Approaching room capacity limit (${currentUsage.rooms}/${totalRooms})`);
  }
  if (itemType === 'bed' && currentUsage.beds >= totalBeds * 0.8) {
    validation.warnings.push(`Approaching bed capacity limit (${currentUsage.beds}/${totalBeds})`);
  }

  return validation;
};

/**
 * Get capacity utilization percentage
 * @param {Object} property - Property object
 * @returns {Object} Utilization percentages
 */
export const getCapacityUtilization = (property) => {
  const currentUsage = calculateCurrentUsage(property);
  const { totalFloors, totalRooms, totalBeds } = property;

  return {
    floors: totalFloors > 0 ? Math.round((currentUsage.floors / totalFloors) * 100) : 0,
    rooms: totalRooms > 0 ? Math.round((currentUsage.rooms / totalRooms) * 100) : 0,
    beds: totalBeds > 0 ? Math.round((currentUsage.beds / totalBeds) * 100) : 0,
    occupiedBeds: totalBeds > 0 ? Math.round((currentUsage.occupiedBeds / totalBeds) * 100) : 0
  };
};

/**
 * Get capacity status (good, warning, critical)
 * @param {Object} property - Property object
 * @returns {Object} Capacity status for each type
 */
export const getCapacityStatus = (property) => {
  const utilization = getCapacityUtilization(property);
  
  const getStatus = (percentage) => {
    if (percentage >= 100) return 'critical';
    if (percentage >= 80) return 'warning';
    return 'good';
  };

  return {
    floors: getStatus(utilization.floors),
    rooms: getStatus(utilization.rooms),
    beds: getStatus(utilization.beds)
  };
};

/**
 * Check if property capacity can be updated
 * @param {Object} property - Current property
 * @param {Object} newCapacity - New capacity values
 * @returns {Object} Validation result
 */
export const validateCapacityUpdate = (property, newCapacity) => {
  const currentUsage = calculateCurrentUsage(property);
  const validation = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Check if new capacity is less than current usage
  if (newCapacity.totalFloors < currentUsage.floors) {
    validation.isValid = false;
    validation.errors.push(`Cannot reduce floors to ${newCapacity.totalFloors}. Currently using ${currentUsage.floors} floors.`);
  }

  if (newCapacity.totalRooms < currentUsage.rooms) {
    validation.isValid = false;
    validation.errors.push(`Cannot reduce rooms to ${newCapacity.totalRooms}. Currently using ${currentUsage.rooms} rooms.`);
  }

  if (newCapacity.totalBeds < currentUsage.beds) {
    validation.isValid = false;
    validation.errors.push(`Cannot reduce beds to ${newCapacity.totalBeds}. Currently using ${currentUsage.beds} beds.`);
  }

  return validation;
};

/**
 * Get capacity summary for display
 * @param {Object} property - Property object
 * @returns {Object} Formatted capacity summary
 */
export const getCapacitySummary = (property) => {
  const currentUsage = calculateCurrentUsage(property);
  const utilization = getCapacityUtilization(property);
  const status = getCapacityStatus(property);

  return {
    floors: {
      current: currentUsage.floors,
      total: property.totalFloors,
      percentage: utilization.floors,
      status: status.floors
    },
    rooms: {
      current: currentUsage.rooms,
      total: property.totalRooms,
      percentage: utilization.rooms,
      status: status.rooms
    },
    beds: {
      current: currentUsage.beds,
      total: property.totalBeds,
      percentage: utilization.beds,
      status: status.beds,
      occupied: currentUsage.occupiedBeds
    }
  };
};
