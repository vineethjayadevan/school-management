const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const User = require('./models/User');

async function testPasswords() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({});
        for (const user of users) {
            const isMatch = await user.matchPassword('password123');
            console.log(`User: ${user.email}, Role: ${user.role}, Password Match ('password123'): ${isMatch}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

testPasswords();
