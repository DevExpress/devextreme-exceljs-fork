'use strict';

const {test: base, expect} = require('@playwright/test');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {pathToFileURL} = require('url');

// The bundle under test, set per project in playwright.config.js
const test = base.extend({bundle: ['dx-exceljs-fork.js', {option: true}]});

const testPageURL = pathToFileURL(path.resolve(__dirname, 'exceljs.spec.html')).href;
const bundlePath = bundle => path.resolve(__dirname, '../../dist', bundle);

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
  test.beforeEach(async ({page, bundle}) => {
    await page.goto(testPageURL);
    await page.addScriptTag({path: bundlePath(bundle)});
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

// Each branch of the UMD wrapper. Bundlers and DevExtreme's test runner use CommonJS, <script> tags the global.
test.describe('ExcelJS Browser UMD', () => {
  [
    {
      loader: 'global',
      load: async (page, file) => {
        await page.addScriptTag({path: file});
        await page.evaluate(() => {
          window.loaded = window.ExcelJS;
        });
      },
      exceljsGlobal: 'object',
    },
    {
      // As DevExtreme's test runner loads it: an ES module (strict mode) that declares `module` and `exports`
      loader: 'CommonJS',
      load: async (page, file) => {
        const source = await fs.promises.readFile(file, 'utf8');
        await page.addScriptTag({
          type: 'module',
          content: `const module = {exports: {}}; const exports = module.exports; var define;\n${source}\nwindow.loaded = module.exports;`,
        });
      },
      exceljsGlobal: 'undefined',
    },
    {
      loader: 'AMD',
      load: async (page, file) => {
        await page.evaluate(() => {
          window.define = (deps, factory) => {
            window.loaded = factory();
          };
          window.define.amd = {};
        });
        await page.addScriptTag({path: file});
      },
      exceljsGlobal: 'undefined',
    },
  ].forEach(({loader, load, exceljsGlobal}) => {
    test(`should load through ${loader}`, async ({page, bundle}) => {
      await page.goto(testPageURL);
      await page.evaluate(() => window.addEventListener('error', event => {
        window.loadError = event.message;
      }));
      await load(page, bundlePath(bundle));
      // Module scripts run asynchronously
      await page.waitForFunction(() => window.loaded || window.loadError);
      expect(await page.evaluate(() => window.loadError)).toBeUndefined();

      const result = await page.evaluate(async () => {
        const wb = new window.loaded.Workbook();
        wb.addWorksheet('blort').getCell('A1').value = 7;

        const wb2 = new window.loaded.Workbook();
        await wb2.xlsx.load(await wb.xlsx.writeBuffer());

        return {
          a1: wb2.getWorksheet('blort').getCell('A1').value,
          globals: [typeof window.ExcelJS, typeof window.__dxExcelJS],
        };
      });

      expect(result).toEqual({a1: 7, globals: [exceljsGlobal, 'undefined']});
    });
  });
});
