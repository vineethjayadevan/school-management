const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');
const Expense = require('../models/Expense');
const OtherIncome = require('../models/OtherIncome');
const Fee = require('../models/Fee');
const connectDB = require('../config/db');

// Load env vars
dotenv.config({ path: './server/.env' });

const clearFinancialData = async () => {
    try {
        await connectDB();

        console.log('Clearing ALL Financial Data (including Student Fees)...'.yellow);

        // Delete Expenses
        const expenseResult = await Expense.deleteMany({});
        console.log(`Deleted ${expenseResult.deletedCount} Expense records.`.red);

        // Delete Other Income
        const incomeResult = await OtherIncome.deleteMany({});
        console.log(`Deleted ${incomeResult.deletedCount} Other Income records.`.red);

        // Delete Fees
        const feeResult = await Fee.deleteMany({});
        console.log(`Deleted ${feeResult.deletedCount} Student Fee transaction records.`.red);

        console.log('NOTE: Student Profiles (names, classes, etc.) were NOT touched.'.green);

        console.log('All Financial Data Cleared Successfully!'.green.inverse);
        process.exit();
    } catch (error) {
        console.error(`${error}`.red.inverse);
        process.exit(1);
    }
};

clearFinancialData();
