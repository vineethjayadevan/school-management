const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Staff = require('./models/Staff');

async function fixTeacherLinks() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const teachers = await User.find({ role: 'teacher' });
        const allStaff = await Staff.find({ role: 'Teacher' });

        for (const user of teachers) {
            console.log(`\nChecking User: ${user.name} (${user.email})`);

            // Check if profileId is valid
            let isValidProfile = false;
            if (user.profileId) {
                const staff = await Staff.findById(user.profileId);
                if (staff) {
                    isValidProfile = true;
                    console.log(`Current Link Valid: Staff ${staff.name}`);
                }
            }

            if (!isValidProfile) {
                console.log('Link missing or invalid. Attempting to link...');

                // Try Email Match
                let staffMatch = allStaff.find(s => s.email && s.email.toLowerCase() === user.email?.toLowerCase());

                // Try Name Match (normalized)
                if (!staffMatch) {
                    const normalize = (n) => n.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
                    const userNameNorm = normalize(user.name);
                    staffMatch = allStaff.find(s => normalize(s.name) === userNameNorm);
                }

                if (staffMatch) {
                    user.profileId = staffMatch._id;
                    await user.save();
                    console.log(`SUCCESS: Linked to Staff ${staffMatch.name} (${staffMatch._id})`);
                } else {
                    console.log('Could NOT find a matching staff record for this user.');
                }
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('Fix failed:', error);
        process.exit(1);
    }
}

fixTeacherLinks();
