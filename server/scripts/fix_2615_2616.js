require('dotenv').config();
const mongoose = require('mongoose');
const xlsx = require('xlsx');
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

const targetAdmissions = ['2615', '2616'];

async function fixStudents() {
    console.log("Connecting to Database...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected.");

    const workbook = xlsx.readFile(excelPath, { cellDates: true });
    const targetSheets = ['Mont 1', 'Mont 2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'];
    
    let updatedCount = 0;
    
    for (const sheetName of targetSheets) {
        if (!workbook.SheetNames.includes(sheetName)) continue;
        
        const sheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;
            
            const admissionNo = row[2] ? String(row[2]).trim() : '';
            if (!admissionNo || !targetAdmissions.includes(admissionNo)) continue;
            
            const dbStudent = await Student.findOne({ admissionNo: admissionNo });
            if (!dbStudent) continue;
            
            if (row[3]) dbStudent.name = String(row[3]).trim(); 
            if (row[1]) dbStudent.className = String(row[1]).trim();
            if (row[4]) {
                const rawG = String(row[4]).trim().toLowerCase();
                let finalG = '';
                if (rawG === 'male') finalG = 'Male';
                else if (rawG === 'female') finalG = 'Female';
                else if (rawG === 'other') finalG = 'Other';
                if (finalG) dbStudent.gender = finalG; 
            }
            if (row[5]) { const dob = parseExcelDate(row[5]); if (dob) dbStudent.dob = dob; }
            if (row[6]) dbStudent.bloodGroup = String(row[6]).trim();
            if (row[7]) dbStudent.aadharNo = String(row[7]).trim();
            if (row[8]) dbStudent.religion = String(row[8]).trim();
            if (row[9]) dbStudent.caste = String(row[9]).trim();
            if (row[10]) { 
                dbStudent.address = String(row[10]).trim(); 
                if (!dbStudent.residentialAddress) dbStudent.residentialAddress = {};
                dbStudent.residentialAddress.street = String(row[10]).trim();
            }
            if (row[11]) { 
                dbStudent.fatherName = String(row[11]).trim(); 
                dbStudent.guardian = String(row[11]).trim();
            }
            if (row[12]) dbStudent.fatherOccupation = String(row[12]).trim();
            if (row[13]) { 
                const phone = cleanPhone(row[13]);
                if (phone) {
                    dbStudent.fatherMobile = phone; 
                    dbStudent.primaryPhone = phone;
                }
            }
            if (row[14]) dbStudent.motherName = String(row[14]).trim();
            if (row[15]) dbStudent.motherOccupation = String(row[15]).trim();
            if (row[16]) { 
                const phone = cleanPhone(row[16]);
                if (phone) dbStudent.motherMobile = phone;
            }
            if (row[17]) { 
                if (!dbStudent.transportation) dbStudent.transportation = {};
                dbStudent.transportation.mode = 'School Bus';
                dbStudent.transportation.pickupPoint = String(row[17]).trim();
            }
            if (row[18]) { 
                const phone = cleanPhone(row[18]);
                if (phone) {
                    if (!dbStudent.emergencyContact) dbStudent.emergencyContact = {};
                    dbStudent.emergencyContact.phone = phone;
                }
            }
            if (row[19]) dbStudent.email = String(row[19]).trim();
            
            try {
                await dbStudent.save();
                console.log(`+ Fixed Student: ${dbStudent.name} (${admissionNo})`);
                updatedCount++;
            } catch (err) {
                console.error(`Error updating (${admissionNo}):`, err.message);
            }
        }
    }
    
    console.log(`\nSuccessfully fixed ${updatedCount} students.`);
    mongoose.disconnect();
}

fixStudents().catch(err => {
    console.error(err);
    mongoose.disconnect();
});
