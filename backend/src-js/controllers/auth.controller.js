const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { asyncHandler } = require('../middleware/error.middleware');

const prisma = new PrismaClient();

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// POST /api/auth/register - Register new user
const register = asyncHandler(async (req, res) => {
  const { email, password, fullName, phone, role = 'OWNER' } = req.body;

  // Validation
  if (!email || !password || !fullName || !phone) {
    return res.status(400).json({
      success: false,
      error: { message: 'Email, password, full name, and phone are required' }
    });
  }

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      email
    }
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: { message: 'User with this email already exists' }
    });
  }

  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      username: email, // Use email as username for now
      password: hashedPassword,
      fullName,
      phone,
      role,
    },
    select: {
      id: true,
      email: true,
      username: true,
      fullName: true,
      phone: true,
      role: true,
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
    message: 'User registered successfully'
  });
});

// POST /api/auth/login - Login user
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: { message: 'Email and password are required' }
    });
  }

  // Find user by email
  const user = await prisma.user.findFirst({
    where: {
      email,
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