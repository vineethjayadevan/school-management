const Expense = require('../models/Expense');
const ExpenseCategory = require('../models/ExpenseCategory');
const connectDB = require('../config/db');
const dotenv = require('dotenv');
const colors = require('colors');

dotenv.config({ path: './server/.env' }); // Adjusted for running from root or check env path

async function check() {
    try {
        await connectDB();
        const count = await Expense.countDocuments();
        console.log(`Total Expenses: ${count}`.green);

        const sample = await Expense.findOne().sort({ createdAt: -1 });
        if (sample) {
            console.log('Sample Expense:'.cyan);
            console.log(JSON.stringify(sample, null, 2));
        } else {
            console.log('No expenses found.'.yellow);
        }

        // Check Category
        const categoryName = 'Infrastructure and Construction';
        const cat = await ExpenseCategory.findOne({ name: categoryName });
        console.log(`Category '${categoryName}' Found:`.cyan, !!cat);
        if (cat) console.log('Subcategories:', cat.subcategories);

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
