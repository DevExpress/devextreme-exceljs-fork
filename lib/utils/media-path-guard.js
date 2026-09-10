'use strict';

function assertMediaString(value, kind) {
  if (value === undefined || value === null) {
    return false;
  }
  if (typeof value !== 'string') {
    throw new Error(`\`${kind}\` must be a string. Received "${typeof value}"`);
  }
  if (value.includes('\0')) {
    throw new Error(`\`${kind}\` cannot contain null bytes: "${value}"`);
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
    throw new Error(`File path cannot contain "..": "${filename}"`);
  }
}

function assertSafeMediaExtension(extension) {
  if (assertMediaString(extension, 'extension') && (/[\\/]/.test(extension) || extension.includes('..'))) {
    throw new Error(`File extension cannot contain "..", "/", or "\\": "${extension}"`);
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
