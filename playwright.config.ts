import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    headless: true,
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'npm run build && npm run start',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
