const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const User = require('./models/User');

const boardMembersToCreate = [
    { _id: '697c9f7c41a44ed84c08769b', name: 'Jayadevan V', email: 'jayadevanv@mystemgps.com' },
    { _id: '697c9f7c41a44ed84c08769e', name: 'Jayaraj V', email: 'jayarajv@mystemgps.com' },
    { _id: '697c9f7d41a44ed84c0876a1', name: 'Shaji P', email: 'shajip@mystemgps.com' },
    { _id: '697c9f7d41a44ed84c0876a4', name: 'Sithara Sajid', email: 'sitharasaj@mystemgps.com' },
    { _id: '697c9f7d41a44ed84c0876a7', name: 'Sabira TS', email: 'sabirats@mystemgps.com' },
    { _id: '697c9f7e41a44ed84c0876aa', name: 'Sabna P', email: 'sabnap@mystemgps.com' },
    { _id: '697c9f7e41a44ed84c0876ad', name: 'Fathima T', email: 'fathimat@mystemgps.com' },
    { _id: '697c9f7e41a44ed84c0876b0', name: 'Rameena J', email: 'rameenaj@mystemgps.com' },
    { _id: '697c9f7e41a44ed84c0876b3', name: 'Regi V George', email: 'regivgeorge@mystemgps.com' },
    { _id: '697c9f7e41a44ed84c0876b6', name: 'Shameer Ali', email: 'shameerali@mystemgps.com' }
];

async function seedUsers() {
    try {
        console.log("Connecting to:", mongoose.connection.name || process.env.MONGO_URI);
        const client = await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to database:', client.connection.name);

        let createdCount = 0;

        for (const user of boardMembersToCreate) {
            // Drop any existing instances that match the ID, username, or email to avoid E11000 duplicate keys
            await User.deleteMany({
                $or: [
                   { _id: new mongoose.Types.ObjectId(user._id) },
                   { email: user.email },
                   { username: user.email }
                ]
            });

            // Derive password from email prefix (everything before the @)
            const generatedPassword = user.email.split('@')[0];

            // Explicitly set the _id from the mapping to restore the data linkage
            const newMember = await User.create({
                _id: new mongoose.Types.ObjectId(user._id),
                name: user.name,
                username: user.email,
                email: user.email,
                password: generatedPassword, 
                role: 'board_member',
                isActive: true
            });

            console.log(`Created [${newMember.name}] \t| ID: ${newMember._id} \t| Pass: ${generatedPassword}`);
            createdCount++;
        }

        console.log(`\nSuccessfully recreated all ${createdCount} Board Member profiles and linked their orphaned records!`);
        process.exit(0);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

seedUsers();
