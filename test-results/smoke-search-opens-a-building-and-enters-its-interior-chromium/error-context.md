# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> search opens a building and enters its interior
- Location: tests/smoke.spec.ts:79:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('dialog', { name: /Main Street Market/i })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByRole('dialog', { name: /Main Street Market/i })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic:
      - generic:
        - generic:
          - paragraph: Epic MusicSpace · Premium City OS
          - heading "Main Street Market" [level=1]
          - paragraph: The biggest beat marketplace in the city. Marketplaces turn discovery into licensing with pricing tiers, checkout, and downloadable inventory.
          - generic:
            - generic: The City
            - generic: Hip-Hop Highway
            - generic: Main Street Market
            - generic: BUILDING
        - generic:
          - button "Back to previous layer" [ref=e4] [cursor=pointer]
          - generic: Live studio feed connected · 6 districts active
      - generic:
        - generic:
          - generic:
            - paragraph: District focus
            - heading "Hip-Hop Highway" [level=2]
            - paragraph: Boom bap to now. The main drag.
          - generic:
            - generic:
              - strong: "10"
              - generic: Buildings
            - generic:
              - strong: "2"
              - generic: Landmarks
            - generic:
              - strong: "4"
              - generic: Monetizable spaces
          - generic:
            - generic:
              - generic:
                - generic: 🛍 Main Street Market
                - generic: The biggest beat marketplace in the city.
              - generic:
                - button "Enter interior" [ref=e5] [cursor=pointer]
                - button "Copy link to this building": 🔗 Share
            - generic:
              - generic: Commerce loop
              - paragraph: Marketplaces turn discovery into licensing with pricing tiers, checkout, and downloadable inventory.
          - generic:
            - paragraph: Inventory
            - generic:
              - button "🎙 Boom Bap Studio Recording Studio Classic hip-hop production. SP-1200 in every room." [ref=e6] [cursor=pointer]:
                - generic [ref=e7]:
                  - generic [ref=e8]: 🎙 Boom Bap Studio
                  - generic [ref=e9]: Recording Studio
                - generic [ref=e10]: Classic hip-hop production. SP-1200 in every room.
              - button "🏢 Label Row HQ Label Office The most powerful label in EMS. Corner office on the top floor." [ref=e11] [cursor=pointer]:
                - generic [ref=e12]:
                  - generic [ref=e13]: 🏢 Label Row HQ
                  - generic [ref=e14]: Label Office
                - generic [ref=e15]: The most powerful label in EMS. Corner office on the top floor.
              - button "🎵 The Cipher Listening Room Group listening, freestyles, and listening parties. Open to all." [ref=e16] [cursor=pointer]:
                - generic [ref=e17]:
                  - generic [ref=e18]: 🎵 The Cipher
                  - generic [ref=e19]: Listening Room
                - generic [ref=e20]: Group listening, freestyles, and listening parties. Open to all.
              - button "🛍 Main Street Market Marketplace The biggest beat marketplace in the city." [ref=e21] [cursor=pointer]:
                - generic [ref=e22]:
                  - generic [ref=e23]: 🛍 Main Street Market
                  - generic [ref=e24]: Marketplace
                - generic [ref=e25]: The biggest beat marketplace in the city.
              - button "🎪 The Grind Club / Lounge Late-night sessions and listening parties." [ref=e26] [cursor=pointer]:
                - generic [ref=e27]:
                  - generic [ref=e28]: 🎪 The Grind
                  - generic [ref=e29]: Club / Lounge
                - generic [ref=e30]: Late-night sessions and listening parties.
              - button "🛍 Sample Shop Marketplace Vintage breaks and rare sample packs." [ref=e31] [cursor=pointer]:
                - generic [ref=e32]:
                  - generic [ref=e33]: 🛍 Sample Shop
                  - generic [ref=e34]: Marketplace
                - generic [ref=e35]: Vintage breaks and rare sample packs.
              - button "🏠 Producer Loft Artist Residence Artist residence." [ref=e36] [cursor=pointer]:
                - generic [ref=e37]:
                  - generic [ref=e38]: 🏠 Producer Loft
                  - generic [ref=e39]: Artist Residence
                - generic [ref=e40]: Artist residence.
              - button "🏠 MC's Palace Artist Residence Artist residence." [ref=e41] [cursor=pointer]:
                - generic [ref=e42]:
                  - generic [ref=e43]: 🏠 MC's Palace
                  - generic [ref=e44]: Artist Residence
                - generic [ref=e45]: Artist residence.
              - button "🏠 Old School Apts Artist Residence Artist residence." [ref=e46] [cursor=pointer]:
                - generic [ref=e47]:
                  - generic [ref=e48]: 🏠 Old School Apts
                  - generic [ref=e49]: Artist Residence
                - generic [ref=e50]: Artist residence.
              - button "🏠 The Crib Artist Residence Artist residence." [ref=e51] [cursor=pointer]:
                - generic [ref=e52]:
                  - generic [ref=e53]: 🏠 The Crib
                  - generic [ref=e54]: Artist Residence
                - generic [ref=e55]: Artist residence.
    - navigation "District navigation map" [ref=e56]:
      - generic [ref=e57]:
        - generic [ref=e58]:
          - paragraph [ref=e59]: Districts
          - paragraph [ref=e60]: Hip-Hop Highway
        - button "Hide map" [expanded] [ref=e61] [cursor=pointer]
      - generic [ref=e62]:
        - button "Trap Ave" [ref=e63] [cursor=pointer]:
          - generic [ref=e64]: Trap Ave
        - button "R&B Blvd" [ref=e65] [cursor=pointer]:
          - generic [ref=e66]: R&B Blvd
        - button "Drill District" [ref=e67] [cursor=pointer]:
          - generic [ref=e68]: Drill District
        - button "Hip-Hop Highway" [pressed] [ref=e69] [cursor=pointer]:
          - generic [ref=e70]: Hip-Hop Highway
        - button "Pop Plaza" [ref=e72] [cursor=pointer]:
          - generic [ref=e73]: Pop Plaza
        - button "Afrobeats Alley" [ref=e74] [cursor=pointer]:
          - generic [ref=e75]: Afrobeats Alley
      - paragraph [ref=e76]: Tap a district to jump there
  - button "Open Next.js Dev Tools" [ref=e82] [cursor=pointer]:
    - img [ref=e83]
  - alert [ref=e86]
```

# Test source

```ts
  1   | import { expect, test } from '@playwright/test';
  2   | 
  3   | const liveStudiosPayload = {
  4   |   source: 'live',
  5   |   studios: [
  6   |     {
  7   |       username: 'boomboxx',
  8   |       name: 'BOOMBOXX Studio',
  9   |       image: null,
  10  |       district: 'LABEL_ROW',
  11  |       level: 7,
  12  |       avgScore: 94,
  13  |       songCount: 28,
  14  |       totalSold: 320,
  15  |     },
  16  |   ],
  17  | };
  18  | 
  19  | test.beforeEach(async ({ page }) => {
  20  |   await page.addInitScript(() => {
  21  |     window.localStorage.setItem('ems-seen-v1', '1');
  22  |   });
  23  | 
  24  |   await page.route('**/api/studios', async (route) => {
  25  |     await route.fulfill({
  26  |       status: 200,
  27  |       contentType: 'application/json',
  28  |       body: JSON.stringify(liveStudiosPayload),
  29  |     });
  30  |   });
  31  | });
  32  | 
  33  | test('loads the city surface with a nonblank 3D canvas', async ({ page }) => {
  34  |   await page.goto('/');
  35  | 
  36  |   await expect(page.getByRole('heading', { name: /premium music city/i })).toBeVisible();
  37  |   await expect(page.getByText(/Live studio feed connected/i)).toBeVisible();
  38  | 
  39  |   const canvas = page.locator('canvas.city-canvas');
  40  |   await expect(canvas).toBeVisible({ timeout: 45_000 });
  41  | 
  42  |   const box = await canvas.boundingBox();
  43  |   expect(box?.width).toBeGreaterThan(300);
  44  |   expect(box?.height).toBeGreaterThan(300);
  45  | 
  46  |   await expect
  47  |     .poll(
  48  |       async () => canvas.evaluate((node) => {
  49  |         const cityCanvas = node as HTMLCanvasElement;
  50  |         const gl = cityCanvas.getContext('webgl2') ?? cityCanvas.getContext('webgl');
  51  |         if (!gl) return false;
  52  | 
  53  |         const width = gl.drawingBufferWidth;
  54  |         const height = gl.drawingBufferHeight;
  55  |         if (width <= 0 || height <= 0) return false;
  56  | 
  57  |         const sampleWidth = Math.min(48, width);
  58  |         const sampleHeight = Math.min(48, height);
  59  |         const x = Math.max(0, Math.floor((width - sampleWidth) / 2));
  60  |         const y = Math.max(0, Math.floor((height - sampleHeight) / 2));
  61  |         const pixels = new Uint8Array(sampleWidth * sampleHeight * 4);
  62  | 
  63  |         gl.readPixels(x, y, sampleWidth, sampleHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  64  | 
  65  |         let energy = 0;
  66  |         for (let i = 0; i < pixels.length; i += 4) {
  67  |           if (pixels[i + 3] > 0) {
  68  |             energy += pixels[i] + pixels[i + 1] + pixels[i + 2];
  69  |           }
  70  |         }
  71  | 
  72  |         return energy / (sampleWidth * sampleHeight) > 3;
  73  |       }),
  74  |       { timeout: 15_000 },
  75  |     )
  76  |     .toBe(true);
  77  | });
  78  | 
  79  | test('search opens a building and enters its interior', async ({ page }) => {
  80  |   await page.goto('/');
  81  | 
  82  |   await page.getByLabel('Search buildings').fill('Main Street Market');
  83  |   await expect(page.getByRole('option', { name: /Main Street Market/i })).toBeVisible();
  84  |   await page.keyboard.press('Enter');
  85  | 
  86  |   await expect(page.locator('h1.topbar-title')).toContainText('Main Street Market');
  87  |   await page.getByRole('button', { name: /Enter interior/i }).click({ force: true });
> 88  |   await expect(page.getByRole('dialog', { name: /Main Street Market/i })).toBeVisible();
      |                                                                           ^ Error: expect(locator).toBeVisible() failed
  89  |   await expect(page.getByRole('button', { name: /^License$/ }).first()).toBeVisible();
  90  | });
  91  | 
  92  | test('marketplace checkout fails gracefully when payments are not configured', async ({ page }) => {
  93  |   await page.route('**/api/checkout', async (route) => {
  94  |     await route.fulfill({
  95  |       status: 503,
  96  |       contentType: 'application/json',
  97  |       body: JSON.stringify({ error: 'Payments not configured.' }),
  98  |     });
  99  |   });
  100 | 
  101 |   await page.goto('/#hh-main-market');
  102 | 
  103 |   await expect(page.locator('h1.topbar-title')).toContainText('Main Street Market');
  104 |   await page.getByRole('button', { name: /Enter interior/i }).click({ force: true });
  105 |   await page.getByRole('button', { name: /^License$/ }).first().click();
  106 |   await page.getByRole('button', { name: /Continue/i }).click();
  107 |   await page.getByRole('button', { name: /Pay .* via Stripe/i }).click();
  108 | 
  109 |   await expect(page.getByText(/Stripe is not configured/i)).toBeVisible();
  110 | });
  111 | 
  112 | test('mobile minimap starts collapsed and can expand', async ({ page }) => {
  113 |   await page.setViewportSize({ width: 390, height: 844 });
  114 |   await page.goto('/');
  115 | 
  116 |   await expect(page.getByRole('button', { name: /Open map/i })).toBeVisible();
  117 |   await page.getByRole('button', { name: /Open map/i }).click();
  118 |   await expect(page.getByRole('button', { name: /Hide map/i })).toBeVisible();
  119 |   await expect(
  120 |     page
  121 |       .getByRole('navigation', { name: /District navigation map/i })
  122 |       .getByRole('button', { name: 'Hip-Hop Highway', exact: true }),
  123 |   ).toBeVisible();
  124 | });
  125 | 
  126 | test('telemetry endpoint accepts known events and rejects unknown events', async ({ request }) => {
  127 |   const good = await request.post('/api/telemetry', {
  128 |     data: {
  129 |       event: 'city_loaded',
  130 |       sessionId: 'test-session',
  131 |       path: '/',
  132 |       properties: { smoke: true },
  133 |     },
  134 |   });
  135 | 
  136 |   expect(good.ok()).toBe(true);
  137 | 
  138 |   const bad = await request.post('/api/telemetry', {
  139 |     data: {
  140 |       event: 'not_a_real_event',
  141 |       properties: {},
  142 |     },
  143 |   });
  144 | 
  145 |   expect(bad.status()).toBe(400);
  146 | });
  147 | 
```