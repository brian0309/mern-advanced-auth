import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupTests } from '../../setup/globalSetup';
import bcryptjs from 'bcryptjs';
import { signup, login, logout, verifyEmail, forgotPassword, resetPassword, checkAuth, changePassword } from '../../../controllers/auth.controller';
import { User } from '../../../models/user.model';
import { createMockRequest, createMockResponse, createTestUser } from '../../helpers/testHelpers';
import * as tokenUtil from '../../../utils/generateTokenAndSetCookie';
import * as emailService from '../../../mailtrap/emails';

// Mock email service

// Initialize database for tests
setupTests();

jest.mock('../../../mailtrap/emails', () => ({
  sendVerificationEmail: jest.fn(),
  sendWelcomeEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  sendResetSuccessEmail: jest.fn(),
}));

// Initialize database for tests
setupTests();

describe('Auth Controller', () => {
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    mockRequest = createMockRequest({});
    mockResponse = createMockResponse();
  });

  describe('signup', () => {
    it('should create a new user successfully', async () => {
      mockRequest.body = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      await signup(mockRequest, mockResponse as any);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'User created successfully',
          user: expect.objectContaining({
            email: 'newuser@example.com',
            name: 'New User',
          }),
        })
      );

      // Verify user was created in database
      const user = await User.findOne({ email: 'newuser@example.com' });
      expect(user).toBeDefined();
      expect(user?.name).toBe('New User');
    });

    it('should return 400 if email is missing', async () => {
      mockRequest.body = {
        password: 'password123',
        name: 'Test User',
      };

      await signup(mockRequest, mockResponse as any);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'All fields are required',
        })
      );
    });

    it('should return 400 if password is missing', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        name: 'Test User',
      };

      await signup(mockRequest, mockResponse as any);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'All fields are required',
        })
      );
    });

    it('should return 400 if name is missing', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      await signup(mockRequest, mockResponse as any);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'All fields are required',
        })
      );
    });

    it('should return 400 if user already exists', async () => {
      await createTestUser({ email: 'existing@example.com', password: 'password123' });

      mockRequest.body = {
        email: 'existing@example.com',
        password: 'newpassword123',
        name: 'Another User',
      };

      await signup(mockRequest, mockResponse as any);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'User already exists',
      });
    });

    it('should hash the password', async () => {
      mockRequest.body = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      await signup(mockRequest, mockResponse as any);

      const user = await User.findOne({ email: 'newuser@example.com' });
      expect(user?.password).toBeDefined();
      expect(user?.password).not.toBe('password123');

      // Verify password is actually hashed
      const isMatch = await bcryptjs.compare('password123', user?.password!);
      expect(isMatch).toBe(true);
    });

    it('should generate and set verification token', async () => {
      mockRequest.body = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      await signup(mockRequest, mockResponse as any);

      const user = await User.findOne({ email: 'newuser@example.com' });
      expect(user?.verificationToken).toBeDefined();
      expect(user?.verificationToken).toMatch(/^\d{6}$/); // 6-digit code
      expect(user?.verificationTokenExpiresAt).toBeDefined();
    });

    it('should send verification email', async () => {
      mockRequest.body = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      await signup(mockRequest, mockResponse as any);

      expect(emailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        'newuser@example.com',
        expect.any(String)
      );
    });

    it('should not return password in response', async () => {
      mockRequest.body = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      await signup(mockRequest, mockResponse as any);

      const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.user.password).toBeUndefined();
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      await createTestUser({
        email: 'user@example.com',
        password: 'password123',
        isVerified: true,
      });

      mockRequest.body = {
        email: 'user@example.com',
        password: 'password123',
      };

      await login(mockRequest, mockResponse as any);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Logged in successfully',
        })
      );
    });

    it('should return 400 if user does not exist', async () => {
      mockRequest.body = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      await login(mockRequest, mockResponse as any);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid credentials',
      });
    });

    it('should return 400 if password is incorrect', async () => {
      await createTestUser({
        email: 'user@example.com',
        password: 'correctpassword',
      });

      mockRequest.body = {
        email: 'user@example.com',
        password: 'wrongpassword',
      };

      await login(mockRequest, mockResponse as any);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid credentials',
      });
    });

    it('should return 400 if user has no password (OAuth user)', async () => {
      await createTestUser({
        email: 'oauth@example.com',
        googleId: 'google-123',
        isVerified: true,
      });

      mockRequest.body = {
        email: 'oauth@example.com',
        password: 'anypassword',
      };

      await login(mockRequest, mockResponse as any);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Please use Google OAuth to login',
      });
    });

    it('should update lastLogin timestamp', async () => {
      const user = await createTestUser({
        email: 'user@example.com',
        password: 'password123',
      });

      const originalLastLogin = user.lastLogin;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      mockRequest.body = {
        email: 'user@example.com',
        password: 'password123',
      };

      await login(mockRequest, mockResponse as any);

      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.lastLogin.getTime()).toBeGreaterThan(originalLastLogin.getTime());
    });

    it('should not return password in response', async () => {
      await createTestUser({
        email: 'user@example.com',
        password: 'password123',
      });

      mockRequest.body = {
        email: 'user@example.com',
        password: 'password123',
      };

      await login(mockRequest, mockResponse as any);

      const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.user.password).toBeUndefined();
    });
  });

  describe('logout', () => {
    it('should clear the token cookie', async () => {
      await logout(mockRequest, mockResponse as any);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'token',
        expect.objectContaining({
          httpOnly: true,
        })
      );
    });

    it('should return success message', async () => {
      await logout(mockRequest, mockResponse as any);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully',
      });
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid code', async () => {
      const verificationToken = '123456';
      const user = await User.create({
        email: 'user@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        verificationToken,
        verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      mockRequest.body = { code: verificationToken };

      await verifyEmail(mockRequest, mockResponse as any);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Email verified successfully',
        })
      );

      // Verify user is marked as verified
      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.isVerified).toBe(true);
      expect(updatedUser?.verificationToken).toBeUndefined();
      expect(updatedUser?.verificationTokenExpiresAt).toBeUndefined();
    });

    it('should return 400 if code is invalid', async () => {
      mockRequest.body = { code: 'invalid-code' };

      await verifyEmail(mockRequest, mockResponse as any);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired verification code',
      });
    });

    it('should return 400 if code is expired', async () => {
      const verificationToken = '123456';
      await User.create({
        email: 'user@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        verificationToken,
        verificationTokenExpiresAt: new Date(Date.now() - 1000), // Expired
      });

      mockRequest.body = { code: verificationToken };

      await verifyEmail(mockRequest, mockResponse as any);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired verification code',
      });
    });

    it('should send welcome email after verification', async () => {
      const verificationToken = '123456';
      await User.create({
        email: 'user@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        verificationToken,
        verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      mockRequest.body = { code: verificationToken };

      await verifyEmail(mockRequest, mockResponse as any);

      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(
        'user@example.com',
        'Test User'
      );
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email for existing user', async () => {
      await createTestUser({ email: 'user@example.com', password: 'password123' });

      mockRequest.body = { email: 'user@example.com' };

      await forgotPassword(mockRequest, mockResponse as any);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password reset link sent to your email',
      });

      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    });

    it('should return 400 if user does not exist', async () => {
      mockRequest.body = { email: 'nonexistent@example.com' };

      await forgotPassword(mockRequest, mockResponse as any);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
      });
    });

    it('should set reset token and expiry on user', async () => {
      const user = await createTestUser({
        email: 'user@example.com',
        password: 'password123',
      });

      mockRequest.body = { email: 'user@example.com' };

      await forgotPassword(mockRequest, mockResponse as any);

      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.resetPasswordToken).toBeDefined();
      expect(updatedUser?.resetPasswordExpiresAt).toBeDefined();
      expect(updatedUser?.resetPasswordExpiresAt!.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const resetToken = 'valid-reset-token-123';
      const user = await User.create({
        email: 'user@example.com',
        password: 'oldhashedpassword',
        name: 'Test User',
        resetPasswordToken: resetToken,
        resetPasswordExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      mockRequest.params = { token: resetToken };
      mockRequest.body = { password: 'newpassword123' };

      await resetPassword(mockRequest, mockResponse as any);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password reset successful',
      });

      // Verify password was updated
      const updatedUser = await User.findById(user._id);
      const isMatch = await bcryptjs.compare('newpassword123', updatedUser?.password!);
      expect(isMatch).toBe(true);

      // Verify token was cleared
      expect(updatedUser?.resetPasswordToken).toBeUndefined();
      expect(updatedUser?.resetPasswordExpiresAt).toBeUndefined();
    });

    it('should return 400 if token is invalid', async () => {
      mockRequest.params = { token: 'invalid-token' };
      mockRequest.body = { password: 'newpassword123' };

      await resetPassword(mockRequest, mockResponse as any);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired reset token',
      });
    });

    it('should return 400 if token is expired', async () => {
      const resetToken = 'expired-token';
      await User.create({
        email: 'user@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        resetPasswordToken: resetToken,
        resetPasswordExpiresAt: new Date(Date.now() - 1000), // Expired
      });

      mockRequest.params = { token: resetToken };
      mockRequest.body = { password: 'newpassword123' };

      await resetPassword(mockRequest, mockResponse as any);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired reset token',
      });
    });

    it('should send reset success email', async () => {
      const resetToken = 'valid-reset-token-123';
      await User.create({
        email: 'user@example.com',
        password: 'oldhashedpassword',
        name: 'Test User',
        resetPasswordToken: resetToken,
        resetPasswordExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      mockRequest.params = { token: resetToken };
      mockRequest.body = { password: 'newpassword123' };

      await resetPassword(mockRequest, mockResponse as any);

      expect(emailService.sendResetSuccessEmail).toHaveBeenCalledWith('user@example.com');
    });
  });

  describe('checkAuth', () => {
    it('should return user data for authenticated user', async () => {
      const user = await createTestUser({
        email: 'user@example.com',
        password: 'password123',
      });

      mockRequest.userId = user._id.toString();

      await checkAuth(mockRequest, mockResponse as any);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        user: expect.objectContaining({
          email: 'user@example.com',
        }),
      });
    });

    it('should return 400 if user not found', async () => {
      mockRequest.userId = '507f1f77bcf86cd799439011'; // Valid but non-existent ID

      await checkAuth(mockRequest, mockResponse as any);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
      });
    });

    it('should not return password in response', async () => {
      const user = await createTestUser({
        email: 'user@example.com',
        password: 'password123',
      });

      mockRequest.userId = user._id.toString();

      await checkAuth(mockRequest, mockResponse as any);

      const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.user.password).toBeUndefined();
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const user = await createTestUser({
        email: 'user@example.com',
        password: 'oldpassword',
      });

      mockRequest.userId = user._id.toString();
      mockRequest.body = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
      };

      await changePassword(mockRequest, mockResponse as any);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password changed successfully',
      });

      // Verify password was actually changed
      const updatedUser = await User.findById(user._id);
      const isMatch = await bcryptjs.compare('newpassword123', updatedUser?.password!);
      expect(isMatch).toBe(true);
    });

    it('should return 400 if user not found', async () => {
      mockRequest.userId = '507f1f77bcf86cd799439011'; // Valid but non-existent ID
      mockRequest.body = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
      };

      await changePassword(mockRequest, mockResponse as any);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
      });
    });

    it('should return 400 if current password is incorrect', async () => {
      const user = await createTestUser({
        email: 'user@example.com',
        password: 'correctpassword',
      });

      mockRequest.userId = user._id.toString();
      mockRequest.body = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123',
      };

      await changePassword(mockRequest, mockResponse as any);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Current password is incorrect',
      });
    });

    it('should return 400 for OAuth users without password', async () => {
      const user = await createTestUser({
        email: 'oauth@example.com',
        googleId: 'google-123',
      });

      mockRequest.userId = user._id.toString();
      mockRequest.body = {
        currentPassword: 'anypassword',
        newPassword: 'newpassword123',
      };

      await changePassword(mockRequest, mockResponse as any);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Cannot change password for OAuth users',
      });
    });
  });
});
