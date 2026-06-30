const xlsx = require('xlsx');
const path = 'C:\\Users\\vinee\\Desktop\\AG Projects\\Stemgps_Data\\Mont1Rahi.xlsx';

try {
  const workbook = xlsx.readFile(path, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { range: 1, defval: "" });
  
  if (data.length > 0) {
    console.log("Headers:", Object.keys(data[0]));
    console.log("First Row Data:", data[0]);
    console.log(`Total Rows: ${data.length}`);
  } else {
    console.log("No data found in the first sheet.");
  }
} catch (error) {
  console.error("Error reading Excel file:", error.message);
}
