// Credentials matching the development seed (apps/api/src/db/seed/seed.ts)
export const SEED_CREDS = {
  superAdmin: { email: 'superadmin@desiredrycleaning.in', password: 'Admin@123!' },
  storeOwner: { email: 'owner@demo-store.in',            password: 'Store@123!' },
  rider:      { email: 'rider@demo-store.in',            password: 'Rider@123!' },
} as const;

export const APP_URLS = {
  user:  process.env['USER_APP_URL']  ?? 'http://localhost:3001',
  store: process.env['STORE_APP_URL'] ?? 'http://localhost:3002',
  admin: process.env['ADMIN_APP_URL'] ?? 'http://localhost:3003',
} as const;

export { test, expect } from '@playwright/test';
