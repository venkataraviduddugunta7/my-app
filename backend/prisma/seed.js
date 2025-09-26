const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@mypg.com',
      username: 'admin',
      password: hashedPassword,
      fullName: 'System Administrator',
      phone: '+91-9999999999',
      role: 'ADMIN',
      subscriptionStatus: 'ACTIVE',
      isActive: true,
      approvedAt: new Date(),
      userSettings: {
        create: {
          theme: 'dark',
          emailNotifications: true,
          smsNotifications: true,
          pushNotifications: true,
        }
      },
      dashboardSettings: {
        create: {
          defaultView: 'cards',
          showNotifications: true,
          autoRefresh: true,
          refreshInterval: 30,
          compactMode: false,
          statsVisible: true,
          activitiesVisible: true,
          chartsVisible: true,
          quickActionsVisible: true,
        }
      }
    }
  });

  console.log('✅ Admin user created:', admin.email);
  console.log('📧 Admin Email: admin@mypg.com');
  console.log('🔑 Admin Password: admin123');
  console.log('');
  console.log('🎯 Database is now ready for real-time use!');
  console.log('🚀 Users who sign up will be in WAITING_APPROVAL status');
  console.log('👨‍💼 Admin can approve/block users from the admin panel');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
