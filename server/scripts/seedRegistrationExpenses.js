const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');
const Expense = require('../models/Expense');
const User = require('../models/User');
const ExpenseCategory = require('../models/ExpenseCategory');
const connectDB = require('../config/db');

// Load env vars
dotenv.config({ path: './server/.env' });

const seedRegistration = async () => {
    try {
        await connectDB();
        console.log('Connected to MongoDB...'.green);

        // 1. Find User
        const user = await User.findOne({ email: 'shajip@mystemgps.com' });
        if (!user) {
            console.error('User shajip@mystemgps.com not found.'.red);
            process.exit(1);
        }
        console.log(`Assigning expenses to: ${user.name}`.blue);

        // 2. Ensure Category/Subcategory
        const categoryName = 'Administrative Expenses';
        const subcategoryName = 'Registration and Renewals';

        let category = await ExpenseCategory.findOne({ name: categoryName });
        if (!category) {
            console.log(`Category '${categoryName}' missing. Creating...`.yellow);
            category = await ExpenseCategory.create({
                name: categoryName,
                subcategories: [subcategoryName]
            });
        } else {
            if (!category.subcategories.includes(subcategoryName)) {
                category.subcategories.push(subcategoryName);
                await category.save();
                console.log(`Added subcategory '${subcategoryName}'.`.green);
            }
        }

        // 3. Define Expenses
        // 25-Jan-26 | Partnership Stamp | 550.00
        // 25-Jan-26 | Partnership registration sunil khader | 10,000.00
        const expensesData = [
            {
                title: 'Partnership Stamp',
                amount: 550.00,
                date: new Date('2026-01-25')
            },
            {
                title: 'Partnership registration sunil khader',
                amount: 10000.00,
                date: new Date('2026-01-25')
            }
        ];

        const expensesToInsert = expensesData.map(item => ({
            ...item,
            category: categoryName,
            subcategory: subcategoryName,
            description: 'Imported from image',
            referenceType: 'Voucher',
            addedBy: user._id
        }));

        // 4. Insert
        await Expense.insertMany(expensesToInsert);
        console.log(`Successfully appended ${expensesToInsert.length} 'Registration' expenses for Shaji.`.green.inverse);

        process.exit();
    } catch (error) {
        console.error(`${error}`.red.inverse);
        process.exit(1);
    }
};

seedRegistration();
