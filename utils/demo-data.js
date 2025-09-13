// Demo data for the application

export const DEMO_PROPERTY = {
  id: 'demo-property-1',
  name: 'Sunrise PG',
  address: '123 Main Street, City',
  totalBeds: 24,
  occupiedBeds: 21,
  floors: 3,
  rooms: 8,
  amenities: ['WiFi', 'AC', 'Hot Water', 'Laundry', 'Kitchen', 'Security'],
  monthlyRent: 8000,
  securityDeposit: 16000
};

export const DEMO_USER = {
  id: 'demo-user-1',
  email: 'demo@pgmanager.com',
  fullName: 'Demo User',
  role: 'OWNER',
  phone: '+91 9876543210'
};

export const DEMO_STATS = {
  totalBeds: 24,
  occupiedBeds: 21,
  availableBeds: 3,
  totalTenants: 21,
  monthlyRevenue: 168000,
  pendingPayments: 24000,
  occupancyRate: 87.5,
  collectionRate: 85.7
};

export const DEMO_BEDS = [
  { id: 'bed-1', number: '101', floor: 1, room: '101', status: 'OCCUPIED', tenant: 'John Doe', rent: 8000 },
  { id: 'bed-2', number: '102', floor: 1, room: '101', status: 'OCCUPIED', tenant: 'Jane Smith', rent: 8000 },
  { id: 'bed-3', number: '103', floor: 1, room: '102', status: 'AVAILABLE', tenant: null, rent: 8500 },
  { id: 'bed-4', number: '104', floor: 1, room: '102', status: 'OCCUPIED', tenant: 'Bob Johnson', rent: 8500 },
  { id: 'bed-5', number: '201', floor: 2, room: '201', status: 'OCCUPIED', tenant: 'Alice Brown', rent: 9000 },
  { id: 'bed-6', number: '202', floor: 2, room: '201', status: 'MAINTENANCE', tenant: null, rent: 9000 },
  { id: 'bed-7', number: '203', floor: 2, room: '202', status: 'OCCUPIED', tenant: 'Charlie Wilson', rent: 8500 },
  { id: 'bed-8', number: '204', floor: 2, room: '202', status: 'AVAILABLE', tenant: null, rent: 8500 },
];

export const DEMO_TENANTS = [
  { 
    id: 'tenant-1', 
    name: 'John Doe', 
    email: 'john@example.com', 
    phone: '+91 9876543211',
    bedNumber: '101',
    moveInDate: '2024-01-15',
    rent: 8000,
    status: 'ACTIVE',
    pendingAmount: 0
  },
  { 
    id: 'tenant-2', 
    name: 'Jane Smith', 
    email: 'jane@example.com', 
    phone: '+91 9876543212',
    bedNumber: '102',
    moveInDate: '2024-02-01',
    rent: 8000,
    status: 'ACTIVE',
    pendingAmount: 8000
  },
  { 
    id: 'tenant-3', 
    name: 'Bob Johnson', 
    email: 'bob@example.com', 
    phone: '+91 9876543213',
    bedNumber: '104',
    moveInDate: '2024-01-20',
    rent: 8500,
    status: 'ACTIVE',
    pendingAmount: 0
  },
  { 
    id: 'tenant-4', 
    name: 'Alice Brown', 
    email: 'alice@example.com', 
    phone: '+91 9876543214',
    bedNumber: '201',
    moveInDate: '2023-12-10',
    rent: 9000,
    status: 'ACTIVE',
    pendingAmount: 0
  },
  { 
    id: 'tenant-5', 
    name: 'Charlie Wilson', 
    email: 'charlie@example.com', 
    phone: '+91 9876543215',
    bedNumber: '203',
    moveInDate: '2024-03-01',
    rent: 8500,
    status: 'ACTIVE',
    pendingAmount: 16000
  },
];

export const DEMO_ACTIVITIES = [
  { id: 1, type: 'payment', message: 'Payment received from John Doe - ₹8,000', time: '2 hours ago', status: 'success' },
  { id: 2, type: 'tenant', message: 'New tenant Charlie Wilson moved in to Bed 203', time: '5 hours ago', status: 'info' },
  { id: 3, type: 'maintenance', message: 'Maintenance request for Bed 202 - AC repair', time: '1 day ago', status: 'warning' },
  { id: 4, type: 'payment', message: 'Payment pending from Jane Smith - ₹8,000', time: '2 days ago', status: 'error' },
  { id: 5, type: 'system', message: 'Monthly report generated successfully', time: '3 days ago', status: 'success' },
];
