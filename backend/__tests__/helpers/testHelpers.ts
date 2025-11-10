import { Response } from 'express';
import { User } from '../../models/user.model';
import bcryptjs from 'bcryptjs';

export const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
  };
  return res;
};

export const createMockRequest = (data: any = {}): any => {
  return {
    body: data.body || {},
    params: data.params || {},
    query: data.query || {},
    cookies: data.cookies || {},
    userId: data.userId || undefined,
  };
};

export const createTestUser = async (userData: {
  email?: string;
  password?: string;
  name?: string;
  isVerified?: boolean;
  googleId?: string;
}) => {
  const hashedPassword = userData.password 
    ? await bcryptjs.hash(userData.password, 10)
    : undefined;

  const user = await User.create({
    email: userData.email || 'test@example.com',
    password: hashedPassword,
    name: userData.name || 'Test User',
    isVerified: userData.isVerified ?? false,
    googleId: userData.googleId,
  });

  return user;
};

export const generateVerificationToken = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
