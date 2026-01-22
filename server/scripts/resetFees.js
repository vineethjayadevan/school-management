const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Fee = require('../models/Fee');
const Student = require('../models/Student');

const path = require('path');
// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const resetFees = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        console.log('Deleting all Fee records...');
        const deleteResult = await Fee.deleteMany({});
        console.log(`Deleted ${deleteResult.deletedCount} fee records.`);

        console.log('Resetting feesStatus for all students...');
        const updateResult = await Student.updateMany({}, { feesStatus: 'Pending' });
        console.log(`Updated ${updateResult.modifiedCount} students to Pending status.`);

        console.log('Fee reset complete.');
    } catch (error) {
        console.error('Error resetting fees:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

resetFees();
