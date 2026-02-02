const Expense = require('./server/models/Expense');
const ExpenseCategory = require('./server/models/ExpenseCategory');
const connectDB = require('./server/config/db');
const dotenv = require('dotenv');

dotenv.config({ path: './server/.env' });

async function fixCategories() {
    try {
        await connectDB();
        console.log('Connected DB');

        // Pair 1: Infrastructure
        // Target: 'Infrastructure & Construction'
        // Bad: 'Infrastructure and Construction'
        await mergeCategory('Infrastructure and Construction', 'Infrastructure & Construction', ['Building construction', 'Furniture']);

        // Pair 2: Events
        // Target: 'Events & Activities'
        // Bad: 'Events and Activity'
        await mergeCategory('Events and Activity', 'Events & Activities', ['Annual Day']);

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

async function mergeCategory(badName, targetName, subcategoriesToAdd) {
    console.log(`\nMerging '${badName}' into '${targetName}'...`);

    const targetCat = await ExpenseCategory.findOne({ name: targetName });
    if (!targetCat) {
        console.log(`Target '${targetName}' not found! Skipping.`);
        return;
    }

    const badCat = await ExpenseCategory.findOne({ name: badName });
    if (!badCat) {
        console.log(`Bad '${badName}' not found. Maybe already fixed? checking expenses...`);
    }

    // 1. Move Expenses
    const res = await Expense.updateMany(
        { category: badName },
        { category: targetName }
    );
    console.log(`Updated ${res.modifiedCount} expenses to '${targetName}'.`);

    // 2. Add subcategories to Target
    let updated = false;
    for (const sub of subcategoriesToAdd) {
        if (!targetCat.subcategories.includes(sub)) {
            targetCat.subcategories.push(sub);
            updated = true;
            console.log(`Added subcategory '${sub}' to target.`);
        }
    }
    if (updated) await targetCat.save();

    // 3. Delete Bad Category
    if (badCat) {
        await badCat.deleteOne();
        console.log(`Deleted category '${badName}'.`);
    }
}

fixCategories();
