import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from '../../routes/auth.route';
import { User } from '../../models/user.model';
import bcryptjs from 'bcryptjs';
import { setupTests } from '../setup/globalSetup';

// Initialize database for tests
setupTests();

describe('Auth Routes Integration Tests', () => {
  let app: Express;

  beforeAll(() => {
    // Create a minimal Express app for testing
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/auth', authRoutes);
  });

  describe('POST /api/auth/signup', () => {
    it('should create a new user and return 201', async () => {
      const userData = {
        email: 'integration@example.com',
        password: 'password123',
        name: 'Integration User',
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.password).toBeUndefined();

      // Verify cookie was set
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('token=');
    });

    it('should return 400 for duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'password123',
        name: 'User One',
      };

      // Create first user
      await request(app).post('/api/auth/signup').send(userData);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User already exists');
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      // Create a test user
      const hashedPassword = await bcryptjs.hash('password123', 10);
      await User.create({
        email: 'logintest@example.com',
        password: hashedPassword,
        name: 'Login Test User',
        isVerified: true,
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'logintest@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe('logintest@example.com');

      // Verify cookie was set
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('token=');
    });

    it('should return 400 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'logintest@example.com',
          password: 'wrongpassword',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 400 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout and clear cookie', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');

      // Verify cookie was cleared
      const cookies = response.headers['set-cookie'];
      if (cookies) {
        expect(cookies[0]).toContain('token=;');
      }
    });
  });

  describe('POST /api/auth/verify-email', () => {
    it('should verify email with valid code', async () => {
      const verificationToken = '123456';
      await User.create({
        email: 'verify@example.com',
        password: 'hashedpassword',
        name: 'Verify User',
        verificationToken,
        verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ code: verificationToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Email verified successfully');

      // Verify user is marked as verified in database
      const user = await User.findOne({ email: 'verify@example.com' });
      expect(user?.isVerified).toBe(true);
    });

    it('should return 400 for invalid verification code', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email')
        .send({ code: 'invalid-code' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired verification code');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    beforeAll(async () => {
      await User.create({
        email: 'forgot@example.com',
        password: 'hashedpassword',
        name: 'Forgot User',
      });
    });

    it('should send reset email for existing user', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'forgot@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password reset link sent to your email');

      // Verify reset token was set
      const user = await User.findOne({ email: 'forgot@example.com' });
      expect(user?.resetPasswordToken).toBeDefined();
      expect(user?.resetPasswordExpiresAt).toBeDefined();
    });

    it('should return 400 for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });
  });

  describe('POST /api/auth/reset-password/:token', () => {
    it('should reset password with valid token', async () => {
      const resetToken = 'valid-reset-token';
      await User.create({
        email: 'reset@example.com',
        password: 'oldhashedpassword',
        name: 'Reset User',
        resetPasswordToken: resetToken,
        resetPasswordExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      const response = await request(app)
        .post(`/api/auth/reset-password/${resetToken}`)
        .send({ password: 'newpassword123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password reset successful');

      // Verify password was changed
      const user = await User.findOne({ email: 'reset@example.com' });
      const isMatch = await bcryptjs.compare('newpassword123', user?.password!);
      expect(isMatch).toBe(true);
    });

    it('should return 400 for invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password/invalid-token')
        .send({ password: 'newpassword123' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired reset token');
    });
  });

  describe('GET /api/auth/check-auth', () => {
    it('should return 401 without valid token', async () => {
      const response = await request(app)
        .get('/api/auth/check-auth')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Unauthorized - no token provided');
    });

    it('should return user data with valid token', async () => {
      // First, signup to get a valid token
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'checkauth@example.com',
          password: 'password123',
          name: 'Check Auth User',
        });

      const cookies = signupResponse.headers['set-cookie'];

      // Then use that token to check auth
      const response = await request(app)
        .get('/api/auth/check-auth')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe('checkauth@example.com');
      expect(response.body.user.password).toBeUndefined();
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should return 401 without valid token', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .send({
          currentPassword: 'oldpass',
          newPassword: 'newpass',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should change password with valid credentials', async () => {
      // First, signup to get a valid token
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'changepass@example.com',
          password: 'oldpassword',
          name: 'Change Pass User',
        });

      const cookies = signupResponse.headers['set-cookie'];

      // Change password
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', cookies)
        .send({
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password changed successfully');

      // Verify password was actually changed by trying to login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'changepass@example.com',
          password: 'newpassword123',
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });
  });

  describe('GET /api/auth/google/url', () => {
    it('should return Google OAuth URL', async () => {
      // Set required environment variables
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
      process.env.GOOGLE_REDIRECT_URI = 'http://localhost:5000/api/auth/google/callback';

      const response = await request(app)
        .get('/api/auth/google/url')
        .expect(200);

      expect(response.body.url).toBeDefined();
      expect(response.body.url).toContain('accounts.google.com');

      // Verify oauth_state cookie was set
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.includes('oauth_state='))).toBe(true);
    });
  });
});
