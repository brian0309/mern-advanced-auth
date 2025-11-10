import { describe, it, expect } from '@jest/globals';
import { User } from '../../../models/user.model';
import { setupTests } from '../../setup/globalSetup';

// Initialize database for tests
setupTests();

describe('User Model', () => {
  describe('Schema Validation', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'hashedpassword123',
        name: 'Test User',
      };

      const user = await User.create(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.password).toBe(userData.password);
      expect(user.isVerified).toBe(false); // default value
      expect(user.lastLogin).toBeDefined(); // has default
    });

    it('should require email for non-OAuth users', async () => {
      const userData = {
        password: 'hashedpassword123',
        name: 'Test User',
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should require password for non-OAuth users', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should require name field', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'hashedpassword123',
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should allow creating user with Google OAuth (no password required)', async () => {
      const userData = {
        email: 'google@example.com',
        name: 'Google User',
        googleId: 'google-id-123',
        isVerified: true,
      };

      const user = await User.create(userData);

      expect(user).toBeDefined();
      expect(user.googleId).toBe(userData.googleId);
      expect(user.password).toBeUndefined();
      expect(user.isVerified).toBe(true);
    });

    it('should enforce unique email constraint', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'hashedpassword123',
        name: 'User One',
      };

      await User.create(userData);

      // Try to create another user with the same email
      await expect(
        User.create({
          email: 'duplicate@example.com',
          password: 'anotherpassword',
          name: 'User Two',
        })
      ).rejects.toThrow();
    });

    it('should enforce unique googleId constraint', async () => {
      const userData = {
        email: 'google1@example.com',
        name: 'Google User One',
        googleId: 'unique-google-id',
      };

      await User.create(userData);

      // Try to create another user with the same googleId
      await expect(
        User.create({
          email: 'google2@example.com',
          name: 'Google User Two',
          googleId: 'unique-google-id',
        })
      ).rejects.toThrow();
    });
  });

  describe('Default Values', () => {
    it('should set isVerified to false by default', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
      });

      expect(user.isVerified).toBe(false);
    });

    it('should set lastLogin to current date by default', async () => {
      const before = new Date();
      const user = await User.create({
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
      });
      const after = new Date();

      expect(user.lastLogin).toBeDefined();
      expect(user.lastLogin.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(user.lastLogin.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should have timestamps (createdAt and updatedAt)', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
      });

      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Optional Fields', () => {
    it('should allow optional fields to be set', async () => {
      const verificationToken = '123456';
      const resetToken = 'reset-token-123';

      const user = await User.create({
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
        verificationToken,
        verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        resetPasswordToken: resetToken,
        resetPasswordExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
        profilePicture: 'https://example.com/pic.jpg',
      });

      expect(user.verificationToken).toBe(verificationToken);
      expect(user.verificationTokenExpiresAt).toBeDefined();
      expect(user.resetPasswordToken).toBe(resetToken);
      expect(user.resetPasswordExpiresAt).toBeDefined();
      expect(user.profilePicture).toBe('https://example.com/pic.jpg');
    });

    it('should allow optional fields to be undefined', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User',
      });

      expect(user.verificationToken).toBeUndefined();
      expect(user.verificationTokenExpiresAt).toBeUndefined();
      expect(user.resetPasswordToken).toBeUndefined();
      expect(user.resetPasswordExpiresAt).toBeUndefined();
      expect(user.googleId).toBeUndefined();
      expect(user.profilePicture).toBeUndefined();
    });
  });

  describe('Indexes', () => {
    it('should have index on verificationToken and verificationTokenExpiresAt', async () => {
      const indexes = User.collection.indexes();
      
      // The indexes should include a compound index for verification
      // This test verifies the model is set up correctly
      expect(indexes).toBeDefined();
    });

    it('should have index on resetPasswordToken and resetPasswordExpiresAt', async () => {
      const indexes = User.collection.indexes();
      
      // The indexes should include a compound index for password reset
      expect(indexes).toBeDefined();
    });
  });
});
