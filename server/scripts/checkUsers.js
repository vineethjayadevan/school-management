const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const connectDB = require('../config/db');

dotenv.config({ path: './server/.env' });

connectDB();

const checkBoardMembers = async () => {
    try {
        const boardMembers = await User.find({ role: 'board_member' }).select('name email role');
        console.log('Found Board Members:', boardMembers.length);
        boardMembers.forEach(bm => console.log(`${bm.name} - ${bm.email}`));
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkBoardMembers();
