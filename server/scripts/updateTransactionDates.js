const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Expense = require('../models/Expense');
const OtherIncome = require('../models/OtherIncome');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${mongoose.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const updateDates = async () => {
    try {
        await connectDB();

        const targetDate = new Date('2026-04-02');
        console.log(`Target Date: ${targetDate.toDateString()}`);

        const expenseResult = await Expense.updateMany(
            {},
            { $set: { date: targetDate } }
        );
        console.log(`Expenses updated: ${expenseResult.modifiedCount} (matched: ${expenseResult.matchedCount})`);

        const incomeResult = await OtherIncome.updateMany(
            {},
            { $set: { date: targetDate } }
        );
        console.log(`Other Income updated: ${incomeResult.modifiedCount} (matched: ${incomeResult.matchedCount})`);

        console.log('Update complete.');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

updateDates();
