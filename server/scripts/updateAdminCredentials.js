const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const connectDB = require('../config/db');

// Load env vars
dotenv.config({ path: './server/.env' });

// Connect to DB
connectDB();

const updateCredentials = async () => {
    try {
        console.log('Starting credential update...');

        // 1. Update Admin
        // Try finding by old email first
        let admin = await User.findOne({ email: 'admin@school.com' });

        if (!admin) {
            // Try finding by new email in case run previously
            admin = await User.findOne({ email: 'admin@mystemgps.com' });
            if (!admin) {
                // Try finding by role as last resort if data is inconsistent
                admin = await User.findOne({ role: 'admin' });
            }
        }

        if (admin) {
            console.log(`Found Admin user: ${admin.email}`);
            admin.email = 'admin@mystemgps.com';
            admin.password = 'admin@stem'; // Will be hashed by pre-save hook
            await admin.save();
            console.log('✅ Admin credentials updated successfully.');
        } else {
            console.log('❌ Admin user not found.');
        }

        // 2. Update Office Staff
        let office = await User.findOne({ email: 'office@school.com' });

        if (!office) {
            office = await User.findOne({ email: 'office@mystemgps.com' });
            if (!office) {
                office = await User.findOne({ role: 'office_staff' });
            }
        }

        if (office) {
            console.log(`Found Office user: ${office.email}`);
            office.email = 'office@mystemgps.com';
            office.password = 'office@stem'; // Will be hashed by pre-save hook
            await office.save();
            console.log('✅ Office credentials updated successfully.');
        } else {
            console.log('❌ Office user not found.');
        }

        console.log('Update process complete.');
        process.exit();

    } catch (error) {
        console.error('Error updating credentials:', error);
        process.exit(1);
    }
};

updateCredentials();
