require('dotenv').config();
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const path = require('path');
const Student = require('../models/Student');

const excelPath = "C:\\Users\\vinee\\Desktop\\AG Projects\\Stemgps_Data\\final Student List\\All Students details 2026-27.xlsx";

// Helper to format date
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

// Clean phone numbers
function cleanPhone(phone) {
    if (!phone) return null;
    const cleaned = String(phone).replace(/\D/g, '');
    return cleaned.length > 0 ? cleaned : null;
}

async function insertStudents() {
    console.log("Connecting to Database...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected.");

    const workbook = xlsx.readFile(excelPath, { cellDates: true });
    const targetSheets = ['Mont 1', 'Mont 2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4'];
    
    let addedCount = 0;
    
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
            
            // Check if already in DB
            const exists = await Student.findOne({ admissionNo: admissionNo });
            if (exists) {
                // Skip existing
                continue;
            }
            
            // It's a new student, construct document
            const name = row[3] ? String(row[3]).trim() : 'Unknown';
            const className = row[1] ? String(row[1]).trim() : 'Unknown';
            const rawGender = row[4] ? String(row[4]).trim() : '';
            const gender = ['Male', 'Female', 'Other'].includes(rawGender) ? rawGender : '';
            const dob = parseExcelDate(row[5]);
            const bloodGroup = row[6] ? String(row[6]).trim() : '';
            const aadharNo = row[7] ? String(row[7]).trim() : '';
            const religion = row[8] ? String(row[8]).trim() : '';
            const caste = row[9] ? String(row[9]).trim() : '';
            const address = row[10] ? String(row[10]).trim() : '';
            const fatherName = row[11] ? String(row[11]).trim() : '';
            const fatherOccupation = row[12] ? String(row[12]).trim() : '';
            const fatherMobile = cleanPhone(row[13]);
            const motherName = row[14] ? String(row[14]).trim() : '';
            const motherOccupation = row[15] ? String(row[15]).trim() : '';
            const motherMobile = cleanPhone(row[16]);
            const boardingPoint = row[17] ? String(row[17]).trim() : '';
            const emergencyContact = cleanPhone(row[18]);
            const email = row[19] ? String(row[19]).trim() : '';
            
            const guardian = fatherName || motherName || 'Not Provided';
            const primaryPhone = fatherMobile || motherMobile || emergencyContact || '0000000000';
            
            const newStudent = new Student({
                admissionNo: admissionNo,
                name: name,
                className: className,
                section: 'A', // Required field
                gender: gender,
                dob: dob,
                bloodGroup: bloodGroup,
                aadharNo: aadharNo,
                religion: religion,
                caste: caste,
                fatherName: fatherName,
                fatherOccupation: fatherOccupation,
                fatherMobile: fatherMobile,
                motherName: motherName,
                motherOccupation: motherOccupation,
                motherMobile: motherMobile,
                email: email,
                address: address, // legacy field
                residentialAddress: {
                    street: address
                },
                guardian: guardian,
                primaryPhone: primaryPhone,
                applicationNo: admissionNo, // Required field
                submissionDate: new Date(), // Required field
                transportation: {
                    mode: boardingPoint ? 'School Bus' : 'Walking',
                    pickupPoint: boardingPoint
                },
                emergencyContact: {
                    phone: emergencyContact
                }
            });
            
            try {
                await newStudent.save();
                console.log(`+ Added Student: ${name} (${admissionNo})`);
                addedCount++;
            } catch (err) {
                console.error(`Error adding ${name} (${admissionNo}):`, err.message);
            }
        }
    }
    
    console.log(`\nSuccessfully added ${addedCount} new students.`);
    mongoose.disconnect();
}

insertStudents().catch(err => {
    console.error(err);
    mongoose.disconnect();
});
