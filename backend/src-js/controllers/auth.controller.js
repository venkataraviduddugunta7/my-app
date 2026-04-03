const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { asyncHandler } = require('../middleware/error.middleware');

const prisma = new PrismaClient();

const usernameRegex = /^[a-zA-Z0-9._-]{3,30}$/;

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const normalizeOptionalString = (value) => {
  const normalized = String(value || '').trim();
  return normalized ? normalized : null;
};

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// POST /api/auth/register - Register new user
const register = asyncHandler(async (req, res) => {
  const { email, password, fullName, phone, username } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const normalizedFullName = String(fullName || '').trim();
  const normalizedPhone = String(phone || '').trim();
  const normalizedUsername = normalizeOptionalString(username);

  // Validation
  if (!normalizedEmail || !password || !normalizedFullName || !normalizedPhone) {
    return res.status(400).json({
      success: false,
      error: { message: 'Email, password, full name, and phone are required' }
    });
  }

  if (normalizedUsername && !usernameRegex.test(normalizedUsername)) {
    return res.status(400).json({
      success: false,
      error: { message: 'Username should be 3-30 characters and use only letters, numbers, dots, underscores, or hyphens' }
    });
  }

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      email: normalizedEmail
    }
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: { message: 'User with this email already exists' }
    });
  }

  if (normalizedUsername) {
    const existingUsername = await prisma.user.findFirst({
      where: {
        username: normalizedUsername
      }
    });

    if (existingUsername) {
      return res.status(400).json({
        success: false,
        error: { message: 'Username is already taken' }
      });
    }
  }

  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user with WAITING_APPROVAL status by default
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      username: normalizedUsername || normalizedEmail,
      password: hashedPassword,
      fullName: normalizedFullName,
      phone: normalizedPhone,
      role: 'OWNER',
      subscriptionStatus: 'WAITING_APPROVAL', // Default status for new users
    },
    select: {
      id: true,
      email: true,
      username: true,
      fullName: true,
      phone: true,
      role: true,
      subscriptionStatus: true,
      isActive: true,
      createdAt: true,
    }
  });

  // Generate token
  const token = generateToken(user.id);

  res.status(201).json({
    success: true,
    data: {
      user,
      token
    },
    message: 'Registration successful! Your account is pending approval from the administrator. You will be notified once approved.'
  });
});

// POST /api/auth/login - Login user
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);

  // Validation
  if (!normalizedEmail || !password) {
    return res.status(400).json({
      success: false,
      error: { message: 'Email and password are required' }
    });
  }

  // Find user by email
  const user = await prisma.user.findFirst({
    where: {
      email: normalizedEmail,
      isActive: true
    }
  });

  if (!user) {
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid credentials' }
    });
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid credentials' }
    });
  }

  // Generate token
  const token = generateToken(user.id);

  // Return user data without password
  const { password: _, ...userWithoutPassword } = user;

  res.status(200).json({
    success: true,
    data: {
      user: userWithoutPassword,
      token
    },
    message: 'Login successful'
  });
});

// GET /api/auth/me - Get current user profile
const getProfile = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
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
          totalBeds: true,
        }
      }
    }
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: { message: 'User not found' }
    });
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// PUT /api/auth/profile - Update user profile
const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, phone } = req.body;
  
  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      ...(fullName && { fullName }),
      ...(phone && { phone }),
    },
    select: {
      id: true,
      email: true,
      username: true,
      fullName: true,
      phone: true,
      role: true,
      isActive: true,
      updatedAt: true,
    }
  });

  res.status(200).json({
    success: true,
    data: updatedUser,
    message: 'Profile updated successfully'
  });
});

// POST /api/auth/change-password - Change password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      error: { message: 'Current password and new password are required' }
    });
  }

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: req.user.id }
  });

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      error: { message: 'Current password is incorrect' }
    });
  }

  // Hash new password
  const hashedNewPassword = await bcrypt.hash(newPassword, 12);

  // Update password
  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: hashedNewPassword }
  });

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

// POST /api/auth/logout - Logout (client-side token removal)
const logout = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout
}; 
