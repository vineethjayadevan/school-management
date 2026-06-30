require('dotenv').config();
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const Student = require('../models/Student');

const excelPath = "C:\\Users\\vinee\\Desktop\\AG Projects\\Stemgps_Data\\final Student List\\All Students details 2026-27.xlsx";

// Helper to format date for comparison
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
}

// Convert Excel Serial Date to JS Date string (YYYY-MM-DD)
function excelDateToJSDateStr(serial) {
    if (!serial) return '';
    if (typeof serial !== 'number') {
        // Try parsing string date if not serial
        return formatDate(serial);
    }
    const utc_days  = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;                                        
    const date_info = new Date(utc_value * 1000);
    return formatDate(date_info);
}

// Helper for loose string comparison
function compareString(str1, str2) {
    const s1 = (str1 || '').toString().trim().toLowerCase();
    const s2 = (str2 || '').toString().trim().toLowerCase();
    return s1 === s2;
}

async function analyze() {
    console.log("Connecting to Database...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected.");

    console.log("Reading Excel File...");
    const workbook = xlsx.readFile(excelPath, { cellDates: true });
    
    const targetSheets = ['Mont 1', 'Mont 2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'];
    
    let newStudents = [];
    let mismatches = [];
    
    for (const sheetName of targetSheets) {
        if (!workbook.SheetNames.includes(sheetName)) {
            console.log(`Sheet ${sheetName} not found, skipping.`);
            continue;
        }
        
        console.log(`Processing sheet: ${sheetName}`);
        const sheet = workbook.Sheets[sheetName];
        // header: 1 gives us an array of arrays
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        
        // Skip header row
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;
            
            const admissionNo = row[2] ? String(row[2]).trim() : '';
            if (!admissionNo) continue; // Skip if no admission number
            
            const className = row[1] ? String(row[1]).trim() : '';
            const name = row[3] ? String(row[3]).trim() : '';
            const gender = row[4] ? String(row[4]).trim() : '';
            const dobExcel = row[5];
            const bloodGroup = row[6] ? String(row[6]).trim() : '';
            const aadharNo = row[7] ? String(row[7]).trim() : '';
            const religion = row[8] ? String(row[8]).trim() : '';
            const caste = row[9] ? String(row[9]).trim() : '';
            const address = row[10] ? String(row[10]).trim() : '';
            const fatherName = row[11] ? String(row[11]).trim() : '';
            const fatherMobile = row[13] ? String(row[13]).trim() : '';
            
            // Find student in DB
            const dbStudent = await Student.findOne({ admissionNo: admissionNo });
            
            if (!dbStudent) {
                newStudents.push({
                    admissionNo,
                    name,
                    className
                });
            } else {
                let fieldMismatches = [];
                
                if (!compareString(name, dbStudent.name)) fieldMismatches.push(`Name: Excel="${name}", DB="${dbStudent.name}"`);
                if (!compareString(className, dbStudent.className)) fieldMismatches.push(`Class: Excel="${className}", DB="${dbStudent.className}"`);
                if (!compareString(gender, dbStudent.gender)) fieldMismatches.push(`Gender: Excel="${gender}", DB="${dbStudent.gender}"`);
                
                // DOB compare
                const excelDobStr = excelDateToJSDateStr(dobExcel);
                const dbDobStr = formatDate(dbStudent.dob);
                if (excelDobStr && dbDobStr && excelDobStr !== dbDobStr) {
                    fieldMismatches.push(`DOB: Excel="${excelDobStr}", DB="${dbDobStr}"`);
                }
                
                if (bloodGroup && !compareString(bloodGroup, dbStudent.bloodGroup)) fieldMismatches.push(`Blood Group: Excel="${bloodGroup}", DB="${dbStudent.bloodGroup}"`);
                if (aadharNo && !compareString(aadharNo, dbStudent.aadharNo)) fieldMismatches.push(`Aadhar: Excel="${aadharNo}", DB="${dbStudent.aadharNo}"`);
                if (religion && !compareString(religion, dbStudent.religion)) fieldMismatches.push(`Religion: Excel="${religion}", DB="${dbStudent.religion}"`);
                if (caste && !compareString(caste, dbStudent.caste)) fieldMismatches.push(`Caste: Excel="${caste}", DB="${dbStudent.caste}"`);
                
                if (fatherName && !compareString(fatherName, dbStudent.fatherName)) fieldMismatches.push(`Father Name: Excel="${fatherName}", DB="${dbStudent.fatherName}"`);
                if (fatherMobile && !compareString(fatherMobile, dbStudent.fatherMobile) && !compareString(fatherMobile, dbStudent.primaryPhone)) {
                     fieldMismatches.push(`Father Mobile: Excel="${fatherMobile}", DB_Mobile="${dbStudent.fatherMobile}", DB_Primary="${dbStudent.primaryPhone}"`);
                }
                
                if (fieldMismatches.length > 0) {
                    mismatches.push({
                        admissionNo,
                        name,
                        mismatches: fieldMismatches
                    });
                }
            }
        }
    }
    
    // Generate Reports
    const outputPath = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath);
    }
    
    // Missing students report
    let missingTxt = "=== NEW STUDENTS TO ADD ===\n\n";
    newStudents.forEach(s => {
        missingTxt += `Admn No: ${s.admissionNo} | Name: ${s.name} | Class: ${s.className}\n`;
    });
    fs.writeFileSync(path.join(outputPath, 'new_students_report.txt'), missingTxt);
    
    // Mismatch report
    let mismatchTxt = "=== EXISTING STUDENTS MISMATCHES ===\n\n";
    mismatches.forEach(m => {
        mismatchTxt += `Admn No: ${m.admissionNo} | Name: ${m.name}\n`;
        m.mismatches.forEach(issue => {
            mismatchTxt += `  -> ${issue}\n`;
        });
        mismatchTxt += `\n`;
    });
    fs.writeFileSync(path.join(outputPath, 'mismatches_report.txt'), mismatchTxt);
    
    console.log(`\nAnalysis Complete!`);
    console.log(`New Students Found: ${newStudents.length}`);
    console.log(`Existing Students with Mismatches: ${mismatches.length}`);
    console.log(`Reports saved to server/data/`);
    
    mongoose.disconnect();
}

analyze().catch(err => {
    console.error(err);
    mongoose.disconnect();
});
