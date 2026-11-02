'use strict';

/* eslint-disable no-console */

const fs = require('fs');
const http = require('http');
const path = require('path');
const ExcelJS = require('../../lib/dx-exceljs-fork.nodejs.js');
const StreamBuf = require('../../lib/utils/stream-buf');

const publicDir = path.join(__dirname, 'public');
const contentTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
};

console.log('Copying bundle.js to public folder');
fs.createReadStream(`${__dirname}/../../dist/dx-exceljs-fork.min.js`).pipe(
  fs.createWriteStream(path.join(publicDir, 'exceljs.min.js'))
);
fs.createReadStream(`${__dirname}/../../dist/dx-exceljs-fork.js`).pipe(
  fs.createWriteStream(path.join(publicDir, 'exceljs.js'))
);

function upload(req, res) {
  const wb = new ExcelJS.Workbook();

  const stream = new StreamBuf();
  stream.on('finish', () => {
    const base64 = stream.read();

    wb.xlsx.load(base64, {base64: true}).then(() => {
      const ws = wb.getWorksheet('blort');

      console.log('XLSX uploaded:');
      console.log('A1', ws.getCell('A1').value);
      console.log('A2', ws.getCell('A2').value);

      ws.getCell('A1').value = 'Hey Ho!';
      ws.getCell('A2').value = 14;

      const outStream = new StreamBuf();
      wb.xlsx.write(outStream).then(() => {
        const b = outStream.read();
        const s = b.toString('base64');
        res.write(s);
        res.end();
      });
    });
  });

  req.pipe(stream);
}

function serveStatic(req, res) {
  const url = URL.parse(req.url, 'http://localhost');
  if (!url) {
    res.statusCode = 400;
    res.end();
    return;
  }
  const filePath = path.join(publicDir, url.pathname === '/' ? 'index.html' : url.pathname);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = 404;
      res.end();
      return;
    }
    res.setHeader('Content-Type', contentTypes[path.extname(filePath)] || 'application/octet-stream');
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/upload') {
    upload(req, res);
    return;
  }
  serveStatic(req, res);
});

server.listen(3003);
console.log('Listening on port 3003');
