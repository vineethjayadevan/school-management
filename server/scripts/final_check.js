require('dotenv').config();
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const Student = require('../models/Student');

const excelPath = "C:\\Users\\vinee\\Desktop\\AG Projects\\Stemgps_Data\\final Student List\\All Students details 2026-27.xlsx";

async function finalCheck() {
    console.log("Connecting to Database...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected.");

    const workbook = xlsx.readFile(excelPath);
    const targetSheets = ['Mont 1', 'Mont 2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'];
    
    // 1. Gather all admission numbers and names from Excel
    const excelStudents = new Map(); // admissionNo -> { name, class }
    let excelTotalCount = 0;
    
    for (const sheetName of targetSheets) {
        if (!workbook.SheetNames.includes(sheetName)) continue;
        const sheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;
            
            const admissionNo = row[2] ? String(row[2]).trim() : '';
            if (!admissionNo) continue;
            
            const name = row[3] ? String(row[3]).trim() : 'Unknown';
            const className = row[1] ? String(row[1]).trim() : sheetName;
            
            excelStudents.set(admissionNo, { name, className });
            excelTotalCount++;
        }
    }
    
    console.log(`Total students in Excel: ${excelTotalCount}`);
    
    // 2. Gather all students from DB
    const allDbStudents = await Student.find({}, 'admissionNo name className studentStatus isActive');
    console.log(`Total students in Database: ${allDbStudents.length}`);
    
    // 3. Find extra students in DB (Not in Excel)
    const extraInDb = [];
    const dbAdmissions = new Set();
    const duplicateNamesInDb = new Map();
    let duplicates = [];
    
    for (const st of allDbStudents) {
        // Check for duplicates by name
        const lowerName = st.name.toLowerCase().trim();
        if (duplicateNamesInDb.has(lowerName)) {
            duplicateNamesInDb.get(lowerName).push(st);
        } else {
            duplicateNamesInDb.set(lowerName, [st]);
        }
        
        dbAdmissions.add(st.admissionNo);
        
        if (!excelStudents.has(st.admissionNo)) {
            extraInDb.push(st);
        }
    }
    
    for (const [name, arr] of duplicateNamesInDb.entries()) {
        if (arr.length > 1) {
            duplicates.push({ name: arr[0].name, records: arr });
        }
    }
    
    // Generate Report
    const outputPath = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath);
    }
    
    let reportTxt = `=== FINAL DATABASE CHECK ===\n`;
    reportTxt += `Total in DB: ${allDbStudents.length}\n`;
    reportTxt += `Total in Excel: ${excelTotalCount}\n\n`;
    
    reportTxt += `=== EXTRA STUDENTS IN DATABASE (NOT IN EXCEL) [${extraInDb.length}] ===\n`;
    extraInDb.forEach(st => {
        reportTxt += `Admn No: ${st.admissionNo} | Name: ${st.name} | Class: ${st.className} | Status: ${st.studentStatus} | Active: ${st.isActive}\n`;
    });
    
    reportTxt += `\n=== POSSIBLE REPEATED ENTRIES IN DATABASE (SAME NAME) [${duplicates.length}] ===\n`;
    duplicates.forEach(d => {
        reportTxt += `Name: ${d.name}\n`;
        d.records.forEach(st => {
            reportTxt += `  -> Admn No: ${st.admissionNo} | Class: ${st.className}\n`;
        });
        reportTxt += `\n`;
    });
    
    fs.writeFileSync(path.join(outputPath, 'final_check_report.txt'), reportTxt);
    
    console.log(`Extra students in DB (Not in Excel): ${extraInDb.length}`);
    console.log(`Possible repeated entries in DB: ${duplicates.length}`);
    
    mongoose.disconnect();
}

finalCheck().catch(err => {
    console.error(err);
    mongoose.disconnect();
});
