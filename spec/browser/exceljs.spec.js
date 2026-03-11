'use strict';

const {test, expect} = require('@playwright/test');
const path = require('path');
const {pathToFileURL} = require('url');

const testPageURL = pathToFileURL(path.resolve(__dirname, 'exceljs.spec.html')).href;

test.describe('ExcelJS Browser', () => {
  test.beforeEach(async ({page}) => {
    await page.goto(testPageURL);
    await page.waitForFunction(() => typeof window.ExcelJS !== 'undefined');
  });

  test('should read and write xlsx via binary buffer', async ({page}) => {
    const result = await page.evaluate(async () => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('blort');

      ws.getCell('A1').value = 'Hello, World!';
      ws.getCell('A2').value = 7;

      const buffer = await wb.xlsx.writeBuffer();
      const wb2 = new ExcelJS.Workbook();
      await wb2.xlsx.load(buffer);

      const ws2 = wb2.getWorksheet('blort');
      return {
        wsExists: !!ws2,
        a1: ws2.getCell('A1').value,
        a2: ws2.getCell('A2').value,
      };
    });

    expect(result.wsExists).toBe(true);
    expect(result.a1).toBe('Hello, World!');
    expect(result.a2).toBe(7);
  });

  test('should read and write xlsx via base64 buffer', async ({page}) => {
    const result = await page.evaluate(async () => {
      const options = {base64: true};
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('blort');

      ws.getCell('A1').value = 'Hello, World!';
      ws.getCell('A2').value = 7;

      const buffer = await wb.xlsx.writeBuffer(options);
      const wb2 = new ExcelJS.Workbook();
      await wb2.xlsx.load(buffer.toString('base64'), options);

      const ws2 = wb2.getWorksheet('blort');
      return {
        wsExists: !!ws2,
        a1: ws2.getCell('A1').value,
        a2: ws2.getCell('A2').value,
      };
    });

    expect(result.wsExists).toBe(true);
    expect(result.a1).toBe('Hello, World!');
    expect(result.a2).toBe(7);
  });

  test('should write csv via buffer', async ({page}) => {
    const csvText = await page.evaluate(async () => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('blort');

      ws.getCell('A1').value = 'Hello, World!';
      ws.getCell('B1').value = 'What time is it?';
      ws.getCell('A2').value = 7;
      ws.getCell('B2').value = '12pm';

      const buffer = await wb.csv.writeBuffer();
      return buffer.toString();
    });

    expect(csvText).toBe('"Hello, World!",What time is it?\n7,12pm');
  });
});
