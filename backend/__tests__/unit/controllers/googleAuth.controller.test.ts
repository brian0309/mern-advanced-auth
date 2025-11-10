import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupTests } from '../../setup/globalSetup';
import { getGoogleAuthUrl, googleAuthCallback } from '../../../controllers/googleAuth.controller';
import { createMockRequest, createMockResponse, createTestUser } from '../../helpers/testHelpers';
import { User } from '../../../models/user.model';
import * as googleAuthConfig from '../../../config/googleAuth';

// Mock the Google Auth configuration
jest.mock('../../../config/googleAuth', () => ({
  getGoogleAuthURL: jest.fn(),
  getGoogleUser: jest.fn(),
}));

// Initialize database for tests
setupTests();

describe('Google Auth Controller', () => {
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    mockRequest = createMockRequest({});
    mockResponse = createMockResponse();
    process.env.CLIENT_URL = 'http://localhost:3000';
  });

  describe('getGoogleAuthUrl', () => {
    it('should return Google OAuth URL', () => {
      const mockUrl = 'https://accounts.google.com/o/oauth2/auth?...';
      const mockState = 'random-state-string';

      (googleAuthConfig.getGoogleAuthURL as jest.Mock).mockReturnValue({
        url: mockUrl,
        state: mockState,
      });

      getGoogleAuthUrl(mockRequest, mockResponse as any);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ url: mockUrl });
    });

    it('should set oauth_state cookie for CSRF protection', () => {
      const mockState = 'random-state-string';

      (googleAuthConfig.getGoogleAuthURL as jest.Mock).mockReturnValue({
        url: 'https://accounts.google.com/o/oauth2/auth',
        state: mockState,
      });

      getGoogleAuthUrl(mockRequest, mockResponse as any);

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'oauth_state',
        mockState,
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 10 * 60 * 1000, // 10 minutes
        })
      );
    });

    it('should return 500 if URL generation fails', () => {
      (googleAuthConfig.getGoogleAuthURL as jest.Mock).mockImplementation(() => {
        throw new Error('Config error');
      });

      getGoogleAuthUrl(mockRequest, mockResponse as any);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error generating Google URL',
      });
    });
  });

  describe('googleAuthCallback', () => {
    it('should create new user and redirect on successful OAuth', async () => {
      const mockGoogleUser = {
        id: 'google-id-123',
        email: 'newuser@example.com',
        name: 'New Google User',
        picture: 'https://example.com/pic.jpg',
        verified_email: true,
      };

      const state = 'matching-state';
      mockRequest.query = { code: 'auth-code', state };
      mockRequest.cookies = { oauth_state: state };

      (googleAuthConfig.getGoogleUser as jest.Mock).mockResolvedValue(mockGoogleUser);

      await googleAuthCallback(mockRequest, mockResponse as any);

      // Verify user was created
      const user = await User.findOne({ email: 'newuser@example.com' });
      expect(user).toBeDefined();
      expect(user?.googleId).toBe('google-id-123');
      expect(user?.isVerified).toBe(true);

      // Verify redirect with success
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('success=true')
      );
    });

    it('should redirect to error page if state does not match (CSRF protection)', async () => {
      mockRequest.query = { code: 'auth-code', state: 'different-state' };
      mockRequest.cookies = { oauth_state: 'original-state' };

      await googleAuthCallback(mockRequest, mockResponse as any);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('error=invalid_state')
      );

      // Verify no user was created
      const userCount = await User.countDocuments();
      expect(userCount).toBe(0);
    });

    it('should redirect to error page if no code provided', async () => {
      const state = 'matching-state';
      mockRequest.query = { state };
      mockRequest.cookies = { oauth_state: state };

      await googleAuthCallback(mockRequest, mockResponse as any);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('error=no_code')
      );
    });

    it('should link Google account to existing email user', async () => {
      // Create existing user without Google ID
      const existingUser = await createTestUser({
        email: 'existing@example.com',
        password: 'password123',
        isVerified: false,
      });

      const mockGoogleUser = {
        id: 'google-id-456',
        email: 'existing@example.com',
        name: 'Existing User',
        picture: 'https://example.com/pic.jpg',
        verified_email: true,
      };

      const state = 'matching-state';
      mockRequest.query = { code: 'auth-code', state };
      mockRequest.cookies = { oauth_state: state };

      (googleAuthConfig.getGoogleUser as jest.Mock).mockResolvedValue(mockGoogleUser);

      await googleAuthCallback(mockRequest, mockResponse as any);

      // Verify Google account was linked
      const updatedUser = await User.findById(existingUser._id);
      expect(updatedUser?.googleId).toBe('google-id-456');
      expect(updatedUser?.isVerified).toBe(true); // Should be verified via Google
    });

    it('should login existing Google user', async () => {
      // Create existing Google user
      await createTestUser({
        email: 'google@example.com',
        googleId: 'google-id-789',
        isVerified: true,
      });

      const mockGoogleUser = {
        id: 'google-id-789',
        email: 'google@example.com',
        name: 'Google User',
        picture: 'https://example.com/pic.jpg',
        verified_email: true,
      };

      const state = 'matching-state';
      mockRequest.query = { code: 'auth-code', state };
      mockRequest.cookies = { oauth_state: state };

      (googleAuthConfig.getGoogleUser as jest.Mock).mockResolvedValue(mockGoogleUser);

      await googleAuthCallback(mockRequest, mockResponse as any);

      // Verify user count didn't increase (no duplicate)
      const userCount = await User.countDocuments();
      expect(userCount).toBe(1);

      // Verify lastLogin was updated
      const user = await User.findOne({ email: 'google@example.com' });
      expect(user?.lastLogin).toBeDefined();
    });

    it('should clear oauth_state cookie after verification', async () => {
      const mockGoogleUser = {
        id: 'google-id-123',
        email: 'user@example.com',
        name: 'User',
        picture: 'https://example.com/pic.jpg',
        verified_email: true,
      };

      const state = 'matching-state';
      mockRequest.query = { code: 'auth-code', state };
      mockRequest.cookies = { oauth_state: state };

      (googleAuthConfig.getGoogleUser as jest.Mock).mockResolvedValue(mockGoogleUser);

      await googleAuthCallback(mockRequest, mockResponse as any);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('oauth_state');
    });

    it('should redirect to error page on authentication failure', async () => {
      const state = 'matching-state';
      mockRequest.query = { code: 'invalid-code', state };
      mockRequest.cookies = { oauth_state: state };

      (googleAuthConfig.getGoogleUser as jest.Mock).mockRejectedValue(
        new Error('Google auth failed')
      );

      await googleAuthCallback(mockRequest, mockResponse as any);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('error=google_auth_failed')
      );
    });

    it('should update profile picture if not set', async () => {
      const existingUser = await createTestUser({
        email: 'user@example.com',
        googleId: 'google-123',
      });

      const mockGoogleUser = {
        id: 'google-123',
        email: 'user@example.com',
        name: 'User',
        picture: 'https://example.com/new-pic.jpg',
        verified_email: true,
      };

      const state = 'matching-state';
      mockRequest.query = { code: 'auth-code', state };
      mockRequest.cookies = { oauth_state: state };

      (googleAuthConfig.getGoogleUser as jest.Mock).mockResolvedValue(mockGoogleUser);

      await googleAuthCallback(mockRequest, mockResponse as any);

      const updatedUser = await User.findById(existingUser._id);
      expect(updatedUser?.profilePicture).toBe('https://example.com/new-pic.jpg');
    });

    it('should redirect to error page if state is missing', async () => {
      mockRequest.query = { code: 'auth-code' }; // No state
      mockRequest.cookies = { oauth_state: 'some-state' };

      await googleAuthCallback(mockRequest, mockResponse as any);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('error=invalid_state')
      );
    });

    it('should redirect to error page if stored state is missing', async () => {
      mockRequest.query = { code: 'auth-code', state: 'some-state' };
      mockRequest.cookies = {}; // No stored state

      await googleAuthCallback(mockRequest, mockResponse as any);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('error=invalid_state')
      );
    });
  });
});
