'use strict';

let hashers;
function getHasher(algorithm) {
  if (!hashers) {
    // Not at the top: Jest can't require() this ES module by default, so only protect() tests need extra Jest config
    const {sha256, sha384, sha512} = require('@noble/hashes/sha2.js');
    hashers = {sha256, sha384, sha512};
  }
  const name = algorithm.toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(hashers, name)) {
    throw new Error(`Hash algorithm '${name}' not supported!`);
  }
  return hashers[name];
}

const Encryptor = {
  /**
   * Convert a password into an encryption key
   * @param {string} password - The password
   * @param {string} hashAlgorithm - The hash algoritm
   * @param {string} saltValue - The salt value
   * @param {number} spinCount - The spin count
   * @returns {string} The encryption key, base64-encoded
   */
  convertPasswordToHash(password, hashAlgorithm, saltValue, spinCount) {
    const hash = getHasher(hashAlgorithm);
    // Password must be in unicode buffer
    const passwordBuffer = Buffer.from(password, 'utf16le');
    const saltedPassword = Buffer.concat([Buffer.from(saltValue, 'base64'), passwordBuffer]);
    // Generate the initial hash. Copy to a Uint8Array: noble rejects a Buffer from another realm (Jest + jsdom)
    let key = hash(new Uint8Array(saltedPassword));
    // Excel's spin (not PBKDF2): key = hash(key + uint32LE(i)), spinCount times
    const block = new Uint8Array(key.length + 4);
    const view = new DataView(block.buffer);
    for (let i = 0; i < spinCount; i++) {
      block.set(key, 0);
      view.setUint32(key.length, i, true);
      key = hash(block);
    }
    return Buffer.from(key).toString('base64');
  },
  /**
   * Generates cryptographically strong pseudo-random data.
   * @param size The size argument is a number indicating the number of bytes to generate.
   */
  randomBytes(size) {
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    return Buffer.from(globalThis.crypto.getRandomValues(new Uint8Array(size)));
  },
};
module.exports = Encryptor;
