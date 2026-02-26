const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Student = require('../models/Student');
const AcademicYear = require('../models/AcademicYear');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const year = await AcademicYear.findOne({ name: '2024-2025' });
    const students = await Student.find({ admissionNo: { $regex: /^TEST-ADM-G2-/i } });
    for (const s of students) {
        s.className = 'Grade 2';
        s.section = 'A';
        s.promotionStatus = 'Active';
        s.currentAcademicYear = year._id;
        if (!s.previousClass || s.previousClass === '') s.previousClass = undefined;
        await s.save();
        console.log(`Moved: ${s.name} (${s.admissionNo}) → Grade 2`);
    }
    console.log(`\nDone! ${students.length} students moved to Grade 2.`);
    process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
