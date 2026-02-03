const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const OtherIncome = require('../models/OtherIncome');
const IncomeCategory = require('../models/IncomeCategory');

const seedPDFData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB...');

        // 1. Find User "Shaji P"
        let user = await User.findOne({ name: { $regex: 'Shaji P', $options: 'i' } });
        if (!user) {
            console.log('User "Shaji P" not found. Searching for any admin/board member to assign...');
            user = await User.findOne({ role: { $in: ['board_member', 'admin'] } });
            if (!user) {
                console.error('❌ No suitable user found to assign these records.');
                process.exit(1);
            }
            console.log(`⚠️ "Shaji P" not found. Assigning to: ${user.name} (${user.role})`);
        } else {
            console.log(`✅ User Found: ${user.name}`);
        }

        // 2. Define Records
        // Date: 4/2/2026. Assuming D/M/Y based on Indian context usually, so Feb 4th or April 2nd?
        // Given standard Asian/UK format DD/MM/YYYY, 4/2 is Feb 4th.
        // Let's use Feb 4th, 2026.
        const date = new Date('2026-02-04');

        const records = [
            {
                categoryName: 'Donations',
                description: 'Recieved from Building owner',
                amount: 15000,
                date: date
            },
            {
                categoryName: 'Miscellaneous', // Need to check if this category exists or map to 'Others'
                description: 'Balance Amount from Annual Day Collection',
                amount: 26500,
                date: date
            },
            {
                categoryName: 'Donations',
                description: 'Donation Recieved',
                amount: 10000,
                date: date
            }
        ];

        // 3. Insert Records
        for (const rec of records) {
            // Ensure Category Exists
            let category = await IncomeCategory.findOne({ name: rec.categoryName });
            if (!category) {
                console.log(`Creating Category: ${rec.categoryName}`);
                category = await IncomeCategory.create({
                    name: rec.categoryName,
                    description: 'Created from PDF Import'
                });
            }

            // Create Income Record
            const income = new OtherIncome({
                category: rec.categoryName, // Schema stores String currently
                amount: rec.amount,
                description: rec.description,
                date: rec.date,
                addedBy: user._id,
                receiptNo: '' // "-" in PDF
            });

            await income.save();
            console.log(`Created Record: ₹${rec.amount} - ${rec.description}`);
        }

        console.log('\n✅ PDF Data Import Complete!');
        process.exit(0);

    } catch (error) {
        console.error('Import Failed:', error);
        process.exit(1);
    }
};

seedPDFData();
