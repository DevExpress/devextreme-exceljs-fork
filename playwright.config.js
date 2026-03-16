'use strict';

const {defineConfig} = require('@playwright/test');

module.exports = defineConfig({
  testDir: './spec/browser',
  testMatch: '**/*.spec.js',
  timeout: 30000,
  retries: 0,
  reporter: process.env.CI ? 'dot' : 'list',
  projects: [
    {
      name: 'chrome',
      use: {
        channel: 'chrome',
      },
    },
  ],
});
