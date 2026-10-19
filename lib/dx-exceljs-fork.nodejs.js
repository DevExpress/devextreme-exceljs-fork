const ExcelJS = {
  Workbook: require('./doc/workbook'),
  ModelContainer: require('./doc/modelcontainer'),
  utils: {
    safeJoin: require('./utils/safe-join').safeJoin,
  },
};

Object.assign(ExcelJS, require('./doc/enums'));

module.exports = ExcelJS;
