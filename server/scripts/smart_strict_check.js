require('dotenv').config();
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const Student = require('../models/Student');

const excelPath = "C:\\Users\\vinee\\Desktop\\AG Projects\\Stemgps_Data\\final Student List\\All Students details 2026-27.xlsx";

async function smartCheck() {
    console.log("Connecting to Database...");
    await mongoose.connect(process.env.MONGO_URI);
    
    const workbook = xlsx.readFile(excelPath, { cellDates: true });
    const targetSheets = ['Mont 1', 'Mont 2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'];
    
    const excelAdmissions = new Set();
    
    for (const sheetName of targetSheets) {
        if (!workbook.SheetNames.includes(sheetName)) continue;
        const sheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;
            
            let col2 = row[2] ? String(row[2]).trim() : '';
            let col3 = row[3] ? String(row[3]).trim() : '';
            
            let admissionNo = col2;
            
            // SMART FIX: If col3 is pure digits, it's the real admission number (Grade 2 swap issue)
            if (/^\d+$/.test(col3) && sheetName === 'Grade 2') {
                admissionNo = col3;
            }
            
            if (!admissionNo || /^[a-zA-Z\s\.]+$/.test(admissionNo)) continue;
            
            excelAdmissions.add(admissionNo);
        }
    }
    
    const allDbStudents = await Student.find({}, 'admissionNo name className studentStatus isActive');
    const extraInDb = [];
    
    for (const st of allDbStudents) {
        if (!excelAdmissions.has(st.admissionNo)) {
            extraInDb.push(st);
        }
    }
    
    const outputPath = path.join(__dirname, '..', 'data');
    let reportTxt = `=== TRUE ADDITIONAL STUDENTS IN DATABASE ===\n`;
    reportTxt += `These ${extraInDb.length} students are in the DB but not in the Excel file.\n\n`;
    
    extraInDb.forEach(st => {
        reportTxt += `Admn No: ${st.admissionNo} | Name: ${st.name} | Class: ${st.className} | Status: ${st.studentStatus}\n`;
    });
    
    fs.writeFileSync(path.join(outputPath, 'true_additional_students.txt'), reportTxt);
    console.log(`True extra students: ${extraInDb.length}`);
    mongoose.disconnect();
}

smartCheck().catch(err => {
    console.error(err);
    mongoose.disconnect();
});
