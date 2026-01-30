const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User'); // Adjust path to default model if correct one

dotenv.config({ path: path.join(__dirname, '../.env') }); // Load env

const listBoardMembers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Check if User model has role or if we need BoardMember model?
        // Usually User with role 'board_member'
        const members = await User.find({ role: 'board_member' });

        console.log(`\nFound ${members.length} Board Members:`);
        members.forEach(m => {
            console.log(`- ${m.name} (${m.email}) [ID: ${m._id}]`);
        });

        const expectedEmails = [
            'jayadevanv@mystemgps.com',
            'jayarajv@mystemgps.com',
            'shajip@mystemgps.com',
            'sitharasaj@mystemgps.com',
            'sabirats@mystemgps.com',
            'sabnap@mystemgps.com',
            'fathimat@mystemgps.com',
            'rameenaj@mystemgps.com',
            'regivgeorge@mystemgps.com',
            'shameerali@mystemgps.com'
        ];

        console.log('\n--- Verification ---');
        let allPresent = true;
        expectedEmails.forEach(email => {
            const found = members.find(m => m.email === email);
            if (!found) {
                console.log(`❌ MISSING: ${email}`);
                allPresent = false;
            } else {
                console.log(`✅ OK: ${email}`);
            }
        });

        // Check for unexpected members
        members.forEach(m => {
            if (!expectedEmails.includes(m.email)) {
                console.log(`⚠️ UNEXPECTED: ${m.email} (${m.name})`);
                allPresent = false; // Or warning
            }
        });

        if (allPresent) {
            console.log('\n✅ All expected board members are present and accounted for.');
        } else {
            console.log('\n❌ Discrepancies found.');
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

listBoardMembers();
