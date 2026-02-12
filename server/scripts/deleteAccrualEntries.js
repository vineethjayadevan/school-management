const mongoose = require('mongoose');
const AccrualRevenue = require('../models/AccrualRevenue');
const AccrualExpense = require('../models/AccrualExpense');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const deleteAccrualEntries = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Search patterns
        const revenuePattern = /Balakrishnan/i;
        const expensePattern = /Staff salary/i;

        // 1. Delete AccrualRevenue
        const revResult = await AccrualRevenue.deleteMany({
            $or: [
                { customer: revenuePattern },
                { description: revenuePattern }
            ]
        });
        console.log(`Deleted ${revResult.deletedCount} AccrualRevenue records.`);

        // 2. Delete AccrualExpense
        const expResult = await AccrualExpense.deleteMany({
            $or: [
                { vendor: expensePattern },
                { description: expensePattern }
            ]
        });
        console.log(`Deleted ${expResult.deletedCount} AccrualExpense records.`);

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

deleteAccrualEntries();
