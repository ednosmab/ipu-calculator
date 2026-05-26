import { test, expect, BrowserContext, Page } from '@playwright/test';

/**
 * E2E: Realtime Sync Between Two Clients
 *
 * Simulates two users opening the Models screen simultaneously.
 * When User A creates a model, User B should see it appear
 * without refreshing — powered by Supabase Realtime (WebSocket).
 *
 * Prerequisites:
 *   - .env.local with TEST_USER_EMAIL and TEST_USER_PASSWORD
 *   - Supabase project with Realtime enabled on the `models` table
 */

const MODEL_NAME = `E2E_SYNC_${Date.now()}`;
const INJECTION_TIME = '3.50';

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.waitForLoadState('load');

  await page.getByTestId('login-email-input').fill(email);
  await page.getByTestId('login-password-input').fill(password);
  await page.getByTestId('login-submit-button').click();

  // Wait for redirect away from /login (target: /models or /admin)
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 });
}

async function goToModels(page: Page) {
  await page.goto('/models');
  await page.waitForLoadState('load');
  await page.waitForTimeout(1000);
}

async function createModel(page: Page, name: string, time: string) {
  const createButton = page.getByRole('button', { name: /criar novo/i })
    .or(page.locator('text=/Criar Novo/i'));
  await createButton.first().click();

  await expect(page.locator('text=Novo Modelo')).toBeVisible({ timeout: 5_000 });

  const nameInput = page.locator('input[placeholder="Nome do modelo"]')
    .or(page.getByLabel('Nome'));
  await nameInput.first().fill(name);

  const timeInput = page.locator('input[placeholder="0.00"]')
    .or(page.getByLabel(/tempo de injeção/i));
  await timeInput.first().fill(time);

  const saveButton = page.getByRole('button', { name: /salvar/i });
  await saveButton.click();

  await expect(page.locator('text=Novo Modelo')).not.toBeVisible({ timeout: 10_000 });
}

async function deleteModelByName(page: Page, name: string) {
  const modelCard = page.getByTestId(`model-card-${name}`).first();
  if (!(await modelCard.isVisible().catch(() => false))) return;

  const card = modelCard.locator('..').locator('..').locator('..');
  const iconButtons = card.locator('div[role="button"]');
  const count = await iconButtons.count();
  if (count > 0) {
    await iconButtons.last().click();
  }

  const confirmButton = page.getByRole('button', { name: /excluir/i });
  if (await confirmButton.isVisible().catch(() => false)) {
    await confirmButton.click();
    await page.waitForTimeout(1_000);
  }
}

test.describe('Realtime Sync: Two Clients', () => {
  let contextA: BrowserContext | null = null;
  let contextB: BrowserContext | null = null;
  let pageA: Page | null = null;
  let pageB: Page | null = null;

  test.beforeAll(async ({ browser }) => {
    test.skip(
      !TEST_USER_EMAIL || !TEST_USER_PASSWORD,
      'Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env.local'
    );

    contextA = await browser.newContext();
    contextB = await browser.newContext();
    pageA = await contextA.newPage();
    pageB = await contextB.newPage();

    await login(pageA, TEST_USER_EMAIL!, TEST_USER_PASSWORD!);
    await login(pageB, TEST_USER_EMAIL!, TEST_USER_PASSWORD!);
  });

  test.afterAll(async () => {
    if (pageA) {
      try {
        await goToModels(pageA);
        await deleteModelByName(pageA, MODEL_NAME);
      } catch {
        // Ignore cleanup errors
      }
    }

    await contextA?.close();
    await contextB?.close();
  });

  test('User B sees model created by User A in real time', async () => {
    const pA = pageA!;
    const pB = pageB!;

    // Step 1: Both users navigate to Models screen
    await goToModels(pA);
    await goToModels(pB);

    // Step 2: Verify model does NOT exist on User B's screen
    const modelCardB = pB.getByTestId(`model-card-${MODEL_NAME}`);
    await expect(modelCardB).not.toBeVisible({ timeout: 3_000 });

    // Step 3: User A creates a new model
    await createModel(pA, MODEL_NAME, INJECTION_TIME);

    // Verify it appeared on User A's own screen
    await expect(pA.getByTestId(`model-card-${MODEL_NAME}`)).toBeVisible({ timeout: 10_000 });

    // Step 4: User B should see the new model appear (Realtime)
    await expect(pB.getByTestId(`model-card-${MODEL_NAME}`)).toBeVisible({ timeout: 15_000 });
  });
});
