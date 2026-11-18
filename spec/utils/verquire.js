// Loads modules from lib/ for the specs ('exceljs' is the package entry).

/* eslint-disable import-x/no-dynamic-require */

const libs = {
  exceljs: require('../../lib/dx-exceljs-fork.nodejs'),
};

module.exports = function verquire(path) {
  if (!libs[path]) {
    libs[path] = require(`../../lib/${path}`);
  }
  return libs[path];
};
