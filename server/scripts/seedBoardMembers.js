const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');
const User = require('../models/User');
const connectDB = require('../config/db');

dotenv.config({ path: './server/.env' });

connectDB();

const seedBoardMembers = async () => {
    try {
        // Check if board members already exist to avoid duplicates
        const existingBoardMembers = await User.countDocuments({ role: 'board_member' });

        if (existingBoardMembers >= 10) {
            console.log('Board members already exist. Skipping seed.'.yellow);
            process.exit();
        }

        const boardMembers = [];
        for (let i = 1; i <= 10; i++) {
            boardMembers.push({
                name: `Board Member ${i}`,
                email: `board${i}@school.com`, // Example: board1@school.com
                password: `Board@${new Date().getFullYear()}${i}`, // systematic password e.g., Board@20251
                role: 'board_member',
                avatar: `https://ui-avatars.com/api/?name=Board+Member+${i}&background=random`
            });
        }

        await User.insertMany(boardMembers);

        console.log('10 Board Members Imported!'.green.inverse);
        console.log('Login IDs: board1@school.com to board10@school.com');
        process.exit();
    } catch (error) {
        console.error(`${error}`.red.inverse);
        process.exit(1);
    }
};

seedBoardMembers();
