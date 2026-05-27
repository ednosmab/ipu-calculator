import { Page } from '@playwright/test';

export const E2E_PREFIX = 'E2E_SYNC_';

async function goToModels(page: Page) {
  await page.goto('/models');
  // Wait until either model cards or empty state text appears in the DOM
  await page.waitForFunction(() => {
    const hasCards = document.querySelectorAll('[data-testid^="model-card-"]').length > 0;
    const isEmpty = document.body.textContent?.includes('Nenhum modelo salvo') ?? false;
    return hasCards || isEmpty;
  }, { timeout: 15000 });
}

async function findE2EModelNames(page: Page): Promise<string[]> {
  return page.evaluate((prefix) => {
    const cards = document.querySelectorAll(`[data-testid^="model-card-${prefix}"]`);
    return Array.from(cards).map((card) => {
      const testId = card.getAttribute('data-testid')!;
      return testId.replace('model-card-', '');
    });
  }, E2E_PREFIX);
}

async function deleteModelByName(page: Page, name: string) {
  const card = page.getByTestId(`model-card-${name}`).first();
  const visible = await card.isVisible().catch(() => false);
  if (!visible) return;

  // Click the last icon button (trash = delete)
  const buttons = card.locator('div[style*="padding: 8px"]');
  const count = await buttons.count();
  if (count > 0) {
    await buttons.last().click();
  }

  // Wait for delete confirmation modal and click confirm
  const confirmBtn = page.getByRole('button', { name: /excluir|delete/i });
  await confirmBtn.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  if (await confirmBtn.isVisible().catch(() => false)) {
    await confirmBtn.click();
    await page.waitForTimeout(1500);
  }
}

export async function cleanupE2EModels(page: Page) {
  await goToModels(page);
  const modelNames = await findE2EModelNames(page);
  if (modelNames.length === 0) return;

  for (const name of modelNames) {
    await deleteModelByName(page, name);
  }
}
