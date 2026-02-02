const mongoose = require('mongoose');
const ExpenseCategory = require('../models/ExpenseCategory');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: './server/.env' });

const addSalary = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI not found in environment');
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Check for 'Administrative' or similar
        let adminCat = await ExpenseCategory.findOne({ name: { $regex: /Admin/i } });
        if (adminCat) {
            if (!adminCat.subcategories.includes('Salary')) {
                adminCat.subcategories.push('Salary');
                await adminCat.save();
                console.log(`Added 'Salary' to '${adminCat.name}' category.`);
            } else {
                console.log(`'Salary' already exists in '${adminCat.name}'.`);
            }
        } else {
            console.log("Creating 'Administrative' category...");
            adminCat = await ExpenseCategory.create({
                name: 'Administrative',
                subcategories: ['Salary', 'Office Supplies', 'Utilities'],
                description: 'General administrative expenses'
            });
            console.log("Created 'Administrative' with 'Salary'.");
        }

        // 2. Check for 'Academics' or similar (Optional but good)
        let academicCat = await ExpenseCategory.findOne({ name: { $regex: /Academic/i } });
        if (academicCat) {
            if (!academicCat.subcategories.includes('Salary')) {
                academicCat.subcategories.push('Salary');
                await academicCat.save();
                console.log(`Added 'Salary' to '${academicCat.name}' category.`);
            } else {
                console.log(`'Salary' already exists in '${academicCat.name}'.`);
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

addSalary();
