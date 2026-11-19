## Unreleased

### What Changed

- Removed `dist/es5`, the ES5 copy of `lib/` for Node.js versions earlier than 10 and ES5 browsers (see [Replace `dist/es5` Imports](#replace-distes5-imports)). Also removed `index.ts`, which re-exported it. TypeScript types still come from `index.d.ts`.
- The browser bundles (`dist/dx-exceljs-fork(.min).js`) are now built with esbuild instead of Browserify and Babel. They target ES2020 instead of ES5, so they're smaller: gzipped `dx-exceljs-fork.min.js` is 138 KB instead of 189 KB.
- Removed `dist/dx-exceljs-fork.bare.js` and `dist/dx-exceljs-fork.bare.min.js`. `dx-exceljs-fork(.min).js` no longer includes the core-js and regenerator-runtime polyfills, so it now has the same code and replaces them (see [Replace `.bare` Bundles](#replace-bare-bundles)). It also no longer defines the `regeneratorRuntime` global.
- Removed the following Node.js polyfills and their dependencies from the browser bundles (`dist/dx-exceljs-fork(.min).js`):
    - `crypto-browserify`, with `elliptic`, `bn.js`, `pbkdf2` and others
    - `util`, with `call-bind`, `get-intrinsic`, `which-typed-array` and others
- `worksheet.protect()` now calculates the SHA-512 password hash with `@noble/hashes` 2.x (a new dependency) and generates the salt with `crypto.getRandomValues()`. Protected worksheets are unchanged: Excel accepts the same passwords as before.
- New runtime requirements:
    - `worksheet.protect()` with a password and writing extended conditional formatting rules (see below) require the Web Crypto API (`globalThis.crypto`). Node.js 22+ and all modern browsers include it. Some test environments that emulate a browser don't: for example, jsdom 19 and earlier (Jest 28 and earlier with `testEnvironment: 'jsdom'`).
    - The browser bundles require a browser that supports ES2020, for example, Chrome and Edge 80+, Firefox 74+, or Safari 14.1+. Internet Explorer 11 isn't supported (see [Internet Explorer 11](#internet-explorer-11)).
    - Jest tests that call `worksheet.protect()` with a password require a configuration change (see [Configure Jest for Worksheet Protection](#configure-jest-for-worksheet-protection)).
- Fixed an error (`crypto.randomUUID is not a function`) thrown in browsers when you write a workbook that contains extended conditional formatting rules on a non-secure page (served over plain HTTP from a host other than `localhost`). Extended rules include:
    - data bars, unless they set `gradient: true`
    - icon sets with custom icons, and the `3Triangles`, `3Stars` and `5Boxes` icon sets

### How to Update Existing Apps

#### Replace `dist/es5` Imports

Import the package root instead.

**v5.x and earlier**

```js
const ExcelJS = require('devextreme-exceljs-fork/dist/es5');
```

**v6.0.0+**

```js
const ExcelJS = require('devextreme-exceljs-fork');
```

Node.js then loads `lib/`, which requires Node.js 22.21.1 or later. Bundlers that read the `browser` field, such as webpack and Vite, load `dist/dx-exceljs-fork.min.js`. To use that bundle with a bundler that ignores the `browser` field, import it directly: `devextreme-exceljs-fork/dist/dx-exceljs-fork.min.js`. You can remove the `core-js` and `regenerator-runtime` imports that `dist/es5` required.

#### Replace `.bare` Bundles

Load `dx-exceljs-fork.min.js` or `dx-exceljs-fork.js` instead. They no longer include polyfills.

**v5.x and earlier**

```html
<script src="https://cdn.jsdelivr.net/npm/devextreme-exceljs-fork@5.0.0/dist/dx-exceljs-fork.bare.min.js"></script>
```

**v6.0.0+**

```html
<script src="https://cdn.jsdelivr.net/npm/devextreme-exceljs-fork@6.0.0/dist/dx-exceljs-fork.min.js"></script>
```

#### Internet Explorer 11

The browser bundles no longer run in Internet Explorer 11 or other browsers without ES2020 support. If your app supports these browsers, continue to use v5.x.

#### Configure Jest for Worksheet Protection

`worksheet.protect()` hashes the password with `@noble/hashes` 2.x, which is an ES module. Jest loads the package's Node.js entry point and can't `require()` ES modules by default, so tests that call `worksheet.protect()` with a password fail with `Must use import to load ES Module` (Jest 30) or `Jest encountered an unexpected token` (Jest 29). Other features aren't affected.

Choose one of the following options:

| Option | Requirements | Tests of browser code | Tests of Node.js code |
|---|---|---|---|
| Map to the browser bundle | Jest 29 or 30 | Yes | No |
| Enable ES module support | Jest 30.4+ on Node.js 24.9+ | Yes | Yes |
| Transform with Babel | Jest 29 or 30, a Babel config with `@babel/preset-env` | Yes | Yes |

If one Jest config runs tests of both browser and Node.js code, choose an option that supports both. If you use this package to export DevExtreme components, your tests run browser code: DevExtreme uses only the browser bundle.

**Map to the browser bundle** (Jest 29 and 30). Your tests then load the same bundle that bundlers load in your app. This doesn't require Babel:

```js
// jest.config.js
module.exports = {
  moduleNameMapper: {
    '^devextreme-exceljs-fork$': 'devextreme-exceljs-fork/dist/dx-exceljs-fork.min.js',
  },
};
```

The mapping applies to all tests that use this config, and the bundle doesn't include Node.js-only features, such as `readFile()`, `writeFile()` and `ModelContainer`. Don't use it for tests of Node.js code.

**Enable ES module support** (Jest 30.4+ on Node.js 24.9+). Run Jest with the `--experimental-vm-modules` Node.js option wherever you run it, for example, in npm scripts, CI and your IDE. Node.js prints an `ExperimentalWarning` for this option. With earlier Jest or Node.js versions, `worksheet.protect()` still fails.

```sh
NODE_OPTIONS=--experimental-vm-modules npx jest
```

**Transform with Babel** (Jest 29 and 30). Let Babel transform `@noble/hashes`. This requires a Babel config with `@babel/preset-env`:

```js
// jest.config.js
module.exports = {
  transformIgnorePatterns: ['/node_modules/(?!(\\.pnpm/[^/]+/node_modules/)?@noble/hashes/)'],
};
```

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
