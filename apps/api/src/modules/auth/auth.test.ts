import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';

// Mock the SMS adapter so tests don't need real MSG91
vi.mock('../notifications/channels/sms.adapter.js', () => ({
  getSmsAdapter: () => ({
    sendOtp:  vi.fn().mockResolvedValue(undefined),
    sendText: vi.fn().mockResolvedValue(undefined),
  }),
}));

// Mock Redis for rate-limit keys
vi.mock('../../lib/redis.js', () => {
  const store = new Map<string, string>();
  const mockRedis = {
    incr:   vi.fn(async (k: string) => { store.set(k, String((Number(store.get(k) ?? 0)) + 1)); return Number(store.get(k)); }),
    expire: vi.fn().mockResolvedValue(1),
    ttl:    vi.fn().mockResolvedValue(-1), // no cooldown by default
    set:    vi.fn().mockResolvedValue('OK'),
    get:    vi.fn(async (k: string) => store.get(k) ?? null),
  };
  return { getRedis: () => mockRedis, getDuplicateRedis: () => mockRedis };
});

const app = createApp();

describe('POST /api/v1/auth/otp/send', () => {
  it('accepts a valid Indian phone and returns ok', async () => {
    const res = await request(app)
      .post('/api/v1/auth/otp/send')
      .send({ phone: '9876543210' }); // 10-digit format

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('rejects an invalid phone', async () => {
    const res = await request(app)
      .post('/api/v1/auth/otp/send')
      .send({ phone: '1234' });

    expect(res.status).toBe(422);
    expect(res.body.ok).toBe(false);
  });
});

describe('POST /api/v1/auth/otp/verify', () => {
  it('returns 400 when no OTP record exists', async () => {
    const res = await request(app)
      .post('/api/v1/auth/otp/verify')
      .send({ phone: '9876543210', otp: '123456' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_OTP');
  });
});

describe('POST /api/v1/auth/email/login', () => {
  it('returns 401 for unknown user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/email/login')
      .send({ email: 'unknown@example.com', password: 'Password123!' });

    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });
});

describe('POST /api/v1/auth/email/register + login flow', () => {
  it('registers a new user then logs them in', async () => {
    const regRes = await request(app)
      .post('/api/v1/auth/email/register')
      .send({ name: 'Test Admin', email: 'admin@test.in', password: 'Password123!' });

    expect(regRes.status).toBe(201);
    expect(regRes.body.data.accessToken).toBeDefined();

    const loginRes = await request(app)
      .post('/api/v1/auth/email/login')
      .send({ email: 'admin@test.in', password: 'Password123!' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.accessToken).toBeDefined();
  });

  it('rejects wrong password', async () => {
    await request(app)
      .post('/api/v1/auth/email/register')
      .send({ name: 'Test', email: 'user2@test.in', password: 'Password123!' });

    const res = await request(app)
      .post('/api/v1/auth/email/login')
      .send({ email: 'user2@test.in', password: 'WrongPassword' });

    expect(res.status).toBe(401);
  });

  it('rejects duplicate email on register', async () => {
    await request(app)
      .post('/api/v1/auth/email/register')
      .send({ name: 'First', email: 'dup@test.in', password: 'Password123!' });

    const res = await request(app)
      .post('/api/v1/auth/email/register')
      .send({ name: 'Second', email: 'dup@test.in', password: 'Password123!' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });
});

describe('POST /api/v1/auth/refresh', () => {
  it('returns 401 when no refresh token is provided', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({});

    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/users/me', () => {
  it('returns 401 without auth header', async () => {
    const res = await request(app).get('/api/v1/users/me');
    expect(res.status).toBe(401);
  });

  it('returns user data with valid token', async () => {
    // Register + get token
    const reg = await request(app)
      .post('/api/v1/auth/email/register')
      .send({ name: 'Me User', email: 'me@test.in', password: 'Password123!' });

    const token = reg.body.data.accessToken;

    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('me@test.in');
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });
});
