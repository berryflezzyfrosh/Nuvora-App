import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { sendVerificationEmail } from '../services/emailService';
import { logger } from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('username').isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/),
  body('firstName').isLength({ min: 1, max: 50 }).trim(),
  body('lastName').isLength({ min: 1, max: 50 }).trim(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 1 })
];

// Generate JWT tokens
const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// Register endpoint
router.post('/register', registerValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400, 'VALIDATION_ERROR');
  }

  const { email, username, firstName, lastName, password } = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        { username }
      ]
    }
  });

  if (existingUser) {
    throw createError(
      existingUser.email === email ? 'Email already registered' : 'Username already taken',
      409,
      'USER_EXISTS'
    );
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);
  const emailVerificationToken = uuidv4();

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      username,
      firstName,
      lastName,
      passwordHash,
      emailVerificationToken
    },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      isEmailVerified: true,
      createdAt: true
    }
  });

  // Send verification email
  try {
    await sendVerificationEmail(email, emailVerificationToken);
  } catch (error) {
    logger.error('Failed to send verification email:', error);
    // Don't fail registration if email fails
  }

  logger.info(`New user registered: ${username} (${email})`);

  res.status(201).json({
    message: 'Registration successful. Please check your email for verification.',
    user
  });
}));

// Login endpoint
router.post('/login', loginValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400, 'VALIDATION_ERROR');
  }

  const { email, password } = req.body;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      avatar: true,
      passwordHash: true,
      isEmailVerified: true,
      status: true,
      lastSeen: true
    }
  });

  if (!user) {
    throw createError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    throw createError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  if (!user.isEmailVerified) {
    throw createError('Please verify your email before logging in', 401, 'EMAIL_NOT_VERIFIED');
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id);

  // Update refresh token and last seen
  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshToken,
      lastSeen: new Date(),
      status: 'ONLINE'
    }
  });

  const { passwordHash, ...userWithoutPassword } = user;

  logger.info(`User logged in: ${user.username} (${user.email})`);

  res.json({
    message: 'Login successful',
    user: userWithoutPassword,
    tokens: {
      accessToken,
      refreshToken
    }
  });
}));

// Refresh token endpoint
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw createError('Refresh token required', 401, 'TOKEN_MISSING');
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
    
    // Find user and verify refresh token
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.userId,
        refreshToken
      }
    });

    if (!user) {
      throw createError('Invalid refresh token', 401, 'INVALID_TOKEN');
    }

    // Generate new tokens
    const tokens = generateTokens(user.id);

    // Update refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken }
    });

    res.json({
      message: 'Token refreshed successfully',
      tokens
    });
  } catch (error) {
    throw createError('Invalid refresh token', 401, 'INVALID_TOKEN');
  }
}));

// Logout endpoint
router.post('/logout', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  // Clear refresh token and set status to offline
  await prisma.user.update({
    where: { id: userId },
    data: {
      refreshToken: null,
      status: 'OFFLINE',
      lastSeen: new Date()
    }
  });

  logger.info(`User logged out: ${req.user!.username}`);

  res.json({ message: 'Logout successful' });
}));

// Email verification endpoint
router.post('/verify-email', asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw createError('Verification token required', 400, 'TOKEN_MISSING');
  }

  const user = await prisma.user.findFirst({
    where: { emailVerificationToken: token }
  });

  if (!user) {
    throw createError('Invalid verification token', 400, 'INVALID_TOKEN');
  }

  // Update user as verified
  await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      emailVerificationToken: null
    }
  });

  logger.info(`Email verified for user: ${user.username}`);

  res.json({ message: 'Email verified successfully' });
}));

// Resend verification email
router.post('/resend-verification', asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    // Don't reveal if email exists
    return res.json({ message: 'If the email exists, a verification link has been sent.' });
  }

  if (user.isEmailVerified) {
    throw createError('Email already verified', 400, 'EMAIL_ALREADY_VERIFIED');
  }

  const emailVerificationToken = uuidv4();

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerificationToken }
  });

  try {
    await sendVerificationEmail(email, emailVerificationToken);
  } catch (error) {
    logger.error('Failed to send verification email:', error);
    throw createError('Failed to send verification email', 500, 'EMAIL_SEND_FAILED');
  }

  res.json({ message: 'Verification email sent successfully' });
}));

// Get current user
router.get('/me', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      avatar: true,
      bio: true,
      status: true,
      lastSeen: true,
      isEmailVerified: true,
      createdAt: true,
      updatedAt: true
    }
  });

  res.json({ user });
}));

export default router;