const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const checkBuildingExpenses = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const expenses = await Expense.find({
            category: 'Infrastructure & Construction',
            subcategory: 'Building Construction'
        }).limit(10);

        console.log(`Found ${expenses.length} expenses.`);
        expenses.forEach(e => {
            console.log({
                id: e._id,
                title: e.title,
                description: e.description,
                amount: e.amount,
                date: e.date,
                referenceType: e.referenceType,
                referenceNo: e.referenceNo
            });
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkBuildingExpenses();
