## v6.0.0

### What Changed

- Added the following runtime requirements:
    - Browser bundles now require a browser that supports ES2020 or later (for example, Chrome/Edge 80+, Firefox 74+, or Safari 14.1+). This requirement applies to `dist/dx-exceljs-fork.js` and `dist/dx-exceljs-fork.min.js`. These bundles no longer support Internet Explorer 11.
    - You now need the Web Crypto API (`globalThis.crypto`) to pass `password` to `worksheet.protect()`. You also need the Web Crypto API to write a workbook that contains extended conditional formatting rules. Node.js 22+ and modern browsers include this API. Certain test environments that emulate a browser do not include this API (for example, jsdom 19 and earlier, used by Jest 28 and earlier when `testEnvironment` is `'jsdom'`).
    - Jest tests that call `worksheet.protect()` with a password require a configuration change (see [Configure Jest for Worksheet Protection](#configure-jest-for-worksheet-protection)).
- Removed `dist/dx-exceljs-fork.bare.js` and `dist/dx-exceljs-fork.bare.min.js`. The browser bundles no longer include `core-js` and `regenerator-runtime` polyfills. These bundles now contain the same code as the `.bare` bundles (see [Replace `.bare` Bundles](#replace-bare-bundles)). The browser bundles also no longer define the `regeneratorRuntime` global.
- Removed `dist/es5`, the ES5 copy of `lib/` for ES5 browsers and Node.js versions earlier than 10 (see [Replace `dist/es5` Imports](#replace-distes5-imports)).
    - Removed `index.ts`. This file re-exported `dist/es5`. TypeScript types remain in `index.d.ts`.
- Browser bundle builds now use esbuild instead of Browserify and Babel.
- Removed the following Node.js polyfills from the browser bundles:
    - `crypto-browserify` and its dependencies (such as `elliptic`, `bn.js`, and `pbkdf2`)
    - `util` and its dependencies (such as `call-bind`, `get-intrinsic`, and `which-typed-array`)
- Updated `worksheet.protect()`: `@noble/hashes` 2.x (a new dependency) now calculates the SHA-512 password hash, and `crypto.getRandomValues()` generates the salt. This change does not affect protected worksheets: Excel accepts the same passwords as before.
- Fixed the following error thrown in browsers: `crypto.randomUUID is not a function`. This error was thrown on non-secure pages (served over plain HTTP from a host other than `localhost`) when you wrote a workbook that contained extended conditional formatting rules. Extended rules include the following:
    - Data bars without `gradient: true`
    - Icon sets with custom icons
    - The following icon sets: `3Triangles`, `3Stars`, and `5Boxes`

### How to Update Existing Apps

#### Configure Jest for Worksheet Protection

`worksheet.protect()` uses `@noble/hashes` 2.x (an ES module) to hash passwords. Jest loads the Node.js entry point of `devextreme-exceljs-fork` and cannot `require()` ES modules in the default configuration. As a result, tests that call `worksheet.protect()` with a password fail with one of the following errors:

- Jest 30: `Must use import to load ES Module`
- Jest 29: `Jest encountered an unexpected token`

This issue does not affect other tests.

Use one of the following options to update your app:

| Option | Requirements |
|---|---|
| Map to the browser bundle | Jest 29 or 30 |
| Enable ES module support | Jest 30.4+ on Node.js 24.9+ |
| Transform using Babel | Jest 29 or 30, a Babel config with `@babel/preset-env` |

> [!Note]
> You cannot map Node.js tests to the browser bundle.

##### Map to the Browser Bundle (Jest 29 and 30)

This option does not require Babel. Add the following mapping to your Jest config:

```js
// jest.config.js
module.exports = {
  moduleNameMapper: {
    '^devextreme-exceljs-fork$': 'devextreme-exceljs-fork/dist/dx-exceljs-fork.min.js',
  },
};
```

Your tests then load the same bundle that bundlers load in your app. The mapping applies to all tests that use this config. The bundle does not include Node.js-only APIs such as `readFile()`, `writeFile()`, and `ModelContainer`. Use this option only to test browser code.

##### Enable ES Module Support (Jest 30.4+ on Node.js 24.9+)

Pass `--experimental-vm-modules` to Node.js wherever you run Jest (for example, in npm scripts, CI, or your IDE):

```sh
NODE_OPTIONS=--experimental-vm-modules npx jest
```

Node.js prints an `ExperimentalWarning` when you pass `--experimental-vm-modules`. `worksheet.protect()` still fails in earlier Jest or Node.js versions.

##### Transform Using Babel (Jest 29 and 30)

This option requires a Babel config with `@babel/preset-env`. Configure Jest so that Babel transforms `@noble/hashes`:

```js
// jest.config.js
module.exports = {
  transformIgnorePatterns: ['/node_modules/(?!(\\.pnpm/[^/]+/node_modules/)?@noble/hashes/)'],
};
```

#### Replace `.bare` Bundles

`dx-exceljs-fork.js` and `dx-exceljs-fork.min.js` no longer include polyfills. Load these bundles instead of the `.bare` bundles:

**v5.x and earlier**

```html
<script src="https://cdn.jsdelivr.net/npm/devextreme-exceljs-fork@5.0.0/dist/dx-exceljs-fork.bare.min.js"></script>
```

**v6.0.0+**

```html
<script src="https://cdn.jsdelivr.net/npm/devextreme-exceljs-fork@6.0.0/dist/dx-exceljs-fork.min.js"></script>
```

For additional information, refer to [Browser Bundles](README.md#browser-bundles).

#### Replace `dist/es5` Imports

Import the package root instead of `dist/es5`:

**v5.x and earlier**

```js
const ExcelJS = require('devextreme-exceljs-fork/dist/es5');
```

**v6.0.0+**

```js
const ExcelJS = require('devextreme-exceljs-fork');
```

Node.js loads `lib/`, which requires Node.js 22.21.1 or later. Bundlers that read the `browser` field in `package.json` load `dist/dx-exceljs-fork.min.js`. These bundlers include webpack and Vite. If your bundler ignores the `browser` field, import this bundle directly: `devextreme-exceljs-fork/dist/dx-exceljs-fork.min.js`.

You can also remove the `core-js` and `regenerator-runtime` imports that `dist/es5` required.

## v5.0.0

### What Changed

- Removed the Node.js streaming API (`ExcelJS.stream`) because its dependencies triggered security scanner warnings. The following classes are no longer available:
    - `ExcelJS.stream.xlsx.WorkbookWriter`
    - `ExcelJS.stream.xlsx.WorkbookReader`
- Removed dependencies that only the streaming API used:
    - **archiver**
    - **unzipper**
    - **tmp**
- Removed methods that were deprecated in v4.0 and only threw errors:
    - `workbook.xlsx.createInputStream()`
    - `workbook.csv.createInputStream()`
- Deprecated `Row.commit()`, which only affected the removed streaming writer. The method remains for backward compatibility and has no effect.
- Updated TypeScript definitions:
    - Removed the `stream` namespace and all its types.
    - Removed the following options from `XlsxWriteOptions` because they had no effect:
        - `filename`
        - `stream`
        - `useSharedStrings`
    - Removed `Worksheet.commit()`, which standard worksheets never implemented. Calls to this method were compiled but threw errors at runtime.
- Fixed an error thrown when you set `useStyles` to `false` to write a workbook that contains conditional formatting. The library now writes conditional formatting styles regardless of the `useStyles` value.

### How to Update Existing Apps

The following browser bundles never included the streaming API:

- `dist/dx-exceljs-fork.js`
- `dist/dx-exceljs-fork.min.js`
- `dist/dx-exceljs-fork.bare.js`
- `dist/dx-exceljs-fork.bare.min.js`

Only the [TypeScript updates](#update-typescript-code) can affect apps that run in a browser.

> [!IMPORTANT]
> `ExcelJS.Workbook` retains the entire workbook in memory. If your app uses the streaming API to write/read very large files, continue to use v4.x.

#### Replace `WorkbookWriter` with `Workbook`

**v4.x and earlier**

```js
const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({filename: './file.xlsx'});
const worksheet = workbook.addWorksheet('Sheet 1');
worksheet.addRow(['a', 'b']).commit();
await workbook.commit();
```

**v5.0.0+**

```js
const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet('Sheet 1');
worksheet.addRow(['a', 'b']);
await workbook.xlsx.writeFile('./file.xlsx');
```

You can also call `workbook.xlsx.write(stream)` to write to a stream or `workbook.xlsx.writeBuffer()` to write to a buffer. For additional information, refer to [Writing XLSX](README.md#writing-xlsx).

#### Replace `WorkbookReader` with `Workbook`

**v4.x and earlier**

```js
const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader('./file.xlsx');
for await (const worksheetReader of workbookReader) {
  for await (const row of worksheetReader) {
    // ...
  }
}
```

**v5.0.0+**

```js
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile('./file.xlsx');
workbook.eachSheet(worksheet => {
  worksheet.eachRow(row => {
    // ...
  });
});
```

You can also call `workbook.xlsx.read(stream)` to read from a stream or `workbook.xlsx.load(buffer)` to read a buffer. For additional information, refer to [Reading XLSX](README.md#reading-xlsx).

#### Replace `createInputStream()` with `read()`

Call `workbook.xlsx.read(stream)` or `workbook.csv.read(stream)` instead of `createInputStream()`:

**v4.x and earlier**

```js
stream.pipe(workbook.xlsx.createInputStream());
```

**v5.0.0+**

```js
await workbook.xlsx.read(stream);
```

#### Remove `Row.commit()` Calls

`Row.commit()` is deprecated and has no effect. The method remains so that existing calls do not throw errors, but you can safely remove these calls.

#### Update TypeScript Code

- Replace the streaming API classes with `Workbook` as shown above. Remove other references to the `stream` namespace.
- Remove the following options from `XlsxWriteOptions` objects because they had no effect: `filename`, `stream`, and `useSharedStrings`. You can still specify `useStyles` and `zip`.
- Remove `worksheet.commit()` calls. These calls threw errors at runtime.

#### Check Your Dependencies

The **devextreme-exceljs-fork** package no longer installs **archiver**, **unzipper**, and **tmp**. If your app uses these packages, add them to your app's `package.json`.
