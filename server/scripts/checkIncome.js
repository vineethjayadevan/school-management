const mongoose = require('mongoose');
const OtherIncome = require('../models/OtherIncome');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const checkIncome = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const incomes = await OtherIncome.find({});
        console.log(`Found ${incomes.length} income entries.`);
        incomes.forEach(i => {
            console.log({
                id: i._id,
                title: i.title,
                category: i.category,
                subcategory: i.subcategory,
                amount: i.amount,
                date: i.date,
                description: i.description,
                source: i.source // checking if this field exists
            });
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkIncome();
