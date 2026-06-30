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

async function fixSwappedStudents() {
    console.log("Connecting to Database...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected.");
    
    // 1. Delete the bad records
    const allStudents = await Student.find({}, 'admissionNo name');
    let deletedCount = 0;
    
    for (const st of allStudents) {
        const isNameNumber = /^\d+$/.test(st.name.trim());
        const isAdmnString = /^[a-zA-Z\s\.]+$/.test(st.admissionNo.trim());
        
        if (isNameNumber || isAdmnString || st.admissionNo === st.name) {
            await Student.deleteOne({ _id: st._id });
            console.log(`Deleted messy record: ${st.admissionNo} (Name: ${st.name})`);
            deletedCount++;
        }
    }
    console.log(`\nDeleted ${deletedCount} messy records.\n`);

    // 2. Read Excel and update the correct records
    const workbook = xlsx.readFile(excelPath, { cellDates: true });
    const sheetName = 'Grade 2'; // All were in Grade 2
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    let updatedCount = 0;
    
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        
        let col2 = row[2] ? String(row[2]).trim() : '';
        let col3 = row[3] ? String(row[3]).trim() : '';
        
        if (!col2 && !col3) continue;
        
        let admissionNo = col2;
        let name = col3;
        
        // If col3 is just digits, they are swapped!
        if (/^\d+$/.test(col3)) {
            admissionNo = col3;
            name = col2;
        }
        
        // If col2 is just digits, they are normal!
        if (!admissionNo || /^[a-zA-Z\s\.]+$/.test(admissionNo)) continue; // skip if still invalid
        
        const dbStudent = await Student.findOne({ admissionNo: admissionNo });
        if (!dbStudent) {
            // It might be a genuinely new student that we need to add back properly
            console.log(`Need to add missing correct student: ${name} (${admissionNo})`);
            
            const rawG = row[4] ? String(row[4]).trim().toLowerCase() : '';
            let finalG = '';
            if (rawG === 'male') finalG = 'Male';
            else if (rawG === 'female') finalG = 'Female';
            else if (rawG === 'other') finalG = 'Other';
            
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
                className: 'Grade 2',
                section: 'A',
                gender: finalG,
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
                address: address,
                residentialAddress: { street: address },
                guardian: guardian,
                primaryPhone: primaryPhone,
                applicationNo: admissionNo,
                submissionDate: new Date(),
                transportation: {
                    mode: boardingPoint ? 'School Bus' : 'Walking',
                    pickupPoint: boardingPoint
                },
                emergencyContact: { phone: emergencyContact }
            });
            
            try {
                await newStudent.save();
                console.log(`+ Added Cleaned Student: ${name} (${admissionNo})`);
                updatedCount++;
            } catch(e) {
                console.error(`Error adding ${admissionNo}:`, e.message);
            }
            continue;
        }
        
        // Update existing correct student
        dbStudent.name = name;
        dbStudent.className = 'Grade 2';
        
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
            console.log(`+ Updated Corrected Student: ${dbStudent.name} (${admissionNo})`);
            updatedCount++;
        } catch (err) {
            console.error(`Error updating (${admissionNo}):`, err.message);
        }
    }
    
    console.log(`\nSuccessfully processed ${updatedCount} students.`);
    mongoose.disconnect();
}

fixSwappedStudents().catch(err => {
    console.error(err);
    mongoose.disconnect();
});
