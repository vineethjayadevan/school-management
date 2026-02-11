const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const OtherIncome = require('../models/OtherIncome');
const User = require('../models/User');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const addCapitalEntries = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find Admin user to associate as 'addedBy'
        let adminUser = await User.findOne({ role: 'admin' });
        if (!adminUser) adminUser = await User.findOne({}); // Fallback

        const entries = [
            { name: 'Jayaraj V', amount: 30600 },
            { name: 'Reji', amount: 30600 },
            { name: 'Shaji', amount: 30600 },
            { name: 'Shameer', amount: 30600 },
            { name: 'Sabira', amount: 30600 },
            { name: 'Sithara', amount: 30600 }
        ];

        const date = new Date('2026-04-02'); // April 2 2026

        console.log(`\nAdding ${entries.length} Capital Entries for date: ${date.toDateString()}...`);

        for (const entry of entries) {
            // Check existence to prevent duplicates
            const exists = await OtherIncome.findOne({
                category: 'Capital Introduced',
                subcategory: 'Investment by Board Members',
                amount: entry.amount,
                description: `Investment by ${entry.name}`,
                date: date
            });

            if (!exists) {
                await OtherIncome.create({
                    category: 'Capital Introduced',
                    subcategory: 'Investment by Board Members',
                    amount: entry.amount,
                    description: `Investment by ${entry.name}`,
                    date: date,
                    addedBy: adminUser?._id
                });
                console.log(`✅ Added: ${entry.name} - Rs. ${entry.amount}`);
            } else {
                console.log(`⚠️ Skipped (Exists): ${entry.name}`);
            }
        }

        console.log('\nDone! 🚀');
        process.exit();

    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

addCapitalEntries();
