import { test, expect, BrowserContext, Page } from '@playwright/test';

/**
 * E2E: Realtime Sync Between Two Clients
 *
 * Simulates two users opening the Models screen simultaneously.
 * When User A creates a model, User B should see it appear
 * without refreshing — powered by Supabase Realtime (WebSocket).
 *
 * Prerequisites:
 *   - Supabase project with Realtime enabled on the `models` table
 *   - .env with valid EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
 */

const MODEL_NAME = `E2E_SYNC_${Date.now()}`;
const INJECTION_TIME = '3.50';

// Helper: navigate from Home to Models screen
async function goToModels(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Click "Listar Modelos" button (PT default)
  const modelsButton = page.getByRole('button', { name: /listar modelos/i })
    .or(page.getByRole('link', { name: /listar modelos/i }))
    .or(page.locator('text=/Listar Modelos/i'));
  await modelsButton.first().click();

  // Wait for Models screen to load
  await page.waitForURL('**/models', { timeout: 10_000 });
  await page.waitForTimeout(500);
}

// Helper: create a model via the UI
async function createModel(page: Page, name: string, time: string) {
  // Click "Criar Novo"
  const createButton = page.getByRole('button', { name: /criar novo/i })
    .or(page.locator('text=/Criar Novo/i'));
  await createButton.first().click();

  // Fill the modal form
  await expect(page.locator('text=Novo Modelo')).toBeVisible({ timeout: 5_000 });

  const nameInput = page.locator('input[placeholder="Nome do modelo"]')
    .or(page.getByLabel('Nome'));
  await nameInput.first().fill(name);

  const timeInput = page.locator('input[placeholder="0.00"]')
    .or(page.getByLabel(/tempo de injeção/i));
  await timeInput.first().fill(time);

  // Click "Salvar"
  const saveButton = page.getByRole('button', { name: /salvar/i });
  await saveButton.click();

  // Wait for modal to close
  await expect(page.locator('text=Novo Modelo')).not.toBeVisible({ timeout: 10_000 });
}

// Helper: delete a model by name to clean up
async function deleteModelByName(page: Page, name: string) {
  const modelCard = page.locator(`text=${name}`).first();
  if (!(await modelCard.isVisible().catch(() => false))) return;

  // Find the trash icon within the same card row
  const card = modelCard.locator('..').locator('..').locator('..');
  const trashButton = card.locator('[data-testid="trash-button"]')
    .or(card.locator('text=/trash/i'))
    .or(card.locator('[aria-label*="trash"]'));

  // Fallback: click the last icon button in the row (trash is always last)
  const iconButtons = card.locator('div[role="button"]');
  const count = await iconButtons.count();
  if (count > 0) {
    await iconButtons.last().click();
  } else {
    // Try clicking the trash FontAwesome icon directly
    await trashButton.first().click();
  }

  // Confirm deletion
  const confirmButton = page.getByRole('button', { name: /excluir/i });
  if (await confirmButton.isVisible().catch(() => false)) {
    await confirmButton.click();
    await page.waitForTimeout(1_000);
  }
}

test.describe('Realtime Sync: Two Clients', () => {
  let contextA: BrowserContext;
  let contextB: BrowserContext;
  let pageA: Page;
  let pageB: Page;

  test.beforeAll(async ({ browser }) => {
    // Two independent browser contexts = two independent users
    contextA = await browser.newContext();
    contextB = await browser.newContext();
    pageA = await contextA.newPage();
    pageB = await contextB.newPage();
  });

  test.afterAll(async () => {
    // Cleanup: try to delete the test model
    try {
      await goToModels(pageA);
      await deleteModelByName(pageA, MODEL_NAME);
    } catch {
      // Ignore cleanup errors
    }

    await contextA.close();
    await contextB.close();
  });

  test('User B sees model created by User A in real time', async () => {
    // --- Step 1: Both users navigate to Models screen ---
    await goToModels(pageA);
    await goToModels(pageB);

    // --- Step 2: Verify model does NOT exist on User B's screen ---
    const modelTextB = pageB.locator(`text=${MODEL_NAME}`);
    await expect(modelTextB).not.toBeVisible({ timeout: 3_000 });

    // --- Step 3: User A creates a new model ---
    await createModel(pageA, MODEL_NAME, INJECTION_TIME);

    // Verify it appeared on User A's own screen
    await expect(pageA.locator(`text=${MODEL_NAME}`)).toBeVisible({ timeout: 10_000 });

    // --- Step 4: User B should see the new model appear (Realtime) ---
    // We give up to 15 seconds for the WebSocket event to propagate
    await expect(pageB.locator(`text=${MODEL_NAME}`)).toBeVisible({ timeout: 15_000 });
  });
});
