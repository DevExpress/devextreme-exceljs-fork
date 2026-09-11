const {assertSafeMediaPath, assertSafeMediaExtension, assertSafeImage} = verquire('utils/media-path-guard');

describe('media-path-guard', () => {
  describe('assertSafeMediaPath', () => {
    ['../../etc/passwd', 'images/../../secret', '..\\..\\secret', '..', 'C:..\\secret'].forEach(filename => {
      it(`throws on a path-traversal filename '${filename}'`, () => {
        expect(() => assertSafeMediaPath(filename)).to.throw(/\.\./);
      });
    });

    ['images/logo.png', '/abs/path/to/logo.png', 'C:\\images\\logo.png', 'a..b.png', 'foo:../bar'].forEach(filename => {
      it(`accepts a safe filename '${filename}'`, () => {
        expect(() => assertSafeMediaPath(filename)).to.not.throw();
      });
    });

    [undefined, null].forEach(filename => {
      it(`ignores an absent filename '${filename}'`, () => {
        expect(() => assertSafeMediaPath(filename)).to.not.throw();
      });
    });

    it('throws on a numeric file descriptor', () => {
      expect(() => assertSafeMediaPath(0)).to.throw(/string/);
    });

    it('throws on a Buffer filename', () => {
      expect(() => assertSafeMediaPath(Buffer.from('../../etc/passwd'))).to.throw(/string/);
    });

    it('throws on a filename with a null byte', () => {
      expect(() => assertSafeMediaPath('images/logo.png\0.txt')).to.throw(/null byte/);
    });
  });

  describe('assertSafeMediaExtension', () => {
    ['png/../../evil', 'png/evil', 'png\\evil', '..', 'a..b'].forEach(extension => {
      it(`throws on an unsafe extension '${extension}'`, () => {
        expect(() => assertSafeMediaExtension(extension)).to.throw();
      });
    });

    ['png', 'jpeg', 'gif'].forEach(extension => {
      it(`accepts a safe extension '${extension}'`, () => {
        expect(() => assertSafeMediaExtension(extension)).to.not.throw();
      });
    });

    [undefined, null].forEach(extension => {
      it(`ignores an absent extension '${extension}'`, () => {
        expect(() => assertSafeMediaExtension(extension)).to.not.throw();
      });
    });

    it('throws on a non-string extension', () => {
      expect(() => assertSafeMediaExtension(0)).to.throw(/string/);
    });

    it('throws on an extension with a null byte', () => {
      expect(() => assertSafeMediaExtension('png\0')).to.throw(/null byte/);
    });
  });

  describe('assertSafeImage', () => {
    it('throws when the image filename is unsafe', () => {
      expect(() => assertSafeImage({filename: '../../etc/passwd', extension: 'png'})).to.throw(/\.\./);
    });

    it('throws when the image extension is unsafe', () => {
      expect(() => assertSafeImage({buffer: Buffer.from('x'), extension: '../../evil'})).to.throw();
    });

    it('accepts a safe image and an absent image', () => {
      expect(() => assertSafeImage({filename: 'images/logo.png', extension: 'png'})).to.not.throw();
      expect(() => assertSafeImage(undefined)).to.not.throw();
    });
  });
});
