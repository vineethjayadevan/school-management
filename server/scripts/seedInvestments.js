const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');
const OtherIncome = require('../models/OtherIncome');
const IncomeCategory = require('../models/IncomeCategory');
const User = require('../models/User');
const connectDB = require('../config/db');

// Load env vars
dotenv.config({ path: './server/.env' });

const seedInvestments = async () => {
    try {
        await connectDB();
        console.log('Connected to MongoDB...'.green);

        // 1. Ensure Category
        const categoryName = 'Investment by board members';
        let category = await IncomeCategory.findOne({ name: categoryName });

        if (!category) {
            console.log(`Category '${categoryName}' missing. Creating...`.yellow);
            category = await IncomeCategory.create({
                name: categoryName,
                description: 'Capital investments by board members'
            });
        } else {
            console.log(`Category '${categoryName}' already exists.`);
        }

        // 2. Define Investments
        const investments = [
            { email: 'jayadevanv@mystemgps.com', amount: 500000, date: '2026-01-15' },
            { email: 'rameenaj@mystemgps.com', amount: 500000, date: '2025-11-01' },
            { email: 'fathimat@mystemgps.com', amount: 500000, date: '2025-11-01' },
            { email: 'sabnap@mystemgps.com', amount: 500000, date: '2025-11-01' }
        ];

        let addedCount = 0;

        for (const inv of investments) {
            const user = await User.findOne({ email: inv.email });
            if (!user) {
                console.error(`User ${inv.email} not found! Skipping.`.red);
                continue;
            }

            // Check if already exists to avoid duplicates (optional, but good practice)
            // Simple check: same user, same amount, same date, same category
            /* const existing = await OtherIncome.findOne({
                 addedBy: user._id,
                 amount: inv.amount,
                 category: categoryName,
                 date: new Date(inv.date)
             });
 
             if (existing) {
                 console.log(`Investment for ${inv.email} already exists. Skipping.`);
                 continue;
             } */

            await OtherIncome.create({
                category: categoryName,
                amount: inv.amount,
                date: new Date(inv.date),
                description: 'Investment',
                addedBy: user._id
            });

            console.log(`Added investment: ${inv.email} - ${inv.amount}`.green);
            addedCount++;
        }

        console.log(`\nSuccessfully seeded ${addedCount} investment records.`.green.inverse);
        process.exit();

    } catch (error) {
        console.error(`${error}`.red.inverse);
        process.exit(1);
    }
};

seedInvestments();
