const Expense = require('./server/models/Expense');
const connectDB = require('./server/config/db');
const dotenv = require('dotenv');
const colors = require('colors');

dotenv.config({ path: './server/.env' });

async function check() {
    try {
        await connectDB();
        const count = await Expense.countDocuments();
        console.log(`Total Expenses: ${count}`.green);

        const sample = await Expense.findOne().sort({ createdAt: -1 });
        console.log('Sample Expense:'.cyan);
        console.log(JSON.stringify(sample, null, 2));

        // Check Category
        const ExpenseCategory = require('./server/models/ExpenseCategory');
        const cat = await ExpenseCategory.findOne({ name: 'Infrastructure and Construction' });
        console.log('Category Found:'.cyan, !!cat);
        if (cat) console.log('Subcategories:', cat.subcategories);

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
