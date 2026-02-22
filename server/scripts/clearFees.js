const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });
const connectDB = require('../config/db');
const Fee = require('../models/Fee');
const Student = require('../models/Student');

connectDB().then(async () => {
    try {
        console.log('Connected to DB. Deleting fees...');
        const result = await Fee.deleteMany({});
        console.log('Deleted ' + result.deletedCount + ' fee records.');

        // Also reset student feesStatus just to be entirely safe
        const students = await Student.updateMany({}, { $set: { feesStatus: 'Pending' } });
        console.log('Reset ' + students.modifiedCount + ' students fee status to Pending.');

        process.exit(0);
    } catch (e) {
        console.error('Failure:', e);
        process.exit(1);
    }
});
