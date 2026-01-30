const mongoose = require('mongoose');
const dotenv = require('dotenv');
const IncomeCategory = require('../models/IncomeCategory');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const categories = [
    { name: 'Student Fees', description: 'Income from Student Admission, Tuition, etc.' },
    { name: 'Donations', description: 'Voluntary contributions' },
    { name: 'Sponsorships', description: 'Corporate or individual sponsorships' },
    { name: 'Grants', description: 'Government or private grants' },
    { name: 'Miscellaneous', description: 'Other income sources' }
];

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const seedCategories = async () => {
    try {
        await connectDB();
        console.log('Seeding Income Categories...');

        for (const cat of categories) {
            const exists = await IncomeCategory.findOne({ name: cat.name });
            if (!exists) {
                await IncomeCategory.create(cat);
                console.log(`Created category: ${cat.name}`);
            } else {
                console.log(`Category exists: ${cat.name}`);
            }
        }

        console.log('Seeding complete.');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedCategories();
