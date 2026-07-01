const xlsx = require('xlsx');

const filePath = "C:\\Users\\vinee\\Downloads\\cash receipts 2026-27.xls";

try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
    
    console.log(`Sheet: ${sheetName}`);
    console.log("Row 0:", data[0]);
    console.log("Row 1:", data[1]);
    console.log("Row 2:", data[2]);
    console.log("Row 3:", data[3]);
    console.log("Row 4:", data[4]);
} catch (e) {
    console.error(e);
}
