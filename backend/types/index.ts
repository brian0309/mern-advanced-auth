/**
 * Central export file for all backend TypeScript types
 * Import types from here in other files: import { IUser, LoginDTO } from '../types/index.js';
 */

// User types
export type {
  IUser,
  IUserDocument,
  CreateUserDTO,
  CreateGoogleUserDTO,
  UserResponse,
} from "./user.types.js";

// Auth types
export type {
  SignupDTO,
  LoginDTO,
  VerifyEmailDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
  ChangePasswordDTO,
  TokenPayload,
  GoogleProfile,
} from "./auth.types.js";

// API types
export type {
  ApiResponse,
  AuthResponse,
  VerificationResponse,
  LogoutResponse,
  CheckAuthResponse,
  GoogleOAuthUrlResponse,
  ErrorResponse,
} from "./api.types.js";

// Express extensions are automatically available when express.d.ts is included in compilation
