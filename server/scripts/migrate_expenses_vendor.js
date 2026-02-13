const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const path = require('path');
const dotenv = require('dotenv');

// Try loading from server/.env (if running from root) or .env (if running from server)
dotenv.config({ path: path.resolve(__dirname, '../../server/.env') });
if (!process.env.MONGO_URI) {
    dotenv.config(); // Try default
}

const migrateExpenses = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const expenses = await Expense.find({ vendor: { $exists: false } });
        console.log(`Found ${expenses.length} expenses without vendor field.`);

        for (const expense of expenses) {
            // Try to extract vendor from title or description if possible, or default to 'Unknown'
            // Since we don't have a reliable way to know, we'll set it to 'Unknown' or 'System Legacy'
            expense.vendor = 'Legacy Entry';
            await expense.save();
        }

        console.log('Migration completed.');
        process.exit();
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateExpenses();
