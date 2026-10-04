import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFileA = 'playwright/.auth/user-a.json';
const authFileB = 'playwright/.auth/user-b.json';

setup('authenticate user A', async ({ page, request, baseURL }) => {
  // Preflight health check for Render cold start
  console.log('Polling health endpoint...');
  const maxRetries = 30; // Wait up to 30x5s = 150 seconds
  let isHealthy = false;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      // The frontend Vite server proxies /api to backend, or we hit backend directly.
      // E2E_BASE_URL usually points to the frontend url which might proxy /api,
      // On Render, the frontend and backend are often the same Express server in prod.
      const healthUrl = baseURL?.includes('localhost') 
        ? 'http://localhost:5001/api/health' 
        : `${baseURL}/api/health`;
        
      const res = await request.get(healthUrl, { timeout: 5000 });
      if (res.ok()) {
        isHealthy = true;
        console.log('Backend is healthy!');
        break;
      }
    } catch (e) {
      // ignore
    }
    console.log('Waiting for backend to be healthy...');
    await new Promise(r => setTimeout(r, 5000));
  }
  
  if (!isHealthy) {
    throw new Error('Backend failed to become healthy in time.');
  }

  const userAEmail = process.env.E2E_USER_A_EMAIL;
  const userAPassword = process.env.E2E_USER_A_PASSWORD;
  if (!userAEmail) return; // skip if no credentials

  await page.goto('/login');
  await page.getByTestId('login-email').fill(userAEmail);
  await page.getByTestId('login-password').fill(userAPassword);
  
  const [loginRes] = await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/api/auth/login')),
    page.getByTestId('login-submit').click()
  ]);
  console.log('User A login status:', loginRes.status());
  if (loginRes.status() !== 200) {
    console.log('Login failed body:', await loginRes.text());
  }
  
  await expect(page).toHaveURL('/');
  await page.waitForSelector('aside');
  await page.context().storageState({ path: authFileA });
});

setup('authenticate user B', async ({ page }) => {
  const userBEmail = process.env.E2E_USER_B_EMAIL;
  const userBPassword = process.env.E2E_USER_B_PASSWORD;
  if (!userBEmail) return;

  await page.goto('/login');
  await page.getByTestId('login-email').fill(userBEmail);
  await page.getByTestId('login-password').fill(userBPassword);
  
  const [loginResB] = await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/api/auth/login')),
    page.getByTestId('login-submit').click()
  ]);
  console.log('User B login status:', loginResB.status());
  if (loginResB.status() !== 200) {
    console.log('Login failed body:', await loginResB.text());
  }
  
  await expect(page).toHaveURL('/');
  await page.waitForSelector('aside');
  await page.context().storageState({ path: authFileB });
});
