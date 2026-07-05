const XLSX = require('xlsx');
const fs = require('fs');

try {
    const workbook = XLSX.readFile('C:\\Users\\vinee\\Downloads\\VEHICLE LIST FULL 26-27.xlsx');
    
    for (const sheetName of workbook.SheetNames) {
        console.log(`\n=== Sheet: ${sheetName} ===`);
        const sheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with header: 1 to get array of arrays
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        // Let's print the first 20 rows to understand the structure
        for (let i = 0; i < Math.min(20, data.length); i++) {
            console.log(`Row ${i + 1}:`, JSON.stringify(data[i]));
        }
    }
} catch (error) {
    console.error('Error reading Excel file:', error);
}
