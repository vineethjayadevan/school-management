const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Staff = require('./models/Staff');

async function fixStaffCategories() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Update all "Teaching" to "Teacher"
        const result = await Staff.updateMany(
            { category: 'Teaching' },
            { $set: { category: 'Teacher' } }
        );

        console.log(`Successfully updated ${result.modifiedCount} staff records.`);

        process.exit(0);
    } catch (error) {
        console.error('Fix failed:', error);
        process.exit(1);
    }
}

fixStaffCategories();
