const User = require('../models/User');
const connectDB = require('../config/db');
const dotenv = require('dotenv');
const colors = require('colors');

dotenv.config({ path: './server/.env' });

async function checkUser() {
    try {
        await connectDB();
        const email = 'jayarajv@mystemgps.com';
        const user = await User.findOne({ email });
        if (user) {
            console.log(`User found: ${user.name} (${user._id})`.green);
        } else {
            console.log(`User ${email} NOT FOUND`.red);
        }
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkUser();
