const mongoose = require('mongoose');
const OtherIncome = require('../models/OtherIncome');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const checkIncomeCats = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const incomes = await OtherIncome.find({}, 'category subcategory title');
        console.log(`Found ${incomes.length} records`);
        const cats = {};
        incomes.forEach(i => {
            const key = `${i.category} > ${i.subcategory}`;
            if (!cats[key]) cats[key] = 0;
            cats[key]++;
        });
        console.log(cats);
        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkIncomeCats();
