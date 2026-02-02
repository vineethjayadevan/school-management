const mongoose = require('mongoose');
const ExpenseCategory = require('../models/ExpenseCategory');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: './server/.env' });

const listCategories = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI not found in environment');
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const categories = await ExpenseCategory.find({});
        console.log('\n--- Existing Expense Categories ---');
        categories.forEach(cat => {
            console.log(`\nCategory: ${cat.name}`);
            console.log(`Subcategories: ${cat.subcategories.join(', ')}`);
        });
        console.log('\n-----------------------------------');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

listCategories();
