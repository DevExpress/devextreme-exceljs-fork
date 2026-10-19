# UPGRADE FROM 3.x to 4.0

## `wb.createInputStream()` deprecation

| ExcelJS V3.9.*                                                      | ExcelJS v4                         |
|---------------------------------------------------------------------|------------------------------------|
|`stream.pipe(workbook.xlsx.createInputStream());`                    | `await workbook.xlsx.read(stream)` |
|                                                                     |                                    |
