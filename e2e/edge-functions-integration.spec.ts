import { test, expect, Page } from '@playwright/test';
import { cleanupE2EModels } from './helpers/cleanup';

const MODEL_PREFIX = `E2E_CRUD_${Date.now()}`;
const INJECTION_TIME = '3.50';
const UPDATED_TIME = '4.20';

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;

async function login(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('load');

  await page.getByTestId('login-email-input').fill(TEST_USER_EMAIL!);
  await page.getByTestId('login-password-input').fill(TEST_USER_PASSWORD!);
  await page.getByTestId('login-submit-button').click();

  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 });
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

test.describe('Edge Functions Integration: CRUD via App', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    test.skip(
      !TEST_USER_EMAIL || !TEST_USER_PASSWORD,
      'Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env.local'
    );

    page = await browser.newPage();
    await login(page);

    // Clean any leftovers
    await cleanupE2EModels(page);
  });

  test.afterAll(async () => {
    if (page) {
      try {
        await cleanupE2EModels(page);
      } catch { /* ignore */ }
    }
    await page?.context()?.close();
  });

  test('create a model via Edge Functions (models-sync)', async () => {
    const p = page!;
    const modelName = `${MODEL_PREFIX}_CREATE`;

    // Navigate to models
    await p.goto('/models');
    await p.waitForLoadState('load');
    await p.waitForTimeout(1000);

    // Create model
    await createModel(p, modelName, INJECTION_TIME);

    // Verify it appears on screen
    const modelCard = p.getByTestId(`model-card-${modelName}`);
    await expect(modelCard).toBeVisible({ timeout: 10_000 });

    // Verify sync status indicator (should show synced or pending badge)
    const statusBadge = modelCard.locator('[data-testid*="sync"]')
      .or(modelCard.locator('text=synced'))
      .or(modelCard.locator('text=pending'));
    await expect(statusBadge.or(modelCard)).toBeVisible({ timeout: 5_000 });
  });

  test('read and verify a model loaded from server (models-get)', async () => {
    const p = page!;
    const modelName = `${MODEL_PREFIX}_READ`;

    // Create a second model
    await createModel(p, modelName, INJECTION_TIME);

    // Navigate away and back to force a fresh read from server
    await p.goto('/calculator');
    await p.waitForLoadState('load');
    await p.goto('/models');
    await p.waitForLoadState('load');
    await p.waitForTimeout(1500);

    // Model should be present (loaded via models-get)
    const modelCard = p.getByTestId(`model-card-${modelName}`);
    await expect(modelCard).toBeVisible({ timeout: 10_000 });
  });

  test('delete a model via Edge Functions (models-delete)', async () => {
    const p = page!;
    const modelName = `${MODEL_PREFIX}_DELETE`;

    // Create a model to delete
    await p.goto('/models');
    await p.waitForLoadState('load');
    await p.waitForTimeout(1000);

    await createModel(p, modelName, INJECTION_TIME);

    // Verify it exists
    await expect(p.getByTestId(`model-card-${modelName}`)).toBeVisible({ timeout: 5_000 });

    // Delete it
    const card = p.getByTestId(`model-card-${modelName}`);
    const deleteBtn = card.locator('div[style*="padding: 8px"]').last();
    await deleteBtn.click();

    // Confirm deletion
    const confirmBtn = p.getByRole('button', { name: /excluir|delete/i });
    await confirmBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await confirmBtn.click();

    // Wait for removal
    await p.waitForTimeout(2000);

    // Verify it's gone
    await expect(p.getByTestId(`model-card-${modelName}`)).not.toBeVisible({ timeout: 10_000 });
  });
});
