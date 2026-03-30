const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Expense = require('./models/Expense');
const Capital = require('./models/Capital');
const OtherIncome = require('./models/OtherIncome');

async function analyze() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const results = {};

        // Analyze Expenses
        const expenses = await Expense.find({});
        results['Expenses'] = {};
        expenses.forEach(exp => {
            const cat = exp.category || 'Uncategorized';
            if (!results['Expenses'][cat]) results['Expenses'][cat] = new Set();
            if (exp.addedBy) results['Expenses'][cat].add(exp.addedBy.toString());
        });

        // Analyze OtherIncome
        const incomes = await OtherIncome.find({});
        results['Incomes'] = {};
        incomes.forEach(inc => {
            const cat = inc.category || 'Uncategorized';
            if (!results['Incomes'][cat]) results['Incomes'][cat] = new Set();
            if (inc.addedBy) results['Incomes'][cat].add(inc.addedBy.toString());
        });

        // Analyze Capital
        const capitals = await Capital.find({});
        results['Capitals'] = {};
        capitals.forEach(cap => {
            const cat = cap.type || 'Uncategorized';
            if (!results['Capitals'][cat]) results['Capitals'][cat] = new Set();
            if (cap.shareholder) results['Capitals'][cat].add(cap.shareholder.toString());
        });

        const outputData = {};
        for (const [moduleName, categories] of Object.entries(results)) {
            let totalModuleIds = new Set();
            outputData[moduleName] = { categories: {}, totalUniqueIds: 0 };
            
            for (const [catName, idSet] of Object.entries(categories)) {
                 const ids = Array.from(idSet);
                 ids.forEach(id => totalModuleIds.add(id));
                 outputData[moduleName].categories[catName] = ids;
            }
            outputData[moduleName].totalUniqueIds = totalModuleIds.size;
        }

        fs.writeFileSync(path.join(__dirname, 'analysis_results.json'), JSON.stringify(outputData, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
analyze();
