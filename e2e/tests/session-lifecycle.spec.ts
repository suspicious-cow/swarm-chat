import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = process.env.SCREENSHOTS_DIR || path.join(__dirname, '..', '..', 'screenshots');

const API_BASE = process.env.API_BASE || 'http://localhost:58432';

test.describe.serial('Session Lifecycle', () => {
  let joinCode: string;
  let sessionId: string;

  test('04 - admin creates session and joins', async ({ page }) => {
    // Create session via API
    const createRes = await page.request.post(`${API_BASE}/api/sessions`, {
      data: { title: 'E2E Test: Should cities ban cars?', subgroup_size: 5 },
    });
    const session = await createRes.json();
    joinCode = session.join_code;
    sessionId = session.id;

    // Navigate and join as admin
    await page.goto('/');
    await page.getByPlaceholder(/A3X9K2/i).fill(joinCode);
    await page.getByPlaceholder('Enter your name').last().fill('Admin');
    await page.getByText('Join Session').click();

    // Wait for waiting room
    await expect(page.getByText(joinCode, { exact: true })).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: path.join(screenshotsDir, '04-waiting-admin.png'), fullPage: true });
  });

  test('05 - users join the session', async ({ browser }) => {
    // Join 4 more users via API
    for (const name of ['Alice', 'Bob', 'Charlie', 'Diana']) {
      await (await browser.newPage()).request.post(`${API_BASE}/api/users`, {
        data: { join_code: joinCode, display_name: name },
      });
    }

    // Open a new page to view the waiting room
    const page = await browser.newPage();
    await page.goto('/');
    await page.getByPlaceholder(/A3X9K2/i).fill(joinCode);
    await page.getByPlaceholder('Enter your name').last().fill('Observer');
    await page.getByText('Join Session').click();

    await expect(page.getByText(joinCode, { exact: true })).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: path.join(screenshotsDir, '05-waiting-users-joined.png'), fullPage: true });
    await page.close();
  });

  test('06 - admin starts session, chat room appears', async ({ browser }) => {
    // Start session via API
    const startRes = await (await browser.newPage()).request.post(
      `${API_BASE}/api/sessions/${sessionId}/start`
    );
    expect(startRes.ok()).toBeTruthy();

    // Join as a user and navigate to chat
    const page = await browser.newPage();
    await page.goto('/');
    await page.getByPlaceholder(/A3X9K2/i).fill(joinCode);
    await page.getByPlaceholder('Enter your name').last().fill('TestUser');
    await page.getByText('Join Session').click();

    // Should transition to chat view (session is active)
    await expect(page.getByText('ThinkTank')).toBeVisible({ timeout: 15_000 });
    await page.screenshot({ path: path.join(screenshotsDir, '06-chat-room-empty.png'), fullPage: true });
    await page.close();
  });

  test('07 - send messages in chat', async ({ browser }) => {
    // Join as user and send messages
    const page = await browser.newPage();
    await page.goto('/');
    await page.getByPlaceholder(/A3X9K2/i).fill(joinCode);
    await page.getByPlaceholder('Enter your name').last().fill('Chatter');
    await page.getByText('Join Session').click();

    await expect(page.getByText('ThinkTank')).toBeVisible({ timeout: 15_000 });

    // Send a message
    const input = page.getByPlaceholder('Type your message...');
    await input.fill('I think banning cars would reduce pollution significantly.');
    await page.getByText('Send').click();

    await input.fill('But what about accessibility for disabled people?');
    await page.getByText('Send').click();

    // Wait for messages to appear
    await expect(page.getByText('reduce pollution')).toBeVisible({ timeout: 5_000 });
    await page.screenshot({ path: path.join(screenshotsDir, '07-chat-messages.png'), fullPage: true });
    await page.close();
  });

  test('08 - visualizer view', async ({ browser }) => {
    // Join as admin to see visualizer
    const page = await browser.newPage();
    await page.goto('/');
    await page.getByPlaceholder(/A3X9K2/i).fill(joinCode);
    await page.getByPlaceholder('Enter your name').last().fill('VizAdmin');
    await page.getByText('Join Session').click();

    await expect(page.getByText('ThinkTank')).toBeVisible({ timeout: 15_000 });

    // Click Visualizer button in the header
    const vizBtn = page.getByText('Visualizer');
    if (await vizBtn.isVisible()) {
      await vizBtn.click();
      await expect(page.getByText('Deliberation Map')).toBeVisible({ timeout: 5_000 });
    }

    await page.screenshot({ path: path.join(screenshotsDir, '08-visualizer-view.png'), fullPage: true });
    await page.close();
  });

  test('09 - stop session', async ({ browser }) => {
    // Stop session via API
    const stopRes = await (await browser.newPage()).request.post(
      `${API_BASE}/api/sessions/${sessionId}/stop`
    );
    expect(stopRes.ok()).toBeTruthy();

    // Join and observe completed state
    const page = await browser.newPage();
    await page.goto('/');
    await page.getByPlaceholder(/A3X9K2/i).fill(joinCode);
    await page.getByPlaceholder('Enter your name').last().fill('PostStop');
    await page.getByText('Join Session').click();

    // Session is completed — should see status or an indicator
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '09-session-completed.png'), fullPage: true });
    await page.close();
  });

  test('10 - generate summary', async ({ browser }) => {
    // Generate summary via API
    const summaryRes = await (await browser.newPage()).request.post(
      `${API_BASE}/api/admin/${sessionId}/summary`
    );
    const summaryData = await summaryRes.json();
    expect(summaryData.summary).toBeTruthy();

    // Take a screenshot showing the summary was generated
    const page = await browser.newPage();
    await page.goto('/');
    // Show lobby with a note about summary
    await page.screenshot({ path: path.join(screenshotsDir, '10-summary-generated.png'), fullPage: true });
    await page.close();
  });
});
