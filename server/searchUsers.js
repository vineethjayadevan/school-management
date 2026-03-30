const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const User = require('./models/User');

async function searchUsers() {
    try {
        const client = await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB (test)');

        const users = await User.find({});
        console.log(`\n--- ALL USERS IN TEST DB ---`);
        users.forEach(u => {
            console.log(`Email: ${u.email || 'N/A'}, Username: ${u.username || 'N/A'}, Role: ${u.role}, ID: ${u._id}`);
        });

        // Search for admin@mystemgps.com
        const admin = await User.findOne({ email: 'admin@mystemgps.com' });
        if (admin) {
            console.log('\nFound admin@mystemgps.com:', admin);
        } else {
            console.log('\nadmin@mystemgps.com NOT FOUND in test DB.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Search failed:', error);
        process.exit(1);
    }
}

searchUsers();
