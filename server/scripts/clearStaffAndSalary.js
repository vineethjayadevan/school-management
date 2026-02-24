const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Staff = require('../models/Staff');
const Salary = require('../models/Salary');

dotenv.config({ path: path.join(__dirname, '../.env') });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const salaryResult = await Salary.deleteMany({});
        console.log(`Salary records deleted: ${salaryResult.deletedCount}`);

        const staffResult = await Staff.deleteMany({});
        console.log(`Staff records deleted: ${staffResult.deletedCount}`);

        console.log('Done. All staff and salary data cleared.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

run();
