const mongoose = require('mongoose');
const AccrualExpense = require('../models/AccrualExpense');
const Payable = require('../models/Payable');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const fixVendor = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const badVendor = '2 X 3500';
        const correctVendor = 'Sajid';

        const result1 = await AccrualExpense.updateMany(
            { vendor: badVendor },
            { $set: { vendor: correctVendor } }
        );
        console.log(`Updated ${result1.modifiedCount} AccrualExpense(s).`);

        const result2 = await Payable.updateMany(
            { vendor: badVendor },
            { $set: { vendor: correctVendor } }
        );
        console.log(`Updated ${result2.modifiedCount} Payable(s).`);

        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

fixVendor();
