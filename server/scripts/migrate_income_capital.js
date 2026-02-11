const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const IncomeCategory = require('../models/IncomeCategory');
const OtherIncome = require('../models/OtherIncome');
const User = require('../models/User');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const newCategories = [
    // --- Income (Revenue) ---
    {
        name: 'Student Fees',
        type: 'income',
        subcategories: [
            'Tuition Fees',
            'Admission / Registration Fees',
            'Transport Fees',
            'Other Academic Fees'
        ]
    },
    {
        name: 'Donations',
        type: 'income',
        subcategories: [
            'General Donations (Revenue)',
            'Capital Donations (Restricted)'
        ]
    },
    {
        name: 'Sponsorships',
        type: 'income',
        subcategories: [
            'Event Sponsorships',
            'Program / Activity Sponsorships'
        ]
    },
    {
        name: 'Grants',
        type: 'income',
        subcategories: [
            'Revenue Grants',
            'Capital Grants'
        ]
    },
    {
        name: 'Other Operating Income',
        type: 'income',
        subcategories: [
            'Late Fees / Fines',
            'Certificate / Examination Charges',
            'Interest Received',
            'Miscellaneous Operating Income'
        ]
    },

    // --- Capital & Non-Operating Inflows ---
    {
        name: 'Capital Introduced',
        type: 'capital',
        subcategories: [
            'Investment by Board Members',
            'Additional Capital Contribution',
            'Founder / Promoter Capital'
        ]
    },
    {
        name: 'Loans Received',
        type: 'capital',
        subcategories: [
            'Bank / Financial Institution Loans',
            'Director / Board Member Loans',
            'Short-Term Loans'
        ]
    },
    {
        name: 'Refundable Deposits & Advances',
        type: 'capital',
        subcategories: [
            'Security Deposits Received',
            'Caution Deposits',
            'Advances Received (Refundable)'
        ]
    },
    {
        name: 'Asset Sale Proceeds',
        type: 'capital',
        subcategories: [
            'Sale of Fixed Assets',
            'Sale of Scrap / Old Items'
        ]
    },
    {
        name: 'Other Non-Operating Receipts',
        type: 'capital',
        subcategories: [
            'Insurance Claim Received',
            'Refunds / Reimbursements Received',
            'Extraordinary / One-time Receipts'
        ]
    }
];

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Update IncomeCategory Collection
        console.log('\nUpdating IncomeCategory collection...');
        await IncomeCategory.deleteMany({});
        await IncomeCategory.insertMany(newCategories);
        console.log('Successfully updated Income Categories!');

        // 2. Remap Specific Transactions
        console.log('\nRemapping Specific Transactions...');

        // a. "Recieved from Building owner" -> Donations > Capital Donations (Restricted)
        const res1 = await OtherIncome.updateMany(
            { description: { $regex: /Recieved from Building owner/i } },
            {
                $set: {
                    category: 'Donations',
                    subcategory: 'Capital Donations (Restricted)'
                }
            }
        );
        console.log(`- Remapped "Recieved from Building owner": ${res1.modifiedCount}`);

        // b. "Balance Amount from Annual Day Collection" -> Other Operating Income > Miscellaneous Operating Income
        const res2 = await OtherIncome.updateMany(
            { description: { $regex: /Balance Amount from Annual Day Collection/i } },
            {
                $set: {
                    category: 'Other Operating Income',
                    subcategory: 'Miscellaneous Operating Income'
                }
            }
        );
        console.log(`- Remapped "Balance Amount from Annual Day Collection": ${res2.modifiedCount}`);

        // c. "Donation Received" -> Donations > General Donations (Revenue)
        const res3 = await OtherIncome.updateMany(
            { description: { $regex: /Donation Received/i } },
            {
                $set: {
                    category: 'Donations',
                    subcategory: 'General Donations (Revenue)'
                }
            }
        );
        console.log(`- Remapped "Donation Received": ${res3.modifiedCount}`);


        // 3. Insert New Capital Entries
        console.log('\nInserting New Capital Entries...');
        // Find IDs for users (just assigning to first found board member if specifics not found, 
        // OR creating dummy/placeholder if strictly needed, but better to attach to admin or user).
        // Since names are specific, let's try to look them up or just use a default "Admin" user for now 
        // as we don't know the exact user IDs.

        let adminUser = await User.findOne({ role: 'admin' });
        if (!adminUser) adminUser = await User.findOne({}); // Fallback

        const capitalEntries = [
            { name: 'Jayadevan', amount: 530600 },
            { name: 'Sabna P', amount: 530600 },
            { name: 'Rameena J', amount: 530600 },
            { name: 'Fathima', amount: 530600 }
        ];

        const date = new Date('2026-04-02'); // April 2 2026

        for (const entry of capitalEntries) {
            // Check if already exists to avoid dupes on re-run
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
                    addedBy: adminUser._id
                });
                console.log(`- Added Investment: ${entry.name}`);
            } else {
                console.log(`- Investment already exists: ${entry.name}`);
            }
        }

        console.log('\nMigration Complete! 🚀');
        process.exit();

    } catch (err) {
        console.error('Migration Failed:', err);
        process.exit(1);
    }
};

migrate();
