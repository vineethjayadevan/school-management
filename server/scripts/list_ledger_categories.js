const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const ExpenseCategory = require('../models/ExpenseCategory');
const IncomeCategory = require('../models/IncomeCategory');
const fs = require('fs');

const listCategories = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Fetch Expenses
        const expenses = await ExpenseCategory.find({}).sort({ name: 1 });

        // Fetch Income & Capital
        const incomeCats = await IncomeCategory.find({}).sort({ name: 1 });

        // Group Income Categories by Type
        const income = incomeCats.filter(c => c.type === 'income');
        const capital = incomeCats.filter(c => c.type === 'capital');

        let output = '';
        const log = (msg) => { output += msg + '\n'; };

        log('================================================');
        log('           CURRENT CASH LEDGER STRUCTURE');
        log('================================================\n');

        // 1. CAPITAL
        log('--- CAPITAL (Inflows) ---');
        if (capital.length === 0) log('(No capital categories found)');
        capital.forEach(cat => {
            log(`\nCategory: ${cat.name}`);
            if (cat.subcategories && cat.subcategories.length > 0) {
                cat.subcategories.forEach(sub => log(`  - ${sub}`));
            } else {
                log('  (No subcategories)');
            }
        });

        // 2. REVENUE INCOME
        log('\n\n--- REVENUE INCOME ---');
        if (income.length === 0) log('(No income categories found)');
        income.forEach(cat => {
            log(`\nCategory: ${cat.name}`);
            if (cat.subcategories && cat.subcategories.length > 0) {
                cat.subcategories.forEach(sub => log(`  - ${sub}`));
            } else {
                log('  (No subcategories)');
            }
        });

        // 3. EXPENSES
        log('\n\n--- EXPENSES ---');
        if (expenses.length === 0) log('(No expense categories found)');
        expenses.forEach(cat => {
            log(`\nCategory: ${cat.name}`);
            if (cat.subcategories && cat.subcategories.length > 0) {
                cat.subcategories.forEach(sub => log(`  - ${sub}`));
            } else {
                log('  (No subcategories)');
            }
        });

        log('\n================================================');

        const outputPath = path.join(__dirname, '../../ledger_structure.txt');
        fs.writeFileSync(outputPath, output, 'utf8');
        console.log(`List written to ${outputPath}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

listCategories();
