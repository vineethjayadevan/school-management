require('dotenv').config();
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const path = require('path');
const Student = require('./models/Student');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB...'))
  .catch(err => console.error('Could not connect to MongoDB...', err));

const excelPath = 'C:\\Users\\vinee\\Desktop\\AG Projects\\Stemgps_Data\\Mont1Rahi.xlsx';
const ACADEMIC_YEAR_ID = '699d642f3a2acf7048bdb4d3'; // 2026-2027

async function importStudents() {
  try {
    const workbook = xlsx.readFile(excelPath, { cellDates: true });
    // PROCESS ONLY SHEET2
    const sheetName = workbook.SheetNames[1]; // Index 1 is Sheet2
    const sheet = workbook.Sheets[sheetName];
    // Use range: 1 because the first row is a title row
    const data = xlsx.utils.sheet_to_json(sheet, { range: 1, defval: "" });

    console.log(`Found ${data.length} records in ${sheetName}. Starting import...`);

    let imported = 0;
    let errors = 0;

    for (const row of data) {
      const admissionNo = String(row['Admn No:'] || '').trim();
      const name = String(row['Name of the student'] || '').trim();
      
      if (!admissionNo || !name) {
        console.log(`Skipping row missing admissionNo or name.`);
        continue;
      }

      // Check if student already exists
      const existingStudent = await Student.findOne({ admissionNo });
      if (existingStudent) {
        console.log(`Student with admissionNo ${admissionNo} already exists. Skipping.`);
        continue;
      }

      let gender = String(row['Gender'] || '').trim();
      // Capitalize first letter to match enum ['Male', 'Female', 'Other', '']
      if (gender) {
          gender = gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
      }

      const fatherName = String(row["Father's Name"] || '').trim();
      const fatherContact = String(row['Contact no:'] || '').trim();
      const motherName = String(row["Mother's Name"] || '').trim();
      const motherContact = String(row['Contact No:'] || '').trim();

      const guardian = fatherName || motherName || 'Unknown';
      const primaryPhone = fatherContact || motherContact || '0000000000';

      let rawPickupPoint = String(row['Boarding Point'] || '').trim();
      let mode = 'Walking';
      let pickupPoint = '';

      if (rawPickupPoint.toLowerCase().includes('walk in')) {
         mode = 'Walking';
      } else if (rawPickupPoint) {
         mode = 'School Bus';
         pickupPoint = rawPickupPoint;
      }

      const studentDoc = {
        admissionNo: admissionNo,
        name: name,
        className: 'Mont 1',
        section: 'A',
        gender: ['Male', 'Female', 'Other'].includes(gender) ? gender : '',
        dob: row['DOB'] instanceof Date ? row['DOB'] : null,
        bloodGroup: String(row['Blood Group'] || '').trim().toUpperCase(),
        aadharNo: String(row['Adhar No:'] || '').trim(),
        religion: String(row['Religion '] || '').trim(),
        caste: String(row['Caste'] || '').trim(),
        address: String(row['Address'] || '').trim(),
        
        fatherName: fatherName,
        fatherOccupation: String(row['Occupation '] || '').trim(), // Father occupation has trailing space
        fatherMobile: fatherContact,
        
        motherName: motherName,
        motherOccupation: String(row['Occupation'] || '').trim(), // Mother doesn't
        motherMobile: motherContact,
        
        guardian: guardian,
        primaryPhone: primaryPhone,
        
        transportation: {
            mode: mode,
            pickupPoint: pickupPoint
        },
        
        emergencyContact: {
            phone: String(row['Emergency contact No'] || '').trim()
        },
        
        email: String(row['Email'] || '').trim(),
        
        // System defaults required by schema
        applicationNo: `APP-${admissionNo}`,
        submissionDate: new Date(),
        currentAcademicYear: ACADEMIC_YEAR_ID,
        studentStatus: 'Active',
        feesStatus: 'Pending',
        financialClearance: true
      };

      try {
        const student = new Student(studentDoc);
        await student.save();
        console.log(`Successfully imported student: ${name} (${admissionNo})`);
        imported++;
      } catch (err) {
        console.error(`Error saving student ${name} (${admissionNo}):`, err.message);
        errors++;
      }
    }

    console.log(`\nImport Summary:`);
    console.log(`Successfully Imported: ${imported}`);
    console.log(`Errors: ${errors}`);

  } catch (error) {
    console.error("Critical error during import:", error.message);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

importStudents();
