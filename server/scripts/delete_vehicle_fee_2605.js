const mongoose = require('mongoose');
const Fee = require('../models/Fee');
const Student = require('../models/Student');

const MONGODB_URI = 'mongodb+srv://vineethjay1998_db_user:vineeth_school_management@cluster0.k6cxmia.mongodb.net/school_management?appName=Cluster0';

async function deleteFees() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const student = await Student.findOne({ admissionNo: '2605' });
        if (!student) {
            console.log('Student not found');
            return;
        }

        const res = await Fee.deleteMany({ student: student._id, feeType: { $regex: '^Vehicle Fee', $options: 'i' } });
        console.log('Deleted fees:', res.deletedCount);

        student.paidVehicleMonths = [];
        await student.save();
        console.log('Cleared paidVehicleMonths for student 2605');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

deleteFees();
