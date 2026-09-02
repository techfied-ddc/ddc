import mongoose from 'mongoose';
import { beforeAll, afterAll, beforeEach } from 'vitest';

// Use a separate test DB
const TEST_DB = process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017/ddc_test';

beforeAll(async () => {
  await mongoose.connect(TEST_DB);
});

beforeEach(async () => {
  // Clean all collections before each test for isolation
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
});
