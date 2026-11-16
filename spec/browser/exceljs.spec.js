'use strict';

const {test, expect} = require('@playwright/test');
const crypto = require('crypto');
const path = require('path');
const {pathToFileURL} = require('url');

const testPageURL = pathToFileURL(path.resolve(__dirname, 'exceljs.spec.html')).href;

// Reference hash from node:crypto to check the bundle's result
function excelPasswordHash(password, saltValue, spinCount) {
  const sha512 = (...buffers) => crypto.createHash('sha512').update(Buffer.concat(buffers)).digest();
  let key = sha512(Buffer.from(saltValue, 'base64'), Buffer.from(password, 'utf16le'));
  for (let i = 0; i < spinCount; i++) {
    const iterator = Buffer.alloc(4);
    iterator.writeUInt32LE(i, 0);
    key = sha512(key, iterator);
  }
  return key.toString('base64');
}

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

  test('should protect a worksheet with a password', async ({page}) => {
    const sheetProtection = await page.evaluate(async () => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('protected');
      await ws.protect('secret', {spinCount: 1000});

      const buffer = await wb.xlsx.writeBuffer();
      const wb2 = new ExcelJS.Workbook();
      await wb2.xlsx.load(buffer);

      return wb2.getWorksheet('protected').sheetProtection;
    });

    expect(sheetProtection.algorithmName).toBe('SHA-512');
    expect(sheetProtection.spinCount).toBe(1000);
    expect(Buffer.from(sheetProtection.saltValue, 'base64')).toHaveLength(16);
    expect(sheetProtection.hashValue).toBe(excelPasswordHash('secret', sheetProtection.saltValue, 1000));
  });

  [
    {title: 'with crypto.randomUUID', removeRandomUUID: false},
    {title: 'without crypto.randomUUID (non-secure page)', removeRandomUUID: true},
  ].forEach(({title, removeRandomUUID}) => {
    test(`should write ext conditional formatting ${title}`, async ({page}) => {
      const result = await page.evaluate(async removeUUID => {
        if (removeUUID) {
          Object.defineProperty(crypto, 'randomUUID', {value: undefined, configurable: true});
        }

        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('cf');
        ws.getCell('A1').value = 1;
        ws.getCell('A2').value = 2;
        ws.getCell('A3').value = 3;
        ws.addConditionalFormatting({
          ref: 'A1:A3',
          rules: [
            {
              type: 'iconSet',
              iconSet: '3Triangles',
              cfvo: [
                {type: 'percent', value: 0},
                {type: 'percent', value: 33},
                {type: 'percent', value: 67},
              ],
            },
          ],
        });

        const buffer = await wb.xlsx.writeBuffer();
        const wb2 = new ExcelJS.Workbook();
        await wb2.xlsx.load(buffer);
        const [rule] = wb2.getWorksheet('cf').conditionalFormattings[0].rules;

        return {randomUUID: typeof crypto.randomUUID, type: rule.type, iconSet: rule.iconSet, x14Id: rule.x14Id};
      }, removeRandomUUID);

      expect(result.randomUUID).toBe(removeRandomUUID ? 'undefined' : 'function');
      expect(result.type).toBe('iconSet');
      expect(result.iconSet).toBe('3Triangles');
      expect(result.x14Id).toMatch(/^\{[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}\}$/);
    });
  });
});
