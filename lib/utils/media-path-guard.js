'use strict';

function assertMediaString(value, kind) {
  if (value === undefined || value === null) {
    return false;
  }
  if (typeof value !== 'string') {
    throw new Error(`Unsafe media ${kind}: expected a string but received ${typeof value}`);
  }
  if (value.includes('\0')) {
    throw new Error(`Unsafe media ${kind} "${value}": null bytes are not allowed`);
  }
  return true;
}

function assertSafeMediaPath(filename) {
  if (!assertMediaString(filename, 'filename')) {
    return;
  }
  const hasTraversalSegment = /(^|[\\/])\.\.([\\/]|$)/.test(filename);
  const hasWindowsDriveRelative = /^[a-zA-Z]:\.\./.test(filename);
  if (hasTraversalSegment || hasWindowsDriveRelative) {
    throw new Error(`Unsafe media filename "${filename}": path traversal ("..") segments are not allowed`);
  }
}

function assertSafeMediaExtension(extension) {
  if (assertMediaString(extension, 'extension') && (/[\\/]/.test(extension) || extension.includes('..'))) {
    throw new Error(`Unsafe media extension "${extension}": path separators and ".." are not allowed`);
  }
}

function assertSafeImage(image) {
  if (!image) {
    return;
  }
  assertSafeMediaPath(image.filename);
  assertSafeMediaExtension(image.extension);
}

module.exports = {assertSafeMediaPath, assertSafeMediaExtension, assertSafeImage};
