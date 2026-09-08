const path = require('path');

const {safeJoin} = verquire('utils/safe-join');

describe('safe-join', () => {
  const base = path.resolve('app', 'assets');

  it('resolves a safe user path inside the base directory', () => {
    expect(safeJoin(base, 'logos/logo.png')).to.equal(path.join(base, 'logos', 'logo.png'));
  });

  it('throws when the user path escapes the base directory', () => {
    expect(() => safeJoin(base, '../../etc/passwd')).to.throw(/outside the base directory/);
  });

  it('throws when the user path is an absolute path outside the base directory', () => {
    expect(() => safeJoin(base, path.resolve('/etc/passwd'))).to.throw(/outside the base directory/);
  });

  it('throws on a null byte in the user path', () => {
    expect(() => safeJoin(base, 'logo\0.png')).to.throw(/null byte/);
  });

  it('throws on a non-string user path', () => {
    expect(() => safeJoin(base, 0)).to.throw(/must be strings/);
  });
});
