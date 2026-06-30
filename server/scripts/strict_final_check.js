require('dotenv').config();
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const Student = require('../models/Student');

const excelPath = "C:\\Users\\vinee\\Desktop\\AG Projects\\Stemgps_Data\\final Student List\\All Students details 2026-27.xlsx";

function parseExcelDate(serial) {
    if (!serial) return null;
    if (typeof serial !== 'number') {
        const d = new Date(serial);
        return isNaN(d.getTime()) ? null : d;
    }
    const utc_days  = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;                                        
    return new Date(utc_value * 1000);
}

function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
}

function compareString(str1, str2) {
    const s1 = (str1 || '').toString().trim().toLowerCase();
    const s2 = (str2 || '').toString().trim().toLowerCase();
    return s1 === s2;
}

function cleanPhone(phone) {
    if (!phone) return null;
    const cleaned = String(phone).replace(/\D/g, '');
    return cleaned.length > 0 ? cleaned : null;
}

async function strictCheck() {
    console.log("Connecting to Database...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected.");

    const workbook = xlsx.readFile(excelPath, { cellDates: true });
    const targetSheets = ['Mont 1', 'Mont 2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'];
    
    const excelAdmissions = new Set();
    let excelCount = 0;
    let discrepancies = 0;
    
    // 1. Verify all Excel students are perfectly matched in DB
    for (const sheetName of targetSheets) {
        if (!workbook.SheetNames.includes(sheetName)) continue;
        const sheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;
            
            const admissionNo = row[2] ? String(row[2]).trim() : '';
            if (!admissionNo) continue;
            
            excelAdmissions.add(admissionNo);
            excelCount++;
            
            const dbStudent = await Student.findOne({ admissionNo: admissionNo });
            if (!dbStudent) {
                console.log(`CRITICAL: Student ${admissionNo} is in Excel but NOT in DB!`);
                discrepancies++;
                continue;
            }
            
            // Check Name exactly
            const excelName = row[3] ? String(row[3]).trim() : '';
            if (!compareString(excelName, dbStudent.name)) {
                // If they are strictly different, but we purposely skipped them, log it.
                // Wait, the user said "rest u can replace the details" and we excluded 3 (2617... wait).
                // Actually the user ONLY excluded 2631, 2665, 2616 from force update?
                // Wait, no. We force updated 35 students. So their names should match perfectly now!
                // Let's just flag any that still don't match.
                console.log(`Mismatch Name for ${admissionNo}: Excel="${excelName}", DB="${dbStudent.name}"`);
                discrepancies++;
            }
        }
    }
    
    // 2. Find Additional in DB
    const allDbStudents = await Student.find({}, 'admissionNo name className studentStatus isActive');
    const extraInDb = [];
    
    const duplicateNamesInDb = new Map();
    let duplicates = [];
    
    for (const st of allDbStudents) {
        // Only count duplicates for Active students just in case
        if (st.isActive) {
            const lowerName = st.name.toLowerCase().trim();
            if (duplicateNamesInDb.has(lowerName)) {
                duplicateNamesInDb.get(lowerName).push(st);
            } else {
                duplicateNamesInDb.set(lowerName, [st]);
            }
        }
        
        if (!excelAdmissions.has(st.admissionNo)) {
            extraInDb.push(st);
        }
    }
    
    for (const [name, arr] of duplicateNamesInDb.entries()) {
        if (arr.length > 1) {
            duplicates.push({ name: arr[0].name, records: arr });
        }
    }
    
    // Write Report
    const outputPath = path.join(__dirname, '..', 'data');
    let reportTxt = `=== ADDITIONAL STUDENTS IN DATABASE ===\n`;
    reportTxt += `These ${extraInDb.length} students are in the DB but not in the Excel file.\n\n`;
    
    extraInDb.forEach(st => {
        reportTxt += `Admn No: ${st.admissionNo} | Name: ${st.name} | Class: ${st.className} | Status: ${st.studentStatus}\n`;
    });
    
    fs.writeFileSync(path.join(outputPath, 'final_additional_students.txt'), reportTxt);
    
    console.log(`\n=== STRICT CHECK SUMMARY ===`);
    console.log(`Total students in Excel: ${excelCount}`);
    console.log(`Total students in DB: ${allDbStudents.length}`);
    console.log(`Additional students in DB (Not in Excel): ${extraInDb.length}`);
    console.log(`Duplicate Names in DB: ${duplicates.length}`);
    if (duplicates.length > 0) {
        duplicates.forEach(d => {
            console.log(`  - Duplicate: ${d.name} (Admissions: ${d.records.map(r=>r.admissionNo).join(', ')})`);
        });
    }
    console.log(`Discrepancies found during sync validation: ${discrepancies}`);
    
    mongoose.disconnect();
}

strictCheck().catch(err => {
    console.error(err);
    mongoose.disconnect();
});
