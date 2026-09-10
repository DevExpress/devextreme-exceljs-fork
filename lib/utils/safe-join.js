const path = require('path');

function safeJoin(baseDir, userPath) {
  if (typeof baseDir !== 'string' || typeof userPath !== 'string') {
    throw new Error('`safeJoin` parameters must be strings');
  }
  if (baseDir.includes('\0') || userPath.includes('\0')) {
    throw new Error('`safeJoin` parameters cannot contain null bytes');
  }
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(resolvedBase, userPath);
  const relative = path.relative(resolvedBase, resolvedTarget);
  const escapesBase = relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative);
  if (escapesBase) {
    throw new Error(
      `"${userPath}" resolves to an invalid path: "${resolvedTarget}"\n\n` +
        `This path is outside of the base directory "${resolvedBase}"`
    );
  }
  return resolvedTarget;
}

module.exports = {safeJoin};
