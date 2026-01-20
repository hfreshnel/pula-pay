import { Request, Response, NextFunction } from 'express';
import { AuthController } from '../AuthController';
import { ZodError } from 'zod';
import { createMockUserRepository } from '../../../../__tests__/mocks/repositories.mock';
import { createUser, userFixtures } from '../../../../__tests__/fixtures';

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2a$12$hashedvalue'),
  compare: jest.fn(),
}));

// Mock auth middleware
jest.mock('../../middleware/auth', () => ({
  generateToken: jest.fn().mockReturnValue('mock-access-token'),
  generateRefreshToken: jest.fn().mockReturnValue('mock-refresh-token'),
  verifyRefreshToken: jest.fn(),
}));

import bcrypt from 'bcryptjs';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../../middleware/auth';

describe('AuthController', () => {
  let controller: AuthController;
  let mockUserRepo: ReturnType<typeof createMockUserRepository>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockUserRepo = createMockUserRepository();
    controller = new AuthController(mockUserRepo);

    mockReq = {
      body: {},
      headers: { 'x-request-id': 'req-123' },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register new user and return 201', async () => {
      // Arrange
      mockReq.body = {
        phone: '+22501234567',
        email: 'test@example.com',
        password: 'SecureP@ss123',
      };

      mockUserRepo.findByPhone.mockResolvedValue(null);
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockUserRepo.create.mockResolvedValue(userFixtures.noKyc());
      mockUserRepo.update.mockResolvedValue(userFixtures.noKyc());

      // Act
      await controller.register(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          user: expect.any(Object),
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: '15m',
        }),
        meta: expect.any(Object),
      });
    });

    it('should return 409 when phone already exists', async () => {
      // Arrange
      mockReq.body = {
        phone: '+22501234567',
        password: 'SecureP@ss123',
      };

      mockUserRepo.findByPhone.mockResolvedValue(userFixtures.basicKyc());

      // Act
      await controller.register(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'PHONE_EXISTS',
          }),
        })
      );
    });

    it('should return 409 when email already exists', async () => {
      // Arrange
      mockReq.body = {
        phone: '+22501234567',
        email: 'existing@example.com',
        password: 'SecureP@ss123',
      };

      mockUserRepo.findByPhone.mockResolvedValue(null);
      mockUserRepo.findByEmail.mockResolvedValue(userFixtures.basicKyc());

      // Act
      await controller.register(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'EMAIL_EXISTS',
          }),
        })
      );
    });

    it('should validate phone format', async () => {
      // Arrange
      mockReq.body = {
        phone: '123', // Too short
        password: 'SecureP@ss123',
      };

      // Act
      await controller.register(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });

    it('should validate password minimum length', async () => {
      // Arrange
      mockReq.body = {
        phone: '+22501234567',
        password: 'short', // Less than 8 characters
      };

      // Act
      await controller.register(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });

    it('should validate email format when provided', async () => {
      // Arrange
      mockReq.body = {
        phone: '+22501234567',
        email: 'invalid-email',
        password: 'SecureP@ss123',
      };

      // Act
      await controller.register(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });

    it('should hash password before storing', async () => {
      // Arrange
      mockReq.body = {
        phone: '+22501234567',
        password: 'SecureP@ss123',
      };

      mockUserRepo.findByPhone.mockResolvedValue(null);
      mockUserRepo.create.mockResolvedValue(userFixtures.noKyc());

      // Act
      await controller.register(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('SecureP@ss123', 12);
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      // Arrange
      mockReq.body = {
        phone: '+22501234567',
        password: 'SecureP@ss123',
      };

      const user = userFixtures.basicKyc();
      mockUserRepo.findByPhone.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      await controller.login(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          user: expect.any(Object),
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        }),
        meta: expect.any(Object),
      });
    });

    it('should return 401 for invalid phone', async () => {
      // Arrange
      mockReq.body = {
        phone: '+22501234567',
        password: 'SecureP@ss123',
      };

      mockUserRepo.findByPhone.mockResolvedValue(null);

      // Act
      await controller.login(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INVALID_CREDENTIALS',
          }),
        })
      );
    });

    it('should return 401 for invalid password', async () => {
      // Arrange
      mockReq.body = {
        phone: '+22501234567',
        password: 'WrongPassword',
      };

      mockUserRepo.findByPhone.mockResolvedValue(userFixtures.basicKyc());
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act
      await controller.login(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INVALID_CREDENTIALS',
          }),
        })
      );
    });
  });

  describe('requestOtp', () => {
    it('should generate and store OTP', async () => {
      // Arrange
      mockReq.body = {
        phone: '+22501234567',
      };

      const user = userFixtures.noKyc();
      mockUserRepo.findByPhone.mockResolvedValue(user);
      mockUserRepo.update.mockResolvedValue(user);

      // Act
      await controller.requestOtp(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          message: 'OTP sent successfully',
          expiresIn: expect.stringContaining('minutes'),
        }),
        meta: expect.any(Object),
      });
      expect(mockUserRepo.update).toHaveBeenCalled();
    });

    it('should return 404 for unknown phone', async () => {
      // Arrange
      mockReq.body = {
        phone: '+22599999999',
      };

      mockUserRepo.findByPhone.mockResolvedValue(null);

      // Act
      await controller.requestOtp(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'USER_NOT_FOUND',
          }),
        })
      );
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP and upgrade KYC to BASIC', async () => {
      // Arrange
      mockReq.body = {
        phone: '+22501234567',
        otp: '123456',
      };

      const user = userFixtures.withPendingOtp();
      mockUserRepo.findByPhone.mockResolvedValue(user);
      mockUserRepo.update.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      await controller.verifyOtp(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          user: expect.any(Object),
          accessToken: expect.any(String),
        }),
        meta: expect.any(Object),
      });
    });

    it('should return 400 for expired OTP', async () => {
      // Arrange
      mockReq.body = {
        phone: '+22501234567',
        otp: '123456',
      };

      mockUserRepo.findByPhone.mockResolvedValue(userFixtures.withExpiredOtp());

      // Act
      await controller.verifyOtp(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'OTP_EXPIRED',
          }),
        })
      );
    });

    it('should return 400 for invalid OTP', async () => {
      // Arrange
      mockReq.body = {
        phone: '+22501234567',
        otp: '000000',
      };

      mockUserRepo.findByPhone.mockResolvedValue(userFixtures.withPendingOtp());
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act
      await controller.verifyOtp(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INVALID_OTP',
          }),
        })
      );
    });

    it('should validate OTP format (6 digits)', async () => {
      // Arrange
      mockReq.body = {
        phone: '+22501234567',
        otp: '12345', // Only 5 digits
      };

      // Act
      await controller.verifyOtp(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });

    it('should validate OTP contains only digits', async () => {
      // Arrange
      mockReq.body = {
        phone: '+22501234567',
        otp: 'abcdef',
      };

      // Act
      await controller.verifyOtp(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens', async () => {
      // Arrange
      mockReq.body = {
        refreshToken: 'valid-refresh-token',
      };

      (verifyRefreshToken as jest.Mock).mockReturnValue({ sub: 'user-123' });
      mockUserRepo.findById.mockResolvedValue(userFixtures.basicKyc());

      // Act
      await controller.refreshToken(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          expiresIn: '15m',
        }),
        meta: expect.any(Object),
      });
    });

    it('should return 401 for unknown user in token', async () => {
      // Arrange
      mockReq.body = {
        refreshToken: 'valid-refresh-token',
      };

      (verifyRefreshToken as jest.Mock).mockReturnValue({ sub: 'unknown-user' });
      mockUserRepo.findById.mockResolvedValue(null);

      // Act
      await controller.refreshToken(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('me', () => {
    it('should return user profile with limits', async () => {
      // Arrange
      mockReq.userId = 'user-123';
      const user = userFixtures.basicKyc();
      mockUserRepo.findById.mockResolvedValue(user);

      // Act
      await controller.me(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          user: expect.any(Object),
          limits: expect.objectContaining({
            dailyLimit: expect.any(Number),
            monthlyLimit: expect.any(Number),
          }),
        }),
        meta: expect.any(Object),
      });
    });

    it('should return 404 when user not found', async () => {
      // Arrange
      mockReq.userId = 'unknown-user';
      mockUserRepo.findById.mockResolvedValue(null);

      // Act
      await controller.me(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateProfile', () => {
    it('should update user email', async () => {
      // Arrange
      mockReq.userId = 'user-123';
      mockReq.body = {
        email: 'new@example.com',
      };

      const user = userFixtures.basicKyc();
      mockUserRepo.findById.mockResolvedValue(user);
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockUserRepo.update.mockResolvedValue(user);

      // Act
      await controller.updateProfile(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockUserRepo.update).toHaveBeenCalled();
    });

    it('should return 409 when new email already in use', async () => {
      // Arrange
      mockReq.userId = 'user-123';
      mockReq.body = {
        email: 'taken@example.com',
      };

      const user = userFixtures.basicKyc();
      const otherUser = createUser({ id: 'other-user' });
      mockUserRepo.findById.mockResolvedValue(user);
      mockUserRepo.findByEmail.mockResolvedValue(otherUser);

      // Act
      await controller.updateProfile(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'EMAIL_EXISTS',
          }),
        })
      );
    });

    it('should update display currency', async () => {
      // Arrange
      mockReq.userId = 'user-123';
      mockReq.body = {
        displayCurrency: 'XOF',
      };

      const user = userFixtures.basicKyc();
      mockUserRepo.findById.mockResolvedValue(user);
      mockUserRepo.update.mockResolvedValue(user);

      // Act
      await controller.updateProfile(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should update locale', async () => {
      // Arrange
      mockReq.userId = 'user-123';
      mockReq.body = {
        locale: 'en-US',
      };

      const user = userFixtures.basicKyc();
      mockUserRepo.findById.mockResolvedValue(user);
      mockUserRepo.update.mockResolvedValue(user);

      // Act
      await controller.updateProfile(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});
