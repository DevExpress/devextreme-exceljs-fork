// Builds the browser bundles in dist/ from lib/ with esbuild.

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const pkg = require('../../package.json');

const root = path.join(__dirname, '../..');

/* eslint-disable max-len */
const preamble = `/*!
 * DevExtreme-ExcelJS Fork v.${pkg.version}
 * https://js.devexpress.com/
 * Copyright (c) 2025, Developer Express Inc.
 * Copyright (c) 2014-2019 Guyon Roche
 * Read about DevExtreme-ExcelJS Fork licensing here: https://cdn.jsdelivr.net/npm/devextreme-exceljs-fork@${pkg.version}/LICENSE
 */`;

// UMD wrapper (esbuild has no UMD format): CommonJS, AMD or the global `ExcelJS`.
// The trailing `var` hides the loader's names from the bundle: a visible `require` makes webpack warn.
const umdHeader = '(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.ExcelJS = f()}})(function(){var define,module,exports,require;';
/* eslint-enable max-len */
const umdFooter = 'return __dxExcelJS;});';

// Browser versions of the Node built-ins that lib/ and its dependencies require.
// Any other built-in, e.g. `crypto`, fails the build: esbuild doesn't polyfill them.
// Resolved from the project root. A trailing slash means the npm package of that name, not the built-in.
// No `timers`: see shims/node-globals.mjs.
const alias = {
  buffer: 'buffer/',
  events: 'events/',
  // A stub: only the Node-only readFile/writeFile use `fs`
  fs: './tools/build/shims/fs.js',
  process: 'process/',
  stream: 'stream-browserify',
  string_decoder: 'string_decoder/',
  util: 'util/',
};

// Ignores dependencies' own source maps: some point to unpublished .ts files (saxes, @fast-csv).
const ignoreDependencySourceMaps = {
  name: 'ignore-dependency-source-maps',
  setup(build) {
    build.onLoad({filter: /[\\/]node_modules[\\/].*\.[cm]?js$/}, async args => ({
      contents: (await fs.promises.readFile(args.path, 'utf8')).replace(/\/\/# sourceMappingURL=\S+\s*$/, ''),
      loader: 'js',
    }));
  },
};

// Node's `crypto` polyfill (crypto-browserify) and its heavy dependencies must never be bundled, not even
// through an alias or a direct require (hashing uses @noble/hashes).
const forbidden = /node_modules[\\/](crypto-browserify|elliptic|bn\.js|pbkdf2|sha\.js)[\\/]/;

async function build(minify) {
  const outfile = `dist/dx-exceljs-fork${minify ? '.min' : ''}.js`;
  const {metafile} = await esbuild.build({
    absWorkingDir: root,
    entryPoints: ['lib/dx-exceljs-fork.browser.js'],
    outfile,
    bundle: true,
    minify,
    platform: 'browser',
    target: 'es2020',
    format: 'iife',
    // Returned by the UMD footer
    globalName: '__dxExcelJS',
    banner: {js: `${preamble}\n${umdHeader}`},
    footer: {js: umdFooter},
    alias,
    plugins: [ignoreDependencySourceMaps],
    // Node globals used without an import
    inject: ['tools/build/shims/node-globals.mjs'],
    define: {global: 'globalThis'},
    sourcemap: true,
    metafile: true,
    logLevel: 'warning',
  });

  const found = Object.keys(metafile.inputs).filter(input => forbidden.test(input));
  if (found.length) {
    throw new Error(`${outfile} bundles Node crypto polyfills:\n${found.join('\n')}`);
  }
}

async function main() {
  // Start from an empty dist/, so stale files never get packed
  fs.rmSync(path.join(root, 'dist'), {recursive: true, force: true});
  await build(false);
  await build(true);
  fs.copyFileSync(path.join(root, 'LICENSE'), path.join(root, 'dist/LICENSE'));
}

main().catch(err => {
  // esbuild logs its own errors
  if (!err.errors) {
    // eslint-disable-next-line no-console
    console.error(err);
  }
  process.exit(1);
});
