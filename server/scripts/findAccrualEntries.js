const mongoose = require('mongoose');
const AccrualRevenue = require('../models/AccrualRevenue');
const AccrualExpense = require('../models/AccrualExpense');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const findAccrualEntries = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Search patterns based on previous deletions
        const revenuePattern = /Balakrishnan/i;
        const expensePattern = /Staff salary/i;

        // 1. Find AccrualRevenue
        const revenues = await AccrualRevenue.find({
            $or: [
                { customer: revenuePattern },
                { description: revenuePattern }
            ]
        });

        console.log(`Found ${revenues.length} matching AccrualRevenue entries:`);
        revenues.forEach(r => console.log(`- ID: ${r._id}, Customer: ${r.customer}, Amount: ${r.amount}, Date: ${r.date}`));

        // 2. Find AccrualExpense
        const expenses = await AccrualExpense.find({
            $or: [
                { vendor: expensePattern },
                { description: expensePattern }
            ]
        });

        console.log(`Found ${expenses.length} matching AccrualExpense entries:`);
        expenses.forEach(e => console.log(`- ID: ${e._id}, Vendor: ${e.vendor}, Amount: ${e.amount}, Date: ${e.date}`));

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

findAccrualEntries();
