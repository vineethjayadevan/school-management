const xlsx = require('xlsx');
const path = require('path');

const filePath = "C:\\Users\\vinee\\Desktop\\AG Projects\\Stemgps_Data\\final Student List\\All Students details 2026-27.xlsx";

try {
    const workbook = xlsx.readFile(filePath);
    console.log("Sheet Names:", workbook.SheetNames);
    
    // Read the first sheet just to see headers
    if (workbook.SheetNames.length > 0) {
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(firstSheet, { header: 1 });
        console.log("\nHeaders of the first sheet (" + workbook.SheetNames[0] + "):");
        console.log(data[0]);
        console.log("\nFirst data row:");
        console.log(data[1]);
    }
} catch (error) {
    console.error("Error reading excel file:", error);
}
