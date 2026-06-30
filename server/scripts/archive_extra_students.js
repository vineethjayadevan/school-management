require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');

const extraAdmissions = [
    '2505', '2516', '2501', '2542', '2551', 
    '2550', '2513', '2540', '2545', '2566', 
    '2534', '2554', '2553', '2546'
];

async function archiveStudents() {
    console.log("Connecting to Database...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected.");
    
    let archivedCount = 0;
    
    for (const admissionNo of extraAdmissions) {
        const student = await Student.findOne({ admissionNo: admissionNo });
        if (student) {
            student.isActive = false;
            student.studentStatus = 'Transferred';
            await student.save();
            console.log(`Archived: ${student.name} (${admissionNo})`);
            archivedCount++;
        }
    }
    
    console.log(`\nSuccessfully archived ${archivedCount} students.`);
    mongoose.disconnect();
}

archiveStudents().catch(err => {
    console.error(err);
    mongoose.disconnect();
});
