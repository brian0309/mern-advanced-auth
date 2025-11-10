import { connectTestDb, clearTestDb, disconnectTestDb } from './testDb';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.MONGO_URI = 'mongodb://localhost:27017/test';

export const setupTests = () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });
};
