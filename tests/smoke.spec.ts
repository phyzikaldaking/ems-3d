import { expect, test, type Page } from '@playwright/test';

const liveStudiosPayload = {
  source: 'live',
  studios: [
    {
      username: 'boomboxx',
      name: 'BOOMBOXX Studio',
      image: null,
      district: 'LABEL_ROW',
      level: 7,
      avgScore: 94,
      songCount: 28,
      totalSold: 320,
    },
  ],
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('ems-seen-v1', '1');
  });

  await page.route('**/api/studios', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(liveStudiosPayload),
    });
  });
});

async function waitForCityReady(page: Page) {
  await expect(page.getByRole('status', { name: /Loading Epic MusicSpace/i })).toBeHidden({ timeout: 60_000 });
}

test('loads the city surface with a nonblank 3D canvas', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /premium music city/i })).toBeVisible();
  await expect(page.getByText(/Live studio feed connected/i)).toBeVisible();

  const canvas = page.locator('canvas.city-canvas');
  await expect(canvas).toBeVisible({ timeout: 45_000 });

  const box = await canvas.boundingBox();
  expect(box?.width).toBeGreaterThan(300);
  expect(box?.height).toBeGreaterThan(300);

  await expect
    .poll(
      async () => canvas.evaluate((node) => {
        const cityCanvas = node as HTMLCanvasElement;
        const gl = cityCanvas.getContext('webgl2') ?? cityCanvas.getContext('webgl');
        if (!gl) return false;

        const width = gl.drawingBufferWidth;
        const height = gl.drawingBufferHeight;
        if (width <= 0 || height <= 0) return false;

        const sampleWidth = Math.min(48, width);
        const sampleHeight = Math.min(48, height);
        const x = Math.max(0, Math.floor((width - sampleWidth) / 2));
        const y = Math.max(0, Math.floor((height - sampleHeight) / 2));
        const pixels = new Uint8Array(sampleWidth * sampleHeight * 4);

        gl.readPixels(x, y, sampleWidth, sampleHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

        let energy = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          if (pixels[i + 3] > 0) {
            energy += pixels[i] + pixels[i + 1] + pixels[i + 2];
          }
        }

        return energy / (sampleWidth * sampleHeight) > 3;
      }),
      { timeout: 15_000 },
    )
    .toBe(true);
});

test('search opens a building and enters its interior', async ({ page }) => {
  await page.goto('/');
  await waitForCityReady(page);

  await page.getByLabel('Search buildings').fill('Main Street Market');
  await expect(page.getByRole('option', { name: /Main Street Market/i })).toBeVisible();
  await page.keyboard.press('Enter');

  await expect(page.locator('h1.topbar-title')).toContainText('Main Street Market');
  await page.getByRole('button', { name: /Enter interior/i }).click({ force: true });
  await expect(page.getByRole('dialog', { name: /Main Street Market/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^License$/ }).first()).toBeVisible();
});

test('marketplace checkout fails gracefully when payments are not configured', async ({ page }) => {
  await page.route('**/api/checkout', async (route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Payments not configured.' }),
    });
  });

  await page.goto('/#hh-main-market');
  await waitForCityReady(page);

  await expect(page.locator('h1.topbar-title')).toContainText('Main Street Market');
  await page.getByRole('button', { name: /Enter interior/i }).click({ force: true });
  await page.getByRole('button', { name: /^License$/ }).first().click();
  await page.getByRole('button', { name: /Continue/i }).click();
  await page.getByRole('button', { name: /Pay .* via Stripe/i }).click();

  await expect(page.getByText(/Stripe is not configured/i)).toBeVisible();
});

test('mobile minimap starts collapsed and can expand', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await waitForCityReady(page);

  await expect(page.getByRole('button', { name: /Open map/i })).toBeVisible();
  await page.getByRole('button', { name: /Open map/i }).click();
  await expect(page.getByRole('button', { name: /Hide map/i })).toBeVisible();
  await expect(
    page
      .getByRole('navigation', { name: /District navigation map/i })
      .getByRole('button', { name: 'Hip-Hop Highway', exact: true }),
  ).toBeVisible();
});

test('telemetry endpoint accepts known events and rejects unknown events', async ({ request }) => {
  const good = await request.post('/api/telemetry', {
    data: {
      event: 'city_loaded',
      sessionId: 'test-session',
      path: '/',
      properties: { smoke: true },
    },
  });

  expect(good.ok()).toBe(true);

  const bad = await request.post('/api/telemetry', {
    data: {
      event: 'not_a_real_event',
      properties: {},
    },
  });

  expect(bad.status()).toBe(400);
});
