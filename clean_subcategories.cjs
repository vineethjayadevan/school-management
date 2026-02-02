const Expense = require('./server/models/Expense');
const ExpenseCategory = require('./server/models/ExpenseCategory');
const connectDB = require('./server/config/db');
const dotenv = require('dotenv');

dotenv.config({ path: './server/.env' });

async function cleanSubcategories() {
    try {
        await connectDB();
        console.log('Connected DB');

        const catName = 'Events & Activities';
        const targetSub = 'Annual Day';
        const badSub = 'Annual Day Celebration';

        // 1. Move Expenses
        const res = await Expense.updateMany(
            { category: catName, subcategory: badSub },
            { subcategory: targetSub }
        );
        console.log(`Migrated ${res.modifiedCount} expenses from '${badSub}' to '${targetSub}'.`);

        // 2. Update Category Definition
        const category = await ExpenseCategory.findOne({ name: catName });
        if (category) {
            const initialLen = category.subcategories.length;
            category.subcategories = category.subcategories.filter(s => s !== badSub);

            if (category.subcategories.length < initialLen) {
                await category.save();
                console.log(`Removed '${badSub}' from category definition.`);
            } else {
                console.log(`'${badSub}' not found in category definition.`);
            }
            console.log('Current Subcategories:', category.subcategories);
        } else {
            console.log(`Category '${catName}' not found.`);
        }

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

cleanSubcategories();
