// `util` in the browser bundles: @fast-csv/format needs promisify; readable-stream works without debuglog and inspect.
module.exports = {
  promisify(fn) {
    return (...args) => new Promise((resolve, reject) => {
      fn(...args, (err, value) => (err ? reject(err) : resolve(value)));
    });
  },
};
