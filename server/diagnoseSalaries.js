const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Salary = require('./models/Salary');
const Staff = require('./models/Staff');

async function checkOrphanedSalaries() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const salaries = await Salary.find().populate('staff');
        const orphaned = salaries.filter(s => !s.staff);

        if (orphaned.length > 0) {
            console.log(`Found ${orphaned.length} orphaned salary records:`);
            orphaned.forEach(s => {
                console.log(`ID: ${s._id}, Month: ${s.month}, Staff ID: ${s.get('staff', null, { getters: false })}`);
            });
        } else {
            console.log('No orphaned salary records found.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error checking salaries:', error);
        process.exit(1);
    }
}

checkOrphanedSalaries();
