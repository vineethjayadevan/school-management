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

function cleanPhone(phone) {
    if (!phone) return null;
    const cleaned = String(phone).replace(/\D/g, '');
    return cleaned.length > 0 ? cleaned : null;
}

function compareString(str1, str2) {
    const s1 = (str1 || '').toString().trim().toLowerCase();
    const s2 = (str2 || '').toString().trim().toLowerCase();
    return s1 === s2;
}

async function updateStudents() {
    console.log("Connecting to Database...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected.");

    const workbook = xlsx.readFile(excelPath, { cellDates: true });
    const targetSheets = ['Mont 1', 'Mont 2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'];
    
    let updatedCount = 0;
    let nameMismatches = [];
    
    for (const sheetName of targetSheets) {
        if (!workbook.SheetNames.includes(sheetName)) continue;
        
        console.log(`Processing sheet: ${sheetName}`);
        const sheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;
            
            const admissionNo = row[2] ? String(row[2]).trim() : '';
            if (!admissionNo) continue;
            
            const dbStudent = await Student.findOne({ admissionNo: admissionNo });
            if (!dbStudent) {
                // Not an existing student, skip (we already inserted these)
                continue;
            }
            
            const excelName = row[3] ? String(row[3]).trim() : '';
            
            // Check Name Mismatch
            if (!compareString(excelName, dbStudent.name)) {
                nameMismatches.push({
                    admissionNo,
                    excelName,
                    dbName: dbStudent.name
                });
                continue; // Do NOT update if name differs
            }
            
            // Name matches (or is very similar). Update other fields if present in Excel.
            let isModified = false;
            
            if (row[1]) { dbStudent.className = String(row[1]).trim(); isModified = true; }
            if (row[4]) {
                const rawG = String(row[4]).trim().toLowerCase();
                let finalG = '';
                if (rawG === 'male') finalG = 'Male';
                else if (rawG === 'female') finalG = 'Female';
                else if (rawG === 'other') finalG = 'Other';
                
                if (finalG) {
                    dbStudent.gender = finalG; 
                    isModified = true;
                }
            }
            if (row[5]) { const dob = parseExcelDate(row[5]); if (dob) { dbStudent.dob = dob; isModified = true; } }
            if (row[6]) { dbStudent.bloodGroup = String(row[6]).trim(); isModified = true; }
            if (row[7]) { dbStudent.aadharNo = String(row[7]).trim(); isModified = true; }
            if (row[8]) { dbStudent.religion = String(row[8]).trim(); isModified = true; }
            if (row[9]) { dbStudent.caste = String(row[9]).trim(); isModified = true; }
            if (row[10]) { 
                dbStudent.address = String(row[10]).trim(); 
                if (!dbStudent.residentialAddress) dbStudent.residentialAddress = {};
                dbStudent.residentialAddress.street = String(row[10]).trim();
                isModified = true;
            }
            if (row[11]) { 
                dbStudent.fatherName = String(row[11]).trim(); 
                dbStudent.guardian = String(row[11]).trim(); // keep guardian in sync
                isModified = true;
            }
            if (row[12]) { dbStudent.fatherOccupation = String(row[12]).trim(); isModified = true; }
            if (row[13]) { 
                const phone = cleanPhone(row[13]);
                if (phone) {
                    dbStudent.fatherMobile = phone; 
                    dbStudent.primaryPhone = phone;
                    isModified = true;
                }
            }
            if (row[14]) { dbStudent.motherName = String(row[14]).trim(); isModified = true; }
            if (row[15]) { dbStudent.motherOccupation = String(row[15]).trim(); isModified = true; }
            if (row[16]) { 
                const phone = cleanPhone(row[16]);
                if (phone) { dbStudent.motherMobile = phone; isModified = true; }
            }
            if (row[17]) { 
                if (!dbStudent.transportation) dbStudent.transportation = {};
                dbStudent.transportation.mode = 'School Bus';
                dbStudent.transportation.pickupPoint = String(row[17]).trim();
                isModified = true;
            }
            if (row[18]) { 
                const phone = cleanPhone(row[18]);
                if (phone) {
                    if (!dbStudent.emergencyContact) dbStudent.emergencyContact = {};
                    dbStudent.emergencyContact.phone = phone;
                    isModified = true;
                }
            }
            if (row[19]) { dbStudent.email = String(row[19]).trim(); isModified = true; }
            
            if (isModified) {
                try {
                    await dbStudent.save();
                    updatedCount++;
                } catch (err) {
                    console.error(`Error updating ${dbStudent.name} (${admissionNo}):`, err.message);
                }
            }
        }
    }
    
    const outputPath = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath);
    }
    
    let mismatchTxt = "=== STUDENTS WITH NAME MISMATCH (NOT UPDATED) ===\n\n";
    nameMismatches.forEach(m => {
        mismatchTxt += `Admn No: ${m.admissionNo}\n`;
        mismatchTxt += `Excel Name: ${m.excelName}\n`;
        mismatchTxt += `Database Name: ${m.dbName}\n\n`;
    });
    fs.writeFileSync(path.join(outputPath, 'name_mismatches_skipped.txt'), mismatchTxt);
    
    console.log(`\nSuccessfully updated ${updatedCount} existing students.`);
    console.log(`Skipped ${nameMismatches.length} students due to Name Mismatch.`);
    console.log(`List saved to server/data/name_mismatches_skipped.txt`);
    
    mongoose.disconnect();
}

updateStudents().catch(err => {
    console.error(err);
    mongoose.disconnect();
});
