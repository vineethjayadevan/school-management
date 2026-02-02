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
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const monthStr = parts[1].toLowerCase();
    const yearStr = parts[2];

    const months = {
        'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
        'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
    };

    const month = months[monthStr] !== undefined ? months[monthStr] : 0;
    const year = parseInt(yearStr.length === 2 ? '20' + yearStr : yearStr, 10);

    return new Date(year, month, day);
};

const seedFurnitureShaji = async () => {
    try {
        await connectDB();
        console.log('Connected to MongoDB...'.green);

        // 1. Find User
        const user = await User.findOne({ email: 'shajip@mystemgps.com' });
        if (!user) {
            console.error('User shajip@mystemgps.com not found.'.red);
            process.exit(1);
        }
        console.log(`Assigning expenses to: ${user.name}`.blue);

        // 2. Ensure Category/Subcategory
        // Use the MERGED/FIXED category name: 'Infrastructure & Construction'
        const categoryName = 'Infrastructure & Construction';
        const subcategoryName = 'Furniture';

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

        // 3. Read & Parse CSV
        const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
        const lines = fileContent.split(/\r?\n/).filter(line => line.trim() !== '' && !line.startsWith(',,'));

        console.log(`Found ${lines.length} lines. Processing...`);

        const expensesToInsert = [];

        lines.forEach((line, index) => {
            const cols = parseCSVLine(line);

            // Expected: Date, Title, Amount
            if (cols.length < 3) return;

            const dateStr = cols[0];
            const title = cols[1];
            let amountStr = cols[2];

            // Parse Date
            const parsedDate = parseDate(dateStr);
            if (!parsedDate || isNaN(parsedDate.getTime())) {
                // assume header or invalid
                console.log(`Skipping line ${index + 1} (invalid date): ${dateStr}`);
                return;
            }

            // Clean Amount: Remove commas, spaces
            const amount = parseFloat(amountStr.replace(/,/g, '').replace(/\s/g, ''));

            if (isNaN(amount)) return;

            expensesToInsert.push({
                title: title,
                category: categoryName,
                subcategory: subcategoryName,
                amount: amount,
                description: '',
                date: parsedDate,
                referenceType: 'Voucher',
                addedBy: user._id
            });
        });

        // 4. Insert
        if (expensesToInsert.length > 0) {
            await Expense.insertMany(expensesToInsert);
            console.log(`Successfully appended ${expensesToInsert.length} 'Furniture' expenses for Shaji.`.green.inverse);
        } else {
            console.log('No valid expenses found to insert.'.yellow);
        }

        process.exit();

    } catch (error) {
        console.error(`${error}`.red.inverse);
        process.exit(1);
    }
};

seedFurnitureShaji();
