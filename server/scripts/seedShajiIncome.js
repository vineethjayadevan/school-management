const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');
const OtherIncome = require('../models/OtherIncome');
const IncomeCategory = require('../models/IncomeCategory');
const User = require('../models/User');
const connectDB = require('../config/db');

// Load env vars
dotenv.config({ path: './server/.env' });

const seedShajiIncome = async () => {
    try {
        await connectDB();
        console.log('Connected to MongoDB...'.green);

        // 1. Find User
        const user = await User.findOne({ email: 'shajip@mystemgps.com' });
        if (!user) {
            console.error('User shajip@mystemgps.com not found.'.red);
            process.exit(1);
        }
        console.log(`Assigning income to: ${user.name}`.blue);

        // 2. Define Entries
        // Donation Recieved (category Donations) - 10000
        // Balance Amount from Annual Day Collection (category Miscallaneous) - 26500
        // Recieved from Building owner (category Donation) - 15000 -> Map to 'Donations'

        const entries = [
            {
                category: 'Donations',
                description: 'Donation Recieved',
                amount: 10000
            },
            {
                category: 'Miscellaneous',
                description: 'Balance Amount from Annual Day Collection',
                amount: 26500
            },
            {
                category: 'Donations',
                description: 'Recieved from Building owner',
                amount: 15000
            }
        ];

        let addedCount = 0;

        for (const entry of entries) {
            // Check for duplicate (optional but safe)
            /* const existing = await OtherIncome.findOne({
                addedBy: user._id,
                amount: entry.amount,
                category: entry.category,
                description: entry.description
            });

            if (existing) {
                console.log(`Entry '${entry.description}' already exists. Skipping.`);
                continue;
            } */

            await OtherIncome.create({
                category: entry.category,
                amount: entry.amount,
                description: entry.description,
                date: new Date(), // User didn't specify date, defaulting to now or maybe seed script runtime
                addedBy: user._id
            });

            console.log(`Added: ${entry.description} (${entry.category}) - ${entry.amount}`.green);
            addedCount++;
        }

        console.log(`\nSuccessfully seeded ${addedCount} additional income records.`.green.inverse);
        process.exit();

    } catch (error) {
        console.error(`${error}`.red.inverse);
        process.exit(1);
    }
};

seedShajiIncome();
