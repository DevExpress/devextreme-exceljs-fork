'use strict';

const {defineConfig} = require('@playwright/test');

module.exports = defineConfig({
  testDir: './spec/browser',
  testMatch: '**/*.spec.js',
  timeout: 30000,
  retries: 0,
  reporter: process.env.CI ? 'dot' : 'list',
  // One project per bundle; spec/browser reads `bundle`
  projects: [
    'dx-exceljs-fork.js',
    'dx-exceljs-fork.min.js',
  ].map(bundle => ({
    name: bundle,
    use: {
      channel: 'chrome',
      bundle,
    },
  })),
});
