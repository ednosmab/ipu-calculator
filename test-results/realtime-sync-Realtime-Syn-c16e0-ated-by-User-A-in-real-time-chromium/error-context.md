# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: realtime-sync.spec.ts >> Realtime Sync: Two Clients >> User B sees model created by User A in real time
- Location: e2e/realtime-sync.spec.ts:116:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=E2E_SYNC_1777350632221')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('text=E2E_SYNC_1777350632221')

```

```
"afterAll" hook timeout of 60000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e9]:
  - generic [ref=e10]:
    - generic [ref=e13] [cursor=pointer]: 
    - generic [ref=e14]: Modelos
  - generic [ref=e18]:
    - textbox "Buscar modelo..." [ref=e20]
    - generic [ref=e21]:
      - generic [ref=e22]: Injeção
      - generic [ref=e24]:
        - generic [ref=e25]:
          - generic [ref=e26] [cursor=pointer]:
            - generic [ref=e27]: E2E_SYNC_1777350632221
            - generic [ref=e28]: 
          - generic [ref=e30] [cursor=pointer]:
            - generic [ref=e31]: "Tempo:"
            - generic [ref=e32]: 3,50s
        - generic [ref=e34] [cursor=pointer]: 
        - generic [ref=e36] [cursor=pointer]: 
      - generic [ref=e38]:
        - generic [ref=e39]:
          - generic [ref=e40] [cursor=pointer]:
            - generic [ref=e41]: KIKO
            - generic [ref=e42]: 
          - generic [ref=e44] [cursor=pointer]:
            - generic [ref=e45]: "Tempo:"
            - generic [ref=e46]: 68,00s
        - generic [ref=e48] [cursor=pointer]: 
        - generic [ref=e50] [cursor=pointer]: 
      - generic [ref=e52]:
        - generic [ref=e53]:
          - generic [ref=e54] [cursor=pointer]:
            - generic [ref=e55]: TAJ
            - generic [ref=e56]: 
          - generic [ref=e58] [cursor=pointer]:
            - generic [ref=e59]: "Tempo:"
            - generic [ref=e60]: 1,20s
        - generic [ref=e62] [cursor=pointer]: 
        - generic [ref=e64] [cursor=pointer]: 
      - generic [ref=e66]:
        - generic [ref=e67]:
          - generic [ref=e68] [cursor=pointer]:
            - generic [ref=e69]: TPA
            - generic [ref=e70]: 
          - generic [ref=e72] [cursor=pointer]:
            - generic [ref=e73]: "Tempo:"
            - generic [ref=e74]: 15,71s
        - generic [ref=e76] [cursor=pointer]: 
        - generic [ref=e78] [cursor=pointer]: 
  - button "Criar Novo" [ref=e81] [cursor=pointer]:
    - generic [ref=e82]: 
    - generic [ref=e83]: Criar Novo
```

# Test source

```ts
  3   | /**
  4   |  * E2E: Realtime Sync Between Two Clients
  5   |  *
  6   |  * Simulates two users opening the Models screen simultaneously.
  7   |  * When User A creates a model, User B should see it appear
  8   |  * without refreshing — powered by Supabase Realtime (WebSocket).
  9   |  *
  10  |  * Prerequisites:
  11  |  *   - Supabase project with Realtime enabled on the `models` table
  12  |  *   - .env with valid EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
  13  |  */
  14  | 
  15  | const MODEL_NAME = `E2E_SYNC_${Date.now()}`;
  16  | const INJECTION_TIME = '3.50';
  17  | 
  18  | // Helper: navigate from Home to Models screen
  19  | async function goToModels(page: Page) {
  20  |   await page.goto('/');
  21  |   await page.waitForLoadState('networkidle');
  22  | 
  23  |   // Click "Listar Modelos" button (PT default)
  24  |   const modelsButton = page.getByRole('button', { name: /listar modelos/i })
  25  |     .or(page.getByRole('link', { name: /listar modelos/i }))
  26  |     .or(page.locator('text=/Listar Modelos/i'));
  27  |   await modelsButton.first().click();
  28  | 
  29  |   // Wait for Models screen to load
  30  |   await page.waitForURL('**/models', { timeout: 10_000 });
  31  |   await page.waitForTimeout(500);
  32  | }
  33  | 
  34  | // Helper: create a model via the UI
  35  | async function createModel(page: Page, name: string, time: string) {
  36  |   // Click "Criar Novo"
  37  |   const createButton = page.getByRole('button', { name: /criar novo/i })
  38  |     .or(page.locator('text=/Criar Novo/i'));
  39  |   await createButton.first().click();
  40  | 
  41  |   // Fill the modal form
  42  |   await expect(page.locator('text=Novo Modelo')).toBeVisible({ timeout: 5_000 });
  43  | 
  44  |   const nameInput = page.locator('input[placeholder="Nome do modelo"]')
  45  |     .or(page.getByLabel('Nome'));
  46  |   await nameInput.first().fill(name);
  47  | 
  48  |   const timeInput = page.locator('input[placeholder="0.00"]')
  49  |     .or(page.getByLabel(/tempo de injeção/i));
  50  |   await timeInput.first().fill(time);
  51  | 
  52  |   // Click "Salvar"
  53  |   const saveButton = page.getByRole('button', { name: /salvar/i });
  54  |   await saveButton.click();
  55  | 
  56  |   // Wait for modal to close
  57  |   await expect(page.locator('text=Novo Modelo')).not.toBeVisible({ timeout: 10_000 });
  58  | }
  59  | 
  60  | // Helper: delete a model by name to clean up
  61  | async function deleteModelByName(page: Page, name: string) {
  62  |   const modelCard = page.locator(`text=${name}`).first();
  63  |   if (!(await modelCard.isVisible().catch(() => false))) return;
  64  | 
  65  |   // Find the trash icon within the same card row
  66  |   const card = modelCard.locator('..').locator('..').locator('..');
  67  |   const trashButton = card.locator('[data-testid="trash-button"]')
  68  |     .or(card.locator('text=/trash/i'))
  69  |     .or(card.locator('[aria-label*="trash"]'));
  70  | 
  71  |   // Fallback: click the last icon button in the row (trash is always last)
  72  |   const iconButtons = card.locator('div[role="button"]');
  73  |   const count = await iconButtons.count();
  74  |   if (count > 0) {
  75  |     await iconButtons.last().click();
  76  |   } else {
  77  |     // Try clicking the trash FontAwesome icon directly
  78  |     await trashButton.first().click();
  79  |   }
  80  | 
  81  |   // Confirm deletion
  82  |   const confirmButton = page.getByRole('button', { name: /excluir/i });
  83  |   if (await confirmButton.isVisible().catch(() => false)) {
  84  |     await confirmButton.click();
  85  |     await page.waitForTimeout(1_000);
  86  |   }
  87  | }
  88  | 
  89  | test.describe('Realtime Sync: Two Clients', () => {
  90  |   let contextA: BrowserContext;
  91  |   let contextB: BrowserContext;
  92  |   let pageA: Page;
  93  |   let pageB: Page;
  94  | 
  95  |   test.beforeAll(async ({ browser }) => {
  96  |     // Two independent browser contexts = two independent users
  97  |     contextA = await browser.newContext();
  98  |     contextB = await browser.newContext();
  99  |     pageA = await contextA.newPage();
  100 |     pageB = await contextB.newPage();
  101 |   });
  102 | 
> 103 |   test.afterAll(async () => {
      |        ^ "afterAll" hook timeout of 60000ms exceeded.
  104 |     // Cleanup: try to delete the test model
  105 |     try {
  106 |       await goToModels(pageA);
  107 |       await deleteModelByName(pageA, MODEL_NAME);
  108 |     } catch {
  109 |       // Ignore cleanup errors
  110 |     }
  111 | 
  112 |     await contextA.close();
  113 |     await contextB.close();
  114 |   });
  115 | 
  116 |   test('User B sees model created by User A in real time', async () => {
  117 |     // --- Step 1: Both users navigate to Models screen ---
  118 |     await goToModels(pageA);
  119 |     await goToModels(pageB);
  120 | 
  121 |     // --- Step 2: Verify model does NOT exist on User B's screen ---
  122 |     const modelTextB = pageB.locator(`text=${MODEL_NAME}`);
  123 |     await expect(modelTextB).not.toBeVisible({ timeout: 3_000 });
  124 | 
  125 |     // --- Step 3: User A creates a new model ---
  126 |     await createModel(pageA, MODEL_NAME, INJECTION_TIME);
  127 | 
  128 |     // Verify it appeared on User A's own screen
  129 |     await expect(pageA.locator(`text=${MODEL_NAME}`)).toBeVisible({ timeout: 10_000 });
  130 | 
  131 |     // --- Step 4: User B should see the new model appear (Realtime) ---
  132 |     // We give up to 15 seconds for the WebSocket event to propagate
  133 |     await expect(pageB.locator(`text=${MODEL_NAME}`)).toBeVisible({ timeout: 15_000 });
  134 |   });
  135 | });
  136 | 
```