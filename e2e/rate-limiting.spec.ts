import { test, expect } from '@playwright/test';

/**
 * Rate limiting tests for the auth-login Edge Function.
 * Makes direct HTTP calls to the Edge Function (bypasses UI)
 * to verify the 5/60s in-memory rate limiter.
 */

const EDGE_FUNCTIONS_URL = process.env.EXPO_PUBLIC_EDGE_FUNCTIONS_URL;
const TEST_EMAIL = `rate-limit-test-${Date.now()}@test.com`;

function postLogin(email: string, password: string) {
  return fetch(`${EDGE_FUNCTIONS_URL}/auth-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

test.describe('Rate limiting in auth-login', () => {
  test.beforeAll(async () => {
    test.skip(
      !EDGE_FUNCTIONS_URL,
      'Set EXPO_PUBLIC_EDGE_FUNCTIONS_URL in .env.local'
    );
  });

  test('should allow 5 failed attempts then block the 6th with 429', async () => {
    // First 5 attempts should be 401 (INVALID_CREDENTIALS)
    for (let i = 0; i < 5; i++) {
      const res = await postLogin(TEST_EMAIL, 'wrong-password');
      expect(res.status).toBe(401);
    }

    // 6th attempt should be 429 (RATE_LIMITED)
    const blockedRes = await postLogin(TEST_EMAIL, 'wrong-password');
    expect(blockedRes.status).toBe(429);

    const body = await blockedRes.json();
    expect(body.error).toBe('RATE_LIMITED');
  });

  test('should apply rate limit per email separately', async () => {
    const emailA = `rate-limit-a-${Date.now()}@test.com`;
    const emailB = `rate-limit-b-${Date.now()}@test.com`;

    // Exhaust email A's attempts
    for (let i = 0; i < 5; i++) {
      const res = await postLogin(emailA, 'wrong-password');
      expect(res.status).toBe(401);
    }

    // Email A should now be blocked
    const blockedA = await postLogin(emailA, 'wrong-password');
    expect(blockedA.status).toBe(429);

    // Email B should still be allowed (independent counter)
    const allowedB = await postLogin(emailB, 'wrong-password');
    expect(allowedB.status).toBe(401);
  });
});
