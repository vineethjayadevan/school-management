const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');
const Expense = require('../models/Expense');
const connectDB = require('../config/db');

// Load env vars
dotenv.config({ path: './server/.env' });

const refreshExpenses = async () => {
    try {
        await connectDB();

        console.log('Clearing existing expenses...'.yellow);
        await Expense.deleteMany({});
        console.log('Expenses cleared.'.green);

        console.log('Running seeder...'.cyan);
        // We will run the other script via child process or just require logic if modular, 
        // but simplest is to just exit here and let the agent run the next command.
        // Actually, let's just use this script to CLEAR, then run seed script.

        process.exit();
    } catch (error) {
        console.error(`${error}`.red.inverse);
        process.exit(1);
    }
};

refreshExpenses();
