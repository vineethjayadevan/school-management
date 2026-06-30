require('dotenv').config();
const mongoose = require('mongoose');
const xlsx = require('xlsx');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB...\n');
    runAnalysis();
  })
  .catch(err => console.error('Could not connect to MongoDB...', err));

const file1 = 'C:\\Users\\vinee\\Downloads\\Mont-1 mubi (1).xlsx';
const file2 = 'C:\\Users\\vinee\\Downloads\\Mon-1 Students (NUSAIBA ).xlsx';

async function processFile(filePath, fileName) {
  try {
    const Student = require('../models/Student');
    const workbook = xlsx.readFile(filePath, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // using header: 1 to get arrays of rows
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });

    console.log(`=== Analysis Report for: ${fileName} ===`);
    let missingInDb = [];
    let processed = 0;

    // skip row 0 as it's the header
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row.length === 0 || (!row[1] && !row[2])) {
        // empty row
        continue;
      }
      
      processed++;
      const rawAdmnNo = row[1];
      const admnNo = String(rawAdmnNo || '').trim();
      const rawName = row[2];
      const name = String(rawName || '').trim();

      if (!admnNo) {
        missingInDb.push(`[No Admn No] Name: ${name}`);
        continue;
      }

      const existingStudent = await Student.findOne({ admissionNo: admnNo });
      if (!existingStudent) {
        missingInDb.push(`AdmnNo: ${admnNo} | Name: ${name}`);
      }
    }

    console.log(`Total rows processed: ${processed}`);
    console.log(`\nStudents MISSING in Database: ${missingInDb.length}`);
    if (missingInDb.length > 0) {
      missingInDb.forEach(m => console.log(m));
    } else {
      console.log('None.');
    }
    console.log('\n');

  } catch (error) {
    console.error(`Analysis Error for ${fileName}:`, error);
  }
}

async function runAnalysis() {
  await processFile(file1, 'Mont-1 mubi (1).xlsx');
  await processFile(file2, 'Mon-1 Students (NUSAIBA ).xlsx');
  
  mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}
