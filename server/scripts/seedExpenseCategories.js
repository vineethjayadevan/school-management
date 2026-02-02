const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ExpenseCategory = require('../models/ExpenseCategory');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const categories = [
    {
        name: 'Infrastructure & Construction',
        subcategories: [
            'Building construction',
            'Furniture',
            'Classroom setup',
            'Repairs & renovation',
            'Utilities' // Note: Utilities itself might be a main category or have sub-subcategories like Electricity. As per user request, it's under Infra or separate. User example: "Infrastructure... Utilities -> Electricity". 
            // Wait, user formatting was: 
            // Infrastructure & Construction -> [Building, Furniture...]
            // Utilities -> [Electricity, Water, Internet, Telephone]
            // Events -> [...]
            // Administrative -> [...]
            // I should respect that structure. User listed Utilities at top level in example structure indentation.
        ]
    },
    {
        name: 'Utilities',
        subcategories: [
            'Electricity',
            'Water',
            'Internet',
            'Telephone'
        ]
    },
    {
        name: 'Events & Activities',
        subcategories: [
            'Annual Day Celebration',
            'Sports Day',
            'Cultural Programs',
            'Competitions'
        ]
    },
    {
        name: 'Administrative Expenses',
        subcategories: [
            'Office supplies',
            'Printing & stationery',
            'Software subscriptions'
        ]
    }
];

const seedCategories = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Clear existing categories to ensure clean state matching requirements
        await ExpenseCategory.deleteMany({});
        console.log('Cleared existing expense categories');

        await ExpenseCategory.insertMany(categories);
        console.log('Expense Categories Seeded Successfully');

        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedCategories();
