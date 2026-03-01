const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars from server/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const resetPasswords = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected successfully.');

        // Find student users we just linked
        const students = ['ayishaazrinmv@mystemgps.com', 'joshuamathew@mystemgps.com', 'aizamhazinam@mystemgps.com'];

        for (const username of students) {
            const user = await User.findOne({ username });
            if (user) {
                user.password = 'school123';
                await user.save();
                console.log(`Password reset for student: ${username}`);
            } else {
                console.warn(`User not found: ${username}`);
            }
        }

        console.log('Finished resetting passwords.');
        process.exit(0);
    } catch (error) {
        console.error('Error resetting passwords:', error);
        process.exit(1);
    }
};

resetPasswords();
