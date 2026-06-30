require('dotenv').config();
const mongoose = require('mongoose');
const xlsx = require('xlsx');

const ACADEMIC_YEAR_ID = '699d642f3a2acf7048bdb4d3'; // 2026-2027

const filesToProcess = [
  'C:\\Users\\vinee\\Downloads\\Mont-1 mubi (1).xlsx',
  'C:\\Users\\vinee\\Downloads\\Mon-1 Students (NUSAIBA ).xlsx'
];

async function runImport() {
  try {
    const Student = require('../models/Student');
    
    let totalImported = 0;
    let totalUpdated = 0;
    let totalErrors = 0;

    for (const file of filesToProcess) {
      console.log(`\n=== Processing File: ${file} ===`);
      const workbook = xlsx.readFile(file, { cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      // Using header: 1 to get array of arrays, avoiding unicode header key problems
      const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });

      let imported = 0;
      let updated = 0;
      let errors = 0;

      // Skip row 0 (headers)
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        
        // Skip empty rows
        if (row.length === 0 || (!row[1] && !row[2])) {
          continue;
        }

        const admissionNo = String(row[1] || '').trim();
        const name = String(row[2] || '').trim();

        if (!admissionNo || !name) {
          console.log(`Skipping row ${i + 1} missing admissionNo or name.`);
          continue;
        }

        let gender = String(row[3] || '').trim();
        if (gender) {
            gender = gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
        }

        const dobVal = row[4];
        let dob = null;
        if (dobVal instanceof Date) {
          dob = dobVal;
        } else if (typeof dobVal === 'string' && dobVal.trim() !== '') {
          // Attempt basic parse if it's a string date
          const parsed = new Date(dobVal);
          if (!isNaN(parsed)) dob = parsed;
        }

        const bloodGroup = String(row[5] || '').trim().toUpperCase();
        const aadharNo = String(row[6] || '').trim();
        const religion = String(row[7] || '').trim();
        const caste = String(row[8] || '').trim();
        const address = String(row[9] || '').trim();
        
        const fatherName = String(row[10] || '').trim();
        const fatherOccupation = String(row[11] || '').trim();
        const fatherContact = String(row[12] || '').trim();
        
        const motherName = String(row[13] || '').trim();
        const motherOccupation = String(row[14] || '').trim();
        const motherContact = String(row[15] || '').trim();

        const guardian = fatherName || motherName || 'Unknown';
        const primaryPhone = fatherContact || motherContact || '0000000000';

        let rawPickupPoint = String(row[16] || '').trim();
        let mode = 'Walking';
        let pickupPoint = '';

        if (rawPickupPoint.toLowerCase().includes('walk in') || rawPickupPoint.toLowerCase() === 'nil' || rawPickupPoint.toLowerCase() === 'na') {
           mode = 'Walking';
        } else if (rawPickupPoint) {
           mode = 'School Bus';
           pickupPoint = rawPickupPoint;
        }

        const emergencyPhone = String(row[17] || '').trim();
        const email = String(row[18] || '').trim();

        const updateData = {
          name: name,
          className: 'Mont 1',
          section: 'A',
          gender: ['Male', 'Female', 'Other'].includes(gender) ? gender : '',
          dob: dob,
          bloodGroup: bloodGroup,
          aadharNo: aadharNo,
          religion: religion,
          caste: caste,
          address: address,
          
          fatherName: fatherName,
          fatherOccupation: fatherOccupation,
          fatherMobile: fatherContact,
          
          motherName: motherName,
          motherOccupation: motherOccupation,
          motherMobile: motherContact,
          
          guardian: guardian,
          primaryPhone: primaryPhone,
          
          transportation: {
              mode: mode,
              pickupPoint: pickupPoint
          },
          
          emergencyContact: {
              phone: emergencyPhone
          },
          
          email: email,
        };

        try {
          const existingStudent = await Student.findOne({ admissionNo });

          if (existingStudent) {
            Object.assign(existingStudent, updateData);
            await existingStudent.save();
            console.log(`Updated student: ${name} (${admissionNo})`);
            updated++;
          } else {
            const studentDoc = {
              admissionNo: admissionNo,
              ...updateData,
              applicationNo: `APP-${admissionNo}`,
              submissionDate: new Date(),
              currentAcademicYear: ACADEMIC_YEAR_ID,
              studentStatus: 'Active',
              feesStatus: 'Pending',
              financialClearance: true
            };
            const student = new Student(studentDoc);
            await student.save();
            console.log(`Imported NEW student: ${name} (${admissionNo})`);
            imported++;
          }
        } catch (err) {
          console.error(`Error saving/updating student ${name} (${admissionNo}):`, err.message);
          errors++;
        }
      }

      console.log(`File Summary: Imported ${imported}, Updated ${updated}, Errors ${errors}`);
      totalImported += imported;
      totalUpdated += updated;
      totalErrors += errors;
    }

    console.log(`\n=== OVERALL IMPORT SUMMARY ===`);
    console.log(`Successfully Imported New: ${totalImported}`);
    console.log(`Successfully Updated Existing: ${totalUpdated}`);
    console.log(`Total Errors: ${totalErrors}`);

  } catch (error) {
    console.error("Critical error during import:", error.message);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB...');
    runImport();
  })
  .catch(err => console.error('Could not connect to MongoDB...', err));
