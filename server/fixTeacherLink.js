const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Staff = require('./models/Staff');

async function fixTeacherLink() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const email = 'priyawarrier@mystemgps.com';
        const user = await User.findOne({ email });

        if (!user) {
            console.log(`User not found for email: ${email}`);
        } else {
            console.log(`User found: ${user.username}, Role: ${user.role}, ProfileID: ${user.profileId}`);
        }

        // Search staff by name "Priya"
        const staffList = await Staff.find({ name: /Priy/i });
        console.log(`Staff matches found: ${staffList.length}`);
        staffList.forEach(s => {
            console.log(`- Staff Name: ${s.name}, ID: ${s._id}, Email: ${s.email}`);
        });

        // The ID from the user's previous payload: 69a5654f6d8f25c7be8d9f1e
        const explicitStaff = await Staff.findById("69a5654f6d8f25c7be8d9f1e");
        if (explicitStaff) {
            console.log(`Explicit Staff ID matched: ${explicitStaff.name}, ID: ${explicitStaff._id}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Debug failed:', error);
        process.exit(1);
    }
}

fixTeacherLink();
