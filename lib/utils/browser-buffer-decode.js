// eslint-disable-next-line n/no-unsupported-features/node-builtins
const textDecoder = typeof TextDecoder === 'undefined' ? null : new TextDecoder('utf-8');

function bufferToString(chunk) {
  if (typeof chunk === 'string') {
    return chunk;
  }
  if (textDecoder) {
    return textDecoder.decode(chunk);
  }
  return chunk.toString();
}

exports.bufferToString = bufferToString;
