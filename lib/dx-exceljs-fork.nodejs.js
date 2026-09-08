const ExcelJS = {
  Workbook: require('./doc/workbook'),
  ModelContainer: require('./doc/modelcontainer'),
  stream: {
    xlsx: {
      WorkbookWriter: require('./stream/xlsx/workbook-writer'),
      WorkbookReader: require('./stream/xlsx/workbook-reader'),
    },
  },
  utils: {
    safeJoin: require('./utils/utils').safeJoin,
  },
};

Object.assign(ExcelJS, require('./doc/enums'));

module.exports = ExcelJS;
