# UPGRADE FROM 4.x to 5.0

## Streaming API removal

The Node.js streaming API is removed. `ExcelJS.stream` is now `undefined`, so `ExcelJS.stream.xlsx.WorkbookWriter` and `ExcelJS.stream.xlsx.WorkbookReader` are no longer available. Use `ExcelJS.Workbook` instead.

### Writing

```js
// 4.x
const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({filename: './file.xlsx'});
const worksheet = workbook.addWorksheet('Sheet 1');
worksheet.addRow(['a', 'b']).commit();
await workbook.commit();

// 5.0
const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet('Sheet 1');
worksheet.addRow(['a', 'b']);
await workbook.xlsx.writeFile('./file.xlsx');
```

To write to a stream, use `await workbook.xlsx.write(stream)`. To get a buffer, use `await workbook.xlsx.writeBuffer()`.

### Reading

```js
// 4.x
const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader('./file.xlsx');
for await (const worksheetReader of workbookReader) {
  for await (const row of worksheetReader) {
    // ...
  }
}

// 5.0
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile('./file.xlsx');
workbook.eachSheet(worksheet => {
  worksheet.eachRow(row => {
    // ...
  });
});
```

To read from a stream, use `await workbook.xlsx.read(stream)`. To read a buffer, use `await workbook.xlsx.load(buffer)`.

`ExcelJS.Workbook` keeps the whole workbook in memory. If you write or read very large files, stay on 4.x.

`Row.commit()` is kept for compatibility and has no effect, so you can remove the calls.

## `createInputStream` removal

`workbook.xlsx.createInputStream()` and `workbook.csv.createInputStream()` are removed. Since 4.0, they only threw an error. Use `workbook.xlsx.read(stream)` and `workbook.csv.read(stream)` instead.

## TypeScript

- The `stream` namespace is removed, together with `stream.xlsx.WorkbookWriter`, `WorkbookReader`, `WorksheetReader` and their option types (`WorkbookWriterOptions`, `WorkbookStreamWriterOptions`, `WorkbookStreamReaderOptions`, `WorksheetReaderOptions`, `ArchiverZipOptions`, `ZlibOptions`).
- `XlsxWriteOptions` no longer extends `stream.xlsx.WorkbookWriterOptions`, so `filename`, `stream` and `useSharedStrings` are gone. They had no effect on `workbook.xlsx.write`, `writeFile` and `writeBuffer`, so you can remove them. `useStyles` and `zip` stay.
- `Worksheet.commit()` is removed. A regular worksheet never had this method at runtime.
- `Csv.createInputStream()` is removed. It only threw an error at runtime.
- `Row.commit()` is marked as deprecated.

## Dependencies

`archiver`, `unzipper` and `tmp` are no longer dependencies. Only the streaming API used them.

## Browser bundles

The browser bundles (`dist/dx-exceljs-fork.js`, `dist/dx-exceljs-fork.min.js` and their `.bare` variants) never included the streaming API, so browser code needs no changes apart from the TypeScript ones above.
