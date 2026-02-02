const Expense = require('./server/models/Expense');
const ExpenseCategory = require('./server/models/ExpenseCategory');
const connectDB = require('./server/config/db');
const dotenv = require('dotenv');
// const colors = require('colors');

dotenv.config({ path: './server/.env' });

async function checkCategories() {
    try {
        await connectDB();

        console.log('--- Expense Categories (Collection) ---');
        const categories = await ExpenseCategory.find({});
        categories.forEach(c => console.log(`'${c.name}' (Subcats: ${c.subcategories.length})`));

        console.log('\n--- Used in Expenses (Distinct) ---');
        const usedCategories = await Expense.distinct('category');
        usedCategories.forEach(c => console.log(`'${c}'`));

        console.log('\n--- Checking specific match ---');
        const target = 'Events and Activity';
        const count = await Expense.countDocuments({ category: target });
        console.log(`Expenses with category '${target}': ${count}`);

        const subTarget = 'Annual Day';
        const subCount = await Expense.countDocuments({ category: target, subcategory: subTarget });
        console.log(`Expenses with cat '${target}' & sub '${subTarget}': ${subCount}`);

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkCategories();
