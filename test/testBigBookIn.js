'use strict';

const utils = require('./utils/utils');
const HrStopwatch = require('./utils/hr-stopwatch');
const ColumnSum = require('./utils/column-sum');

const Excel = require('../dx-excel-fork');

const {Workbook} = Excel;

if (process.argv[2] === 'help') {
  console.log('Usage:');
  console.log('    node testBigBookIn filename');
  // eslint-disable-next-line no-process-exit
  process.exit(0);
}

const filename = process.argv[2];

const stopwatch = new HrStopwatch();
stopwatch.start();

function logProgress(count) {
  const memory = process.memoryUsage();
  const txtCount = utils.fmt.number(count);
  const txtHeap = utils.fmt.number(memory.heapTotal);
  process.stdout.write(`Count: ${txtCount}, Heap Size: ${txtHeap}\u001b[0G`);
}

const colCount = new ColumnSum([3, 6, 7, 8]);

function checkRow(row) {
  if (row.number > 1) {
    colCount.add(row);

    if (colCount.count % 1000 === 0) {
      logProgress(colCount.count);
    }
  }
  row.destroy();
}

function report() {
  console.log(`Count: ${colCount.count}`);
  console.log(`Sums: ${colCount}`);

  stopwatch.stop();
  console.log(`Time: ${stopwatch}`);
}

const wb = new Workbook();
wb.xlsx
  .readFile(filename)
  .then(() => {
    const ws = wb.getWorksheet('blort');
    ws.eachRow(checkRow);
  })
  .then(report);
