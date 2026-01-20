import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Currency } from '@prisma/client';
import { UserRepository } from '../../../domain/ports/repositories/UserRepository';
import { ApiResponse } from '../../../shared/types';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth';
import { logger } from '../../../shared/utils/logger';

// Validation schemas
const phoneSchema = z.string().min(8, 'Phone must be at least 8 characters').max(15, 'Phone must be at most 15 characters');

const registerSchema = z.object({
  phone: phoneSchema,
  email: z.string().email('Invalid email format').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayCurrency: z.nativeEnum(Currency).optional(),
});

const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, 'Password is required'),
});

const requestOtpSchema = z.object({
  phone: phoneSchema,
});

const verifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must contain only digits'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const updateProfileSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  displayCurrency: z.nativeEnum(Currency).optional(),
  locale: z.string().min(2).max(10).optional(),
});

// Response types
interface AuthResponse {
  user: ReturnType<import('../../../domain/entities/User').User['toJSON']>;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

interface ProfileResponse {
  user: ReturnType<import('../../../domain/entities/User').User['toJSON']>;
  limits?: {
    dailyLimit: number;
    monthlyLimit: number;
  };
}

const SALT_ROUNDS = 12;
const OTP_EXPIRY_MINUTES = 10;

/**
 * AuthController handles user authentication flows:
 * - Registration with phone/email
 * - Login with password
 * - OTP verification (for KYC upgrade)
 * - Token refresh
 * - User profile management
 */
export class AuthController {
  constructor(private readonly userRepo: UserRepository) {}

  /**
   * POST /auth/register
   * Create a new user account
   */
  register = async (
    req: Request,
    res: Response<ApiResponse<AuthResponse>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = registerSchema.parse(req.body);

      // Check if phone already exists
      const existingPhone = await this.userRepo.findByPhone(data.phone);
      if (existingPhone) {
        res.status(409).json({
          success: false,
          error: {
            code: 'PHONE_EXISTS',
            message: 'Phone number already registered',
          },
          meta: { requestId: req.headers['x-request-id'] as string, timestamp: new Date().toISOString() },
        });
        return;
      }

      // Check if email already exists
      if (data.email) {
        const existingEmail = await this.userRepo.findByEmail(data.email);
        if (existingEmail) {
          res.status(409).json({
            success: false,
            error: {
              code: 'EMAIL_EXISTS',
              message: 'Email already registered',
            },
            meta: { requestId: req.headers['x-request-id'] as string, timestamp: new Date().toISOString() },
          });
          return;
        }
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

      // Create user
      const user = await this.userRepo.create({
        phone: data.phone,
        email: data.email,
        passwordHash,
      });

      // Update display currency if provided
      if (data.displayCurrency) {
        user.updateDisplayCurrency(data.displayCurrency);
        await this.userRepo.update(user);
      }

      // Generate tokens
      const accessToken = generateToken({ sub: user.id, email: user.email ?? undefined });
      const refreshTokenValue = generateRefreshToken(user.id);

      logger.info({ userId: user.id, phone: data.phone }, 'User registered successfully');

      res.status(201).json({
        success: true,
        data: {
          user: user.toJSON(),
          accessToken,
          refreshToken: refreshTokenValue,
          expiresIn: '15m',
        },
        meta: { requestId: req.headers['x-request-id'] as string, timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /auth/login
   * Authenticate user with phone and password
   */
  login = async (
    req: Request,
    res: Response<ApiResponse<AuthResponse>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = loginSchema.parse(req.body);

      // Find user
      const user = await this.userRepo.findByPhone(data.phone);
      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid phone or password',
          },
          meta: { requestId: req.headers['x-request-id'] as string, timestamp: new Date().toISOString() },
        });
        return;
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid phone or password',
          },
          meta: { requestId: req.headers['x-request-id'] as string, timestamp: new Date().toISOString() },
        });
        return;
      }

      // Generate tokens
      const accessToken = generateToken({ sub: user.id, email: user.email ?? undefined });
      const refreshTokenValue = generateRefreshToken(user.id);

      logger.info({ userId: user.id }, 'User logged in successfully');

      res.status(200).json({
        success: true,
        data: {
          user: user.toJSON(),
          accessToken,
          refreshToken: refreshTokenValue,
          expiresIn: '15m',
        },
        meta: { requestId: req.headers['x-request-id'] as string, timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /auth/request-otp
   * Request OTP for phone verification (KYC upgrade)
   */
  requestOtp = async (
    req: Request,
    res: Response<ApiResponse<{ message: string; expiresIn: string; otp?: string }>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = requestOtpSchema.parse(req.body);

      const user = await this.userRepo.findByPhone(data.phone);
      if (!user) {
        res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
          meta: { requestId: req.headers['x-request-id'] as string, timestamp: new Date().toISOString() },
        });
        return;
      }

      // Generate 6-digit OTP
      const otp = crypto.randomInt(100000, 999999).toString();
      const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      // Store OTP
      user.setOtp(otpHash, expiresAt);
      await this.userRepo.update(user);

      // In production, send OTP via SMS
      logger.info({ userId: user.id, otp: process.env.NODE_ENV === 'development' ? otp : '[REDACTED]' }, 'OTP generated');

      res.status(200).json({
        success: true,
        data: {
          message: 'OTP sent successfully',
          expiresIn: `${OTP_EXPIRY_MINUTES} minutes`,
          // Include OTP in dev mode for testing
          ...(process.env.NODE_ENV === 'development' && { otp }),
        },
        meta: { requestId: req.headers['x-request-id'] as string, timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /auth/verify-otp
   * Verify OTP and upgrade KYC to BASIC
   */
  verifyOtp = async (
    req: Request,
    res: Response<ApiResponse<AuthResponse>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = verifyOtpSchema.parse(req.body);

      const user = await this.userRepo.findByPhone(data.phone);
      if (!user) {
        res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
          meta: { requestId: req.headers['x-request-id'] as string, timestamp: new Date().toISOString() },
        });
        return;
      }

      // Check OTP validity
      if (!user.isOtpValid()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'OTP_EXPIRED',
            message: 'OTP has expired or was not requested',
          },
          meta: { requestId: req.headers['x-request-id'] as string, timestamp: new Date().toISOString() },
        });
        return;
      }

      // Verify OTP
      const isValidOtp = await bcrypt.compare(data.otp, user.otpHash!);
      if (!isValidOtp) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_OTP',
            message: 'Invalid OTP',
          },
          meta: { requestId: req.headers['x-request-id'] as string, timestamp: new Date().toISOString() },
        });
        return;
      }

      // Clear OTP and upgrade KYC
      user.clearOtp();
      if (user.kycLevel === 'NONE') {
        user.upgradeKyc('BASIC', { phoneVerifiedAt: new Date().toISOString() });
      }
      await this.userRepo.update(user);

      // Generate new tokens
      const accessToken = generateToken({ sub: user.id, email: user.email ?? undefined });
      const refreshTokenValue = generateRefreshToken(user.id);

      logger.info({ userId: user.id }, 'OTP verified, KYC upgraded to BASIC');

      res.status(200).json({
        success: true,
        data: {
          user: user.toJSON(),
          accessToken,
          refreshToken: refreshTokenValue,
          expiresIn: '15m',
        },
        meta: { requestId: req.headers['x-request-id'] as string, timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /auth/refresh
   * Refresh access token using refresh token
   */
  refreshToken = async (
    req: Request,
    res: Response<ApiResponse<TokenResponse>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = refreshTokenSchema.parse(req.body);

      // Verify refresh token
      const decoded = verifyRefreshToken(data.refreshToken);

      // Get user
      const user = await this.userRepo.findById(decoded.sub);
      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
          meta: { requestId: req.headers['x-request-id'] as string, timestamp: new Date().toISOString() },
        });
        return;
      }

      // Generate new tokens
      const accessToken = generateToken({ sub: user.id, email: user.email ?? undefined });
      const refreshTokenValue = generateRefreshToken(user.id);

      res.status(200).json({
        success: true,
        data: {
          accessToken,
          refreshToken: refreshTokenValue,
          expiresIn: '15m',
        },
        meta: { requestId: req.headers['x-request-id'] as string, timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /auth/me
   * Get current user profile
   */
  me = async (
    req: Request,
    res: Response<ApiResponse<ProfileResponse>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.userId!;

      const user = await this.userRepo.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
          meta: { requestId: req.headers['x-request-id'] as string, timestamp: new Date().toISOString() },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          user: user.toJSON(),
          limits: {
            dailyLimit: user.getDailyLimit(),
            monthlyLimit: user.getMonthlyLimit(),
          },
        },
        meta: { requestId: req.headers['x-request-id'] as string, timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /auth/me
   * Update current user profile
   */
  updateProfile = async (
    req: Request,
    res: Response<ApiResponse<ProfileResponse>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.userId!;
      const data = updateProfileSchema.parse(req.body);

      const user = await this.userRepo.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
          meta: { requestId: req.headers['x-request-id'] as string, timestamp: new Date().toISOString() },
        });
        return;
      }

      // Update email if provided
      if (data.email && data.email !== user.email) {
        const existingEmail = await this.userRepo.findByEmail(data.email);
        if (existingEmail && existingEmail.id !== user.id) {
          res.status(409).json({
            success: false,
            error: {
              code: 'EMAIL_EXISTS',
              message: 'Email already in use',
            },
            meta: { requestId: req.headers['x-request-id'] as string, timestamp: new Date().toISOString() },
          });
          return;
        }
        user.updateEmail(data.email);
      }

      // Update display currency if provided
      if (data.displayCurrency) {
        user.updateDisplayCurrency(data.displayCurrency);
      }

      // Update locale if provided
      if (data.locale) {
        user.updateLocale(data.locale);
      }

      await this.userRepo.update(user);

      logger.info({ userId }, 'User profile updated');

      res.status(200).json({
        success: true,
        data: {
          user: user.toJSON(),
        },
        meta: { requestId: req.headers['x-request-id'] as string, timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  };
}
