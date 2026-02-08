const mongoose = require('mongoose');
const dotenv = require('dotenv');
const OtherIncome = require('../models/OtherIncome');
const Capital = require('../models/Capital');
const User = require('../models/User');

dotenv.config();

const migrateInvestments = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // 1. Find all "Investment by board members" in OtherIncome
        const investments = await OtherIncome.find({ category: 'Investment by board members' });

        console.log(`Found ${investments.length} investment records.`);

        let migratedCount = 0;

        for (const inv of investments) {
            // Check if already exists in Capital (avoid duplicates if run multiple times)
            // A simple check: same amount, date, and shareholder
            const exists = await Capital.findOne({
                shareholder: inv.addedBy,
                amount: inv.amount,
                date: inv.date
            });

            if (!exists) {
                await Capital.create({
                    shareholder: inv.addedBy,
                    amount: inv.amount,
                    date: inv.date,
                    type: 'Investment',
                    description: `Migrated from Other Income: ${inv.description || ''}`,
                    recordedBy: inv.addedBy // Assuming self-recorded or preserve original author
                });
                migratedCount++;

                // Optional: Delete from OtherIncome or Mark as Migrated?
                // For now, let's keep them but maybe we should DELETE them to stop them showing up in Profit/Net Worth calculations 
                // that still look at OtherIncome.
                // Constraint: "Reuse existing cashflow data... Capital contributions... must not be treated as income."
                // So yes, we should DELETE them from OtherIncome so they don't double count or count as revenue.

                await OtherIncome.findByIdAndDelete(inv._id);
            } else {
                // Even if it exists in Capital (duplicate run), we should arguably delete the old OtherIncome 
                // to prevent double counting in legacy reports, assuming the Capital entry is the "source of truth" now.
                // Let's delete it to be safe and clean.
                await OtherIncome.findByIdAndDelete(inv._id);
                console.log(`Removed duplicate source record for ${inv._id}`);
            }
        }

        console.log(`Migrated and removed ${migratedCount} investment records.`);
        process.exit();
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateInvestments();
