const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');
const Expense = require('../models/Expense');
const User = require('../models/User');
const connectDB = require('../config/db');

// Load env vars
dotenv.config({ path: './server/.env' });

const csvFilePath = path.join(__dirname, '../../csv/Expense_csv.csv');

// Helper to parse CSV line handling quotes
const parseCSVLine = (line) => {
    const result = [];
    let startValueIndex = 0;
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
            inQuotes = !inQuotes;
        } else if (line[i] === ',' && !inQuotes) {
            let val = line.substring(startValueIndex, i).trim();
            // Remove quotes if present
            if (val.startsWith('"') && val.endsWith('"')) {
                val = val.slice(1, -1);
            }
            // Replace double double-quotes with single double-quote
            val = val.replace(/""/g, '"');
            result.push(val);
            startValueIndex = i + 1;
        }
    }
    // Push last value
    let val = line.substring(startValueIndex).trim();
    if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
    }
    val = val.replace(/""/g, '"');
    result.push(val);

    return result;
};

// Date Parser for MM/DD/YYYY
const parseDate = (dateStr) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split('/');
    if (parts.length !== 3) return new Date();
    // MM/DD/YYYY
    const month = parseInt(parts[0], 10) - 1; // JS months are 0-indexed
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
};

const seedExpenses = async () => {
    try {
        await connectDB();
        console.log('Connected to MongoDB...'.green);

        // Find a user to assign expenses to (Specific User)
        const user = await User.findOne({ email: 'shajip@mystemgps.com' });
        if (!user) {
            console.error('User shajip@mystemgps.com not found.'.red);
            process.exit(1);
        }
        console.log(`Assigning expenses to user: ${user.name} (${user.role})`.blue);

        // Read CSV
        const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
        const lines = fileContent.split(/\r?\n/).filter(line => line.trim() !== '');

        const expensesToInsert = [];

        console.log(`Found ${lines.length} lines in CSV. Parsing...`);

        // Assuming no header based on file view (Lines start with Data)
        // If header exists, skip index 0. user file has `11/05/2025...` at line 1. So NO header.

        lines.forEach((line, index) => {
            // Columns: Date, Title, Amount
            const cols = parseCSVLine(line);

            if (cols.length < 3) {
                console.warn(`Skipping invalid line ${index + 1}: ${line}`.yellow);
                return;
            }

            const dateStr = cols[0];
            const title = cols[1];

            // Clean amount string (remove quotes, commas if any inside quotes were missed, though parseCSV handles quotes)
            // But sometimes amounts come as "2,00,000" in CSVs. User file shows `200000`, `103200`. Looks like clean numbers.
            const amountStr = cols[2];
            const amount = parseFloat(amountStr.replace(/,/g, ''));

            if (isNaN(amount)) {
                console.warn(`Invalid amount at line ${index + 1}: ${amountStr} -> 0`.yellow);
            }

            expensesToInsert.push({
                title: title,
                category: 'Infrastructure and Construction',
                subcategory: 'Building construction',
                amount: isNaN(amount) ? 0 : amount,
                description: '', // User said "Leave for now"
                date: parseDate(dateStr),
                referenceType: 'Voucher',
                addedBy: user._id
            });
        });

        // Create/Update Category and Subcategory
        const categoryName = 'Infrastructure and Construction';
        const subcategoryName = 'Building construction';

        let category = await require('../models/ExpenseCategory').findOne({ name: categoryName });

        if (!category) {
            console.log(`Category '${categoryName}' not found. Creating...`.yellow);
            category = await require('../models/ExpenseCategory').create({
                name: categoryName,
                subcategories: [subcategoryName],
                description: 'Imported from CSV'
            });
        } else {
            console.log(`Category '${categoryName}' found. Checking subcategories...`.cyan);
            if (!category.subcategories.includes(subcategoryName)) {
                category.subcategories.push(subcategoryName);
                await category.save();
                console.log(`Added subcategory '${subcategoryName}'.`.green);
            }
        }

        // Insert into DB
        if (expensesToInsert.length > 0) {
            await Expense.insertMany(expensesToInsert);
            console.log(`Successfully seeded ${expensesToInsert.length} expenses.`.green.inverse);
        } else {
            console.log('No valid expenses found to insert.'.yellow);
        }

        process.exit();
    } catch (error) {
        console.error(`${error}`.red.inverse);
        process.exit(1);
    }
};

seedExpenses();
