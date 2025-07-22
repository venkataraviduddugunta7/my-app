const { PrismaClient } = require('@prisma/client');
const { asyncHandler } = require('../middleware/error.middleware');

const prisma = new PrismaClient();

// GET /api/settings/property/:propertyId - Get property settings
const getPropertySettings = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  const userId = req.user.id;

  console.log('🔧 GET PROPERTY SETTINGS REQUEST:', {
    propertyId,
    userId,
    userEmail: req.user.email
  });

  try {
    // Verify user owns this property
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        ownerId: userId
      }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        error: { message: 'Property not found or access denied' }
      });
    }

    // Get or create property settings
    let settings = await prisma.propertySettings.findUnique({
      where: { propertyId }
    });

    if (!settings) {
      console.log('🔧 Creating default property settings for:', propertyId);
      
      settings = await prisma.propertySettings.create({
        data: {
          propertyId,
          termsAndConditions: null,
          privacyPolicy: null,
          rules: [
            "The tenant agrees to pay rent on or before the 5th of every month.",
            "No smoking or consumption of alcohol is allowed on the premises.",
            "Visitors are allowed only between 9:00 AM to 9:00 PM.",
            "The tenant must maintain cleanliness in their room and common areas.",
            "Any damage to property will be charged from the security deposit."
          ],
          amenities: ['WiFi', 'Parking', 'Security', 'Power Backup'],
          contactInfo: {
            phone: req.user.phone || '',
            email: req.user.email || '',
            emergencyContact: ''
          },
          paymentSettings: {
            rentDueDay: 5,
            lateFeeDays: 3,
            lateFeeAmount: 500,
            acceptedMethods: ['Cash', 'UPI', 'Bank Transfer']
          },
          notificationSettings: {
            emailNotifications: true,
            smsNotifications: false,
            rentReminders: true,
            maintenanceAlerts: true
          }
        }
      });

      console.log('✅ Default property settings created');
    }

    console.log('✅ Sending property settings response');

    res.status(200).json({
      success: true,
      data: settings
    });

  } catch (error) {
    console.error('❌ Error in getPropertySettings:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch property settings' }
    });
  }
});

// PUT /api/settings/property/:propertyId - Update property settings
const updatePropertySettings = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  const userId = req.user.id;
  const updateData = req.body;

  console.log('🔧 UPDATE PROPERTY SETTINGS REQUEST:', {
    propertyId,
    userId,
    updateFields: Object.keys(updateData)
  });

  try {
    // Verify user owns this property
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        ownerId: userId
      }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        error: { message: 'Property not found or access denied' }
      });
    }

    // Update property settings
    const settings = await prisma.propertySettings.upsert({
      where: { propertyId },
      update: updateData,
      create: {
        propertyId,
        ...updateData
      }
    });

    console.log('✅ Property settings updated successfully');

    res.status(200).json({
      success: true,
      data: settings,
      message: 'Property settings updated successfully'
    });

  } catch (error) {
    console.error('❌ Error in updatePropertySettings:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update property settings' }
    });
  }
});

// GET /api/settings/terms/:propertyId - Get terms and conditions for public view
const getTermsAndConditions = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;

  const settings = await prisma.propertySettings.findUnique({
    where: { propertyId },
    select: {
      termsAndConditions: true,
      privacyPolicy: true,
      rules: true,
      amenities: true,
      contactInfo: true
    }
  });

  if (!settings) {
    return res.status(404).json({
      success: false,
      error: { message: 'Terms and conditions not found' }
    });
  }

  res.status(200).json({
    success: true,
    data: settings
  });
});

// GET /api/settings/user - Get user settings/profile
const getUserSettings = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  console.log('🔧 GET USER SETTINGS REQUEST:', {
    userId,
    userEmail: req.user.email
  });

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        properties: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            totalFloors: true,
            totalRooms: true,
            totalBeds: true
          }
        },
        userSettings: true
      }
    });

    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      hasUserSettings: !!user.userSettings
    });

    // If user settings don't exist, create default settings
    let userSettings = user.userSettings;
    if (!userSettings) {
      console.log('🔧 Creating default user settings for user:', userId);
      
      userSettings = await prisma.userSettings.create({
        data: {
          userId,
          theme: 'light',
          language: 'en',
          timezone: 'Asia/Kolkata',
          dateFormat: 'DD/MM/YYYY',
          currency: 'INR',
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
          rentReminders: true,
          maintenanceAlerts: true,
          newTenantAlerts: true,
          paymentAlerts: true,
          systemUpdates: false,
          twoFactorEnabled: false,
          sessionTimeout: 60,
          loginNotifications: true
        }
      });

      console.log('✅ Default user settings created');
    }

    const responseData = {
      ...user,
      userSettings
    };

    console.log('✅ Sending user settings response');

    res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('❌ Error in getUserSettings:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch user settings' }
    });
  }
});

// PUT /api/settings/user - Update user settings/profile
const updateUserSettings = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { 
    fullName, 
    phone, 
    email,
    theme,
    language,
    timezone,
    dateFormat,
    currency,
    emailNotifications,
    smsNotifications,
    pushNotifications,
    rentReminders,
    maintenanceAlerts,
    newTenantAlerts,
    paymentAlerts,
    systemUpdates,
    twoFactorEnabled,
    sessionTimeout,
    loginNotifications
  } = req.body;

  // Check if email is being changed and is unique
  if (email) {
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        id: { not: userId }
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email already in use by another account' }
      });
    }
  }

  // Update user profile
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(fullName && { fullName }),
      ...(phone && { phone }),
      ...(email && { email })
    },
    select: {
      id: true,
      email: true,
      username: true,
      fullName: true,
      phone: true,
      role: true,
      isActive: true,
      updatedAt: true
    }
  });

  // Update user settings if any settings are provided
  const settingsToUpdate = {};
  if (theme !== undefined) settingsToUpdate.theme = theme;
  if (language !== undefined) settingsToUpdate.language = language;
  if (timezone !== undefined) settingsToUpdate.timezone = timezone;
  if (dateFormat !== undefined) settingsToUpdate.dateFormat = dateFormat;
  if (currency !== undefined) settingsToUpdate.currency = currency;
  if (emailNotifications !== undefined) settingsToUpdate.emailNotifications = emailNotifications;
  if (smsNotifications !== undefined) settingsToUpdate.smsNotifications = smsNotifications;
  if (pushNotifications !== undefined) settingsToUpdate.pushNotifications = pushNotifications;
  if (rentReminders !== undefined) settingsToUpdate.rentReminders = rentReminders;
  if (maintenanceAlerts !== undefined) settingsToUpdate.maintenanceAlerts = maintenanceAlerts;
  if (newTenantAlerts !== undefined) settingsToUpdate.newTenantAlerts = newTenantAlerts;
  if (paymentAlerts !== undefined) settingsToUpdate.paymentAlerts = paymentAlerts;
  if (systemUpdates !== undefined) settingsToUpdate.systemUpdates = systemUpdates;
  if (twoFactorEnabled !== undefined) settingsToUpdate.twoFactorEnabled = twoFactorEnabled;
  if (sessionTimeout !== undefined) settingsToUpdate.sessionTimeout = sessionTimeout;
  if (loginNotifications !== undefined) settingsToUpdate.loginNotifications = loginNotifications;

  let userSettings = null;
  if (Object.keys(settingsToUpdate).length > 0) {
    userSettings = await prisma.userSettings.upsert({
      where: { userId },
      update: settingsToUpdate,
      create: {
        userId,
        theme: theme || 'light',
        language: language || 'en',
        timezone: timezone || 'Asia/Kolkata',
        dateFormat: dateFormat || 'DD/MM/YYYY',
        currency: currency || 'INR',
        emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
        smsNotifications: smsNotifications !== undefined ? smsNotifications : false,
        pushNotifications: pushNotifications !== undefined ? pushNotifications : true,
        rentReminders: rentReminders !== undefined ? rentReminders : true,
        maintenanceAlerts: maintenanceAlerts !== undefined ? maintenanceAlerts : true,
        newTenantAlerts: newTenantAlerts !== undefined ? newTenantAlerts : true,
        paymentAlerts: paymentAlerts !== undefined ? paymentAlerts : true,
        systemUpdates: systemUpdates !== undefined ? systemUpdates : false,
        twoFactorEnabled: twoFactorEnabled !== undefined ? twoFactorEnabled : false,
        sessionTimeout: sessionTimeout || 60,
        loginNotifications: loginNotifications !== undefined ? loginNotifications : true
      }
    });
  }

  res.status(200).json({
    success: true,
    data: {
      ...updatedUser,
      ...(userSettings && { userSettings })
    },
    message: 'User profile and settings updated successfully'
  });
});

// GET /api/settings/property/:propertyId/rules - Get property rules
const getPropertyRules = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;

  const settings = await prisma.propertySettings.findUnique({
    where: { propertyId },
    select: {
      rules: true,
      amenities: true
    }
  });

  if (!settings) {
    return res.status(404).json({
      success: false,
      error: { message: 'Property settings not found' }
    });
  }

  res.status(200).json({
    success: true,
    data: {
      rules: settings.rules || [],
      amenities: settings.amenities || []
    }
  });
});

// PUT /api/settings/property/:propertyId/rules - Update property rules
const updatePropertyRules = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  const { rules, amenities } = req.body;

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

  // Update or create settings
  const settings = await prisma.propertySettings.upsert({
    where: { propertyId },
    update: {
      ...(rules !== undefined && { rules }),
      ...(amenities !== undefined && { amenities })
    },
    create: {
      propertyId,
      rules: rules || [],
      amenities: amenities || []
    }
  });

  res.status(200).json({
    success: true,
    data: {
      rules: settings.rules,
      amenities: settings.amenities
    },
    message: 'Property rules and amenities updated successfully'
  });
});

// GET /api/settings/dashboard - Get dashboard settings/preferences
const getDashboardSettings = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get dashboard settings from database
  let dashboardSettings = await prisma.dashboardSettings.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          userSettings: {
            select: {
              theme: true
            }
          }
        }
      }
    }
  });

  // If no settings exist, create default settings
  if (!dashboardSettings) {
    dashboardSettings = await prisma.dashboardSettings.create({
      data: {
        userId,
        defaultView: 'cards',
        showNotifications: true,
        autoRefresh: false,
        refreshInterval: 30,
        defaultProperty: null,
        favoriteCharts: ['occupancy', 'revenue'],
        compactMode: false,
        statsVisible: true,
        activitiesVisible: true,
        chartsVisible: true,
        quickActionsVisible: true
      },
      include: {
        user: {
          select: {
            userSettings: {
              select: {
                theme: true
              }
            }
          }
        }
      }
    });
  }

  // Format response
  const settings = {
    theme: dashboardSettings.user?.userSettings?.theme || 'light',
    defaultView: dashboardSettings.defaultView,
    showNotifications: dashboardSettings.showNotifications,
    autoRefresh: dashboardSettings.autoRefresh,
    refreshInterval: dashboardSettings.refreshInterval,
    defaultProperty: dashboardSettings.defaultProperty,
    favoriteCharts: dashboardSettings.favoriteCharts,
    compactMode: dashboardSettings.compactMode,
    dashboardLayout: {
      stats: dashboardSettings.statsVisible,
      activities: dashboardSettings.activitiesVisible,
      charts: dashboardSettings.chartsVisible,
      quickActions: dashboardSettings.quickActionsVisible
    }
  };

  res.status(200).json({
    success: true,
    data: settings
  });
});

// PUT /api/settings/dashboard - Update dashboard settings/preferences
const updateDashboardSettings = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    defaultView,
    showNotifications,
    autoRefresh,
    refreshInterval,
    defaultProperty,
    favoriteCharts,
    compactMode,
    dashboardLayout
  } = req.body;

  // Update dashboard settings in database
  const dashboardSettings = await prisma.dashboardSettings.upsert({
    where: { userId },
    update: {
      ...(defaultView !== undefined && { defaultView }),
      ...(showNotifications !== undefined && { showNotifications }),
      ...(autoRefresh !== undefined && { autoRefresh }),
      ...(refreshInterval !== undefined && { refreshInterval }),
      ...(defaultProperty !== undefined && { defaultProperty }),
      ...(favoriteCharts !== undefined && { favoriteCharts }),
      ...(compactMode !== undefined && { compactMode }),
      ...(dashboardLayout?.stats !== undefined && { statsVisible: dashboardLayout.stats }),
      ...(dashboardLayout?.activities !== undefined && { activitiesVisible: dashboardLayout.activities }),
      ...(dashboardLayout?.charts !== undefined && { chartsVisible: dashboardLayout.charts }),
      ...(dashboardLayout?.quickActions !== undefined && { quickActionsVisible: dashboardLayout.quickActions })
    },
    create: {
      userId,
      defaultView: defaultView || 'cards',
      showNotifications: showNotifications !== undefined ? showNotifications : true,
      autoRefresh: autoRefresh !== undefined ? autoRefresh : false,
      refreshInterval: refreshInterval || 30,
      defaultProperty,
      favoriteCharts: favoriteCharts || ['occupancy', 'revenue'],
      compactMode: compactMode !== undefined ? compactMode : false,
      statsVisible: dashboardLayout?.stats !== undefined ? dashboardLayout.stats : true,
      activitiesVisible: dashboardLayout?.activities !== undefined ? dashboardLayout.activities : true,
      chartsVisible: dashboardLayout?.charts !== undefined ? dashboardLayout.charts : true,
      quickActionsVisible: dashboardLayout?.quickActions !== undefined ? dashboardLayout.quickActions : true
    },
    include: {
      user: {
        select: {
          userSettings: {
            select: {
              theme: true
            }
          }
        }
      }
    }
  });

  // Format response
  const settings = {
    theme: dashboardSettings.user?.userSettings?.theme || 'light',
    defaultView: dashboardSettings.defaultView,
    showNotifications: dashboardSettings.showNotifications,
    autoRefresh: dashboardSettings.autoRefresh,
    refreshInterval: dashboardSettings.refreshInterval,
    defaultProperty: dashboardSettings.defaultProperty,
    favoriteCharts: dashboardSettings.favoriteCharts,
    compactMode: dashboardSettings.compactMode,
    dashboardLayout: {
      stats: dashboardSettings.statsVisible,
      activities: dashboardSettings.activitiesVisible,
      charts: dashboardSettings.chartsVisible,
      quickActions: dashboardSettings.quickActionsVisible
    }
  };

  res.status(200).json({
    success: true,
    data: settings,
    message: 'Dashboard settings updated successfully'
  });
});

module.exports = {
  getPropertySettings,
  updatePropertySettings,
  getTermsAndConditions,
  getUserSettings,
  updateUserSettings,
  getPropertyRules,
  updatePropertyRules,
  getDashboardSettings,
  updateDashboardSettings
}; 