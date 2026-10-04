import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('Natter Core Chat E2E', () => {

  const setupContexts = async (browser) => {
    const userAEmail = process.env.E2E_USER_A_EMAIL;
    const userBEmail = process.env.E2E_USER_B_EMAIL;

    if (!userAEmail || !userBEmail) {
      test.skip('E2E user credentials not provided.');
      return null;
    }

    const authFileA = 'playwright/.auth/user-a.json';
    const authFileB = 'playwright/.auth/user-b.json';

    const contextA = await browser.newContext({ storageState: authFileA });
    const contextB = await browser.newContext({ storageState: authFileB });

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await pageA.goto('/');
    await pageB.goto('/');

    pageA.on('console', msg => console.log(`Page A: ${msg.text()}`));
    pageB.on('console', msg => console.log(`Page B: ${msg.text()}`));

    await pageA.waitForSelector('aside');
    await pageB.waitForSelector('aside');

    return { contextA, contextB, pageA, pageB };
  };

  const getProfileName = async (page) => {
    await page.goto('/profile');
    const locator = page.getByTestId('profile-name').first();
    await expect(locator).toBeVisible();
    const name = await locator.innerText();
    await page.goto('/');
    return name;
  };

  const openConversation = async (page, targetName) => {
    const searchInput = page.getByPlaceholder('Search conversations...');
    await searchInput.fill(targetName);
    const targetRow = page.locator('button', { hasText: targetName }).first();
    await targetRow.click();
  };

  test('users can exchange messages and read receipts', async ({ browser }) => {
    const contexts = await setupContexts(browser);
    if (!contexts) return;
    const { contextA, contextB, pageA, pageB } = contexts;

    const userAName = await getProfileName(pageA);
    const userBName = await getProfileName(pageB);

    await openConversation(pageA, userBName);
    await openConversation(pageB, userAName);

    const timestamp = Date.now();
    const uniqueMessage = `Natter E2E E2E_TEST_${timestamp}`;

    // A sends unique text
    await pageA.getByTestId('chat-input').fill(uniqueMessage);
    const [sendReqA] = await Promise.all([
      pageA.waitForResponse(resp => resp.url().includes('/messages/send') && resp.status() === 201),
      pageA.getByTestId('send-message').click()
    ]);
    const sendDataA = await sendReqA.json();
    const msgIdA = sendDataA._id;

    // B receives exactly once
    const receivedBubbleB = pageB.getByTestId(`message-${msgIdA}`);
    await expect(receivedBubbleB).toBeVisible();
    await expect(receivedBubbleB).toHaveCount(1);
    await expect(receivedBubbleB).toContainText(uniqueMessage);

    // B reads message, A sees read
    const sentBubbleA = pageA.getByTestId(`message-${msgIdA}`);
    await expect(sentBubbleA).toBeVisible();
    
    // Assert data-status attribute instead of class
    const statusA = sentBubbleA.getByTestId('message-status');
    await expect(statusA).toHaveAttribute('data-status', 'read', { timeout: 10000 });

    // B replies
    const replyMessage = `Reply_${timestamp}`;
    await pageB.getByTestId('chat-input').fill(replyMessage);
    const [sendReqB] = await Promise.all([
      pageB.waitForResponse(resp => resp.url().includes('/messages/send') && resp.status() === 201),
      pageB.getByTestId('send-message').click()
    ]);
    const sendDataB = await sendReqB.json();
    const msgIdB = sendDataB._id;

    // A receives exactly once
    const receivedBubbleA = pageA.getByTestId(`message-${msgIdB}`);
    await expect(receivedBubbleA).toBeVisible();
    await expect(receivedBubbleA).toHaveCount(1);
    await expect(receivedBubbleA).toContainText(replyMessage);

    // Refresh both contexts
    await pageA.reload();
    await pageB.reload();

    // Verify messages persist and sessions persist
    await expect(pageA).toHaveURL('/');
    await expect(pageB).toHaveURL('/');

    await openConversation(pageA, userBName);
    await openConversation(pageB, userAName);

    await expect(pageA.getByTestId(`message-${msgIdA}`)).toBeVisible();
    await expect(pageA.getByTestId(`message-${msgIdB}`)).toBeVisible();

    await expect(pageB.getByTestId(`message-${msgIdA}`)).toBeVisible();
    await expect(pageB.getByTestId(`message-${msgIdB}`)).toBeVisible();

    await contextA.close();
    await contextB.close();
  });

  test('regression: unread badges', async ({ browser }) => {
    const contexts = await setupContexts(browser);
    if (!contexts) return;
    const { contextA, contextB, pageA, pageB } = contexts;

    const userAName = await getProfileName(pageA);
    const userBName = await getProfileName(pageB);

    // Ensure B is NOT on A's conversation initially (go to profile or home without selection)
    // By default, on fresh reload, no conversation is selected on mobile/desktop unless it's cached.
    // Let's force close chat by reloading B.
    await pageB.reload();
    await pageB.waitForSelector('aside');

    // Get initial unread count
    const userARow = pageB.locator('button', { hasText: userAName }).first();
    const unreadBadge = userARow.locator('span.bg-primary');
    let initialCount = 0;
    if (await unreadBadge.isVisible().catch(() => false)) {
      initialCount = parseInt(await unreadBadge.innerText(), 10) || 0;
    }

    // A opens B chat and sends a message
    await openConversation(pageA, userBName);
    await pageA.getByTestId('chat-input').fill('Unread test 1');
    await Promise.all([
      pageA.waitForResponse(resp => resp.url().includes('/messages/send') && resp.status() === 201),
      pageA.getByTestId('send-message').click()
    ]);

    // B should see unread count increment
    await expect(unreadBadge).toBeVisible();
    await expect(unreadBadge).toHaveText(String(initialCount + 1));

    await pageA.getByTestId('chat-input').fill('Unread test 2');
    await Promise.all([
      pageA.waitForResponse(resp => resp.url().includes('/messages/send') && resp.status() === 201),
      pageA.getByTestId('send-message').click()
    ]);

    // B should see unread count increment to initialCount + 2
    await expect(unreadBadge).toHaveText(String(initialCount + 2));

    // B opens conversation, clears badge
    await userARow.click();
    await expect(unreadBadge).toBeHidden();

    await contextA.close();
    await contextB.close();
  });

  test('regression: typing indicators', async ({ browser }) => {
    const contexts = await setupContexts(browser);
    if (!contexts) return;
    const { contextA, contextB, pageA, pageB } = contexts;

    const userAName = await getProfileName(pageA);
    const userBName = await getProfileName(pageB);

    await openConversation(pageA, userBName);
    await openConversation(pageB, userAName);

    // B starts typing
    await pageB.getByTestId('chat-input').type('typing...', { delay: 100 });

    // A sees typing indicator
    const typingIndicator = pageA.getByTestId('typing-indicator');
    await expect(typingIndicator).toBeVisible();

    // B stops typing (wait 2 seconds for debounce to stop)
    await pageB.waitForTimeout(2500);

    // A sees typing indicator disappear
    await expect(typingIndicator).toBeHidden();

    await contextA.close();
    await contextB.close();
  });

  test('regression: image upload', async ({ browser }) => {
    const contexts = await setupContexts(browser);
    if (!contexts) return;
    const { contextA, contextB, pageA, pageB } = contexts;

    const userAName = await getProfileName(pageA);
    const userBName = await getProfileName(pageB);

    await openConversation(pageA, userBName);
    await openConversation(pageB, userAName);

    // We can simulate an image upload using file chooser
    // We need a test png in the frontend folder
    const testImagePath = 'test-image.png';
    
    // Create a dummy 1x1 png if it doesn't exist
    if (!fs.existsSync(testImagePath)) {
      const dummyPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
      fs.writeFileSync(testImagePath, Buffer.from(dummyPngBase64, 'base64'));
    }

    const [fileChooser] = await Promise.all([
      pageA.waitForEvent('filechooser'),
      pageA.locator('button[aria-label="Attach image"]').click(),
    ]);
    await fileChooser.setFiles(testImagePath);

    // Preview appears
    const imagePreview = pageA.locator('img[alt="Preview"]');
    await expect(imagePreview).toBeVisible();

    // Send
    const [sendReqA] = await Promise.all([
      pageA.waitForResponse(resp => resp.url().includes('/messages/send') && resp.status() === 201),
      pageA.getByTestId('send-message').click()
    ]);
    const sendDataA = await sendReqA.json();
    const msgIdA = sendDataA._id;

    // Recipient gets exactly one image
    const receivedBubbleB = pageB.getByTestId(`message-${msgIdA}`);
    await expect(receivedBubbleB).toBeVisible();
    await expect(receivedBubbleB).toHaveCount(1);
    
    // Check if the received message has an image attachment
    const receivedImage = receivedBubbleB.locator('img[alt="Attachment"]');
    await expect(receivedImage).toBeVisible();

    await contextA.close();
    await contextB.close();
  });
});
