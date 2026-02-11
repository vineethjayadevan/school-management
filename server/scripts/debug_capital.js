const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const OtherIncome = require('../models/OtherIncome');
const Capital = require('../models/Capital');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        console.log('\n--- CAPITAL Model Data ---');
        const capitalData = await Capital.find({});
        console.log(`Count: ${capitalData.length}`);
        let capTotal = 0;
        capitalData.forEach(c => {
            console.log(`- ${c.date.toISOString().split('T')[0]} | ${c.type} | ${c.amount} | ${c.description || 'No Desc'}`);
            if (c.type === 'Investment') capTotal += c.amount;
        });
        console.log(`Total Capital Investment: ${capTotal}`);

        console.log('\n--- OTHER INCOME (Capital Introduced) ---');
        const oiData = await OtherIncome.find({ category: 'Capital Introduced' });
        console.log(`Count: ${oiData.length}`);
        let oiTotal = 0;
        oiData.forEach(c => {
            console.log(`- ${c.date.toISOString().split('T')[0]} | ${c.subcategory} | ${c.amount} | ${c.description}`);
            oiTotal += c.amount;
        });
        console.log(`Total OI Capital Introduced: ${oiTotal}`);

        console.log('\n--- COMBINED TOTAL IN CONTROLLER ---');
        console.log(`Sum: ${capTotal + oiTotal}`);

        process.exit();

    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

checkData();
