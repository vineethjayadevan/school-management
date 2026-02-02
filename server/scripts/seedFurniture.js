const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');
const Expense = require('../models/Expense');
const User = require('../models/User');
const ExpenseCategory = require('../models/ExpenseCategory');
const connectDB = require('../config/db');

// Load env vars
dotenv.config({ path: './server/.env' });

const csvFilePath = path.join(__dirname, '../../csv/Expense_csv.csv');

// Helper to parse CSV line
// Helper to parse CSV line
const parseCSVLine = (text) => {
    let result = [];
    let curr = '';
    let inQuote = false;
    for (let i = 0; i < text.length; i++) {
        let char = text[i];
        if (char === '"') {
            inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
            result.push(curr.trim());
            curr = '';
        } else {
            curr += char;
        }
    }
    result.push(curr.trim());
    return result.map(val => val.replace(/^"|"$/g, '').replace(/""/g, '"'));
};


// Date Parser for DD-MMM-YY (e.g. 25-Jan-26)
const parseDate = (dateStr) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split('-');
    if (parts.length !== 3) return new Date(); // Fallback

    const day = parseInt(parts[0], 10);
    const monthStr = parts[1].toLowerCase();
    const yearStr = parts[2];

    const months = {
        'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
        'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
    };

    const month = months[monthStr] !== undefined ? months[monthStr] : 0;

    // Handle Year (assume 20xx)
    const year = parseInt(yearStr.length === 2 ? '20' + yearStr : yearStr, 10);

    return new Date(year, month, day);
};

const seedFurniture = async () => {
    try {
        await connectDB();
        console.log('Connected to MongoDB...'.green);

        // 1. Find User
        const user = await User.findOne({ email: 'jayarajv@mystemgps.com' });
        if (!user) {
            console.error('User jayarajv@mystemgps.com not found.'.red);
            process.exit(1);
        }
        console.log(`Assigning expenses to: ${user.name}`.blue);

        // 2. Ensure Category/Subcategory
        const categoryName = 'Events and Activity';
        const subcategoryName = 'Annual Day';

        let category = await ExpenseCategory.findOne({ name: categoryName });
        if (!category) {
            console.log(`Category '${categoryName}' missing. Creating...`.yellow);
            category = await ExpenseCategory.create({
                name: categoryName,
                subcategories: [subcategoryName]
            });
        } else {
            if (!category.subcategories.includes(subcategoryName)) {
                category.subcategories.push(subcategoryName);
                await category.save();
                console.log(`Added subcategory '${subcategoryName}'.`.green);
            }
        }

        // 2.5 Clean up previous mistake (Delete Furniture expenses for this user)
        const deleteResult = await Expense.deleteMany({
            addedBy: user._id,
            category: 'Infrastructure and Construction',
            subcategory: 'Furniture'
        });
        if (deleteResult.deletedCount > 0) {
            console.log(`Removed ${deleteResult.deletedCount} incorrect 'Furniture' expenses.`.yellow);
        }

        // 3. Read & Parse CSV
        const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
        const lines = fileContent.split(/\r?\n/).filter(line => line.trim() !== '' && !line.startsWith(',,')); // Filter empty lines

        console.log(`Found ${lines.length} lines. Processing...`);

        const expensesToInsert = [];

        lines.forEach((line, index) => {
            const cols = parseCSVLine(line);

            // Expected: Date, Title, Amount
            if (cols.length < 3) return;

            // Skip header if it exists (check if first col looks like 'Date')
            // User snippet: `25-Jan-26,Fasil's expense...` - No header seen in snippet, or maybe line 1 was data.
            // But if format changed, maybe header exists? 
            // The file preview command showed output starting with `25-Jan-26`.

            const dateStr = cols[0];
            const title = cols[1];
            let amountStr = cols[2];

            // If empty date/title/amount, skip
            if (!dateStr || !amountStr) return;

            // Clean Amount: Remove commas, spaces
            const amount = parseFloat(amountStr.replace(/,/g, '').replace(/\s/g, ''));

            if (isNaN(amount)) return;

            expensesToInsert.push({
                title: title,
                category: categoryName,
                subcategory: subcategoryName,
                amount: amount,
                description: '',
                date: parseDate(dateStr),
                referenceType: 'Voucher',
                addedBy: user._id
            });
        });

        // 4. Insert
        if (expensesToInsert.length > 0) {
            await Expense.insertMany(expensesToInsert);
            console.log(`Successfully appended ${expensesToInsert.length} 'Annual Day' expenses for Jayaraj.`.green.inverse);
        } else {
            console.log('No valid expenses found to insert.'.yellow);
        }

        process.exit();

    } catch (error) {
        console.error(`${error}`.red.inverse);
        process.exit(1);
    }
};

seedFurniture();
