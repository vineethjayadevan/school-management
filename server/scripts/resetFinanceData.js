const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Expense = require('../models/Expense');
const OtherIncome = require('../models/OtherIncome');
const Fee = require('../models/Fee');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const resetData = async () => {
    try {
        await connectDB();
        console.log('Resetting financial data...');

        // Delete all Expenses
        const expenseResult = await Expense.deleteMany({});
        console.log(`Expenses deleted: ${expenseResult.deletedCount}`);

        // Delete all Other Income
        const incomeResult = await OtherIncome.deleteMany({});
        console.log(`Other Income deleted: ${incomeResult.deletedCount}`);

        // Delete all Fees (Resetting Fee Income)
        const feeResult = await Fee.deleteMany({});
        console.log(`Fee records deleted: ${feeResult.deletedCount}`);

        console.log('All financial data has been reset to zero.');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

resetData();
