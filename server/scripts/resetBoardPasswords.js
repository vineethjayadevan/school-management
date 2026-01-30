const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const connectDB = require('../config/db');

dotenv.config({ path: './server/.env' });

connectDB();

const resetPasswords = async () => {
    try {
        const boardMembers = await User.find({ role: 'board_member' });

        for (let i = 0; i < boardMembers.length; i++) {
            const user = boardMembers[i];
            // Extract the board number from email or name to ensure consistency
            // email is board1@school.com, board10@school.com
            const boardNum = user.email.match(/\d+/)[0];

            user.password = `Board@2025${boardNum}`; // Setting to what I told the user
            await user.save();
            console.log(`Updated password for ${user.email} to Board@2025${boardNum}`);
        }

        console.log('All board member passwords reset successfully.');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

resetPasswords();
