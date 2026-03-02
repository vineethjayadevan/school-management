const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Staff = require('./models/Staff');

async function fixTeacherLink() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const userEmail = 'priyawarrier@mystemgps.com';
        const staffId = '69a5654f6d8f25c7be8d9f1e';

        const user = await User.findOne({ email: userEmail });
        const staff = await Staff.findById(staffId);

        if (user && staff) {
            user.profileId = staff._id;
            await user.save();
            console.log(`Successfully linked User ${userEmail} to Staff ${staff.name} (${staff._id})`);
        } else {
            console.log('Could not find user or staff to link.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Fix failed:', error);
        process.exit(1);
    }
}

fixTeacherLink();
