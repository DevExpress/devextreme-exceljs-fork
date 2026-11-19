// Node globals that lib/ and its dependencies use without importing them (injected by build.js).
import timers from 'timers-browserify';

export {Buffer} from 'buffer';
export {default as process} from 'process';

// timers-browserify loads here, before this line runs, so it doesn't see these exports and uses its own
// implementation. If it loaded earlier elsewhere, they'd stay undefined: that's why `timers` isn't aliased.
export const {setImmediate, clearImmediate} = timers;
