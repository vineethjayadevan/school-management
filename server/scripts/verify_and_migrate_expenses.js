const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Expense = require('../models/Expense');
const ExpenseCategory = require('../models/ExpenseCategory');

const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

// New Categories Schema
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

const verifyAndMigrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Fetch all expenses
        const expenses = await Expense.find({});
        console.log(`Found ${expenses.length} total expenses.`);

        const mismatches = [];

        // 2. Check for mismatches
        for (const expense of expenses) {
            const cat = expense.category;
            const sub = expense.subcategory;

            if (!newCategories[cat]) {
                mismatches.push({
                    id: expense._id,
                    reason: 'Category not found',
                    current: `${cat} > ${sub}`
                });
                continue;
            }

            if (!newCategories[cat].includes(sub)) {
                // Relaxed check: valid if subcategory is empty/null/undefined AND new category has no subcategories (though here all have subs)
                // OR if the subcategory is just not in the list
                if (sub && !newCategories[cat].includes(sub)) {
                    mismatches.push({
                        id: expense._id,
                        reason: 'Subcategory not found',
                        current: `${cat} > ${sub}`,
                        validSubcategories: newCategories[cat].join(', ')
                    });
                }
            }
        }

        if (mismatches.length > 0) {
            console.log('\n❌ MISMATCHES FOUND. Writing to mismatches.json');
            const fs = require('fs');
            fs.writeFileSync(path.join(__dirname, 'mismatches.json'), JSON.stringify(mismatches, null, 2));
            console.log('Cannot proceed with automatic category replacement until these are resolved.');
        } else {
            console.log('\n✅ No mismatches found. All existing expenses align with the new schema.');

            // 3. Update ExpenseCategory Collection
            console.log('\nUpdating ExpenseCategory collection...');

            // Delete existing categories
            await ExpenseCategory.deleteMany({});

            // Insert new categories
            const categoriesToInsert = Object.entries(newCategories).map(([name, subcategories]) => ({
                name,
                subcategories
            }));

            await ExpenseCategory.insertMany(categoriesToInsert);
            console.log('Successfully updated Expense Categories!');
        }

        process.exit();

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verifyAndMigrate();
