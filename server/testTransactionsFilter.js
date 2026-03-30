const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const OtherIncome = require('./models/OtherIncome');

async function testQuery() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const userId = '697c9f7c41a44ed84c08769b';
        const incomes = await OtherIncome.find({ addedBy: userId });
        console.log(`Found ${incomes.length} incomes for userId ${userId}`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
testQuery();
