/**
 * resetTestStudents.js
 * 1. Unlocks the currently active (or most recent) academic year
 * 2. Resets ALL test students (TEST-ADM-*) to Grade 1 for clean testing
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Student = require('../models/Student');
const AcademicYear = require('../models/AcademicYear');

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // 1. Find 2024-2025 year (by name or active status)
    let year = await AcademicYear.findOne({ name: '2024-2025' });
    if (!year) year = await AcademicYear.findOne({ isActive: true });
    if (!year) year = await AcademicYear.findOne().sort({ createdAt: -1 });

    if (!year) {
        console.error('❌ No academic years found in DB.');
        process.exit(1);
    }

    // 2. Unlock and activate the year
    const wasLocked = year.isLocked;
    year.isLocked = false;
    year.status = 'Active';
    year.isActive = true;
    await year.save();
    console.log(`🔓 Academic year "${year.name}" → ${wasLocked ? 'UNLOCKED & ' : ''}set to Active\n`);

    // 3. Find ALL test students by pattern TEST-ADM-
    const testStudents = await Student.find({
        admissionNo: { $regex: /^TEST-ADM-/i }
    });

    if (testStudents.length === 0) {
        console.log('⚠️  No test students found with pattern TEST-ADM-*');
        process.exit(0);
    }

    console.log(`🔍 Found ${testStudents.length} test student(s):`);
    testStudents.forEach(s => console.log(`   - ${s.name} (${s.admissionNo}) | Class: ${s.className} | Status: ${s.promotionStatus}`));

    // 4. Reset each student to Grade 1
    let updated = 0;
    for (const student of testStudents) {
        student.className = 'Grade 1';
        student.section = 'A';
        student.promotionStatus = 'Active';
        student.studentStatus = 'Active';
        student.isActive = true;
        student.currentAcademicYear = year._id;
        student.academicHistory = [];
        student.rollNo = '';

        if (!student.previousClass || student.previousClass === '') {
            student.previousClass = undefined;
        }

        await student.save();
        updated++;
        console.log(`   ✔ ${student.name} → Grade 1 | AY: ${year.name}`);
    }

    console.log(`\n✅ Done! ${updated} student(s) reset to Grade 1 under "${year.name}".`);
    console.log('   You can now run the Promotion Wizard cleanly.\n');
    process.exit(0);
};

run().catch(err => {
    console.error('❌ Script failed:', err.message);
    process.exit(1);
});
