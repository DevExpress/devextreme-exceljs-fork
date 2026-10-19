/* eslint-disable no-console, no-unused-vars */
const ExcelJS = require('./lib/dx-exceljs-fork.nodejs.js');

const runs = 3;

(async () => {
  try {
    await runProfiling('huge xlsx file read', async () => {
      // Data taken from http://eforexcel.com/wp/downloads-18-sample-csv-files-data-sets-for-testing-sales/
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile('./spec/integration/data/huge.xlsx');

      let rowCount = 0;
      workbook.eachSheet(worksheet => {
        worksheet.eachRow(() => {
          rowCount += 1;
        });
      });

      console.log(`Processed ${workbook.worksheets.length} worksheets and ${rowCount} rows`);
    });
  } catch (err) {
    console.error(err);
    process.exit(1); // eslint-disable-line no-process-exit
  }
})();

async function runProfiling(name, run) {
  console.log('');
  console.log('####################################################');
  console.log(
    `WARMUP: Current memory usage: ${currentMemoryUsage({runGarbageCollector: true})} MB`
  );
  console.log(`WARMUP: ${name} profiling started`);
  const warmupStartTime = Date.now();
  await run();
  console.log(`WARMUP: ${name} profiling finished in ${Date.now() - warmupStartTime}ms`);
  console.log(
    `WARMUP: Current memory usage (before GC): ${currentMemoryUsage({
      runGarbageCollector: false,
    })} MB`
  );
  console.log(
    `WARMUP: Current memory usage (after GC): ${currentMemoryUsage({runGarbageCollector: true})} MB`
  );

  for (let i = 1; i <= runs; i += 1) {
    console.log('');
    console.log('####################################################');
    console.log(`RUN ${i}: ${name} profiling started`);
    const startTime = Date.now();
    await run(); // eslint-disable-line no-await-in-loop
    console.log(`RUN ${i}: ${name} profiling finished in ${Date.now() - startTime}ms`);
    console.log(
      `RUN ${i}: Current memory usage (before GC): ${currentMemoryUsage({
        runGarbageCollector: false,
      })} MB`
    );
    console.log(
      `RUN ${i}: Current memory usage (after GC): ${currentMemoryUsage({
        runGarbageCollector: true,
      })} MB`
    );
  }
}

function currentMemoryUsage({runGarbageCollector}) {
  if (runGarbageCollector) global.gc();
  return Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100;
}
