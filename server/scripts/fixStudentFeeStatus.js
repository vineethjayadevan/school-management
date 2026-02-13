const mongoose = require('mongoose');
const dotenv = require('dotenv');

const Student = require('../models/Student');
const Fee = require('../models/Fee');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err.message);
        process.exit(1);
    }
};

const fixStudentStatuses = async () => {
    try {
        await connectDB();

        console.log('Fetching all students...');
        const students = await Student.find({});
        console.log(`Found ${students.length} students. Checking fee statuses...`);

        let updatedCount = 0;

        for (const student of students) {
            const fees = await Fee.find({ student: student._id });

            let newStatus = 'Pending'; // Default if no fees

            if (fees.length > 0) {
                const totalDue = fees.reduce((sum, f) => sum + (f.amount || 0), 0);

                // Check if individual fee items are paid
                // NOTE: Fee model has 'status' enum ['Paid', 'Pending', 'Overdue']
                // Does it track partial payments per fee? The schema only has 'status' and 'paymentDate'.
                // If it's effectively one-off fees, we sum based on status.

                const paidFees = fees.filter(f => f.status === 'Paid');
                const totalPaidAmount = paidFees.reduce((sum, f) => sum + (f.amount || 0), 0);

                if (totalDue === 0) {
                    newStatus = 'Pending'; // or Paid? If 0 due, technically nothing to pay. But usually indicates no fee setup.
                } else if (totalPaidAmount >= totalDue) {
                    newStatus = 'Paid';
                } else if (totalPaidAmount > 0) {
                    newStatus = 'Partially Paid';
                } else {
                    // Check if any refer directly to overdue
                    const hasOverdue = fees.some(f => f.status === 'Overdue');
                    newStatus = hasOverdue ? 'Overdue' : 'Pending';
                }
            }

            if (student.feesStatus !== newStatus) {
                console.log(`Updating ${student.name} (${student.admissionNo}): ${student.feesStatus} -> ${newStatus} (Fees found: ${fees.length})`);
                await Student.updateOne({ _id: student._id }, { $set: { feesStatus: newStatus } });
                updatedCount++;
            }
        }

        console.log(`\nOperation Complete. Updated ${updatedCount} students.`);
        process.exit(0);

    } catch (error) {
        console.error('Error fixing statuses:', error);
        process.exit(1);
    }
};

fixStudentStatuses();
