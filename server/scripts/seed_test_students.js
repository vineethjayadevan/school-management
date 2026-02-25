const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Student = require('../models/Student');
const AcademicYear = require('../models/AcademicYear');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const seedTestStudents = async () => {
    await connectDB();

    try {
        const activeYear = await AcademicYear.findOne({ isActive: true });
        if (!activeYear) {
            console.error('No active academic year found.');
            process.exit(1);
        }

        const templateStudent = await Student.findOne();
        if (!templateStudent) {
            console.error('No students found to use as template.');
            process.exit(1);
        }

        console.log(`Using student ${templateStudent.name} (ADM: ${templateStudent.admissionNo}) as template.`);

        // Delete existing students in Grade 1 and Grade 2
        await Student.deleteMany({ className: { $in: ['Grade 1', 'Grade 2'] } });
        console.log('Cleared existing students in Grade 1 and Grade 2.');

        const studentsToCreate = [];
        const timestamp = Date.now();

        // Create 5 students for Grade 1
        for (let i = 1; i <= 5; i++) {
            const studentData = templateStudent.toObject();
            delete studentData._id;
            delete studentData.id;
            delete studentData.createdAt;
            delete studentData.updatedAt;
            delete studentData.tcDetails;
            delete studentData.academicHistory;

            studentData.name = `Test Student G1-${i}`;
            studentData.admissionNo = `TEST-ADM-G1-${timestamp}-${i}`;
            studentData.applicationNo = `APP-G1-${timestamp}${i}`;
            studentData.className = 'Grade 1';
            studentData.section = 'A';
            studentData.rollNo = `${i}`;
            studentData.studentStatus = 'Active';
            studentData.isActive = true;
            studentData.currentAcademicYear = activeYear._id;

            studentsToCreate.push(studentData);
        }

        // Create 5 students for Grade 2
        for (let i = 1; i <= 5; i++) {
            const studentData = templateStudent.toObject();
            delete studentData._id;
            delete studentData.id;
            delete studentData.createdAt;
            delete studentData.updatedAt;
            delete studentData.tcDetails;
            delete studentData.academicHistory;

            studentData.name = `Test Student G2-${i}`;
            studentData.admissionNo = `TEST-ADM-G2-${timestamp}-${i}`;
            studentData.applicationNo = `APP-G2-${timestamp}${i}`;
            studentData.className = 'Grade 2';
            studentData.section = 'A';
            studentData.rollNo = `${i}`;
            studentData.studentStatus = 'Active';
            studentData.isActive = true;
            studentData.currentAcademicYear = activeYear._id;

            studentsToCreate.push(studentData);
        }

        const result = await Student.insertMany(studentsToCreate);
        console.log(`Successfully created ${result.length} test students (5 in Grade 1, 5 in Grade 2).`);

        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedTestStudents();
