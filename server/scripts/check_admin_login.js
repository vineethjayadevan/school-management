const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '../.env') });

const checkLogin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const email = 'admin@mystemgps.com';
        const password = 'admin@stem';

        const user = await User.findOne({ email });
        if (!user) {
            console.log(`User not found: ${email}`);
            process.exit();
        }

        console.log(`User found: ${user.name} (${user.role})`);

        const isMatch = await user.matchPassword(password);
        console.log(`Password match for "${password}": ${isMatch}`);

        if (!isMatch) {
            // Check if it matches 'admin@school.com''s password or something else?
            // Actually let's just see the hash
            console.log(`Hashed password in DB: ${user.password}`);

            // Test if it matches a known hash of 'admin@stem'
            const testHash = await bcrypt.hash('admin@stem', 10);
            const testMatch = await bcrypt.compare('admin@stem', user.password);
            console.log(`Re-test with new hash: ${testMatch}`);
        }

        process.exit();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

checkLogin();
