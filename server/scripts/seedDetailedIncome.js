const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');
const OtherIncome = require('../models/OtherIncome');
const IncomeCategory = require('../models/IncomeCategory');
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
    "Annual alumni donation",
    "Community development grant",
    "School festival proceeds",
    "Sports equipment sponsorship",
    "Library fund contribution",
    "Science lab upgrade grant",
    "Scholarship fund donation",
    "Building maintenance fund",
    "Arts program sponsorship",
    "General purpose donation"
];

const seedData = async () => {
    await connectDB();

    try {
        // Clear existing income
        await OtherIncome.deleteMany();
        console.log('Other Income records cleared!'.red.inverse);

        // Fetch context data
        const boardMembers = await User.find({ role: 'board_member' });
        const categories = await IncomeCategory.find({});

        if (boardMembers.length === 0) {
            console.error('No board members found! Please seed users first.'.red);
            process.exit(1);
        }

        if (categories.length === 0) {
            console.error('No income categories found! Please seed categories first.'.red);
            process.exit(1);
        }

        const incomes = [];
        const numRecords = 75; // Generate 75 records
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6); // Last 6 months

        for (let i = 0; i < numRecords; i++) {
            const randomCategory = categories[Math.floor(Math.random() * categories.length)];
            const randomUser = boardMembers[Math.floor(Math.random() * boardMembers.length)];

            // Generate amount based on category type (roughly)
            let amount = Math.floor(Math.random() * 100000) + 5000;
            if (randomCategory.name.toLowerCase().includes('grant')) amount *= 3;
            if (randomCategory.name.toLowerCase().includes('donation')) amount = Math.floor(Math.random() * 50000) + 1000;

            const income = {
                category: randomCategory.name,
                amount: amount,
                date: getRandomDate(startDate, new Date()),
                description: descriptions[Math.floor(Math.random() * descriptions.length)],
                addedBy: randomUser._id
            };

            incomes.push(income);
        }

        await OtherIncome.insertMany(incomes);
        console.log(`Seeded ${incomes.length} income records!`.green.inverse);

        process.exit();
    } catch (error) {
        console.error(`${error}`.red.inverse);
        process.exit(1);
    }
};

seedData();
