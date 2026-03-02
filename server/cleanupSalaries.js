const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Salary = require('./models/Salary');
const Staff = require('./models/Staff');

async function cleanupOrphanedSalaries() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const salaries = await Salary.find().populate('staff');
        const orphaned = salaries.filter(s => !s.staff);

        if (orphaned.length > 0) {
            console.log(`Found ${orphaned.length} orphaned salary records. Deleting...`);
            for (const s of orphaned) {
                await Salary.findByIdAndDelete(s._id);
                console.log(`Deleted Salary Record: ${s._id}`);
            }
        } else {
            console.log('No orphaned salary records found.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error cleaning up salaries:', error);
        process.exit(1);
    }
}

cleanupOrphanedSalaries();
