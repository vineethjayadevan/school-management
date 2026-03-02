const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Staff = require('./models/Staff');
const StaffCategory = require('./models/StaffCategory');

async function checkCategories() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        console.log('\n--- STAFF CATEGORIES ---');
        const categories = await StaffCategory.find({});
        categories.forEach(c => {
            console.log(`Category: "${c.name}", ID: ${c._id}`);
        });

        console.log('\n--- TEACHERS (Role: Teacher) ---');
        const teachers = await Staff.find({ role: 'Teacher' });
        teachers.forEach(t => {
            console.log(`Name: ${t.name}, Category: "${t.category}", Status: ${t.status}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Check failed:', error);
        process.exit(1);
    }
}

checkCategories();
