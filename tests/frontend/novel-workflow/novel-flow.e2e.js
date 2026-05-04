import { test, expect } from '@playwright/test';

test('novel workflow can open SillyTavern shell', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/SillyTavern/i);
});
