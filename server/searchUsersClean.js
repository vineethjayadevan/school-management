const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const User = require('./models/User');

async function searchUsers() {
    try {
        const client = await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB (test)\n');

        const users = await User.find({});
        console.log(`--- ALL USERS IN TEST DB (${users.length} total) ---`);
        for (const u of users) {
             console.log(`Email: ${u.email || 'N/A'} | Username: ${u.username || 'N/A'} | Role: ${u.role} | ID: ${u._id}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Search failed:', error);
        process.exit(1);
    }
}

searchUsers();
