const xlsx = require('xlsx');
const excelPath = 'C:\\Users\\vinee\\Desktop\\AG Projects\\Stemgps_Data\\mont 2 new copy copy.xlsx';

try {
  const workbook = xlsx.readFile(excelPath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { defval: "" });
  console.log("Keys of first row:");
  console.log(Object.keys(data[0]));
} catch (err) {
  console.error(err);
}
