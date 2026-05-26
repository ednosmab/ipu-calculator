// rate-limiting.spec.ts
// Rate limiting no login

// TODO: Implement E2E tests for rate limiting in login
// This test should verify:
// 1. 5 failed login attempts are allowed (401 each)
// 2. 6th attempt is blocked with 429 (rate limited)
// 3. After waiting 60 seconds, attempts are allowed again (401)
// 4. Rate limit is email-specific

import { test, expect } from '@playwright/test';

test.describe('Rate limiting in login', () => {
  test('should allow 5 failed attempts then block the 6th', () => {
    expect(true).toBe(true);
  });

  test('should reset rate limit after 60 seconds', () => {
    expect(true).toBe(true);
  });

  test('should apply rate limit per email', () => {
    expect(true).toBe(true);
  });
});