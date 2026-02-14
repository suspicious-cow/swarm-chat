import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = process.env.SCREENSHOTS_DIR || path.join(__dirname, '..', '..', 'screenshots');

test.describe('Lobby', () => {
  test('01 - lobby initial load', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Conversational Swarm Intelligence')).toBeVisible();
    await expect(page.getByText('Create a Session')).toBeVisible();
    await expect(page.getByText('Join a Session')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotsDir, '01-lobby-initial.png'), fullPage: true });
  });

  test('02 - lobby create form filled', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder(/Should cities ban/i).fill('Should cities ban cars from downtown?');
    await page.getByPlaceholder('Enter your name').first().fill('Admin User');
    await page.screenshot({ path: path.join(screenshotsDir, '02-lobby-create-filled.png'), fullPage: true });
  });

  test('03 - lobby session created with join code', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder(/Should cities ban/i).fill('Should cities ban cars?');
    await page.getByPlaceholder('Enter your name').first().fill('Admin');
    await page.getByText('Create Session').click();

    // Wait for session creation
    await expect(page.getByText('Session Created!')).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: path.join(screenshotsDir, '03-lobby-session-created.png'), fullPage: true });
  });
});
