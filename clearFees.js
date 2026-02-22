const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Fee = require('./server/models/Fee');
const Student = require('./server/models/Student');

dotenv.config({ path: './server/.env' });

async function clearFees() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB.');

        const result = await Fee.deleteMany({});
        console.log(`Deleted ${result.deletedCount} fee records.`);

        const studentResult = await Student.updateMany({}, {
            feesStatus: 'Pending',
            lastConveyancePayment: null
        });
        console.log(`Reset fee status for ${studentResult.modifiedCount} students.`);

        process.exit(0);
    } catch (error) {
        console.error('Error clearing fees:', error);
        process.exit(1);
    }
}

clearFees();
