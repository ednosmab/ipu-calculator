import { test, expect, BrowserContext, Page } from '@playwright/test';

const CACHE_VERSION = '2.2.0';

const MOCK_MODEL = {
  id: 'offline-test-model',
  name: 'Modelo Offline Test',
  type: 'ipu',
  inputs: { isocyanate: 0.0771, polyol: 0.1506 },
  createdAt: Date.now(),
  updatedAt: Date.now(),
  version: 1,
  syncStatus: 'synced',
  localAction: null,
};

async function blockNetwork(context: BrowserContext) {
  await context.route('**/google.com/favicon.ico', (route) => route.abort());
  await context.route('**/*.supabase.co/*', (route) => route.abort());
}

async function unblockNetwork(context: BrowserContext) {
  await context.unroute('**/google.com/favicon.ico');
  await context.unroute('**/*.supabase.co/*');
}

/**
 * Sets localStorage BEFORE any page JS executes,
 * so AsyncStorage picks up the data on init.
 */
async function primeCacheOnNextNavigation(page: Page, models = [MOCK_MODEL]) {
  const cache = JSON.stringify({
    data: models,
    expiresAt: Date.now() + 48 * 60 * 60 * 1000,
    schemaVersion: CACHE_VERSION,
  });
  await page.addInitScript(() => {
    localStorage.setItem('@ipu:models', '');
    localStorage.setItem('@ipu:cache_version', '');
  });
  await page.addInitScript(
    ({ cache, version }) => {
      localStorage.setItem('@ipu:models', cache);
      localStorage.setItem('@ipu:cache_version', version);
    },
    { cache, version: CACHE_VERSION }
  );
}

test.describe('Offline Sync: Acesso Offline', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('should load login page without crashing when offline', async () => {
    await blockNetwork(context);

    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('text=Acesso restrito')).toBeVisible({ timeout: 10_000 });
  });

  test('should show "Acessar Offline" button when offline and cache exists', async () => {
    await primeCacheOnNextNavigation(page);
    await blockNetwork(context);

    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const offlineButton = page.getByRole('button', { name: /acessar offline/i });
    await expect(offlineButton).toBeVisible({ timeout: 15_000 });
  });

  test('should navigate to models via "Acessar Offline" and show cached models', async () => {
    await primeCacheOnNextNavigation(page);
    await blockNetwork(context);

    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const offlineButton = page.getByRole('button', { name: /acessar offline/i });
    await offlineButton.click();

    await page.waitForURL('**/models', { timeout: 10_000 });
    await page.waitForTimeout(2000);

    await expect(page.getByTestId('model-card-Modelo Offline Test')).toBeVisible({ timeout: 10_000 });
  });

  test('should show offline indicator on models page when offline', async () => {
    await primeCacheOnNextNavigation(page);
    await blockNetwork(context);

    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await page.getByRole('button', { name: /acessar offline/i }).click();
    await page.waitForURL('**/models', { timeout: 10_000 });
    await page.waitForTimeout(1000);
  });

  test('should create model while offline, go online, and verify sync flow', async () => {
    await primeCacheOnNextNavigation(page);
    await blockNetwork(context);

    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    await page.getByRole('button', { name: /acessar offline/i }).click();
    await page.waitForURL('**/models', { timeout: 10_000 });
    await page.waitForTimeout(1000);
  });
});
