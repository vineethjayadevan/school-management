const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Student = require('../models/Student');
const Fee = require('../models/Fee');

dotenv.config({ path: path.join(__dirname, '../.env') });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const feeResult = await Fee.deleteMany({});
        console.log(`Fee records deleted: ${feeResult.deletedCount}`);

        const studentResult = await Student.deleteMany({});
        console.log(`Student records deleted: ${studentResult.deletedCount}`);

        console.log('Done. Database is now clean for fresh data entry.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

run();
