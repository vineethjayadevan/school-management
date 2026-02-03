const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Expense = require('../models/Expense');
const OtherIncome = require('../models/OtherIncome');
const IncomeCategory = require('../models/IncomeCategory');
const ExpenseCategory = require('../models/ExpenseCategory');

const EXTRACT_FILE = path.join(__dirname, '../data/finance_backup.json');

const extractData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to Source DB...');

        console.log('Extracting Categories...');
        const incomeCategories = await IncomeCategory.find({});
        const expenseCategories = await ExpenseCategory.find({});

        console.log('Extracting Financial Records...');
        const income = await OtherIncome.find({});
        const expenses = await Expense.find({});

        // Identify all unique user IDs referenced in these records
        const userIds = new Set();

        income.forEach(doc => {
            if (doc.addedBy) userIds.add(doc.addedBy.toString());
        });
        expenses.forEach(doc => {
            if (doc.addedBy) userIds.add(doc.addedBy.toString());
        });

        // Also include all Board Members and Admins to be safe
        const keyUsers = await User.find({
            role: { $in: ['superuser', 'admin', 'board_member'] }
        });
        keyUsers.forEach(u => userIds.add(u._id.toString()));

        console.log('Extracting Users...');
        // Fetch users, explicitly excluding students if they somehow got in (though unlikley for finance)
        const users = await User.find({
            _id: { $in: Array.from(userIds) },
            role: { $ne: 'student' } // Double safety: NO students
        }).select('-password'); // We won't export passwords hash if possible, but for restore we might need them or set default. 
        // Actually, for full migration allowing login, we need passwords. 
        // If we want to keep same credentials, we MUST include password field.
        // Re-fetching WITH password
        const usersWithAuth = await User.find({
            _id: { $in: Array.from(userIds) },
            role: { $ne: 'student' }
        });

        const data = {
            timestamp: new Date().toISOString(),
            sourceUri: process.env.MONGO_URI,
            counts: {
                users: usersWithAuth.length,
                incomeCategories: incomeCategories.length,
                expenseCategories: expenseCategories.length,
                income: income.length,
                expenses: expenses.length
            },
            incomeCategories,
            expenseCategories,
            users: usersWithAuth,
            income,
            expenses
        };

        fs.writeFileSync(EXTRACT_FILE, JSON.stringify(data, null, 2));
        console.log(`\n✅ Extraction Complete! Saved to: ${EXTRACT_FILE}`);
        console.log('Summary:', data.counts);

        process.exit(0);
    } catch (error) {
        console.error('Extraction Failed:', error);
        process.exit(1);
    }
};

extractData();
