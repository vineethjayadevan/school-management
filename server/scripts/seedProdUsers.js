const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');
const User = require('../models/User');
const connectDB = require('../config/db');

dotenv.config({ path: './server/.env' });

connectDB();

const seedProdUsers = async () => {
    try {
        const usersToSeed = [
            // Admin
            {
                name: 'Admin User',
                email: 'admin@mystemgps.com',
                password: 'admin@stem',
                role: 'admin'
            },
            // Office Staff
            {
                name: 'Office Staff',
                email: 'office@mystemgps.com',
                password: 'office@stem',
                role: 'office_staff'
            },
            // Board Members
            { name: 'Jayadevan V', email: 'jayadevanv@mystemgps.com', password: 'jayadevanv', role: 'board_member' },
            { name: 'Jayaraj V', email: 'jayarajv@mystemgps.com', password: 'jayarajv', role: 'board_member' },
            { name: 'Shaji P', email: 'shajip@mystemgps.com', password: 'shajip', role: 'board_member' },
            { name: 'Sithara Saj', email: 'sitharasaj@mystemgps.com', password: 'sitharasaj', role: 'board_member' },
            { name: 'Sabira TS', email: 'sabirats@mystemgps.com', password: 'sabirats', role: 'board_member' },
            { name: 'Sabna P', email: 'sabnap@mystemgps.com', password: 'sabnap', role: 'board_member' },
            { name: 'Fathima T', email: 'fathimat@mystemgps.com', password: 'fathimat', role: 'board_member' },
            { name: 'Rameena Jaleel', email: 'rameenaj@mystemgps.com', password: 'rameenaj', role: 'board_member' },
            { name: 'Reji V George', email: 'regivgeorge@mystemgps.com', password: 'regivgeorge', role: 'board_member' },
            { name: 'Shameer Ali', email: 'shameerali@mystemgps.com', password: 'shameerali', role: 'board_member' }
        ];

        console.log('Checking and Seeding Users...'.cyan);

        for (const user of usersToSeed) {
            const userExists = await User.findOne({ email: user.email });

            if (userExists) {
                console.log(`User ${user.email} already exists. Skipping.`.yellow);
            } else {
                // Add default avatar for board members if not present
                if (user.role === 'board_member') {
                    user.avatar = `https://ui-avatars.com/api/?name=${user.name.replace(/ /g, '+')}&background=random`;
                }
                await User.create(user);
                console.log(`Created user: ${user.name} (${user.email})`.green);
            }
        }

        console.log('Seeding process completed.'.green.inverse);
        process.exit();
    } catch (error) {
        console.error(`${error}`.red.inverse);
        process.exit(1);
    }
};

seedProdUsers();
