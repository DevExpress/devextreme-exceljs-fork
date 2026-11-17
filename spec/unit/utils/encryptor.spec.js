const crypto = require('crypto');

const Encryptor = verquire('utils/encryptor');

// Reference implementation with node:crypto
function referencePasswordHash(password, hashAlgorithm, saltValue, spinCount) {
  const hash = (...buffers) => crypto.createHash(hashAlgorithm).update(Buffer.concat(buffers)).digest();
  let key = hash(Buffer.from(saltValue, 'base64'), Buffer.from(password, 'utf16le'));
  for (let i = 0; i < spinCount; i++) {
    const iterator = Buffer.alloc(4);
    iterator.writeUInt32LE(i, 0);
    key = hash(key, iterator);
  }
  return key.toString('base64');
}

describe('Encryptor', () => {
  const saltValue = '6tC6yotbNa8JaMaDvbUgxw==';

  describe('convertPasswordToHash', () => {
    it('matches a known SHA-512 hash for the default spin count', () => {
      expect(Encryptor.convertPasswordToHash('password', 'SHA512', saltValue, 100000)).to.equal(
        'l9877b709uRkUSVWkxAlhJgSEqzVqD8ysJkq2o1XpzvWs/sb7Pu3SY/So6djOKFmAiVo1FIh1dNzONnzZnXSEQ=='
      );
    });

    ['password', '', 'пароль 🔒'].forEach(password => {
      [0, 1, 1000].forEach(spinCount => {
        it(`matches node:crypto for password '${password}' and spinCount ${spinCount}`, () => {
          expect(Encryptor.convertPasswordToHash(password, 'SHA512', saltValue, spinCount)).to.equal(
            referencePasswordHash(password, 'sha512', saltValue, spinCount)
          );
        });
      });
    });

    ['sha256', 'sha384'].forEach(algorithm => {
      it(`matches node:crypto for ${algorithm}`, () => {
        expect(Encryptor.convertPasswordToHash('password', algorithm.toUpperCase(), saltValue, 10)).to.equal(
          referencePasswordHash('password', algorithm, saltValue, 10)
        );
      });
    });

    // Object.prototype names must not resolve to a hash function
    ['MD5', 'constructor', '__proto__'].forEach(algorithm => {
      it(`throws for an unsupported hash algorithm '${algorithm}'`, () => {
        expect(() => Encryptor.convertPasswordToHash('password', algorithm, saltValue, 1)).to.throw(
          `Hash algorithm '${algorithm.toLowerCase()}' not supported!`
        );
      });
    });
  });

  describe('randomBytes', () => {
    it('returns a Buffer of the requested size', () => {
      const bytes = Encryptor.randomBytes(16);

      expect(Buffer.isBuffer(bytes)).to.be.true();
      expect(bytes.length).to.equal(16);
    });

    it('returns different bytes on each call', () => {
      expect(Encryptor.randomBytes(16).equals(Encryptor.randomBytes(16))).to.be.false();
    });
  });
});
