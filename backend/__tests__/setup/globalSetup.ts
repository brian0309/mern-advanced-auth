import { setupMockDb, clearMockDb, teardownMockDb } from './mockDb';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.MONGO_URI = 'mongodb://localhost:27017/test';

export const setupTests = () => {
  beforeAll(async () => {
    setupMockDb();
  });

  afterEach(async () => {
    clearMockDb();
  });

  afterAll(async () => {
    teardownMockDb();
  });
};
