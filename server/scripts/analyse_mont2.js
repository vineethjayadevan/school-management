require('dotenv').config();
const mongoose = require('mongoose');
const xlsx = require('xlsx');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB...');
    runAnalysis();
  })
  .catch(err => console.error('Could not connect to MongoDB...', err));

const excelPath = 'C:\\Users\\vinee\\Desktop\\AG Projects\\Stemgps_Data\\mont 2 new copy copy.xlsx';

async function runAnalysis() {
  try {
    const Student = require('../models/Student');
    const workbook = xlsx.readFile(excelPath, { cellDates: true });
    
    // We expect the data to be in the first sheet based on our initial check
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // Use range: 0 as the headers are on the first row
    const data = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    console.log(`\n=== Analysis Report for: ${sheetName} ===`);
    console.log(`Total rows read from Excel: ${data.length}`);

    let missingAdmnNo = [];
    let missingName = [];
    let duplicatesInExcel = new Set();
    let admnNoSet = new Set();
    let alreadyInDb = [];
    let readyToImport = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // Assuming header is row 1
      
      const rawAdmnNo = row['Admn.no'];
      const admnNo = String(rawAdmnNo || '').trim();
      const rawName = row['Name of the student'];
      const name = String(rawName || '').trim();

      if (!admnNo) {
        missingAdmnNo.push(`Row ${rowNum}: Name: ${name || 'UNKNOWN'}`);
        continue;
      }

      if (!name) {
        missingName.push(`Row ${rowNum}: AdmnNo: ${admnNo}`);
      }

      if (admnNoSet.has(admnNo)) {
        duplicatesInExcel.add(admnNo);
      } else {
        admnNoSet.add(admnNo);
      }

      // Check DB
      const existingStudent = await Student.findOne({ admissionNo: admnNo });
      if (existingStudent) {
        alreadyInDb.push(`AdmnNo: ${admnNo} | Excel Name: ${name} | DB Name: ${existingStudent.name}`);
      } else {
        readyToImport.push({ admnNo, name, rowNum });
      }
    }

    console.log('\n--- Missing Admission Numbers ---');
    if (missingAdmnNo.length > 0) {
      missingAdmnNo.forEach(m => console.log(m));
    } else {
      console.log('None.');
    }

    console.log('\n--- Missing Student Names ---');
    if (missingName.length > 0) {
      missingName.forEach(m => console.log(m));
    } else {
      console.log('None.');
    }

    console.log('\n--- Duplicate Admission Numbers in Excel ---');
    if (duplicatesInExcel.size > 0) {
      Array.from(duplicatesInExcel).forEach(d => console.log(d));
    } else {
      console.log('None.');
    }

    console.log('\n--- Students Already Present in Database ---');
    if (alreadyInDb.length > 0) {
      console.log(`Total already in DB: ${alreadyInDb.length}`);
      alreadyInDb.forEach(s => console.log(s));
    } else {
      console.log('None.');
    }

    console.log('\n--- Ready to Import ---');
    console.log(`Total valid students not in DB: ${readyToImport.length}`);

  } catch (error) {
    console.error("Analysis Error:", error);
  } finally {
    mongoose.disconnect();
    console.log('\nDisconnected from MongoDB.');
  }
}
