const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');
const Expense = require('../models/Expense');
const ExpenseCategory = require('../models/ExpenseCategory');
const User = require('../models/User');

dotenv.config({ path: './server/.env' });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline);
    } catch (error) {
        console.error(`Error: ${error.message}`.red.underline.bold);
        process.exit(1);
    }
};

const getRandomDate = (start, end) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const descriptions = [
    "Monthly maintenance payment",
    "Emergency repair work",
    "Scheduled service check",
    "Quarterly supplies purchase",
    "Contract renewal fee",
    "Event setup costs",
    "Equipment upgrade",
    "Safety inspection fee",
    "Cleaning services payment",
    "Utility bill payment"
];

const seedData = async () => {
    await connectDB();

    try {
        // Clear existing expenses
        await Expense.deleteMany();
        console.log('Expenses cleared!'.red.inverse);

        // Fetch context data
        const boardMembers = await User.find({ role: 'board_member' });
        const categories = await ExpenseCategory.find({});

        if (boardMembers.length === 0) {
            console.error('No board members found! Please seed users first.'.red);
            process.exit(1);
        }

        if (categories.length === 0) {
            console.error('No categories found! Please seed categories first.'.red);
            process.exit(1);
        }

        const expenses = [];
        const numRecords = 75; // Generate 75 records
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6); // Last 6 months

        for (let i = 0; i < numRecords; i++) {
            const randomCategory = categories[Math.floor(Math.random() * categories.length)];
            const randomSubcategory = randomCategory.subcategories[Math.floor(Math.random() * randomCategory.subcategories.length)];
            const randomUser = boardMembers[Math.floor(Math.random() * boardMembers.length)];

            // Generate amount based on category type (roughly)
            let amount = Math.floor(Math.random() * 50000) + 1000;
            if (randomCategory.name.includes('Infrastructure')) amount *= 5; // Higher for infrastructure
            if (randomCategory.name.includes('Administrative')) amount = Math.floor(amount / 5) + 500; // Lower for admin

            const expense = {
                title: `${randomSubcategory} - ${randomCategory.name}`,
                category: randomCategory.name,
                subcategory: randomSubcategory,
                amount: amount,
                date: getRandomDate(startDate, new Date()),
                description: descriptions[Math.floor(Math.random() * descriptions.length)],
                addedBy: randomUser._id
            };

            expenses.push(expense);
        }

        await Expense.insertMany(expenses);
        console.log(`Seeded ${expenses.length} expense records!`.green.inverse);

        process.exit();
    } catch (error) {
        console.error(`${error}`.red.inverse);
        process.exit(1);
    }
};

seedData();
