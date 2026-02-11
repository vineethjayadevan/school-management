const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const listUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({}, 'name role email');
        console.log('\n--- USERS ---');
        users.forEach(u => {
            console.log(`${u._id} | ${u.name} | ${u.role} | ${u.email}`);
        });

        process.exit();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

listUsers();
