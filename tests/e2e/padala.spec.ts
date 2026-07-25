import { test, expect } from '@playwright/test';

test.describe('Padala — Pay by Username', () => {
  test('01 - landing page loads with hero text', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Pay anyone by/i })).toBeVisible();
  });

  test('02 - navigation bar shows Padala brand', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav').getByText('Padala')).toBeVisible();
    // nav badge with exact text
    await expect(page.locator('nav span', { hasText: 'Testnet' }).first()).toBeVisible();
  });

  test('03 - send form is visible with federation input', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#fed-input')).toBeVisible();
    await expect(page.getByRole('button', { name: /Resolve/i })).toBeVisible();
  });

  test('04 - federation resolve works for valid address', async ({ page }) => {
    await page.goto('/');
    await page.fill('#fed-input', 'supplier*padala.ph');
    await page.getByRole('button', { name: /Resolve/i }).click();
    await expect(page.getByText('Address resolved via SEP-2')).toBeVisible({ timeout: 10000 });
  });

  test('05 - federation resolve shows error for invalid address', async ({ page }) => {
    await page.goto('/');
    await page.fill('#fed-input', 'notvalid');
    await page.getByRole('button', { name: /Resolve/i }).click();
    // Error div shows "Enter a federation address like supplier*padala.ph"
    await expect(page.locator('.text-red-600', { hasText: 'federation address' })).toBeVisible({ timeout: 5000 });
  });

  test('06 - send payment flow - resolve then send', async ({ page }) => {
    await page.goto('/');
    await page.fill('#fed-input', 'alice*padala.ph');
    await page.getByRole('button', { name: /Resolve/i }).click();
    await expect(page.getByText('Address resolved via SEP-2')).toBeVisible({ timeout: 10000 });
    await page.fill('#amount-input', '5');
    await page.getByRole('button', { name: /Send USDC/i }).click();
    await expect(page.getByText('Payment sent!')).toBeVisible({ timeout: 15000 });
  });

  test('07 - quick amount buttons work', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '$10' }).click();
    await expect(page.locator('#amount-input')).toHaveValue('10');
  });

  test('08 - quick-select suggestion populates input', async ({ page }) => {
    await page.goto('/');
    // click the suggestion button (not the address table at bottom)
    await page.locator('button', { hasText: 'merchant*padala.ph' }).click();
    await expect(page.locator('#fed-input')).toHaveValue('merchant*padala.ph');
  });

  test('09 - live feed panel visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Live Feed' })).toBeVisible();
  });

  test('10 - federation addresses table shown', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Available Federation Addresses (Demo)')).toBeVisible();
    // address table uses font-mono text
    await expect(page.locator('.font-mono', { hasText: 'alice*padala.ph' }).first()).toBeVisible();
  });

  test('11 - send button disabled without resolve', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /Send USDC/i })).toBeDisabled();
  });

  test('12 - mobile layout at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Pay anyone by/i })).toBeVisible();
    await expect(page.locator('#fed-input')).toBeVisible();
  });

  test('13 - SEP-2 info cards visible', async ({ page }) => {
    await page.goto('/');
    // The info card headings
    await expect(page.getByRole('heading', { name: 'SEP-2 Federation' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Sponsored Reserves/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Real-time Feed' })).toBeVisible();
  });

  test('14 - federation API endpoint responds', async ({ page }) => {
    const res = await page.request.get('/api/federation?q=alice*padala.ph&type=name');
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.stellar_address).toBeTruthy();
  });

  test('15 - sender identity badge shows leni', async ({ page }) => {
    await page.goto('/');
    // The badge span inside the send form
    await expect(page.locator('span.text-purple-700', { hasText: 'leni*padala.ph' })).toBeVisible();
  });
});

test.describe('Screenshots', () => {
  test('capture all screenshots', async ({ page }) => {
    // SSE keeps network open, so use 'domcontentloaded' + short wait instead of 'networkidle'
    const goto = async (url: string) => {
      await page.goto(url);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);
    };

    // 01 - Landing
    await page.setViewportSize({ width: 1280, height: 800 });
    await goto('/');
    await page.screenshot({ path: 'screen-shot/01-landing.jpg', type: 'jpeg', quality: 85, fullPage: false });

    // 02 - Send form with resolve
    await page.fill('#fed-input', 'supplier*padala.ph');
    await page.getByRole('button', { name: /Resolve/i }).click();
    await page.waitForSelector('text=Address resolved via SEP-2', { timeout: 10000 });
    await page.screenshot({ path: 'screen-shot/02-resolve.jpg', type: 'jpeg', quality: 85, fullPage: false });

    // 03 - Amount + memo filled
    await page.fill('#amount-input', '50');
    await page.fill('#memo-input', 'Rice & noodles bulk order');
    await page.screenshot({ path: 'screen-shot/03-form-filled.jpg', type: 'jpeg', quality: 85, fullPage: false });

    // 04 - Payment success
    await page.getByRole('button', { name: /Send USDC/i }).click();
    await page.waitForSelector('text=Payment sent!', { timeout: 15000 });
    await page.screenshot({ path: 'screen-shot/04-payment-success.jpg', type: 'jpeg', quality: 85, fullPage: false });

    // 05 - Live feed updated
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screen-shot/05-live-feed.jpg', type: 'jpeg', quality: 85, fullPage: false });

    // 06 - Mobile view 375px
    await page.setViewportSize({ width: 375, height: 812 });
    await goto('/');
    await page.screenshot({ path: 'screen-shot/06-mobile.jpg', type: 'jpeg', quality: 85, fullPage: false });

    // 07 - Full page desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    await goto('/');
    await page.screenshot({ path: 'screen-shot/07-full-page.jpg', type: 'jpeg', quality: 85, fullPage: true });

    // 08 - Quick select + amount
    await page.fill('#fed-input', 'alice*padala.ph');
    await page.getByRole('button', { name: /Resolve/i }).click();
    await page.waitForSelector('text=Address resolved via SEP-2', { timeout: 10000 });
    await page.getByRole('button', { name: '$10' }).click();
    await page.screenshot({ path: 'screen-shot/08-quick-select.jpg', type: 'jpeg', quality: 85, fullPage: false });
  });
});
