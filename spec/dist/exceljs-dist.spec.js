const fs = require('fs');

const pkg = require('../../package.json');

const exists = path => fs.promises.access(path).then(() => true).catch(() => false);

const bundles = ['dx-exceljs-fork.js', 'dx-exceljs-fork.min.js'];

describe('ExcelJS', () => {
  describe('dist folder', () => {
    it('should include LICENSE', async () => {
      expect(await exists('./dist/LICENSE')).to.be.true();
    });
    it('should include dx-exceljs-fork.js', async () => {
      expect(await exists('./dist/dx-exceljs-fork.js')).to.be.true();
    });
    it('should include dx-exceljs-fork.min.js', async () => {
      expect(await exists('./dist/dx-exceljs-fork.min.js')).to.be.true();
    });
  });

  bundles.forEach(bundle => {
    describe(bundle, () => {
      let code;
      before(async () => {
        code = await fs.promises.readFile(`./dist/${bundle}`, 'utf8');
      });

      it('should start with the preamble', () => {
        expect(code.startsWith(`/*!\n * DevExtreme-ExcelJS Fork v.${pkg.version}\n`)).to.be.true();
      });
      it('should hide require in the UMD wrapper', () => {
        // A free `require` makes webpack warn "Critical dependency" (see tools/build/build.js)
        expect(code).to.include('(function(){var define,module,exports,require;');
      });
      it('should be ASCII-only', () => {
        expect(/[\u0080-\uffff]/.test(code)).to.be.false();
      });
    });
  });
});
