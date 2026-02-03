const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const OtherIncome = require('../models/OtherIncome');

const descriptions = [
    'Recieved from Building owner',
    'Balance Amount from Annual Day Collection',
    'Donation Recieved'
];

const cleanup = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB...');

        for (const desc of descriptions) {
            console.log(`\nProcessing: "${desc}"`);

            // Find all records with this description
            const records = await OtherIncome.find({ description: desc }).sort({ createdAt: 1 });

            if (records.length === 0) {
                console.log('No records found.');
                continue;
            }

            console.log(`Found ${records.length} copies.`);

            // Filter for April 2nd (Correct Date)
            const targetDate = '2026-04-02';
            let correctDateRecords = records.filter(r =>
                r.date.toISOString().startsWith(targetDate)
            );

            // If we have correct date records, keep the first one, delete others
            if (correctDateRecords.length > 0) {
                const keeper = correctDateRecords[0];
                console.log(`Keeping: ${keeper._id} (${keeper.date.toISOString().split('T')[0]})`);

                // IDs to delete: All records EXCEPT the keeper
                const deleteIds = records
                    .filter(r => r._id.toString() !== keeper._id.toString())
                    .map(r => r._id);

                if (deleteIds.length > 0) {
                    await OtherIncome.deleteMany({ _id: { $in: deleteIds } });
                    console.log(`Deleted ${deleteIds.length} duplicates.`);
                }
            } else {
                // If NO correct date records exist (e.g. only Feb 4th ones),
                // Keep the first one and UPDATE its date to April 2nd.
                const keeper = records[0];
                console.log(`Keeping (and updating date): ${keeper._id}`);

                keeper.date = new Date(targetDate);
                await keeper.save();
                console.log(`Updated date to ${targetDate}`);

                const deleteIds = records
                    .slice(1) // All except first
                    .map(r => r._id);

                if (deleteIds.length > 0) {
                    await OtherIncome.deleteMany({ _id: { $in: deleteIds } });
                    console.log(`Deleted ${deleteIds.length} duplicates.`);
                }
            }
        }

        console.log('\n✅ Cleanup Complete!');
        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

cleanup();
