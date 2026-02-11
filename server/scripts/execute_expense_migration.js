const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Expense = require('../models/Expense');
const ExpenseCategory = require('../models/ExpenseCategory');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const newCategories = {
    'Infrastructure & Construction': [
        'Building Construction',
        'Furniture',
        'Classroom Setup',
        'Repairs & Renovation'
    ],
    'Utilities': [
        'Electricity',
        'Water',
        'Internet',
        'Telephone'
    ],
    'Staff & Human Resources': [
        'Salaries & Wages',
        'Teaching Staff Payments',
        'Non-Teaching Staff Payments',
        'Contract / Guest Faculty',
        'Staff Welfare & Training'
    ],
    'Academic & Educational Expenses': [
        'Books & Learning Materials',
        'Lab & Classroom Consumables',
        'Examination Expenses',
        'Library / Educational Tools'
    ],
    'Events & Activities': [
        'Annual Day',
        'Sports Day',
        'Cultural Programs',
        'Competitions'
    ],
    'Administrative Expenses': [
        'Office Supplies',
        'Printing & Stationery',
        'Software Subscriptions',
        'Communication Expenses',
        'Miscellaneous Admin'
    ],
    'Transport Expenses': [
        'Fuel',
        'Vehicle Maintenance',
        'Driver Salary',
        'Insurance & Permits'
    ],
    'Maintenance & Housekeeping': [
        'Cleaning & Security',
        'Pest Control',
        'Minor Maintenance'
    ],
    'Professional & Statutory Expenses': [
        'Audit & Accounting',
        'Legal & Consultancy',
        'Government Fees & Licenses'
    ],
    'Financial Expenses': [
        'Bank Charges',
        'Payment Gateway Charges',
        'Loan Interest',
        'Penalties / Late Fees'
    ],
    'Advertisement & Marketing': [
        'Advertisement'
    ]
};

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Fix Casing Mismatch
        console.log('Fixing Casing Mismatches...');
        const casingResult = await Expense.updateMany(
            {
                category: 'Infrastructure & Construction',
                subcategory: 'Building construction' // lowercase 'c'
            },
            {
                $set: { subcategory: 'Building Construction' } // uppercase 'C'
            }
        );
        console.log(`Updated ${casingResult.modifiedCount} records for Building Construction casing.`);

        // 2. Remap Registration and Renewals
        console.log('Remapping Registration and Renewals...');
        const remapResult = await Expense.updateMany(
            {
                category: 'Administrative Expenses',
                subcategory: 'Registration and Renewals'
            },
            {
                $set: {
                    category: 'Professional & Statutory Expenses',
                    subcategory: 'Legal & Consultancy'
                }
            }
        );
        console.log(`Remapped ${remapResult.modifiedCount} records from Registration/Renewals to Legal/Consultancy.`);

        // 3. Update ExpenseCategory Collection
        console.log('Updating ExpenseCategory collection with new schema...');
        await ExpenseCategory.deleteMany({});

        const categoriesToInsert = Object.entries(newCategories).map(([name, subcategories]) => ({
            name,
            subcategories,
            isActive: true
        }));

        await ExpenseCategory.insertMany(categoriesToInsert);
        console.log('Successfully updated Expense Categories collection.');

        console.log('Migration Complete! 🚀');
        process.exit();

    } catch (err) {
        console.error('Migration Failed:', err);
        process.exit(1);
    }
};

migrate();
