// `util` in the browser bundles: @fast-csv/format's write helpers use promisify;
// readable-stream works without debuglog and inspect.
module.exports = {
  promisify(fn) {
    return (...args) => new Promise((resolve, reject) => {
      fn(...args, (err, value) => (err ? reject(err) : resolve(value)));
    });
  },
};
