const http = require('http');
const {Readable} = require('stream');
const testutils = require('../utils/index');

const Excel = verquire('exceljs');

describe('HTTP', () => {
  let server;
  let url;
  before(done => {
    server = http.createServer((req, res) => {
      const wb = testutils.createTestBook(new Excel.Workbook(), 'xlsx');
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', 'attachment; filename=Report.xlsx');
      wb.xlsx.write(res).then(() => {
        res.end();
      });
    });
    server.listen(0, '127.0.0.1', () => {
      url = `http://127.0.0.1:${server.address().port}/workbook`;
      done();
    });
  });

  after(() => {
    server.close();
  });

  it('downloads a workbook', async function() {
    this.timeout(5000);
    const res = await fetch(url);
    expect(res.status).to.equal(200);
    const wb2 = new Excel.Workbook();
    await wb2.xlsx.read(Readable.from(res.body));
    testutils.checkTestBook(wb2, 'xlsx');
  });
});
