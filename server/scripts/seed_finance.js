const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Expense = require('../models/Expense');
const OtherIncome = require('../models/OtherIncome');
const IncomeCategory = require('../models/IncomeCategory');
const ExpenseCategory = require('../models/ExpenseCategory');

const DATA_FILE = path.join(__dirname, '../data/finance_backup.json');

const seedData = async () => {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            console.error('❌ Data file not found:', DATA_FILE);
            process.exit(1);
        }

        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        console.log(`Loaded backup from: ${data.timestamp} (Source: ${data.sourceUri})`);
        console.log('Counts:', data.counts);

        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to TARGET DB...');

        // 1. Sync Users
        console.log('\n--- Syncing Users ---');
        const userMap = {}; // OldID -> NewID
        for (const u of data.users) {
            const userData = { ...u };
            delete userData._id; // Cannot update _id field

            // Use updateOne to BYPASS Mongoose pre-save middleware
            // Use $setOnInsert to set _id only if creating a new doc
            await User.updateOne(
                { email: u.email },
                {
                    $setOnInsert: { _id: u._id },
                    $set: userData
                },
                { upsert: true }
            );

            // Fetch the user to get the ID (needed for map)
            const user = await User.findOne({ email: u.email });
            console.log(`Synced User: ${u.name} (ID: ${user._id})`);
            userMap[u._id] = user._id;
        }

        // 2. Sync Categories
        console.log('\n--- Syncing Categories ---');
        for (const cat of data.incomeCategories) {
            await IncomeCategory.findOneAndUpdate(
                { name: cat.name },
                cat,
                { upsert: true, new: true }
            );
        }
        for (const cat of data.expenseCategories) {
            await ExpenseCategory.findOneAndUpdate(
                { name: cat.name },
                cat,
                { upsert: true, new: true }
            );
        }

        // 3. Sync Financial Records
        // Strategy: We will delete existing records with SAME ID? Or just upsert?
        // Since we want to replicate the EXACT state, we should probably upsert by _id.

        console.log('\n--- Syncing Income Records ---');
        for (const item of data.income) {
            // Remap addedBy
            if (item.addedBy && userMap[item.addedBy]) {
                item.addedBy = userMap[item.addedBy];
            } else if (item.addedBy) {
                console.warn(`⚠️ Warning: Creator of income ${item._id} not found in user map.`);
            }

            await OtherIncome.findByIdAndUpdate(item._id, item, { upsert: true });
        }

        console.log('\n--- Syncing Expense Records ---');
        for (const item of data.expenses) {
            // Remap addedBy
            if (item.addedBy && userMap[item.addedBy]) {
                item.addedBy = userMap[item.addedBy];
            } else if (item.addedBy) {
                console.warn(`⚠️ Warning: Creator of expense ${item._id} not found in user map.`);
            }

            await Expense.findByIdAndUpdate(item._id, item, { upsert: true });
        }

        console.log('\n✅ Restore Complete!');
        process.exit(0);

    } catch (error) {
        console.error('Seeding Failed:', error);
        process.exit(1);
    }
};

seedData();
