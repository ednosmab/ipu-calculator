import { test, expect, BrowserContext, Page } from '@playwright/test';
import { cleanupE2EModels } from './helpers/cleanup';

const MODEL_NAME = `E2E_FLOW_${Date.now()}`;
const INJECTION_TIME = '3.50';

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.waitForLoadState('load');

  await page.getByTestId('login-email-input').fill(email);
  await page.getByTestId('login-password-input').fill(password);
  await page.getByTestId('login-submit-button').click();

  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 });
}

async function goToModels(page: Page) {
  await page.goto('/models');
  await page.waitForLoadState('load');
  await page.waitForTimeout(1000);
}

test.describe('Security flows (auth-login unified)', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    test.skip(
      !TEST_USER_EMAIL || !TEST_USER_PASSWORD,
      'Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env.local'
    );

    context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('should login with valid credentials via auth-login edge function', async () => {
    const p = page;

    await login(p, TEST_USER_EMAIL!, TEST_USER_PASSWORD!);

    // Should land on /models (editor/admin role) or /admin (admin role)
    const currentUrl = p.url();
    expect(currentUrl).not.toContain('/login');
  });

  test('should reject invalid credentials and show error message', async () => {
    const p = page;

    await p.goto('/login');
    await p.waitForLoadState('load');

    await p.getByTestId('login-email-input').fill('wrong@email.com');
    await p.getByTestId('login-password-input').fill('WrongPassword123!');
    await p.getByTestId('login-submit-button').click();

    // Wait for error feedback — the auth-login edge function returns
    // INVALID_CREDENTIALS (generic message to prevent user enumeration)
    const errorText = p.locator('text=Credenciais inválidas')
      .or(p.locator('text=INVALID_CREDENTIALS'))
      .or(p.locator('text=Erro'));

    await expect(errorText.first()).toBeVisible({ timeout: 10_000 });
  });

  test('should allow admin to access admin routes', async () => {
    const p = page;

    // Login first
    await login(p, TEST_USER_EMAIL!, TEST_USER_PASSWORD!);

    // Navigate to admin
    await p.goto('/admin/users');
    await p.waitForLoadState('load');

    // If admin, should see the users list (not redirected to /unauthorized)
    const isUnauthorized = p.url().includes('/unauthorized');
    expect(isUnauthorized).toBe(false);
  });

  test('should persist session across page reloads', async () => {
    const p = page;

    // Already logged in from previous test
    await p.goto('/models');
    await p.waitForLoadState('load');

    // Reload
    await p.reload();
    await p.waitForLoadState('load');
    await p.waitForTimeout(3000); // Wait for session restore

    // Should still be on /models (not redirected to /login)
    expect(p.url()).not.toContain('/login');
  });

  test('should allow logout and redirect to login', async () => {
    const p = page;

    // Login
    await login(p, TEST_USER_EMAIL!, TEST_USER_PASSWORD!);

    // Logout via app (click logout button in nav menu or models screen)
    await p.goto('/models');
    await p.waitForLoadState('load');

    // Try to find and click logout icon
    const logoutBtn = p.locator('[data-testid="logout-button"]')
      .or(p.locator('[name="sign-out-alt"]'))
      .or(p.locator('svg[name="sign-out-alt"]'));

    if (await logoutBtn.isVisible().catch(() => false)) {
      await logoutBtn.click();
      await p.waitForTimeout(2000);
    }

    // Navigate to a protected route to verify redirect
    await p.goto('/models');
    await p.waitForLoadState('load');
    await p.waitForTimeout(3000);

    // Should be redirected to /login
    expect(p.url()).toContain('/login');
  });
});
