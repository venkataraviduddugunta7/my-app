const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create Users
  console.log('👤 Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const owner = await prisma.user.create({
    data: {
      email: 'owner@pgmanagement.com',
      username: 'owner',
      password: hashedPassword,
      fullName: 'John Doe',
      phone: '+91-9876543210',
      role: 'OWNER',
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@pgmanagement.com',
      username: 'manager',
      password: hashedPassword,
      fullName: 'Jane Smith',
      phone: '+91-9876543211',
      role: 'MANAGER',
    },
  });

  // Create Property
  console.log('🏢 Creating property...');
  const property = await prisma.property.create({
    data: {
      name: 'Green Valley PG',
      address: '123 Main Street, Near Metro Station',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      description: 'Premium PG accommodation with modern amenities',
      totalFloors: 3,
      totalRooms: 12,
      totalBeds: 24,
      ownerId: owner.id,
    },
  });

  // Create Property Settings
  console.log('⚙️ Creating property settings...');
  await prisma.propertySettings.create({
    data: {
      propertyId: property.id,
      termsAndConditions: `
1. Rent must be paid by the 5th of every month
2. No smoking or drinking in the premises
3. Visitors allowed only between 9 AM to 9 PM
4. Keep common areas clean
5. No loud music after 10 PM
6. One month notice required before leaving
7. Security deposit is refundable
8. Any damage to property will be charged
9. Follow all house rules strictly
10. Respect fellow tenants
      `.trim(),
      privacyPolicy: 'We respect your privacy and handle your data securely.',
      rules: [
        'No smoking in rooms',
        'Maintain cleanliness',
        'Respect noise levels',
        'Visitors policy: 9 AM - 9 PM',
        'Monthly rent due by 5th',
      ],
      amenities: [
        'Free WiFi',
        'Power Backup',
        'Water 24/7',
        'Laundry Service',
        'Common Kitchen',
        'TV Room',
        'Security',
        'Housekeeping',
      ],
      contactInfo: {
        phone: '+91-9876543210',
        email: 'contact@greenvalleypg.com',
        address: '123 Main Street, Bangalore',
        emergencyContact: '+91-9876543999',
      },
      paymentSettings: {
        lateFeePercentage: 5,
        gracePeriodDays: 3,
        acceptedMethods: ['CASH', 'UPI', 'BANK_TRANSFER'],
        bankDetails: {
          accountName: 'Green Valley PG',
          accountNumber: '1234567890',
          ifscCode: 'HDFC0001234',
          bankName: 'HDFC Bank',
        },
      },
      notificationSettings: {
        smsEnabled: true,
        emailEnabled: true,
        paymentReminders: true,
        maintenanceAlerts: true,
      },
    },
  });

  // Create Floors
  console.log('🏗️ Creating floors...');
  const groundFloor = await prisma.floor.create({
    data: {
      name: 'Ground Floor',
      floorNumber: 0,
      description: 'Ground floor with reception and common areas',
      totalRooms: 4,
      totalBeds: 8,
      propertyId: property.id,
    },
  });

  const firstFloor = await prisma.floor.create({
    data: {
      name: 'First Floor',
      floorNumber: 1,
      description: 'First floor residential rooms',
      totalRooms: 4,
      totalBeds: 8,
      propertyId: property.id,
    },
  });

  const secondFloor = await prisma.floor.create({
    data: {
      name: 'Second Floor',
      floorNumber: 2,
      description: 'Second floor premium rooms',
      totalRooms: 4,
      totalBeds: 8,
      propertyId: property.id,
    },
  });

  // Create Rooms
  console.log('🚪 Creating rooms...');
  const rooms = [];

  // Ground Floor Rooms
  for (let i = 1; i <= 4; i++) {
    const room = await prisma.room.create({
      data: {
        roomNumber: `G${i.toString().padStart(2, '0')}`,
        name: `Ground Floor Room ${i}`,
        roomType: i <= 2 ? 'SHARED' : 'SINGLE',
        capacity: i <= 2 ? 2 : 1,
        currentBeds: i <= 2 ? 2 : 1,
        rent: i <= 2 ? 8000 : 12000,
        deposit: i <= 2 ? 16000 : 24000,
        description: `Spacious ${i <= 2 ? 'shared' : 'single'} room with attached bathroom`,
        amenities: ['AC', 'WiFi', 'Attached Bathroom', 'Study Table', 'Wardrobe'],
        status: 'AVAILABLE',
        floorId: groundFloor.id,
      },
    });
    rooms.push(room);
  }

  // First Floor Rooms
  for (let i = 1; i <= 4; i++) {
    const room = await prisma.room.create({
      data: {
        roomNumber: `F1${i.toString().padStart(2, '0')}`,
        name: `First Floor Room ${i}`,
        roomType: 'SHARED',
        capacity: 2,
        currentBeds: 2,
        rent: 9000,
        deposit: 18000,
        description: 'Well-ventilated shared room with modern amenities',
        amenities: ['AC', 'WiFi', 'Attached Bathroom', 'Study Table', 'Wardrobe', 'Balcony'],
        status: 'AVAILABLE',
        floorId: firstFloor.id,
      },
    });
    rooms.push(room);
  }

  // Second Floor Rooms (Premium)
  for (let i = 1; i <= 4; i++) {
    const room = await prisma.room.create({
      data: {
        roomNumber: `F2${i.toString().padStart(2, '0')}`,
        name: `Second Floor Premium Room ${i}`,
        roomType: i <= 2 ? 'SINGLE' : 'SHARED',
        capacity: i <= 2 ? 1 : 2,
        currentBeds: i <= 2 ? 1 : 2,
        rent: i <= 2 ? 15000 : 11000,
        deposit: i <= 2 ? 30000 : 22000,
        description: `Premium ${i <= 2 ? 'single' : 'shared'} room with city view`,
        amenities: ['AC', 'WiFi', 'Attached Bathroom', 'Study Table', 'Wardrobe', 'City View', 'Premium Furnishing'],
        status: 'AVAILABLE',
        floorId: secondFloor.id,
      },
    });
    rooms.push(room);
  }

  // Create Beds
  console.log('🛏️ Creating beds...');
  const beds = [];

  for (const room of rooms) {
    for (let bedNum = 1; bedNum <= room.capacity; bedNum++) {
      const bed = await prisma.bed.create({
        data: {
          bedNumber: `B${bedNum}`,
          bedType: 'SINGLE',
          rent: room.rent / room.capacity,
          deposit: room.deposit / room.capacity,
          status: 'AVAILABLE',
          description: `Comfortable single bed with mattress and pillows`,
          roomId: room.id,
        },
      });
      beds.push(bed);
    }
  }

  // Create Tenants
  console.log('👥 Creating tenants...');
  const tenants = [];

  const tenantData = [
    {
      tenantId: 'PG001',
      fullName: 'Rahul Kumar',
      email: 'rahul.kumar@email.com',
      phone: '+91-9876543001',
      alternatePhone: '+91-9876543002',
      emergencyContact: '+91-9876543003',
      address: '456 Park Street, Delhi',
      idProofType: 'AADHAR',
      idProofNumber: '1234-5678-9012',
      occupation: 'Software Engineer',
      company: 'Tech Corp',
      monthlyIncome: 50000,
      securityDeposit: 16000,
      advanceRent: 8000,
    },
    {
      tenantId: 'PG002',
      fullName: 'Priya Sharma',
      email: 'priya.sharma@email.com',
      phone: '+91-9876543004',
      alternatePhone: '+91-9876543005',
      emergencyContact: '+91-9876543006',
      address: '789 Lake View, Mumbai',
      idProofType: 'PAN',
      idProofNumber: 'ABCDE1234F',
      occupation: 'Data Analyst',
      company: 'Analytics Inc',
      monthlyIncome: 45000,
      securityDeposit: 16000,
      advanceRent: 8000,
    },
    {
      tenantId: 'PG003',
      fullName: 'Amit Patel',
      email: 'amit.patel@email.com',
      phone: '+91-9876543007',
      emergencyContact: '+91-9876543008',
      address: '321 Garden Road, Pune',
      idProofType: 'DRIVING_LICENSE',
      idProofNumber: 'DL1420110012345',
      occupation: 'Marketing Executive',
      company: 'Brand Solutions',
      monthlyIncome: 40000,
      securityDeposit: 24000,
      advanceRent: 12000,
    },
    {
      tenantId: 'PG004',
      fullName: 'Sneha Reddy',
      email: 'sneha.reddy@email.com',
      phone: '+91-9876543009',
      alternatePhone: '+91-9876543010',
      emergencyContact: '+91-9876543011',
      address: '654 Tech Park, Hyderabad',
      idProofType: 'AADHAR',
      idProofNumber: '5678-9012-3456',
      occupation: 'UI/UX Designer',
      company: 'Design Studio',
      monthlyIncome: 48000,
      securityDeposit: 18000,
      advanceRent: 9000,
    },
    {
      tenantId: 'PG005',
      fullName: 'Vikash Singh',
      email: 'vikash.singh@email.com',
      phone: '+91-9876543012',
      emergencyContact: '+91-9876543013',
      address: '987 Business District, Chennai',
      idProofType: 'PASSPORT',
      idProofNumber: 'A1234567',
      occupation: 'Business Analyst',
      company: 'Consulting Group',
      monthlyIncome: 55000,
      securityDeposit: 30000,
      advanceRent: 15000,
    },
  ];

  for (let i = 0; i < tenantData.length; i++) {
    const data = tenantData[i];
    const availableBed = beds.find(bed => bed.status === 'AVAILABLE');
    
    if (availableBed) {
      const tenant = await prisma.tenant.create({
        data: {
          ...data,
          joiningDate: new Date(2024, 0, 15 + i * 10), // Staggered joining dates
          termsAccepted: true,
          termsAcceptedAt: new Date(2024, 0, 10 + i * 10),
          propertyId: property.id,
          createdById: owner.id,
        },
      });

      // Assign bed to tenant
      await prisma.bed.update({
        where: { id: availableBed.id },
        data: {
          tenantId: tenant.id,
          status: 'OCCUPIED',
        },
      });

      // Update room status if all beds are occupied
      const room = rooms.find(r => r.id === availableBed.roomId);
      const roomBeds = beds.filter(b => b.roomId === room.id);
      const occupiedBeds = roomBeds.filter(b => b.status === 'OCCUPIED').length;
      
      if (occupiedBeds === room.capacity) {
        await prisma.room.update({
          where: { id: room.id },
          data: { status: 'OCCUPIED' },
        });
      }

      tenants.push(tenant);
      
      // Mark bed as occupied for next iteration
      availableBed.status = 'OCCUPIED';
    }
  }

  // Create Payments
  console.log('💰 Creating payments...');
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  for (const tenant of tenants) {
    const tenantBed = beds.find(bed => bed.tenantId === tenant.id);
    
    if (tenantBed) {
      // Create security deposit payment
      await prisma.payment.create({
        data: {
          paymentId: `PAY-${tenant.tenantId}-DEPOSIT`,
          amount: tenant.securityDeposit,
          paymentType: 'DEPOSIT',
          paymentMethod: 'BANK_TRANSFER',
          dueDate: tenant.joiningDate,
          paidDate: tenant.joiningDate,
          status: 'PAID',
          month: `${tenant.joiningDate.getFullYear()}-${(tenant.joiningDate.getMonth() + 1).toString().padStart(2, '0')}`,
          year: tenant.joiningDate.getFullYear(),
          description: 'Security deposit payment',
          propertyId: property.id,
          tenantId: tenant.id,
          bedId: tenantBed.id,
          createdById: owner.id,
        },
      });

      // Create rent payments for the past few months
      for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
        const paymentMonth = new Date(currentYear, currentMonth - monthOffset, 1);
        const dueDate = new Date(currentYear, currentMonth - monthOffset, 5);
        const isPaid = monthOffset > 0; // Current month is pending, previous months are paid
        
        await prisma.payment.create({
          data: {
            paymentId: `PAY-${tenant.tenantId}-${paymentMonth.getFullYear()}${(paymentMonth.getMonth() + 1).toString().padStart(2, '0')}`,
            amount: tenantBed.rent,
            paymentType: 'RENT',
            paymentMethod: isPaid ? 'UPI' : 'CASH',
            dueDate: dueDate,
            paidDate: isPaid ? new Date(dueDate.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000) : null, // Random date within 5 days of due date
            status: isPaid ? 'PAID' : 'PENDING',
            month: `${paymentMonth.getFullYear()}-${(paymentMonth.getMonth() + 1).toString().padStart(2, '0')}`,
            year: paymentMonth.getFullYear(),
            description: `Monthly rent for ${paymentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
            transactionId: isPaid ? `TXN${Math.random().toString(36).substr(2, 9).toUpperCase()}` : null,
            propertyId: property.id,
            tenantId: tenant.id,
            bedId: tenantBed.id,
            createdById: owner.id,
          },
        });
      }
    }
  }

  // Create Notices
  console.log('📢 Creating notices...');
  const notices = [
    {
      title: 'Monthly Maintenance Schedule',
      content: 'Dear Residents,\n\nWe will be conducting routine maintenance of water pumps and electrical systems on Saturday, 15th January from 10 AM to 2 PM. There might be temporary water and power disruptions. We apologize for any inconvenience.\n\nRegards,\nManagement',
      noticeType: 'MAINTENANCE',
      priority: 'HIGH',
      isPublished: true,
      publishDate: new Date(2024, 0, 10),
      expiryDate: new Date(2024, 0, 20),
    },
    {
      title: 'Rent Payment Reminder',
      content: 'This is a friendly reminder that rent for January 2024 is due on 5th January. Please ensure timely payment to avoid late fees.\n\nAccepted payment methods:\n- Cash\n- UPI\n- Bank Transfer\n\nFor any queries, contact the office.',
      noticeType: 'PAYMENT_REMINDER',
      priority: 'MEDIUM',
      isPublished: true,
      publishDate: new Date(2024, 0, 1),
      expiryDate: new Date(2024, 0, 10),
    },
    {
      title: 'New House Rules',
      content: 'We are implementing new house rules effective from 1st February:\n\n1. Visitor timings: 9 AM to 9 PM only\n2. No loud music after 10 PM\n3. Keep common areas clean\n4. Smoking is strictly prohibited\n\nPlease cooperate for a better living environment.',
      noticeType: 'RULE_UPDATE',
      priority: 'HIGH',
      isPublished: true,
      publishDate: new Date(2024, 0, 25),
      expiryDate: new Date(2024, 1, 15),
    },
    {
      title: 'Republic Day Celebration',
      content: 'Join us for Republic Day celebration on 26th January at 8 AM in the common area. We will have flag hoisting ceremony followed by breakfast.\n\nAll residents are invited!',
      noticeType: 'EVENT',
      priority: 'LOW',
      isPublished: true,
      publishDate: new Date(2024, 0, 20),
      expiryDate: new Date(2024, 0, 26),
    },
  ];

  for (const noticeData of notices) {
    await prisma.notice.create({
      data: {
        ...noticeData,
        propertyId: property.id,
        createdById: owner.id,
        targetTenants: {
          connect: tenants.map(t => ({ id: t.id })),
        },
      },
    });
  }

  // Create Documents
  console.log('📄 Creating documents...');
  const documents = [
    {
      title: 'Property Agreement Template',
      description: 'Standard rental agreement template for new tenants',
      documentType: 'AGREEMENT',
      filePath: '/documents/agreement-template.pdf',
      fileName: 'agreement-template.pdf',
      fileSize: 245760, // 240 KB
      mimeType: 'application/pdf',
      tags: ['agreement', 'template', 'legal'],
      isPublic: false,
    },
    {
      title: 'House Rules and Regulations',
      description: 'Complete list of house rules and regulations for residents',
      documentType: 'POLICY',
      filePath: '/documents/house-rules.pdf',
      fileName: 'house-rules.pdf',
      fileSize: 184320, // 180 KB
      mimeType: 'application/pdf',
      tags: ['rules', 'policy', 'residents'],
      isPublic: true,
    },
    {
      title: 'Fire Safety Guidelines',
      description: 'Emergency procedures and fire safety guidelines',
      documentType: 'POLICY',
      filePath: '/documents/fire-safety.pdf',
      fileName: 'fire-safety.pdf',
      fileSize: 512000, // 500 KB
      mimeType: 'application/pdf',
      tags: ['safety', 'emergency', 'fire'],
      isPublic: true,
      expiryDate: new Date(2025, 11, 31),
    },
    {
      title: 'Property Insurance Certificate',
      description: 'Current property insurance certificate and coverage details',
      documentType: 'INSURANCE',
      filePath: '/documents/insurance-cert.pdf',
      fileName: 'insurance-certificate.pdf',
      fileSize: 327680, // 320 KB
      mimeType: 'application/pdf',
      tags: ['insurance', 'certificate', 'coverage'],
      isPublic: false,
      expiryDate: new Date(2024, 11, 31),
    },
    {
      title: 'Maintenance Service Contracts',
      description: 'Service contracts for cleaning, security, and maintenance',
      documentType: 'MAINTENANCE',
      filePath: '/documents/maintenance-contracts.pdf',
      fileName: 'maintenance-contracts.pdf',
      fileSize: 409600, // 400 KB
      mimeType: 'application/pdf',
      tags: ['maintenance', 'contracts', 'services'],
      isPublic: false,
    },
  ];

  for (const docData of documents) {
    await prisma.document.create({
      data: {
        ...docData,
        propertyId: property.id,
        createdById: owner.id,
      },
    });
  }

  // Create some maintenance requests
  console.log('🔧 Creating maintenance requests...');
  const maintenanceRequests = [
    {
      title: 'AC not working in Room G01',
      description: 'The air conditioner in room G01 is not cooling properly. Needs immediate attention.',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      requestedBy: tenants[0]?.id || 'system',
      assignedTo: manager.id,
      cost: 2500,
    },
    {
      title: 'Water leakage in F101 bathroom',
      description: 'There is water leakage from the bathroom ceiling in room F101.',
      priority: 'URGENT',
      status: 'COMPLETED',
      requestedBy: tenants[1]?.id || 'system',
      assignedTo: manager.id,
      cost: 1800,
      completedAt: new Date(2024, 0, 20),
    },
    {
      title: 'WiFi connectivity issues',
      description: 'Internet connection is slow on the second floor.',
      priority: 'MEDIUM',
      status: 'PENDING',
      requestedBy: tenants[2]?.id || 'system',
    },
  ];

  for (const reqData of maintenanceRequests) {
    await prisma.maintenanceRequest.create({
      data: reqData,
    });
  }

  // Update property totals
  console.log('📊 Updating property statistics...');
  const totalFloors = await prisma.floor.count({ where: { propertyId: property.id } });
  const totalRooms = await prisma.room.count({ 
    where: { floor: { propertyId: property.id } } 
  });
  const totalBeds = await prisma.bed.count({ 
    where: { room: { floor: { propertyId: property.id } } } 
  });

  await prisma.property.update({
    where: { id: property.id },
    data: {
      totalFloors,
      totalRooms,
      totalBeds,
    },
  });

  // Update floor totals
  for (const floor of [groundFloor, firstFloor, secondFloor]) {
    const floorRooms = await prisma.room.count({ where: { floorId: floor.id } });
    const floorBeds = await prisma.bed.count({ 
      where: { room: { floorId: floor.id } } 
    });
    
    await prisma.floor.update({
      where: { id: floor.id },
      data: {
        totalRooms: floorRooms,
        totalBeds: floorBeds,
      },
    });
  }

  console.log('✅ Database seeding completed successfully!');
  console.log(`
📊 Summary:
- Users: 2
- Properties: 1
- Floors: 3
- Rooms: 12
- Beds: 24
- Tenants: ${tenants.length}
- Payments: ${tenants.length * 4} (deposit + 3 months rent)
- Notices: 4
- Documents: 5
- Maintenance Requests: 3

🔐 Login Credentials:
Owner: owner@pgmanagement.com / password123
Manager: manager@pgmanagement.com / password123
  `);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 