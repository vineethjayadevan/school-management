const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const OtherIncome = require('../models/OtherIncome');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const reassignEntries = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const updates = [
            { nameInDesc: 'Jayaraj V', userId: '697c9f7c41a44ed84c08769e' }, // Jayaraj V
            { nameInDesc: 'Reji', userId: '697c9f7e41a44ed84c0876b3' },      // Regi V George
            { nameInDesc: 'Shaji', userId: '697c9f7d41a44ed84c0876a1' },     // Shaji P
            { nameInDesc: 'Shameer', userId: '697c9f7e41a44ed84c0876b6' },   // Shameer Ali
            { nameInDesc: 'Sabira', userId: '697c9f7d41a44ed84c0876a7' },    // Sabira TS
            { nameInDesc: 'Sithara', userId: '697c9f7d41a44ed84c0876a4' },   // Sithara Saj
        ];

        const date = new Date('2026-04-02');
        // Set to start of day or use the date range query if time component varies. 
        // The previous script used `new Date('2026-04-02')` which defaults to 00:00:00 UTC.
        // We'll search by range to be safe or exact match if confident.

        console.log('\n--- Reassigning Entries ---');

        for (const update of updates) {
            const res = await OtherIncome.updateOne(
                {
                    category: 'Capital Introduced',
                    subcategory: 'Investment by Board Members',
                    description: { $regex: new RegExp(update.nameInDesc, 'i') }, // Match "Investment by Reji" etc.
                    date: date
                },
                {
                    $set: { addedBy: update.userId }
                }
            );

            if (res.modifiedCount > 0) {
                console.log(`✅ Updated entry for ${update.nameInDesc} -> User ID: ${update.userId}`);
            } else {
                console.log(`⚠️ No entry updated for ${update.nameInDesc}. Matched: ${res.matchedCount}`);
            }
        }

        console.log('\nReassignment Complete! 🚀');
        process.exit();

    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

reassignEntries();
