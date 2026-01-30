const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const boardMembers = [
    { email: 'jayadevanv@mystemgps.com', password: 'jayadevanv', name: 'Jayadevan V' },
    { email: 'jayarajv@mystemgps.com', password: 'jayarajv', name: 'Jayaraj V' },
    { email: 'shajip@mystemgps.com', password: 'shajip', name: 'Shaji P' },
    { email: 'sitharasaj@mystemgps.com', password: 'sitharasaj', name: 'Sithara Saj' },
    { email: 'sabirats@mystemgps.com', password: 'sabirats', name: 'Sabira TS' },
    { email: 'sabnap@mystemgps.com', password: 'sabnap', name: 'Sabna P' },
    { email: 'fathimat@mystemgps.com', password: 'fathimat', name: 'Fathima T' },
    { email: 'rameenaj@mystemgps.com', password: 'rameenaj', name: 'Rameena Jaleel' },
    { email: 'regivgeorge@mystemgps.com', password: 'regivgeorge', name: 'Regi V George' },
    { email: 'shameerali@mystemgps.com', password: 'shameerali', name: 'Shameer Ali' }
];

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const updateCredentials = async () => {
    try {
        await connectDB();

        console.log('Updating board member credentials...');

        for (const member of boardMembers) {
            // Find user by email or create if not exists (upsert-ish, but better to find first to keep ID if possible)
            let user = await User.findOne({ email: member.email });

            if (user) {
                // Update existing user
                user.password = member.password; // Will be hashed by pre-save hook
                user.name = member.name; // Ensure name is correct
                user.role = 'board_member';
                await user.save();
                console.log(`Updated: ${member.email}`);
            } else {
                // Create new user if not found (though requirement says they exist, safety net)
                user = await User.create({
                    name: member.name,
                    email: member.email,
                    password: member.password,
                    role: 'board_member'
                });
                console.log(`Created: ${member.email}`);
            }
        }

        console.log('All board members updated successfully.');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

updateCredentials();
