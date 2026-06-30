require('dotenv').config();
const mongoose = require('mongoose');
const xlsx = require('xlsx');

const excelPath = 'C:\\Users\\vinee\\Desktop\\AG Projects\\Stemgps_Data\\mont 2 new copy copy.xlsx';
const ACADEMIC_YEAR_ID = '699d642f3a2acf7048bdb4d3'; // Assuming 2026-2027 based on import_mont1.js

async function runImport() {
  try {
    const Student = require('../models/Student');
    const workbook = xlsx.readFile(excelPath, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    console.log(`Found ${data.length} records in ${sheetName}. Starting import & update...`);

    let imported = 0;
    let updated = 0;
    let errors = 0;

    for (const row of data) {
      const admissionNo = String(row['Admn.no'] || '').trim();
      const rawName = String(row['Name of the student'] || '').trim();
      
      // Let's capitalize the name appropriately or just keep it uppercase as in Excel, but trimming is good.
      const name = rawName;

      if (!admissionNo || !name) {
        console.log(`Skipping row missing admissionNo or name.`);
        continue;
      }

      let gender = String(row['Gender '] || '').trim();
      if (gender) {
          gender = gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
      }

      const fatherName = String(row["Father Name "] || '').trim();
      const fatherContact = String(row['Contact no'] || '').trim();
      const fatherOccupation = String(row['Occupation '] || '').trim();

      const motherName = String(row["Mother name "] || '').trim();
      const motherContact = String(row['Contact no_1'] || '').trim();
      const motherOccupation = String(row['Occupation _1'] || '').trim();

      const guardian = fatherName || motherName || 'Unknown';
      const primaryPhone = fatherContact || motherContact || '0000000000';

      let rawPickupPoint = String(row['Boarding point '] || '').trim();
      let mode = 'Walking';
      let pickupPoint = '';

      if (rawPickupPoint.toLowerCase().includes('walk in') || rawPickupPoint.toLowerCase() === 'nil' || rawPickupPoint.toLowerCase() === 'na') {
         mode = 'Walking';
      } else if (rawPickupPoint) {
         mode = 'School Bus';
         pickupPoint = rawPickupPoint;
      }

      const updateData = {
        name: name,
        className: 'Mont 2',
        section: 'A',
        gender: ['Male', 'Female', 'Other'].includes(gender) ? gender : '',
        dob: row['DOB'] instanceof Date ? row['DOB'] : null,
        bloodGroup: String(row['Blood group '] || '').trim().toUpperCase(),
        aadharNo: String(row['Adhar no'] || '').trim(),
        religion: String(row['Religion '] || '').trim(),
        caste: String(row['Caste'] || '').trim(),
        address: String(row['Address '] || '').trim(),
        
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
            phone: String(row['Emergency no'] || '').trim()
        },
        
        email: String(row['E-Mail '] || '').trim(),
      };

      try {
        const existingStudent = await Student.findOne({ admissionNo });

        if (existingStudent) {
          // Update existing
          Object.assign(existingStudent, updateData);
          // Preserve existing student status, financial clearance etc., if needed, Object.assign handles it well for scalar fields.
          // For nested fields like transportation or emergencyContact, it overwrites the top level keys.
          await existingStudent.save();
          console.log(`Successfully updated student: ${name} (${admissionNo})`);
          updated++;
        } else {
          // Create new
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
          console.log(`Successfully imported new student: ${name} (${admissionNo})`);
          imported++;
        }
      } catch (err) {
        console.error(`Error saving/updating student ${name} (${admissionNo}):`, err.message);
        errors++;
      }
    }

    console.log(`\nImport Summary:`);
    console.log(`Successfully Imported New: ${imported}`);
    console.log(`Successfully Updated Existing: ${updated}`);
    console.log(`Errors: ${errors}`);

  } catch (error) {
    console.error("Critical error during import:", error.message);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB...');
    runImport();
  })
  .catch(err => console.error('Could not connect to MongoDB...', err));
