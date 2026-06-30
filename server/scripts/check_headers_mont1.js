const xlsx = require('xlsx');

const file1 = 'C:\\Users\\vinee\\Downloads\\Mont-1 mubi (1).xlsx';
const file2 = 'C:\\Users\\vinee\\Downloads\\Mon-1 Students (NUSAIBA ).xlsx';

try {
  console.log('--- File 1 ---');
  const wb1 = xlsx.readFile(file1, { cellDates: true });
  const sheet1 = wb1.Sheets[wb1.SheetNames[0]];
  const data1 = xlsx.utils.sheet_to_json(sheet1, { header: 1, defval: "" });
  console.log(data1[0]);

  console.log('\n--- File 2 ---');
  const wb2 = xlsx.readFile(file2, { cellDates: true });
  const sheet2 = wb2.Sheets[wb2.SheetNames[0]];
  const data2 = xlsx.utils.sheet_to_json(sheet2, { header: 1, defval: "" });
  console.log(data2[0]);
} catch (err) {
  console.error("Error reading excels:", err);
}
