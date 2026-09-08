const path = require('path');

function safeJoin(baseDir, userPath) {
  if (typeof baseDir !== 'string' || typeof userPath !== 'string') {
    throw new Error('safeJoin: baseDir and userPath must be strings');
  }
  if (baseDir.includes('\0') || userPath.includes('\0')) {
    throw new Error('safeJoin: null bytes are not allowed');
  }
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(resolvedBase, userPath);
  const relative = path.relative(resolvedBase, resolvedTarget);
  const escapesBase = relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative);
  if (escapesBase) {
    throw new Error(
      `Refusing to resolve "${userPath}" against base directory "${resolvedBase}": ` +
        `it resolves to "${resolvedTarget}", which is outside the base directory`
    );
  }
  return resolvedTarget;
}

module.exports = {safeJoin};
