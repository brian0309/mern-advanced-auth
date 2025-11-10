import { Response } from 'express';
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

export const generateVerificationToken = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
