const mongoose = require('mongoose');
require('dotenv').config();
const Fee = require('./models/Fee.js');
const Student = require('./models/Student.js');

async function clear() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const f = await Fee.deleteMany({});
        const s = await Student.updateMany({}, { feesStatus: 'Pending', lastConveyancePayment: null });
        console.log(`Cleared ${f.deletedCount} fees and reset ${s.modifiedCount} students!`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
clear();
