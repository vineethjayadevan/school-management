const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');
const Expense = require('../models/Expense');
const User = require('../models/User');
const ExpenseCategory = require('../models/ExpenseCategory');
const connectDB = require('../config/db');

// Load env vars
dotenv.config({ path: './server/.env' });

const seedAds = async () => {
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
        const categoryName = 'Advertisement & Marketing';
        const subcategoryName = 'Advertisement';

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
        // 25-Jan-26 | Advertisement Brosher Printing | 4,800.00
        // 25-Jan-26 | Advertesement social media boosting | 12,500.00
        // 25-Jan-26 | Advertisement. Kollannur fest | 5,000.00
        // 25-Jan-26 | Advertisement board printing 50 Nos. | 4,750.00
        // 25-Jan-26 | Social Media Advertisement | 8,500.00
        // 25-Jan-26 | Social Media Advtesement Balance Payment pending | 10,000.00
        const expensesData = [
            { title: 'Advertisement Brosher Printing', amount: 4800.00 },
            { title: 'Advertesement social media boosting', amount: 12500.00 },
            { title: 'Advertisement. Kollannur fest', amount: 5000.00 },
            { title: 'Advertisement board printing 50 Nos.', amount: 4750.00 },
            { title: 'Social Media Advertisement', amount: 8500.00 },
            { title: 'Social Media Advtesement Balance Payment pending', amount: 10000.00 }
        ];

        const date = new Date('2026-01-25');

        const expensesToInsert = expensesData.map(item => ({
            ...item,
            date: date,
            category: categoryName,
            subcategory: subcategoryName,
            description: 'Imported from image',
            referenceType: 'Voucher',
            addedBy: user._id
        }));

        // 4. Insert
        await Expense.insertMany(expensesToInsert);
        console.log(`Successfully appended ${expensesToInsert.length} 'Advertisement' expenses.`.green.inverse);

        process.exit();
    } catch (error) {
        console.error(`${error}`.red.inverse);
        process.exit(1);
    }
};

seedAds();
