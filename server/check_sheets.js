require('dotenv').config();
const mongoose = require('mongoose');
const xlsx = require('xlsx');

const path = 'C:\\Users\\vinee\\Desktop\\AG Projects\\Stemgps_Data\\Mont1Rahi.xlsx';
const Student = require('./models/Student');

async function checkFile() {
  mongoose.connect(process.env.MONGO_URI);
  
  const workbook = xlsx.readFile(path, { cellDates: true });
  console.log('Sheet Names in file:', workbook.SheetNames);
  
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    // Need to check if second sheet also has range: 1 or range: 0
    let data = xlsx.utils.sheet_to_json(sheet, { defval: "" });
    if (data.length > 0 && data[0]['__EMPTY']) {
      // means it likely has a title row
      data = xlsx.utils.sheet_to_json(sheet, { range: 1, defval: "" });
    }
    console.log(`Sheet "${sheetName}" has ${data.length} rows.`);
  }

  const skippedStudent = await Student.findOne({ admissionNo: '2616' });
  if (skippedStudent) {
    console.log(`\nThe student skipped (Admission No 2616) is: ${skippedStudent.name}`);
  }

  mongoose.disconnect();
}

checkFile();
